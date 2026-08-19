import math
import numpy as np
import scipy.signal
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

