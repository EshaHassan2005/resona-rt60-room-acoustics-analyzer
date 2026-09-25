import json
import math
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

def room_surface_area(length_m: float = None, width_m: float = None, height_m: float = None, volume_m3: float = None) -> float:
    """
    Total interior surface area (m^2) of a rectangular room, needed by
    Eyring's equation (Sabine's equation only needs volume, which is why
    the rest of this file historically got away with never computing this).

    If length/width/height are all given, area is exact:
        S = 2*(L*W + L*H + W*H)

    If only a volume is known (e.g. the user typed in a volume instead of
    three dimensions), there's no way to recover the true surface area -
    a room can have one volume with many different shapes/surface areas.
    In that case we fall back to assuming a cube of that volume as a
    reasonable order-of-magnitude estimate (cubes have the *minimum*
    possible surface area for a given volume, so this fallback slightly
    under-estimates area for typical non-cubic rooms - flagged in the
    returned dict as "estimated": True so callers/UI can show a caveat).
    """
    if length_m and width_m and height_m:
        area = 2 * (length_m * width_m + length_m * height_m + width_m * height_m)
        return {"surface_area_m2": area, "estimated": False}

    if volume_m3 and volume_m3 > 0:
        side = volume_m3 ** (1.0 / 3.0)
        area = 6 * side ** 2
        return {"surface_area_m2": area, "estimated": True}

    raise ValueError("Need either (length_m, width_m, height_m) or volume_m3 to estimate surface area.")


def eyring_absorption_coefficient(rt60_seconds: float, volume_m3: float, surface_area_m2: float) -> float:
    """
    Average absorption coefficient (alpha-bar) implied by a measured RT60,
    via Eyring's reverberation equation - inverted to solve for alpha-bar
    instead of RT60:

        RT60 = 0.161*V / (-S * ln(1 - alpha_bar))
        =>  alpha_bar = 1 - exp( -0.161*V / (RT60 * S) )

    Eyring's model is more physically accurate than Sabine's for rooms
    with high average absorption (alpha_bar above roughly 0.2-0.3), where
    Sabine's equation - which assumes absorption scales linearly with
    alpha_bar - starts to noticeably overestimate RT60. For "typical" live
    rooms (alpha_bar well under 0.2) the two models agree closely.
    """
    if rt60_seconds <= 0:
        raise ValueError("RT60 must be positive to compute absorption.")
    if volume_m3 <= 0:
        raise ValueError("Room volume must be positive.")
    if surface_area_m2 <= 0:
        raise ValueError("Room surface area must be positive.")

    exponent = -0.161 * volume_m3 / (rt60_seconds * surface_area_m2)
    return 1 - math.exp(exponent)


def eyring_rt60(alpha_bar: float, volume_m3: float, surface_area_m2: float) -> float:
    """Predict RT60 from a known average absorption coefficient via Eyring's
    equation - the forward direction of eyring_absorption_coefficient()."""
    if not (0 <= alpha_bar < 1):
        raise ValueError("alpha_bar must be in [0, 1).")
    if volume_m3 <= 0 or surface_area_m2 <= 0:
        raise ValueError("Volume and surface area must be positive.")
    if alpha_bar == 0:
        raise ValueError("alpha_bar of 0 implies infinite RT60 (a perfectly reflective room).")

    return 0.161 * volume_m3 / (-surface_area_m2 * math.log(1 - alpha_bar))


def compare_absorption_models(rt60_seconds: float, volume_m3: float, surface_area_m2: float) -> dict:
    """
    Compares Sabine's and Eyring's average-absorption-coefficient estimate
    for the *same* measured RT60, and flags whether Sabine's simpler
    (linear) approximation is reliable for this room.
    """
    a_sabine = sabine_absorption(rt60_seconds, volume_m3)
    alpha_sabine = min(a_sabine / surface_area_m2, 1.0)
    alpha_eyring = eyring_absorption_coefficient(rt60_seconds, volume_m3, surface_area_m2)

    divergence_pct = (
        abs(alpha_eyring - alpha_sabine) / alpha_eyring * 100
        if alpha_eyring > 0 else 0.0
    )

    return {
        "alpha_bar_sabine": round(alpha_sabine, 4),
        "alpha_bar_eyring": round(alpha_eyring, 4),
        "divergence_percent": round(divergence_pct, 2),
        # Rule of thumb: Sabine stays accurate to within a few percent while
        # alpha_bar is below ~0.2; above that its linear assumption breaks
        # down and Eyring should be trusted instead.
        "sabine_reliable": bool(alpha_sabine < 0.2),
    }


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