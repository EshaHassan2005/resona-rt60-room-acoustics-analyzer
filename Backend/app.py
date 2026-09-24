import os
os.environ.setdefault("NUMBA_CACHE_DIR", "/tmp/numba_cache")
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("NUMBA_NUM_THREADS", "1")

from flask import Flask,request,jsonify
from flask_cors import CORS
# ...rest of your existing imports stay exactly as they were

from flask import Flask,request,jsonify
from flask_cors import CORS

from audio_utils import load_audio, downsample_for_preview, AudioLoadError
from dsp import (
    energy_decay,
    get_fft,
    all_octave_bands,
    extract_impulse_response,
    estimate_rt60,
    clarity_index,
    definition_index,
    calculate_room_modes,
    calculate_waterfall,
    bass_treble_ratio,
)
from treatment import (
    load_acoustic_targets,
    recommend_treatment,
    room_surface_area,
    compare_absorption_models,
)
from scipy import stats

import numpy as np

app=Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5175",
            "https://resona-rt60-room-acoustics-analyzer.vercel.app",
            "*"
        ]
    }
})

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
        "endpoints": ["/upload", "/energydecay", "/fft", "/RT60", "/clarity", "/treatment", "/roommodes", "/waterfall"],
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
        signal, sample_rate = get_uploaded_audio()
        signal = extract_impulse_response(signal, sample_rate)
        decay_db = energy_decay(signal, sample_rate)
    except AudioLoadError as e:
        return jsonify({"error": str(e)}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 422

    time = (np.arange(len(decay_db)) / sample_rate).tolist()
    return jsonify({"status": "success", "sampling_rate": sample_rate, "time": time, "decay_db": decay_db.tolist()}), 200

@app.route("/octavebands", methods=["POST"])
def octave_bands_route():
    try:
        signal, sample_rate = get_uploaded_audio()
        signal = extract_impulse_response(signal, sample_rate)
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

    return jsonify({
        "status": "success",
        "sampling_rate": sample_rate,
        "RT60_T20": t20["rt60_seconds"],
        "RT60_T30": t30["rt60_seconds"],
        "r_squared_T20": t20["r_squared"],
        "r_squared_T30": t30["r_squared"],
        "lundeby_corrected": True
    }), 200

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
    
    length_raw = request.form.get("length_m")
    width_raw = request.form.get("width_m")
    height_raw = request.form.get("height_m")

    if length_raw and width_raw and height_raw:
        try:
            volume_m3 = float(length_raw) * float(width_raw) * float(height_raw)
        except ValueError:
            return jsonify({"error": "Room dimensions must be valid numbers."}), 400
    elif volume_raw:
        try:
            volume_m3 = float(volume_raw)
        except ValueError:
            return jsonify({"error": "'volume_m3' must be a number."}), 400
    else:
        return jsonify({"error": "Missing room volume or dimensions."}), 400

    if not room_type:
        return jsonify({"error": "Missing required form field 'room_type'."}), 400

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
            decay_db = energy_decay(filtered_signal, sample_rate)
            time = np.arange(len(decay_db)) / sample_rate
            t20_band = estimate_rt60(decay_db, time, db_start=-5, db_end=-25)
            measured_rt60_by_band[str(center_freq)] = t20_band["rt60_seconds"]
        except ValueError:
            continue

    if not measured_rt60_by_band:
        return jsonify({"error": "Could not estimate RT60 for any octave band from this recording."}), 422

    # Bass/Treble Ratio - computed from real measured octave-band RT60s
    # (previously only estimated client-side with hardcoded multipliers).
    try:
        tonal_balance = bass_treble_ratio(measured_rt60_by_band)
    except ValueError:
        tonal_balance = {"bass_ratio": None, "treble_ratio": None}

    # Eyring vs. Sabine comparison - needs a surface area, which needs
    # dimensions (falls back to a cube-shape estimate if only a bare
    # volume was submitted; see room_surface_area()'s docstring).
    try:
        surface_info = room_surface_area(
            length_m=float(length_raw) if length_raw else None,
            width_m=float(width_raw) if width_raw else None,
            height_m=float(height_raw) if height_raw else None,
            volume_m3=volume_m3,
        )
        absorption_model_comparison = compare_absorption_models(
            measured_rt60_by_band.get("500", list(measured_rt60_by_band.values())[0]),
            volume_m3,
            surface_info["surface_area_m2"],
        )
        absorption_model_comparison["surface_area_m2"] = round(surface_info["surface_area_m2"], 2)
        absorption_model_comparison["surface_area_estimated"] = surface_info["estimated"]
    except ValueError:
        absorption_model_comparison = None

    # Broadband calculations for complete modal metrics & decay chart
    broadband_decay = energy_decay(signal, sample_rate)
    time_full = np.arange(len(broadband_decay)) / sample_rate
    t20 = estimate_rt60(broadband_decay, time_full, db_start=-5, db_end=-25)
    t30 = estimate_rt60(broadband_decay, time_full, db_start=-5, db_end=-35)

    c50 = clarity_index(signal, sample_rate, time_ms=50.0)
    c80 = clarity_index(signal, sample_rate, time_ms=80.0)
    d50 = definition_index(signal, sample_rate, time_ms=50.0)

    # Downsample points for energy decay curve path
    step = max(1, len(broadband_decay) // 50)
    points = [
        {"time": round(float(time_full[i]), 3), "db": round(float(broadband_decay[i]), 2)}
        for i in range(0, len(broadband_decay), step)
    ]

    targets = load_acoustic_targets()
    try:
        result = recommend_treatment(measured_rt60_by_band, volume_m3, room_type, targets, material=material)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    total_area_needed = result["bands"].get("500", {}).get("recommended_area_m2", 0.0)

    return jsonify({
        "status": "success",
        "measured_rt60": t20["rt60_seconds"],
        "RT60_T20": t20["rt60_seconds"],
        "RT60_T30": t30["rt60_seconds"],
        "r_squared_T20": t20["r_squared"],
        "r_squared_T30": t30["r_squared"],
        "C50": c50,
        "C80": c80,
        "D50": d50,
        "points": points,
        "total_area_needed_m2": total_area_needed,
        "lundeby_corrected": True,
        "bass_ratio": tonal_balance["bass_ratio"],
        "treble_ratio": tonal_balance["treble_ratio"],
        "absorption_model_comparison": absorption_model_comparison,
        **result
    }), 200

@app.route('/roommodes', methods=['POST'])
def room_modes_route():
    try:
        length_m = float(request.form.get("length_m", 6.0))
        width_m = float(request.form.get("width_m", 5.0))
        height_m = float(request.form.get("height_m", 2.8))
    except ValueError:
        return jsonify({"error": "Length, width, and height must be numbers."}), 400

    try:
        signal, sample_rate = get_uploaded_audio()
        signal = extract_impulse_response(signal, sample_rate)
        modes_data = calculate_room_modes(signal, sample_rate, length_m, width_m, height_m)
    except AudioLoadError as e:
        return jsonify({"error": str(e)}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 422

    return jsonify(modes_data), 200

@app.route('/waterfall', methods=['POST'])
def waterfall_route():
    try:
        signal, sample_rate = get_uploaded_audio()
        signal = extract_impulse_response(signal, sample_rate)
        waterfall_data = calculate_waterfall(signal, sample_rate)
    except AudioLoadError as e:
        return jsonify({"error": str(e)}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 422

    return jsonify(waterfall_data), 200

if __name__ == "__main__":
    app.run(debug=True)