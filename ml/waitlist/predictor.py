"""Load and infer with the already-trained waitlist model."""

from __future__ import annotations

from functools import lru_cache
import math
from pathlib import Path
from typing import Any

import joblib
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = PROJECT_ROOT / "ml" / "models" / "waitlist_model.pkl"

NUMERIC_FEATURES = (
    "days_to_departure",
    "waitlist_position",
    "total_seats",
    "historical_occupancy_rate",
    "historical_cancellation_rate",
    "seats_released",
)
CATEGORICAL_FEATURES = (
    "travel_class",
    "day_of_week",
    "is_weekend",
    "demand_level",
)
FEATURE_COLUMNS = NUMERIC_FEATURES + CATEGORICAL_FEATURES


class InvalidFeatures(ValueError):
    """Raised when a prediction request does not match the fitted schema."""


@lru_cache(maxsize=1)
def load_model() -> Any:
    if not MODEL_PATH.is_file():
        raise FileNotFoundError("Trained waitlist model is unavailable")

    model = joblib.load(MODEL_PATH)
    model_features = tuple(getattr(model, "feature_names_in_", ()))
    if model_features != FEATURE_COLUMNS:
        raise RuntimeError("Trained waitlist model feature schema does not match predictor")
    if not hasattr(model, "predict_proba") or not hasattr(model, "classes_"):
        raise RuntimeError("Trained waitlist model does not support probability prediction")
    return model


def validate_features(features: Any) -> dict[str, Any]:
    if not isinstance(features, dict):
        raise InvalidFeatures("Prediction features must be a JSON object")

    missing = [name for name in FEATURE_COLUMNS if name not in features]
    unexpected = sorted(set(features) - set(FEATURE_COLUMNS))
    if missing:
        raise InvalidFeatures(f"Missing required prediction features: {', '.join(missing)}")
    if unexpected:
        raise InvalidFeatures(f"Unexpected prediction features: {', '.join(unexpected)}")

    normalized = dict(features)
    for name in NUMERIC_FEATURES:
        value = normalized[name]
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise InvalidFeatures(f"{name} must be numeric")
        if not math.isfinite(value):
            raise InvalidFeatures(f"{name} must be a finite number")

    for name in ("days_to_departure", "seats_released"):
        if normalized[name] < 0:
            raise InvalidFeatures(f"{name} must be zero or greater")
    if normalized["waitlist_position"] < 1:
        raise InvalidFeatures("waitlist_position must be at least 1")
    if normalized["total_seats"] <= 0:
        raise InvalidFeatures("total_seats must be greater than 0")
    for name in ("historical_occupancy_rate", "historical_cancellation_rate"):
        if not 0 <= normalized[name] <= 1:
            raise InvalidFeatures(f"{name} must be between 0 and 1")

    for name in ("travel_class", "day_of_week", "demand_level"):
        if not isinstance(normalized[name], str) or not normalized[name].strip():
            raise InvalidFeatures(f"{name} must be a non-empty string")

    normalized["travel_class"] = normalized["travel_class"].strip().upper()
    normalized["day_of_week"] = normalized["day_of_week"].strip().capitalize()
    normalized["demand_level"] = normalized["demand_level"].strip().upper()
    if not isinstance(normalized["is_weekend"], bool):
        raise InvalidFeatures("is_weekend must be a boolean")

    return normalized


def predict_confirmation(features: Any) -> dict[str, Any]:
    normalized = validate_features(features)
    model = load_model()
    row = pd.DataFrame(
        [{name: normalized[name] for name in FEATURE_COLUMNS}],
        columns=FEATURE_COLUMNS,
    )
    probabilities = model.predict_proba(row)[0]
    positive_class_index = next(
        (index for index, label in enumerate(model.classes_) if int(label) == 1),
        None,
    )
    if positive_class_index is None:
        raise RuntimeError("Trained waitlist model does not contain positive class 1")

    probability = float(probabilities[positive_class_index]) * 100
    if probability >= 70:
        prediction = "Likely to Confirm"
    elif probability >= 40:
        prediction = "Moderate Chance"
    else:
        prediction = "Low Chance"

    return {
        "confirmation_probability": round(probability, 2),
        "prediction": prediction,
    }
