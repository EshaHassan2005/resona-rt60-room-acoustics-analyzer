import numpy as np
import librosa

MAX_FILE_SIZE_MB = 50

class AudioLoadError(Exception):
    pass

def load_audio(file_storage, target_sr=None):
    file_storage.stream.seek(0,2)
    size_mb= file_storage.stream.tell()/(1024*1024)
    file_storage.stream.seek(0)

    if size_mb > MAX_FILE_SIZE_MB:
        raise AudioLoadError(
            f"File is {size_mb:.1f}MB, which exceeds the {MAX_FILE_SIZE_MB}MB limit."
        )

    try:
        signal, sample_rate = librosa.load(file_storage, sr=target_sr, mono=True)

    except Exception as e:
        raise AudioLoadError(f"Could not decode audio file: {e}")

    if signal is None or len(signal) ==0:
        raise AudioLoadError("Decoded audio is empty.")

    return signal.astype(np.float64), int(sample_rate)


def downsample_for_preview(signal: np.ndarray, sample_rate: int, target_points: int=2000):
    n = len(signal)
    if n <= target_points:
        time = (np.arange(n)/sample_rate).tolist()
        return time, signal.tolist()

    bucket_size = n//target_points
    trimmed_len = bucket_size*target_points
    reshaped = signal[:trimmed_len].reshape(target_points, bucket_size)

    peak_idx_in_bucket = np.argmax(np.abs(reshaped), axis=1)
    preview_amplitude = reshaped[np.arange(target_points), peak_idx_in_bucket]

    bucket_starts = np.arange(target_points)*bucket_size
    preview_time = (bucket_starts+peak_idx_in_bucket)/sample_rate

    return preview_time.tolist(), preview_amplitude.tolist()