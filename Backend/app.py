from flask import Flask,request,jsonify
from flask_cors import CORS

from audio_utils import load_audio, downsample_for_preview, AudioLoadError
from dsp import (energy_decay, get_fft, all_octave_bands,extract_impulse_response, estimate_rt60, clarity_index, definition_index,)
from treatment import load_acoustic_targets, recommend_treatment
from scipy import stats

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


#RT60 calculation part
@app.route('/RT60',methods=['GET','POST'])
def rt60_route():
    try:
        signal, sample_rate=get_uploaded_audio()
        signal = extract_impulse_response(signal, sample_rate)
        decay_db_y=energy_decay(signal, sample_rate)
    except AudioLoadError as e:
        return jsonify({"error":str(e)}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 422
    
    time_x = (np.arange(len(decay_db_y))/ sample_rate)
    try:
        t20 = estimate_rt60(decay_db_y, time_x, db_start=-5, db_end=-25)
        t30 = estimate_rt60(decay_db_y, time_x, db_start=-5, db_end=-35)
    except ValueError as e:
        return jsonify({"error": str(e)}), 422

    return jsonify({"status":"success","sampling_rate": sample_rate,"RT60_T20":t20["rt60_seconds"],"RT60_T30":t30["rt60_seconds"],"r_squared_T20":t20["r_squared"],"r_squared_T30":t30["r_squared"],}),200


@app.route('/clarity', methods=['POST'])
def clarity_route():
    try:
        signal, sample_rate = get_uploaded_audio()
        signal = extract_impulse_response(signal, sample_rate)
        c50 = clarity_index(signal, sample_rate, time_ms=50.0)
        c80 = clarity_index(signal, sample_rate, time_ms=80.0)
        d50 = definition_index(signal, sample_rate, time_ms=50.0)
    except AudioLoadError as e:
        return jsonify({"error": str(e)}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 422

    return jsonify({
        "status": "success",
        "sampling_rate": sample_rate,
        "C50": c50,
        "C80": c80,
        "D50": d50,
    }), 200


@app.route('/treatment', methods=['POST'])
def treatment_route():
    volume_raw = request.form.get("volume_m3")
    room_type = request.form.get("room_type")
    material = request.form.get("material", "acoustic_panel")

    if not volume_raw:
        return jsonify({"error": "Missing required form field 'volume_m3'."}), 400
    
    if not room_type:
        return jsonify({"error": "Missing required form field 'room_type'."}), 400

    try:
        volume_m3= float(volume_raw)
    except ValueError:
        return jsonify({"error":"'volume_m3' must be a number."}), 400

    try:
        signal, sample_rate = get_uploaded_audio()
        signal=extract_impulse_response(signal, sample_rate)
        bands=all_octave_bands(signal,sample_rate)
    except AudioLoadError as e:
        return jsonify({"error":str(e)}), 400
    except ValueError as e:
        return jsonify({"error":str(e)}), 422

    measured_rt60_by_band={}
    for center_freq, filtered_signal in bands.items():
        try:
            decay_db= energy_decay(filtered_signal, sample_rate)
            time = np.arange(len(decay_db))/sample_rate
            t20 = estimate_rt60(decay_db, time, db_start=-5, db_end=-25)
            measured_rt60_by_band[str(center_freq)] = t20["rt60_seconds"]
        except ValueError:
            continue
    if not measured_rt60_by_band:
        return jsonify({"error": "Could not estimate RT60 for any octave band from this recording."}), 422

    targets= load_acoustic_targets()
    try:
        result = recommend_treatment(measured_rt60_by_band, volume_m3, room_type, targets, material=material)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    return jsonify({"status": "success", **result}), 200
    

if __name__=="__main__":
    app.run(debug=True) 