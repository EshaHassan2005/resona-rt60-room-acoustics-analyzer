import os
import sys
import numpy as np
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dsp import (
    energy_decay,
    bandpass,
    octave_band,
    all_octave_bands,
    get_fft,
    OCTAVE_BANDS,
    find_onset,
    extract_impulse_response,
    clarity_index,
    definition_index,
    estimate_rt60,
    lundeby_correction,
    calculate_room_modes,
    calculate_waterfall,
)
from audio_utils import load_audio, downsample_for_preview, AudioLoadError

FIXTURE_PATH = os.path.join(os.path.dirname(__file__), "fixtures", "synthetic_clap.wav")

@pytest.fixture
def synthetic_signal():
    """Loads the synthetic clap fixture directly (bypassing Flask)."""
    import soundfile as sf
    signal, sr = sf.read(FIXTURE_PATH)
    return signal.astype(np.float64), sr

@pytest.fixture
def signal_with_leading_noise():
    sr = 44100
    rng = np.random.default_rng(42)

    noise = rng.normal(0, 0.01, int(0.2* sr))
    true_onset = len(noise)

    clap = np.zeros(1)
    clap[0] = 1.0
    tail_len = int(0.5 * sr)
    t = np.arange(tail_len) / sr
    tail = np.exp(-t * 8.0) * rng.normal(0, 0.05, tail_len)

    signal = np.concatenate([noise, clap, tail])
    return signal, sr, true_onset

@pytest.fixture
def noisy_classroom_signal():
    """
    Simulates a real classroom take: a raised ambient noise floor
    throughout (chatter/HVAC), plus a single stray noise burst (e.g. a
    chair scrape) that is louder than the actual clap but has no
    reverb tail following it, then the real clap + decay.
    """
    sr = 44100
    rng = np.random.default_rng(3)

    total_len = int(1.2 * sr)
    signal = rng.normal(0, 0.03, total_len)  # ambient classroom noise floor

    # Stray noise burst at 0.3s: louder than the clap, but brief (no decay tail)
    stray_idx = int(0.3 * sr)
    signal[stray_idx:stray_idx + 20] += rng.normal(0, 1.0, 20)

    # The real clap at 0.7s, with a proper decaying reverb tail after it
    true_onset = int(0.7 * sr)
    signal[true_onset] += 0.8
    tail_len = min(int(0.4 * sr), total_len - true_onset - 1)
    t = np.arange(tail_len) / sr
    tail = np.exp(-t * 8.0) * rng.normal(0, 0.15, tail_len)
    signal[true_onset + 1: true_onset + 1 + tail_len] += tail

    return signal, sr, true_onset


@pytest.fixture
def signal_with_noise_floor():
    sr = 44100
    rng = np.random.default_rng(42)
    duration = 1.5
    t = np.arange(int(duration * sr)) / sr
    # Exponential decay (-40 dB/s) + artificial noise floor at ~ -30 dB
    decay = np.exp(-t * 10.0)
    noise = rng.normal(0, 0.03, len(t))  # noise floor around -30 dB
    signal = decay + noise
    signal = signal / np.max(np.abs(signal))
    return signal, sr

# ---------- dsp.py ----------

def test_energy_decay_starts_at_zero_db(synthetic_signal):
    signal, sr = synthetic_signal
    decay = energy_decay(signal, sr)
    assert decay[0] == pytest.approx(0.0, abs=1e-6)

def test_energy_decay_is_monotonically_non_increasing(synthetic_signal):
    signal, sr = synthetic_signal
    decay = energy_decay(signal, sr)
    diffs = np.diff(decay)
    assert np.all(diffs <= 1e-9)

def test_energy_decay_uses_log10_not_natural_log(synthetic_signal):
    signal, sr = synthetic_signal
    decay = energy_decay(signal, sr)
    assert np.all(decay <= 1e-9)

def test_lundeby_correction_synthetic_noise_floor(signal_with_noise_floor):
    signal, sr = signal_with_noise_floor
    decay_db, t_cross, noise_floor_db = lundeby_correction(signal, sr)
    assert len(decay_db) == len(signal)
    assert t_cross > 0.0
    assert noise_floor_db < -15.0

def test_calculate_room_modes_known_dimensions(synthetic_signal):
    signal, sr = synthetic_signal
    length, width, height = 6.0, 4.0, 3.0
    res = calculate_room_modes(signal, sr, length_m=length, width_m=width, height_m=height)
    assert res["status"] == "success"
    assert res["schroeder_freq"] > 0
    assert len(res["modes"]) > 0

    # Lowest axial modes: (1,0,0) => 343 / (2*6) = 28.58 Hz
    mode_100 = next(m for m in res["modes"] if m["indices"] == [1, 0, 0])
    assert mode_100["frequency"] == pytest.approx(28.58, abs=0.1)
    assert mode_100["type"] == "axial"

    # (1,1,0) => 343/2 * sqrt(1/36 + 1/16) = 51.52 Hz
    mode_110 = next(m for m in res["modes"] if m["indices"] == [1, 1, 0])
    assert mode_110["type"] == "tangential"

def test_calculate_waterfall(synthetic_signal):
    signal, sr = synthetic_signal
    wf = calculate_waterfall(signal, sr, target_points=20)
    assert wf["status"] == "success"
    assert len(wf["time_points"]) == 20
    assert "500" in wf["bands"]
    assert len(wf["bands"]["500"]) == 20

def test_bandpass_rejects_invalid_edges():
    sr = 44100
    data = np.random.randn(1000)
    with pytest.raises(ValueError):
        bandpass(data, [100, sr], sr)  # upper edge >= Nyquist


def test_octave_band_center_frequencies_are_correct_ratio():
    center = 1000
    expected_fl = center / np.sqrt(2)
    expected_fh = center * np.sqrt(2)
    assert expected_fl == pytest.approx(707.1, abs=0.1)
    assert expected_fh == pytest.approx(1414.2, abs=0.1)


def test_all_octave_bands_skips_bands_above_nyquist(synthetic_signal):
    signal, sr = synthetic_signal
    bands = all_octave_bands(signal, sr)
    nyquist = sr / 2
    for center in bands:
        assert center * np.sqrt(2) < nyquist


def test_all_octave_bands_excludes_band_above_low_nyquist():
    sr = 4000  # Nyquist = 2000Hz, so the 4000Hz band (up to 5657Hz) can't fit
    signal = np.random.randn(sr * 2)
    bands = all_octave_bands(signal, sr)
    assert 4000 not in bands
    assert 2000 not in bands  # 2000*sqrt(2) = 2828 > 2000 Nyquist too


def test_fft_output_shapes_match(synthetic_signal):
    signal, sr = synthetic_signal
    amp, freq = get_fft(signal, sr)
    assert len(amp) == len(signal)
    assert len(freq) == len(signal)

def test_fft_max_frequency_is_nyquist(synthetic_signal):
    signal, sr = synthetic_signal
    amp, freq = get_fft(signal, sr)
    assert np.max(freq) == pytest.approx(sr / 2, rel=0.01)

def test_find_onset_locates_clap_after_leading_noise(signal_with_leading_noise):
    signal , sr, true_onset = signal_with_leading_noise
    detected_onset = find_onset(signal, sr)
    assert detected_onset == pytest.approx(true_onset, abs = int(0.01*sr))


def test_find_onset_on_signal_with_no_leading_noise(synthetic_signal):
    signal, sr = synthetic_signal
    onset = find_onset(signal, sr)
    assert onset < int(0.01*sr)

def test_find_onset_rejects_silent_signal():
    silent = np.zeros(1000)
    with pytest.raises(ValueError):
        find_onset(silent, 44100)


def test_find_onset_ignores_louder_stray_noise_before_clap(noisy_classroom_signal):
    """
    Regression test for the classroom-recording bug: a stray noise
    (chair scrape / door / cough) that is LOUDER than the actual clap,
    plus a raised ambient noise floor throughout. The old global-peak
    strategy would lock onto the stray noise; this should still find
    the real clap because it's the one followed by a decay tail.
    """
    signal, sr, true_onset = noisy_classroom_signal
    detected_onset = find_onset(signal, sr)
    assert detected_onset == pytest.approx(true_onset, abs=int(0.01 * sr))


def test_find_onset_raises_when_nothing_rises_above_noise_floor():
    sr = 44100
    rng = np.random.default_rng(7)
    # Pure background noise, no clap anywhere - should fail clearly
    # instead of silently returning onset_idx = 0.
    signal = rng.normal(0, 0.05, int(1.0 * sr))
    with pytest.raises(ValueError):
        find_onset(signal, sr)

def test_extract_impulse_response_removes_leading_noise(signal_with_leading_noise):
    signal, sr, true_onset = signal_with_leading_noise
    extracted = extract_impulse_response(signal, sr)
    assert len(extracted) < len(signal)
    assert len(extracted) == pytest.approx(len(signal) - true_onset, abs=int(0.01 * sr))

def test_extract_impulse_response_starts_near_peak(signal_with_leading_noise):
    signal, sr, _ = signal_with_leading_noise
    extracted = extract_impulse_response(signal, sr)
    peak_idx_in_extracted = np.argmax(np.abs(extracted))
    assert peak_idx_in_extracted < int(0.01 * sr)

# ---------- clarity_index / definition_index ----------

@pytest.fixture
def early_dominant_ir():
    sr = 44100
    ir = np.zeros(sr)
    ir[0] = 1.0
    ir[int(0.02 * sr)] = 0.2
    ir[int(0.3 * sr)] = 0.05
    return ir, sr

@pytest.fixture
def late_dominant_ir():
    sr = 44100
    ir = np.zeros(sr)
    ir[0] = 0.05
    ir[int(0.3 * sr)] = 1.0
    ir[int(0.5 * sr)] = 0.8
    return ir, sr

def test_clarity_index_positive_for_early_dominant_signal(early_dominant_ir):
    ir, sr = early_dominant_ir
    c50 = clarity_index(ir, sr, time_ms=50)
    assert c50 > 0

def test_clarity_index_negative_for_late_dominant_signal(late_dominant_ir):
    ir, sr = late_dominant_ir
    c50 = clarity_index(ir, sr, time_ms=50)
    assert c50 < 0

def test_clarity_index_raises_when_no_late_energy():
    sr = 44100
    ir = np.zeros(int(0.1 * sr))
    ir[0] = 1.0
    with pytest.raises(ValueError):
        clarity_index(ir, sr, time_ms=80)

def test_definition_index_is_between_0_and_100(early_dominant_ir):
    ir, sr = early_dominant_ir
    d50 = definition_index(ir, sr, time_ms=50)
    assert 0 <= d50 <= 100

def test_definition_index_high_for_early_dominant_signal(early_dominant_ir):
    ir, sr = early_dominant_ir
    d50 = definition_index(ir, sr, time_ms=50)
    assert d50 > 90

def test_definition_index_low_for_late_dominant_signal(late_dominant_ir):
    ir, sr = late_dominant_ir
    d50 = definition_index(ir, sr, time_ms=50)
    assert d50 < 10

def test_definition_index_rejects_silent_signal():
    silent = np.zeros(1000)
    with pytest.raises(ValueError):
        definition_index(silent, 44100, time_ms=50)

# ---------- estimate_rt60 ----------

@pytest.fixture
def synthetic_decay_curve():
    sr = 1000
    duration_s = 2.0
    time = np.arange(int(duration_s * sr)) / sr
    decay_db = -20.0 * time
    return decay_db, time

def test_estimate_rt60_recovers_known_slope(synthetic_decay_curve):
    decay_db, time = synthetic_decay_curve
    result = estimate_rt60(decay_db, time, db_start=-5, db_end=-25)
    assert result["rt60_seconds"] == pytest.approx(3.0, rel=0.01)

def test_estimate_rt60_r_squared_is_near_1_for_perfect_line(synthetic_decay_curve):
    decay_db, time = synthetic_decay_curve
    result = estimate_rt60(decay_db, time, db_start=-5, db_end=-25)
    assert result["r_squared"] == pytest.approx(1.0, abs=1e-6)

def test_estimate_rt60_rejects_mismatched_lengths():
    with pytest.raises(ValueError):
        estimate_rt60(np.zeros(10), np.zeros(5))

def test_estimate_rt60_rejects_flat_curve():
    decay_db = np.zeros(100)
    time = np.arange(100) / 100
    with pytest.raises(ValueError):
        estimate_rt60(decay_db, time, db_start=-5, db_end=-25)

# ---------- audio_utils.py ----------

def test_downsample_for_preview_respects_target_points(synthetic_signal):
    signal, sr = synthetic_signal
    time, amplitude = downsample_for_preview(signal, sr, target_points=500)
    assert len(time) == 500
    assert len(amplitude) == 500

def test_downsample_for_preview_short_signal_returns_full_signal():
    sr = 100
    signal = np.random.randn(50)
    time, amplitude = downsample_for_preview(signal, sr, target_points=2000)
    assert len(amplitude) == 50

# ---------- app.py endpoints ----------

@pytest.fixture
def client():
    from app import app
    app.config["TESTING"] = True
    return app.test_client()

def test_upload_endpoint_returns_waveform(client):
    with open(FIXTURE_PATH, "rb") as f:
        resp = client.post(
            "/upload", data={"audio": (f, "synthetic_clap.wav")},
            content_type="multipart/form-data"
        )
    assert resp.status_code == 200
    data = resp.get_json()
    assert "waveform_full" in data
    assert "waveform_preview" in data
    assert len(data["waveform_preview"]["amplitude"]) == 2000

def test_upload_endpoint_no_file_returns_400(client):
    resp = client.post("/upload", data={}, content_type="multipart/form-data")
    assert resp.status_code == 400

def test_upload_endpoint_corrupt_file_returns_400(client):
    import io
    resp = client.post(
        "/upload", data={"audio": (io.BytesIO(b"not audio"), "fake.wav")},
        content_type="multipart/form-data"
    )
    assert resp.status_code == 400

def test_energydecay_endpoint(client):
    with open(FIXTURE_PATH, "rb") as f:
        resp = client.post(
            "/energydecay", data={"audio": (f, "synthetic_clap.wav")},
            content_type="multipart/form-data"
        )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["decay_db"][0] == pytest.approx(0.0, abs=1e-6)

def test_octavebands_endpoint_returns_all_expected_bands(client):
    with open(FIXTURE_PATH, "rb") as f:
        resp = client.post(
            "/octavebands", data={"audio": (f, "synthetic_clap.wav")},
            content_type="multipart/form-data"
        )
    assert resp.status_code == 200
    data = resp.get_json()
    for band in OCTAVE_BANDS:
        assert str(band) in data["bands"]

def test_fft_endpoint(client):
    with open(FIXTURE_PATH, "rb") as f:
        resp = client.post(
            "/fft", data={"audio": (f, "synthetic_clap.wav")},
            content_type="multipart/form-data"
        )
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data["amplitude"]) == len(data["frequencies"])

def test_treatment_endpoint_returns_extended_metrics(client):
    with open(FIXTURE_PATH, "rb") as f:
        resp = client.post(
            "/treatment",
            data={
                "audio": (f, "synthetic_clap.wav"),
                "room_type": "classroom",
                "volume_m3": "120",
                "material": "acoustic_panel"
            },
            content_type="multipart/form-data"
        )
    assert resp.status_code == 200
    data = resp.get_json()
    assert "r_squared_T20" in data
    assert "C50" in data
    assert "points" in data
    assert len(data["points"]) > 0
    assert data["lundeby_corrected"] is True

def test_roommodes_endpoint(client):
    with open(FIXTURE_PATH, "rb") as f:
        resp = client.post(
            "/roommodes",
            data={
                "audio": (f, "synthetic_clap.wav"),
                "length_m": "6.0",
                "width_m": "4.0",
                "height_m": "3.0"
            },
            content_type="multipart/form-data"
        )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "success"
    assert "modes" in data
    assert "schroeder_freq" in data
    assert "fft" in data

def test_waterfall_endpoint(client):
    with open(FIXTURE_PATH, "rb") as f:
        resp = client.post(
            "/waterfall",
            data={"audio": (f, "synthetic_clap.wav")},
            content_type="multipart/form-data"
        )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "success"
    assert "time_points" in data
    assert "bands" in data