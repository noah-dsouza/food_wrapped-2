
from __future__ import annotations

import json
import uuid
from pathlib import Path
from typing import Optional, List, Dict, Any


#  Reset when server restarts in demo
MEALS: List[Dict[str, Any]] = [] 


# Convert cats 
def normalize_category(category: Optional[str]) -> str:
    if not category:
        return "Home"

    cleaned = str(category).strip().title()

    if cleaned in {"Home", "Restaurant", "Takeout"}:
        return cleaned

    # Map common cats into something valid
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

    # Return mapped value if known else otherwise default to Resto
    return mapping.get(cleaned, "Restaurant")


def normalize_meal_record(meal: Dict[str, Any]) -> Dict[str, Any]:
    normalized = dict(meal)
    normalized["category"] = normalize_category(normalized.get("category"))

    # Clean strs
    if "meal_type" in normalized and normalized["meal_type"]:
        normalized["meal_type"] = str(normalized["meal_type"]).strip().title()

    if "cuisine" in normalized and normalized["cuisine"]:
        normalized["cuisine"] = str(normalized["cuisine"]).strip()

    if "food_name" in normalized and normalized["food_name"]:
        normalized["food_name"] = str(normalized["food_name"]).strip()

    return normalized


def add_meal(meal: Dict[str, Any]) -> Dict[str, Any]:
    normalized = normalize_meal_record(meal)
    # Append to in-memory list
    MEALS.append(normalized)
    return normalized


def list_meals(
    start: Optional[str] = None,
    end: Optional[str] = None,
    meal_type: Optional[str] = None,
    category: Optional[str] = None,
    cuisine: Optional[str] = None,
    q: Optional[str] = None,
) -> List[Dict[str, Any]]:

    records = [normalize_meal_record(m) for m in MEALS]

    # Filter by start n end
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

    # Sort descending by date
    records.sort(key=lambda m: m.get("date", ""), reverse=True)

    return records


def delete_meal(meal_id: str) -> bool:
    for i, m in enumerate(MEALS):
        if m.get("id") == meal_id:
            MEALS.pop(i)
            return True
    return False


def clear_meals() -> int:
    count = len(MEALS)
    MEALS.clear()
    return count


def seed_demo_meals() -> int:
    seed_path = Path(__file__).resolve().parents[1] / "data" / "demo_seed.json"

    # Read JSON list
    with open(seed_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Normalize each record + check for id
    count = 0
    for item in data:
        if not item.get("id"):
            item["id"] = str(uuid.uuid4())

        stored = add_meal(item)
        count += 1

    return count
