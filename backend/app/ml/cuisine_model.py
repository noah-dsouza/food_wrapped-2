"""Helper module that loads and uses the cuisine suggestion model."""

from __future__ import annotations

# Import typing helpers.
from typing import Any, Dict
# Import Path for locating the trained model file.
from pathlib import Path

# Import joblib to load the serialized pipeline.
import joblib

# Resolve the directory containing the saved models.
MODEL_PATH = Path(__file__).resolve().parents[2] / "models" / "cuisine_model.joblib"  # Path to joblib file

# Cache the loaded pipeline so we do not reload it for every request.
CACHED_PIPELINE = None  # Cache placeholder


def load_model():
  """Load the cuisine suggestion pipeline from disk once."""
  # Use the cached pipeline if it already exists.
  global CACHED_PIPELINE  # Reference the global cache
  if CACHED_PIPELINE is not None:  # Return cached pipeline when available
    return CACHED_PIPELINE
  CACHED_PIPELINE = joblib.load(MODEL_PATH)  # Load the model from disk
  return CACHED_PIPELINE  # Return the loaded pipeline


def suggest_cuisine(text: str) -> Dict[str, Any]:
  """Return the top cuisine prediction for the supplied text."""
  if not text.strip():  # Handle empty inputs
    return {"cuisine": "Unknown", "confidence": 0.0}  # Default suggestion
  pipeline = load_model()  # Load or reuse the model
  if hasattr(pipeline, "predict_proba"):  # Check probability support
    probs = pipeline.predict_proba([text])[0]  # Predict probabilities
    labels = pipeline.classes_  # Access label ordering
    best_index = int(probs.argmax())  # Find best probability index
    return {  # Return predicted cuisine with confidence
      "cuisine": str(labels[best_index]),
      "confidence": float(probs[best_index]),
    }
  prediction = pipeline.predict([text])[0]  # Fall back to predict()
  return {"cuisine": str(prediction), "confidence": 0.0}  # Return without confidence
