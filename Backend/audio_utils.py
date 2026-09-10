import io
import os
import subprocess
import tempfile

import numpy as np
import librosa

MAX_FILE_SIZE_MB = 50

class AudioLoadError(Exception):
    pass

def _convert_with_ffmpeg(raw_bytes: bytes) -> str:
    """
    Converts audio to a temp WAV file via ffmpeg and returns its path.
    Used as a fallback for formats libsndfile/audioread can't read
    directly - most notably WebM/Opus, which is what the browser's
    MediaRecorder API produces for live mic recordings (Chrome/Firefox
    default to audio/webm;codecs=opus). Caller must delete the returned file.
    """
    try:
        import imageio_ffmpeg
        ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError as e:
        raise AudioLoadError(
            "This audio format needs ffmpeg to decode, but the "
            "'imageio-ffmpeg' package isn't installed. Run: "
            "pip install imageio-ffmpeg"
        ) from e

    with tempfile.NamedTemporaryFile(suffix=".input", delete=False) as tmp_in:
        tmp_in.write(raw_bytes)
        tmp_in_path = tmp_in.name

    tmp_out_path = tmp_in_path + ".wav"
    try:
        result = subprocess.run(
            [ffmpeg_path, "-y", "-i", tmp_in_path, "-ar", "44100", "-ac", "1", tmp_out_path],
            capture_output=True,
            timeout=30,
        )
        if result.returncode != 0 or not os.path.exists(tmp_out_path):
            raise AudioLoadError(
                "ffmpeg could not convert this audio file: "
                + result.stderr.decode(errors="ignore").strip()[-300:]
            )
        return tmp_out_path
    finally:
        os.remove(tmp_in_path)

def load_audio(file_storage, target_sr=None):
    file_storage.stream.seek(0,2)
    size_mb= file_storage.stream.tell()/(1024*1024)
    file_storage.stream.seek(0)

    if size_mb > MAX_FILE_SIZE_MB:
        raise AudioLoadError(
            f"File is {size_mb:.1f}MB, which exceeds the {MAX_FILE_SIZE_MB}MB limit."
        )

    raw_bytes = file_storage.stream.read()
    file_storage.stream.seek(0)

    try:
        signal, sample_rate = librosa.load(io.BytesIO(raw_bytes), sr=target_sr, mono=True)
    except Exception as first_error:
        converted_path = None
        try:
            converted_path = _convert_with_ffmpeg(raw_bytes)
            signal, sample_rate = librosa.load(converted_path, sr=target_sr, mono=True)
        except AudioLoadError:
            raise
        except Exception as second_error:
            raise AudioLoadError(f"Could not decode audio file: {first_error}") from second_error
        finally:
            if converted_path and os.path.exists(converted_path):
                os.remove(converted_path)

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