"""Utility script to train the cuisine suggestion model."""

from __future__ import annotations

# Import Path to locate data and model files.
from pathlib import Path
# Import typing helpers for type hints.
from typing import Tuple

# Import joblib to persist the trained model.
import joblib
# Import pandas to load the CSV dataset.
import pandas as pd
# Import scikit-learn utilities to build the pipeline.
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

# Define the backend directory relative to this file.
BACKEND_DIR: Path = Path(__file__).resolve().parent.parent.parent  # Root folder
# Define the training data path.
DATA_FILE: Path = BACKEND_DIR / "data" / "cuisine_training.csv"  # CSV path
# Define the model output path.
MODEL_PATH: Path = BACKEND_DIR / "models" / "cuisine_model.joblib"  # Model output


def load_dataset() -> Tuple[pd.Series, pd.Series]:
  """Load the cuisine training CSV and return features plus labels."""
  # Read the CSV into a DataFrame.
  df = pd.read_csv(DATA_FILE)  # Load CSV file
  # Drop rows with missing values to keep training clean.
  df = df.dropna(subset=["text", "cuisine"])  # Remove incomplete rows
  # Return the text column and cuisine column separately.
  return df["text"], df["cuisine"]  # Return features and labels


def build_pipeline() -> Pipeline:
  """Build the TF-IDF + logistic regression pipeline."""
  # Compose the pipeline with two steps.
  return Pipeline(  # Compose the pipeline
    steps=[
      # First convert text into numeric features.
      (
        "tfidf",
        TfidfVectorizer(
          ngram_range=(1, 2),
          min_df=1,
          max_features=2000,
        ),
      ),
      # Then train a logistic regression classifier.
      ("clf", LogisticRegression(max_iter=1000)),  # Logistic regression classifier
    ]
  )


def train_and_save() -> None:
  """Train the cuisine model, report accuracy, and save it."""
  # Load the dataset from disk.
  texts, labels = load_dataset()  # Load dataset from disk
  # Split into training and validation sets for a quick metric.
  x_train, x_test, y_train, y_test = train_test_split(
    texts, labels, test_size=0.2, random_state=42, stratify=labels
  )
  # Build the pipeline.
  pipeline = build_pipeline()  # Build pipeline
  # Fit the pipeline on the training split.
  pipeline.fit(x_train, y_train)  # Train pipeline
  # Generate predictions for the validation split.
  predictions = pipeline.predict(x_test)  # Predict on validation
  # Compute accuracy to understand quality.
  accuracy = accuracy_score(y_test, predictions)  # Compute accuracy
  # Print the accuracy for transparency.
  print(f"Validation accuracy: {accuracy:.2%}")
  # Ensure the models directory exists before saving.
  MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)  # Ensure folder exists
  # Persist the trained pipeline as a joblib file.
  joblib.dump(pipeline, MODEL_PATH)  # Save the pipeline
  # Print the final save location.
  print(f"Model saved to: {MODEL_PATH}")


if __name__ == "__main__":
  # Execute training when run as a script.
  train_and_save()
