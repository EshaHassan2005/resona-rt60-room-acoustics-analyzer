import math
import numpy as np
import scipy.signal
import scipy.stats
from scipy.integrate import cumulative_trapezoid
from scipy.fft import fft,fftfreq

#applicable bandwidths
OCTAVE_BANDS=[125,250,500,1000,2000,4000]

def energy_decay(impulse_response:np.ndarray,sampling_rate: int)->np.ndarray:
    energy=impulse_response**2
    dt=1.0/sampling_rate

    energy_rev=energy[::-1]

    integrated_rev=cumulative_trapezoid(energy_rev,dx=dt,initial=0)
    schroeder_curve = integrated_rev[::-1]

    peak = np.max(schroeder_curve)
    if peak<=0:
        raise ValueError("Signal has no measurable energy - check the recording.")

    normalized = schroeder_curve/peak
    normalized = np.clip(normalized, 1e-12, None)
    return 10*np.log10(normalized)

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


def find_onset(signal: np.ndarray, threshold_db: float = 20.0) -> int:
    # getting the peak location and value

    peak_idx = np.argmax(np.abs(signal))
    peak_val = np.abs(signal[peak_idx])

    # a check (if theres no real clap to detect)

    if peak_val <= 0:
        raise ValueError("Signal has no measurable energy")

    # computing the actual thresold amplitude
    # we know the peak(loudest point) is say 1.0(i assumed).. want to say anything quiter than 20dB below that peak counts as silence/bg noise
    # so converting 20 dB into a fraction of "1.0" to actually compare
    thresold = peak_val * (10 ** (-threshold_db/20))
    below_threshold = np.abs(signal[:peak_idx + 1]) < thresold 

    # quiet samples before the clap takes off
    quiet_indices = np.where(below_threshold)[0]

    onset_idx = (quiet_indices[-1]+1) if len(quiet_indices)>0 else 0
    return onset_idx


def extract_impulse_response(signal: np.ndarray, sample_rate: int, threshold_db: float = 20.0)-> np.ndarray:

    onset_idx = find_onset(signal, threshold_db)
    return signal[onset_idx:]

# week 3

def clarity_index(impulse_response: np.ndarray, sample_rate: int, time_ms: float) -> float:
    """
    Computes a clarity index (C50 if time_ms=50, C80 if time_ms=80) in dB:
    the ratio of early arriving energy to late arriving energy, split at
    the given time cutoff. Positive = early energy dominates (clear sound).
    Negative = late reflections dominate (muddy/blurred sound).
    """
    cutoff_sample = int((time_ms / 1000) * sample_rate)

    energy = impulse_response ** 2
    early_energy = np.sum(energy[:cutoff_sample])
    late_energy = np.sum(energy[cutoff_sample:])

    if late_energy <= 0:
        raise ValueError("No late-arriving energy found - check recording length/cutoff.")

    return 10 * np.log10(early_energy / late_energy)


def definition_index(impulse_response: np.ndarray, sample_rate: int, time_ms: float = 50.0) -> float:
    """
    Computes D50 (Deutlichkeit/Definition): the percentage of total energy
    that arrives within the first `time_ms` milliseconds. Higher = more
    energy concentrated early = better speech intelligibility.
    """
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

    rt60_secoonds = -60.0/slope

    return {
        "rt60_seconds": float(rt60_secoonds),
        "slope": float(slope),
        "intercept": float(intercept),
        "r_squared": float(r_value**2),
    }




