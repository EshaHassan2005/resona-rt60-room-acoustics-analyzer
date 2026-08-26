import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest

from treatment import (
    load_acoustic_targets,
    sabine_absorption,
    absorption_deficit,
    recommend_material_area,
    recommend_treatment,
)


@pytest.fixture
def targets():
    return load_acoustic_targets()


def test_load_acoustic_targets_has_expected_top_level_keys(targets):
    assert "room_types" in targets
    assert "materials" in targets


def test_load_acoustic_targets_room_types_have_target_rt60(targets):
    for room_type, info in targets["room_types"].items():
        assert "target_rt60_seconds" in info
        assert info["target_rt60_seconds"] > 0


def test_load_acoustic_targets_materials_cover_standard_octave_bands(targets):
    standard_bands = {"125", "250", "500", "1000", "2000", "4000"}
    for material, info in targets["materials"].items():
        coeffs = info["absorption_coefficients"]
        assert standard_bands.issubset(coeffs.keys())


# ---------- sabine_absorption ----------

def test_sabine_absorption_matches_hand_calculation():
    # RT60 = 0.161 * V / A  =>  A = 0.161 * V / RT60
    rt60 = 0.5
    volume = 100.0
    expected = 0.161 * volume / rt60
    assert sabine_absorption(rt60, volume) == pytest.approx(expected)


def test_sabine_absorption_rejects_nonpositive_rt60():
    with pytest.raises(ValueError):
        sabine_absorption(0, 100.0)
    with pytest.raises(ValueError):
        sabine_absorption(-1, 100.0)


def test_sabine_absorption_rejects_nonpositive_volume():
    with pytest.raises(ValueError):
        sabine_absorption(0.5, 0)


def test_sabine_absorption_larger_rt60_means_less_absorption():
    # a longer reverberation time implies a less-absorptive (more "live") room
    a_short_rt60 = sabine_absorption(0.3, 100.0)
    a_long_rt60 = sabine_absorption(2.0, 100.0)
    assert a_long_rt60 < a_short_rt60


# ---------- absorption_deficit ----------

def test_absorption_deficit_positive_when_room_too_reverberant():
    # measured RT60 (2.0s) is much longer than target (0.5s) => room needs more absorption
    deficit = absorption_deficit(measured_rt60_seconds=2.0, target_rt60_seconds=0.5, volume_m3=150.0)
    assert deficit > 0


def test_absorption_deficit_negative_when_room_already_meets_target():
    # measured RT60 (0.3s) is already shorter than target (0.6s) => no treatment needed
    deficit = absorption_deficit(measured_rt60_seconds=0.3, target_rt60_seconds=0.6, volume_m3=150.0)
    assert deficit < 0


def test_absorption_deficit_zero_when_rt60_matches_target():
    deficit = absorption_deficit(measured_rt60_seconds=0.6, target_rt60_seconds=0.6, volume_m3=150.0)
    assert deficit == pytest.approx(0.0, abs=1e-9)


# ---------- recommend_material_area ----------

def test_recommend_material_area_zero_when_no_deficit(targets):
    area = recommend_material_area(-5.0, "acoustic_panel", targets, center_freq=1000)
    assert area == 0.0


def test_recommend_material_area_scales_inversely_with_coefficient(targets):
    # a material with a higher absorption coefficient at a given band needs less area
    # to close the same deficit
    area_1000hz = recommend_material_area(10.0, "acoustic_panel", targets, center_freq=1000)
    area_125hz = recommend_material_area(10.0, "acoustic_panel", targets, center_freq=125)
    # acoustic_panel is far less absorptive at 125Hz (0.15) than at 1000Hz (0.90)
    assert area_125hz > area_1000hz


def test_recommend_material_area_rejects_unknown_material(targets):
    with pytest.raises(ValueError):
        recommend_material_area(10.0, "unobtainium_foam", targets, center_freq=1000)


def test_recommend_material_area_rejects_unknown_band(targets):
    with pytest.raises(ValueError):
        recommend_material_area(10.0, "acoustic_panel", targets, center_freq=999)


# ---------- recommend_treatment (end-to-end) ----------

def test_recommend_treatment_returns_entry_per_band(targets):
    measured = {"500": 1.2, "1000": 1.1, "2000": 1.0}
    result = recommend_treatment(measured, volume_m3=150.0, room_type="classroom", targets=targets)
    assert set(result["bands"].keys()) == set(measured.keys())


def test_recommend_treatment_recommends_area_for_reverberant_room(targets):
    # classroom target is 0.6s; a measured 1.5s is clearly too reverberant
    measured = {"500": 1.5}
    result = recommend_treatment(measured, volume_m3=150.0, room_type="classroom", targets=targets)
    assert result["bands"]["500"]["recommended_area_m2"] > 0


def test_recommend_treatment_recommends_no_area_for_already_treated_room(targets):
    # recording_studio target is 0.3s; a measured 0.2s already beats the target
    measured = {"500": 0.2}
    result = recommend_treatment(measured, volume_m3=150.0, room_type="recording_studio", targets=targets)
    assert result["bands"]["500"]["recommended_area_m2"] == 0.0


def test_recommend_treatment_rejects_unknown_room_type(targets):
    with pytest.raises(ValueError):
        recommend_treatment({"500": 1.0}, volume_m3=150.0, room_type="spaceship_cockpit", targets=targets)