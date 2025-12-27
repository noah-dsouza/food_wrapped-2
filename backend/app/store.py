# backend/app/store.py

from __future__ import annotations

# Standard library imports
import json
import uuid
from pathlib import Path
from typing import Optional, List, Dict, Any

# -----------------------------
# In-memory "database"
# -----------------------------
MEALS: List[Dict[str, Any]] = []  # This resets whenever the server restarts (demo mode)


# -----------------------------
# Helpers to keep data valid
# -----------------------------
def normalize_category(category: Optional[str]) -> str:
    """Convert weird category values into one of: Home, Restaurant, Takeout."""
    # If category is missing, default to Home
    if not category:
        return "Home"

    # Clean whitespace + normalize casing
    cleaned = str(category).strip().title()

    # Allow the official values
    if cleaned in {"Home", "Restaurant", "Takeout"}:
        return cleaned

    # Map common “almost categories” into something valid
    mapping = {
        "Cafe": "Restaurant",
        "Café": "Restaurant",
        "Coffee Shop": "Restaurant",
        "Dining": "Restaurant",
        "Dine In": "Restaurant",
        "Dine-In": "Restaurant",
        "Fast Food": "Takeout",
        "Fastfood": "Takeout",
        "Delivery": "Takeout",
    }

    # Return mapped value if known; otherwise default to Restaurant
    return mapping.get(cleaned, "Restaurant")


def normalize_meal_record(meal: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize a meal dict so it matches our API schema."""
    # Make a copy so we don’t mutate the original dict by accident
    normalized = dict(meal)

    # Force category into valid enum values
    normalized["category"] = normalize_category(normalized.get("category"))

    # Clean basic strings (helps pandas + frontend consistency)
    if "meal_type" in normalized and normalized["meal_type"]:
        normalized["meal_type"] = str(normalized["meal_type"]).strip().title()

    if "cuisine" in normalized and normalized["cuisine"]:
        normalized["cuisine"] = str(normalized["cuisine"]).strip()

    if "food_name" in normalized and normalized["food_name"]:
        normalized["food_name"] = str(normalized["food_name"]).strip()

    return normalized


# -----------------------------
# CRUD-ish functions
# -----------------------------
def add_meal(meal: Dict[str, Any]) -> Dict[str, Any]:
    """Add a meal dict to memory and return the stored record."""
    # Normalize the record so it always matches our schema
    normalized = normalize_meal_record(meal)

    # Append to in-memory list
    MEALS.append(normalized)

    # Return what we stored
    return normalized


def list_meals(
    start: Optional[str] = None,
    end: Optional[str] = None,
    meal_type: Optional[str] = None,
    category: Optional[str] = None,
    cuisine: Optional[str] = None,
    q: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List meals with optional filters; always return schema-valid records."""

    # Start from all meals
    records = [normalize_meal_record(m) for m in MEALS]

    # Filter by start/end (simple string compare works for YYYY-MM-DD if format is consistent)
    if start:
        records = [m for m in records if m.get("date", "") >= start]
    if end:
        records = [m for m in records if m.get("date", "") <= end]

    # Filter by enum fields
    if meal_type:
        mt = meal_type.strip().title()
        records = [m for m in records if str(m.get("meal_type", "")).strip().title() == mt]

    if category:
        cat = normalize_category(category)
        records = [m for m in records if normalize_category(m.get("category")) == cat]

    if cuisine:
        c = cuisine.strip().lower()
        records = [m for m in records if str(m.get("cuisine", "")).strip().lower() == c]

    # Full-text search in food_name + notes
    if q:
        query = q.strip().lower()
        records = [
            m
            for m in records
            if query in str(m.get("food_name", "")).lower()
            or query in str(m.get("notes", "")).lower()
        ]

    # Sort descending by date (newest first)
    records.sort(key=lambda m: m.get("date", ""), reverse=True)

    return records


def delete_meal(meal_id: str) -> bool:
    """Delete one meal by id. Returns True if deleted."""
    # Iterate through list with index
    for i, m in enumerate(MEALS):
        if m.get("id") == meal_id:
            MEALS.pop(i)
            return True
    return False


def clear_meals() -> int:
    """Clear all meals and return how many were cleared."""
    count = len(MEALS)
    MEALS.clear()
    return count


def seed_demo_meals() -> int:
    """Load demo meals from backend/data/demo_seed.json into memory."""
    # Find the seed file relative to this file
    seed_path = Path(__file__).resolve().parents[1] / "data" / "demo_seed.json"

    # Read JSON list
    with open(seed_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Normalize each record + ensure it has an id
    count = 0
    for item in data:
        # Ensure ID exists (seed data sometimes omits it)
        if not item.get("id"):
            item["id"] = str(uuid.uuid4())

        # Normalize fields to match schema
        stored = add_meal(item)

        # Track how many were added
        count += 1

    return count
