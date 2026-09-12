import json
import os

DEFAULT_TARGETS_PATH = os.path.join(os.path.dirname(__file__),"config","acoustic_targets.json")

def load_acoustic_targets(path: str=DEFAULT_TARGETS_PATH) -> dict:
    with open(path,"r") as f:
        return json.load(f)


def sabine_absorption(rt60_seconds: float, volume_m3: float)->float:
    if rt60_seconds<=0:
        raise ValueError("RT60 must be positive to compute absorption.")

    if volume_m3 <=0:
        raise ValueError("Room volume must be positive.")

    return 0.161*volume_m3/rt60_seconds

def absorption_deficit(measured_rt60_seconds: float, target_rt60_seconds: float, volume_m3: float)->float:
    "If the difference is positive then it means the room is more reverberant (needs more absorption) and is zero or negative then it means it needs no treatment"
    current_absorption = sabine_absorption(measured_rt60_seconds, volume_m3)
    target_absorption = sabine_absorption(target_rt60_seconds, volume_m3)
    return target_absorption - current_absorption

def recommend_material_area(delta_a_sabins: float, material: str, targets: dict, center_freq: int=500)->float:
    if delta_a_sabins <=0:
        return 0.0

    materials = targets.get("materials",{})
    if material not in materials:
        raise ValueError(f"Unknown material '{material}'. Available: {list(materials.keys())}")

    coefficients = materials[material]["absorption_coefficients"]
    key = str(center_freq)
    if key not in coefficients:
        raise ValueError(f"No absorption coeeficient for '{material}' at {center_freq} Hz.")

    coefficient = coefficients[key]
    if coefficient <=0:
        raise ValueError(f"Absorption coefficient for '{material}' at {center_freq} Hz is zero - cannont compute area.")

    return delta_a_sabins/coefficient

def recommend_treatment_all_spaces(
    measured_rt60_by_band: dict,
    volume_m3: float,
    targets: dict,
    material: str = "acoustic_panel"
) -> dict:
    room_types = targets.get("room_types", {})
    all_spaces = {}
    mid_rt60 = measured_rt60_by_band.get("500", list(measured_rt60_by_band.values())[0] if measured_rt60_by_band else 0.5)

    closest_diff = float("inf")
    best_match_key = None

    for r_key, r_info in room_types.items():
        target = r_info["target_rt60_seconds"]
        acc_range = r_info.get("acceptable_range_seconds", [target * 0.85, target * 1.15])
        
        per_band = {}
        for center_freq, rt60 in measured_rt60_by_band.items():
            delta_a = absorption_deficit(rt60, target, volume_m3)
            area = recommend_material_area(delta_a, material, targets, center_freq=int(center_freq))
            per_band[str(center_freq)] = {
                "measured_rt60_seconds": rt60,
                "absorption_deficit_sabins": delta_a,
                "recommended_area_m2": area,
            }

        needed_area_500 = per_band.get("500", {}).get("recommended_area_m2", 0.0)
        max_area_needed = max([b["recommended_area_m2"] for b in per_band.values()], default=0.0)

        if acc_range[0] <= mid_rt60 <= acc_range[1]:
            status = "Optimal Match"
            status_type = "optimal"
        elif mid_rt60 > acc_range[1]:
            status = "Needs Absorption"
            status_type = "reverberant"
        else:
            status = "Too Dry / Over-Damped"
            status_type = "dry"

        diff = abs(mid_rt60 - target)
        if diff < closest_diff:
            closest_diff = diff
            best_match_key = r_key

        all_spaces[r_key] = {
            "key": r_key,
            "label": r_info.get("label", r_key),
            "target_rt60_seconds": target,
            "acceptable_range_seconds": acc_range,
            "delta_seconds": round(mid_rt60 - target, 2),
            "status": status,
            "status_type": status_type,
            "recommended_area_m2": round(needed_area_500, 1),
            "max_area_m2": round(max_area_needed, 1),
            "bands": per_band
        }

    return {
        "all_spaces": all_spaces,
        "best_match": best_match_key,
        "measured_rt60": mid_rt60,
        "material": targets.get("materials", {}).get(material, {}).get("label", material)
    }

def recommend_treatment(measured_rt60_by_band: dict, volume_m3: float, room_type: str, targets: dict, material: str ="acoustic_panel",)->dict:
    room_types= targets.get("room_types",{})
    all_eval = recommend_treatment_all_spaces(measured_rt60_by_band, volume_m3, targets, material=material)

    if room_type == "all":
        # When 'all' is requested, use the best match or default to recording studio for the primary breakdown
        primary_key = all_eval.get("best_match") or "recording_studio"
    elif room_type not in room_types:
        raise ValueError(f"Unknown room type '{room_type}'. Available: {list(room_types.keys())}")
    else:
        primary_key = room_type

    target_rt60 = room_types[primary_key]["target_rt60_seconds"]

    per_band = {}
    for center_freq, rt60 in measured_rt60_by_band.items():
        delta_a = absorption_deficit(rt60, target_rt60, volume_m3)
        area = recommend_material_area(delta_a, material, targets, center_freq=int(center_freq))
        per_band[str(center_freq)]={
            "measured_rt60_seconds":rt60,
            "absorption_deficit_sabins": delta_a,
            "recommended_area_m2": area,
        }

    return {
        "room_type": room_types[primary_key]["label"],
        "room_type_key": primary_key,
        "material": targets["materials"][material]["label"],
        "volume_m3": volume_m3,
        "target_rt60_seconds": target_rt60,
        "bands": per_band,
        "all_spaces": all_eval["all_spaces"],
        "best_match": all_eval["best_match"]
    }

    