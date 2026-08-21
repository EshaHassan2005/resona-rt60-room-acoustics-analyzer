from flask import Flask,request,jsonify
from flask_cors import CORS

from audio_utils import load_audio, downsample_for_preview, AudioLoadError
from dsp import energy_decay, get_fft, all_octave_bands,extract_impulse_response

import numpy as np



app=Flask(__name__)
CORS(app)

PREVIEW_POINTS = 2000

#helper functions

def get_uploaded_audio():
    if "audio" not in request.files:
        raise AudioLoadError("No audio file was uploaded (expected form field 'audio'.)")

    file = request.files["audio"]
    if file.filename=="":
        raise AudioLoadError("No file was selected.")

    return load_audio(file)

@app.route('/')
def index():
    return jsonify({
        "status": "ok",
        "service": "Resona backend",
        "endpoints": ["/upload","/energydecay","/fft"],
    })


@app.route('/upload',methods=['POST'])
def upload():
    try:
        signal, sample_rate = get_uploaded_audio()
    except AudioLoadError as e:
        return jsonify({"error": str(e)}), 400

    n_samples = len(signal)
    time_full =  (np.arange(n_samples)/sample_rate).tolist()
    preview_time, preview_amplitude = downsample_for_preview(
        signal, sample_rate, target_points=PREVIEW_POINTS
    )

    return jsonify({
        "status": "success",
        "sampling_rate": sample_rate,
        "duration_seconds": n_samples/sample_rate,
        "waveform_full": {
            "time": time_full,
            "amplitude": signal.tolist(),
        },
        "waveform_preview": {
            "time": preview_time,
            "amplitude": preview_amplitude
        },
    }), 200


@app.route('/energydecay',methods=['POST'])
def energy_curve():
    try:
        signal, sample_rate=get_uploaded_audio()
        signal = extract_impulse_response(signal,sample_rate) # added this line
        decay_db=energy_decay(signal, sample_rate)
    except AudioLoadError as e:
        return jsonify({"error":str(e)}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 422

    time = (np.arange(len(decay_db))/ sample_rate).tolist()
    return jsonify({"status":"success","sampling_rate":sample_rate, "time": time, "decay_db": decay_db.tolist()}),200

@app.route("/octavebands", methods=["POST"])
def octave_bands_route():
    try:
        signal, sample_rate= get_uploaded_audio()
        signal = extract_impulse_response(signal,sample_rate)
        bands = all_octave_bands(signal, sample_rate)
    except AudioLoadError as e:
        return jsonify({"error": str(e)}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 422

    result = {}
    for center_freq, filtered_signal in bands.items():
        try:
            decay_db = energy_decay(filtered_signal, sample_rate)
            result[str(center_freq)] = {
                "time": (np.arange(len(decay_db))/sample_rate).tolist(),
                "decay_db": decay_db.tolist(),
            }
        except ValueError:
            continue
    return jsonify({"status": "success", "sampling_rate": sample_rate, "bands":result}), 200


@app.route('/fft',methods=['POST'])
def fft_route():
    try:
        signal, sample_rate= get_uploaded_audio()
    except AudioLoadError as e:
        return jsonify({"error": str(e)}), 400
    
    amp,freq=get_fft(signal,sample_rate)
    half = len(freq)//2
    return jsonify({
        "status": "success",
        "sampling_rate": sample_rate,
        "amplitude": amp[:half].tolist(),
        "frequencies": freq[:half].tolist(),
    }), 200

if __name__=="__main__":
    app.run(debug=True) 