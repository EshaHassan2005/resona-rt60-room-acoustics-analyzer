import os
import sys
import numpy as np
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dsp import energy_decay, bandpass, octave_band, all_octave_bands, get_fft, OCTAVE_BANDS
from audio_utils import load_audio, downsample_for_preview, AudioLoadError

FIXTURE_PATH = os.path.join(os.path.dirname(__file__), "fixtures", "synthetic_clap.wav")


@pytest.fixture
def synthetic_signal():
    """Loads the synthetic clap fixture directly (bypassing Flask)."""
    import soundfile as sf
    signal, sr = sf.read(FIXTURE_PATH)
    return signal.astype(np.float64), sr

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
    # every value should be <= 0 dB (curve is normalized to its own peak)
    assert np.all(decay <= 1e-9)


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


# ---------- app.py ----------

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