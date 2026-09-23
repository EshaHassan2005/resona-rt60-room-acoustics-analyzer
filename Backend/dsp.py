import math
import numpy as np
import scipy.signal
import scipy.stats
from scipy.integrate import cumulative_trapezoid
from scipy.fft import fft, fftfreq

#applicable bandwidths
OCTAVE_BANDS=[125,250,500,1000,2000,4000]

def lundeby_correction(impulse_response: np.ndarray, sampling_rate: int) -> tuple[np.ndarray, float, float]:
    """
    Implements Lundeby's method (ISO 3382-1) for noise floor estimation and truncation.
    Returns (decay_db, t_cross, noise_floor_db).
    """
    energy = impulse_response ** 2
    n_samples = len(energy)
    dt = 1.0 / sampling_rate
    time = np.arange(n_samples) * dt

    if n_samples < int(0.05 * sampling_rate):
        return _raw_schroeder(energy, dt), time[-1], -60.0

    block_size = max(1, int(0.02 * sampling_rate))  # 20ms blocks
    n_blocks = n_samples // block_size
    if n_blocks < 5:
        return _raw_schroeder(energy, dt), time[-1], -60.0

    reshaped = energy[: n_blocks * block_size].reshape(n_blocks, block_size)
    block_energy = np.mean(reshaped, axis=1)
    block_times = (np.arange(n_blocks) * block_size + block_size / 2) * dt
    
    block_energy_db = 10 * np.log10(np.maximum(block_energy, 1e-12))
    max_db = np.max(block_energy_db)

    tail_blocks = max(1, int(0.1 * n_blocks))
    noise_floor_db = float(np.mean(block_energy_db[-tail_blocks:]))

    t_cross = time[-1]
    slope = -20.0
    intercept = 0.0

    for _ in range(5):
        valid_mask = (block_energy_db <= max_db - 5.0) & (block_energy_db >= noise_floor_db + 10.0)
        if np.sum(valid_mask) < 3:
            break

        x_fit = block_times[valid_mask]
        y_fit = block_energy_db[valid_mask]

        reg = scipy.stats.linregress(x_fit, y_fit)
        if reg.slope >= 0:
            break

        slope, intercept = float(reg.slope), float(reg.intercept)

        new_t_cross = (noise_floor_db - intercept) / slope
        if new_t_cross <= 0 or new_t_cross > time[-1]:
            break

        noise_mask = block_times >= new_t_cross
        if np.sum(noise_mask) >= 2:
            noise_floor_db = float(np.mean(block_energy_db[noise_mask]))

        if abs(new_t_cross - t_cross) < 0.005:
            t_cross = new_t_cross
            break

        t_cross = new_t_cross

    cross_idx = min(n_samples, max(1, int(t_cross * sampling_rate)))
    noise_lin = 10 ** (noise_floor_db / 10.0)
    subtracted_energy = np.maximum(0, energy[:cross_idx] - noise_lin)

    decay_rate = -slope * np.log(10) / 10.0
    if decay_rate > 0:
        tail_energy = (10 ** ((slope * t_cross + intercept) / 10.0)) / decay_rate
    else:
        tail_energy = 0.0

    integrated_rev = cumulative_trapezoid(subtracted_energy[::-1], dx=dt, initial=0) + tail_energy
    schroeder_active = integrated_rev[::-1]

    schroeder_curve = np.zeros(n_samples, dtype=np.float64)
    schroeder_curve[:cross_idx] = schroeder_active
    if cross_idx < n_samples:
        t_tail = (np.arange(cross_idx, n_samples) - cross_idx) * dt
        if decay_rate > 0:
            schroeder_curve[cross_idx:] = tail_energy * np.exp(-decay_rate * t_tail)
        else:
            schroeder_curve[cross_idx:] = 1e-12

    peak = np.max(schroeder_curve) if len(schroeder_curve) > 0 else 0
    if peak <= 0:
        return _raw_schroeder(energy, dt), time[-1], noise_floor_db

    normalized = schroeder_curve / peak
    normalized = np.clip(normalized, 1e-12, None)
    decay_db = 10 * np.log10(normalized)

    return decay_db, t_cross, noise_floor_db

def _raw_schroeder(energy: np.ndarray, dt: float) -> np.ndarray:
    integrated_rev = cumulative_trapezoid(energy[::-1], dx=dt, initial=0)
    schroeder_curve = integrated_rev[::-1]
    peak = np.max(schroeder_curve)
    if peak <= 0:
        raise ValueError("Signal has no measurable energy - check the recording.")
    normalized = np.clip(schroeder_curve / peak, 1e-12, None)
    return 10 * np.log10(normalized)

def energy_decay(impulse_response: np.ndarray, sampling_rate: int, use_lundeby: bool = True) -> np.ndarray:
    if use_lundeby:
        try:
            decay_db, _, _ = lundeby_correction(impulse_response, sampling_rate)
            return decay_db
        except Exception:
            pass
    
    energy = impulse_response ** 2
    dt = 1.0 / sampling_rate
    return _raw_schroeder(energy, dt)

def octave_band(impulse_response:np.ndarray,sample_rate,center_freq:float)->np.ndarray:
    fl=center_freq/math.sqrt(2)
    fh=center_freq*math.sqrt(2)
    return bandpass(impulse_response,[fl,fh],sample_rate)


def bandpass(data: np.ndarray,edges: list,sample_rate: int,poles: int=5) -> np.ndarray:
    nyquist = sample_rate/2
    lo, hi = edges
    if lo <=0 or hi>=nyquist:
        raise ValueError(
            f"Band edges {edges} invalid for sample rate {sample_rate} "
            f"(must be within (0, {nyquist}) Hz - Nyquist limit)."
        )
    sos = scipy.signal.butter(poles, edges, btype="bandpass", fs=sample_rate, output="sos")
    return scipy.signal.sosfiltfilt(sos, data)

def all_octave_bands(impulse_response: np.ndarray, sample_rate: int, bands=None)->dict:
    bands = bands or OCTAVE_BANDS
    nyquist = sample_rate/2
    result ={}
    for center in bands:
        fh = center*math.sqrt(2)
        if fh >=nyquist:
            continue
        result[center] = octave_band(impulse_response, sample_rate, center)
    return result

def get_fft(signal:np.ndarray,sample_rate: int):

    time_interval=1/sample_rate
    fft_result=fft(signal)

    frequencies=fftfreq(len(signal),time_interval)

    return (np.abs(fft_result),frequencies)


def _global_peak_onset(signal: np.ndarray, threshold_db: float = 20.0) -> int:
    """Original strategy: loudest sample = clap. Kept as fallback for
    very short signals where frame-based stats aren't meaningful."""
    peak_idx = np.argmax(np.abs(signal))
    peak_val = np.abs(signal[peak_idx])
    if peak_val <= 0:
        raise ValueError("Signal has no measurable energy")
    thresold = peak_val * (10 ** (-threshold_db / 20))
    below_threshold = np.abs(signal[:peak_idx + 1]) < thresold
    quiet_indices = np.where(below_threshold)[0]
    return (quiet_indices[-1] + 1) if len(quiet_indices) > 0 else 0


def find_onset(
    signal: np.ndarray,
    sample_rate: int,
    threshold_db: float = 20.0,
    frame_ms: float = 5.0,
    sustain_ms: float = 50.0,
    sustain_margin_db: float = 6.0,
) -> int:
    if len(signal) == 0 or np.max(np.abs(signal)) <= 0:
        raise ValueError("Signal has no measurable energy")

    frame_len = max(1, int(sample_rate * frame_ms / 1000))
    n_frames = len(signal) // frame_len

    if n_frames < 6:
        return _global_peak_onset(signal, threshold_db)

    trimmed = signal[: n_frames * frame_len].reshape(n_frames, frame_len)
    frame_peak = np.max(np.abs(trimmed), axis=1)
    frame_peak_db = 20 * np.log10(np.maximum(frame_peak, 1e-12))
    frame_rms = np.sqrt(np.mean(trimmed ** 2, axis=1))
    frame_rms_db = 20 * np.log10(np.maximum(frame_rms, 1e-12))

    noise_floor_db = float(np.median(frame_rms_db))

    candidate_frames = np.where(frame_peak_db > noise_floor_db + threshold_db)[0]
    if len(candidate_frames) == 0:
        raise ValueError(
            "Could not find a clap clearly above the background noise floor - "
            "the recording may be too noisy, or the clap too quiet, to isolate."
        )

    sustain_frames = max(1, int(sustain_ms / frame_ms))
    valid_frames = []
    for idx in candidate_frames:
        end = min(n_frames, idx + sustain_frames)
        following_db = frame_rms_db[idx:end]
        if len(following_db) == 0:
            continue
        if np.mean(following_db) > noise_floor_db + sustain_margin_db:
            valid_frames.append(idx)

    if not valid_frames:
        raise ValueError(
            "Found a loud moment in the recording, but nothing with a "
            "decaying reverb tail after it - it may be background noise "
            "rather than a clap. Try a louder, more isolated clap."
        )

    onset_frame = valid_frames[0]

    window_start = max(0, (onset_frame - 1) * frame_len)
    window_end = min(len(signal), (onset_frame + sustain_frames) * frame_len)
    local = signal[window_start:window_end]

    local_peak_idx = int(np.argmax(np.abs(local)))
    noise_floor_lin = 10 ** (noise_floor_db / 20)
    rise_threshold = noise_floor_lin * (10 ** (threshold_db / 20)) * 0.5

    below = np.abs(local[: local_peak_idx + 1]) < rise_threshold
    quiet_indices = np.where(below)[0]
    local_onset = (quiet_indices[-1] + 1) if len(quiet_indices) > 0 else 0

    return window_start + local_onset

def extract_impulse_response(signal: np.ndarray, sample_rate: int, threshold_db: float = 20.0)-> np.ndarray:

    onset_idx = find_onset(signal, sample_rate, threshold_db)
    return signal[onset_idx:]

def clarity_index(impulse_response: np.ndarray, sample_rate: int, time_ms: float) -> float:
    cutoff_sample = int((time_ms / 1000) * sample_rate)
    energy = impulse_response ** 2
    early_energy = np.sum(energy[:cutoff_sample])
    late_energy = np.sum(energy[cutoff_sample:])

    if late_energy <= 0:
        raise ValueError("No late-arriving energy found - check recording length/cutoff.")

    return 10 * np.log10(early_energy / late_energy)

def definition_index(impulse_response: np.ndarray, sample_rate: int, time_ms: float = 50.0) -> float:
    cutoff_sample = int((time_ms / 1000) * sample_rate)
    energy = impulse_response ** 2
    early_energy = np.sum(energy[:cutoff_sample])
    total_energy = np.sum(energy)

    if total_energy <= 0:
        raise ValueError("Signal has no measurable energy - check the recording.")

    return (early_energy / total_energy) * 100


def estimate_rt60(decay_db: np.ndarray, time: np.ndarray, db_start: float=-5.0, db_end: float=-25.0)->dict:
    if len(decay_db) != len(time):
        raise ValueError("decay_db and time arrays must be of the same length.")

    idx_start = np.abs(decay_db-db_start).argmin()
    idx_end = np.abs(decay_db-db_end).argmin()

    if idx_end <= idx_start:
        raise ValueError(f"Decay curve doesn't clearly span {db_start} db to {db_end} db - recording maybe too short or too noisy to fit this range.")

    y = decay_db[idx_start:idx_end+1]
    x = time[idx_start:idx_end+1]

    slope, intercept, r_value, p_value, std_err = scipy.stats.linregress(x,y)

    if slope>=0:
        raise ValueError("Decay curve is not decreasing over this range - cannot estimate RT60.")

    rt60_seconds = -60.0/slope

    return {
        "rt60_seconds": float(rt60_seconds),
        "slope": float(slope),
        "intercept": float(intercept),
        "r_squared": float(r_value**2),
    }

def calculate_room_modes(
    impulse_response: np.ndarray,
    sample_rate: int,
    length_m: float = 6.0,
    width_m: float = 5.0,
    height_m: float = 2.8,
    max_freq: float = 300.0,
) -> dict:
    c = 343.0
    volume = length_m * width_m * height_m

    try:
        decay_db = energy_decay(impulse_response, sample_rate)
        time_x = np.arange(len(decay_db)) / sample_rate
        rt60_info = estimate_rt60(decay_db, time_x, db_start=-5, db_end=-25)
        rt60_sec = rt60_info["rt60_seconds"]
    except Exception:
        rt60_sec = 0.5

    schroeder_freq = 2000.0 * math.sqrt(rt60_sec / volume) if volume > 0 else 200.0

    modes = []
    max_nx = int(math.ceil(2 * max_freq * length_m / c)) + 1
    max_ny = int(math.ceil(2 * max_freq * width_m / c)) + 1
    max_nz = int(math.ceil(2 * max_freq * height_m / c)) + 1

    for nx in range(max_nx):
        for ny in range(max_ny):
            for nz in range(max_nz):
                if nx == 0 and ny == 0 and nz == 0:
                    continue

                freq = (c / 2.0) * math.sqrt((nx / length_m) ** 2 + (ny / width_m) ** 2 + (nz / height_m) ** 2)
                if freq > max_freq:
                    continue
                if freq >= schroeder_freq:
                    continue

                non_zeros = (nx > 0) + (ny > 0) + (nz > 0)
                if non_zeros == 1:
                    mode_type = "axial"
                elif non_zeros == 2:
                    mode_type = "tangential"
                else:
                    mode_type = "oblique"

                modes.append({
                    "frequency": round(freq, 2),
                    "indices": [nx, ny, nz],
                    "type": mode_type
                })

    modes.sort(key=lambda x: x["frequency"])

    amp, freq_axis = get_fft(impulse_response, sample_rate)
    half = len(freq_axis) // 2
    amp_half = amp[:half]
    freq_half = freq_axis[:half]

    mask = (freq_half >= 20.0) & (freq_half <= max_freq)
    fft_freqs = freq_half[mask].tolist()
    fft_amps = amp_half[mask].tolist()

    matched_peaks = []
    if len(fft_amps) > 0:
        norm_amps = np.array(fft_amps)
        if np.max(norm_amps) > 0:
            norm_amps = norm_amps / np.max(norm_amps)

        peaks, _ = scipy.signal.find_peaks(
            norm_amps, height=0.1, distance=max(1, int(2 / (fft_freqs[1] - fft_freqs[0]))) if len(fft_freqs) > 1 else 1
        )
        peak_freqs = [fft_freqs[p] for p in peaks]

        for pf in peak_freqs:
            closest_mode = min(modes, key=lambda m: abs(m["frequency"] - pf)) if modes else None
            if closest_mode and abs(closest_mode["frequency"] - pf) <= 2.5:
                matched_peaks.append({
                    "frequency": round(pf, 2),
                    "matched_mode": closest_mode
                })

    return {
        "status": "success",
        "room_dimensions": {"length_m": length_m, "width_m": width_m, "height_m": height_m, "volume_m3": volume},
        "schroeder_freq": round(schroeder_freq, 2),
        "rt60_seconds": round(rt60_sec, 3),
        "modes": modes,
        "fft": {
            "frequencies": [round(f, 2) for f in fft_freqs],
            "amplitudes": [round(float(a), 4) for a in norm_amps] if len(fft_amps) > 0 else []
        },
        "matched_peaks": matched_peaks
    }

def calculate_waterfall(
    impulse_response: np.ndarray,
    sample_rate: int,
    target_points: int = 50
) -> dict:
    bands = all_octave_bands(impulse_response, sample_rate)
    result_bands = {}

    max_duration = min(1.5, len(impulse_response) / sample_rate)
    time_grid = np.linspace(0, max_duration, target_points)

    for center_freq, filtered_signal in bands.items():
        try:
            decay_db = energy_decay(filtered_signal, sample_rate)
            time_orig = np.arange(len(decay_db)) / sample_rate

            decay_interp = np.interp(time_grid, time_orig, decay_db)
            decay_interp = np.clip(decay_interp, -60.0, 0.0)

            result_bands[str(center_freq)] = [round(v, 2) for v in decay_interp.tolist()]
        except Exception:
            continue

    return {
        "status": "success",
        "sampling_rate": sample_rate,
        "time_points": [round(t, 3) for t in time_grid.tolist()],
        "bands": result_bands
    }
