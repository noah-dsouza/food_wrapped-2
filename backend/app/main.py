

from __future__ import annotations

import os
import uuid
from datetime import datetime, date
from typing import Optional, List, Dict, Any

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .schemas import (
    MealCreate,
    MealResponse,
    WrappedResponse,
    WrappedPeriod,
    CountItem,
    MonthCount,
    BestRated,
    MostExpensive,
    CuisineSuggestRequest,
    CuisineSuggestResponse,
    CuisineSuggestion,
)


app = FastAPI(title="Food Wrapped API", version="1.0.0")

# Let frontend call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


MEALS: List[Dict[str, Any]] = []

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "cuisine_model.joblib")

_cuisine_model = None


def load_cuisine_model():
    global _cuisine_model
    if _cuisine_model is None:
        if not os.path.exists(MODEL_PATH):
            _cuisine_model = "MISSING"
        else:
            _cuisine_model = joblib.load(MODEL_PATH)
    return _cuisine_model


def heuristic_cuisine_guess(food_name: str) -> tuple[str, float]:
    s = food_name.lower()

    rules = [
        (["taco", "burrito", "quesadilla", "enchilada", "salsa"], "Mexican"),
        (["sushi", "ramen", "udon", "miso", "teriyaki"], "Japanese"),
        (["pasta", "pizza", "risotto", "gelato"], "Italian"),
        (["curry", "biryani", "naan", "tikka", "masala"], "Indian"),
        (["pho", "banh mi", "spring roll"], "Vietnamese"),
        (["burger", "fries", "bbq", "brisket"], "American"),
        (["croissant", "baguette", "ratatouille"], "French"),
        (["shawarma", "falafel", "hummus"], "Middle Eastern"),
        (["poke", "spam musubi"], "Hawaiian"),
    ]

    for keywords, cuisine in rules:
        if any(k in s for k in keywords):
            return cuisine, 0.55

    return "Other", 0.20


def predict_cuisine(food_name: str) -> tuple[str, float]:
    model = load_cuisine_model()


    if model == "MISSING":
        return heuristic_cuisine_guess(food_name)


    try:
        # If model supports probabilities, use them for confidence
        if hasattr(model, "predict_proba") and hasattr(model, "classes_"):
            probs = model.predict_proba([food_name])[0]
            best_idx = int(probs.argmax())
            cuisine = str(model.classes_[best_idx])
            confidence = float(probs[best_idx])
            return cuisine, confidence

        # predict label 
        pred = model.predict([food_name])[0]
        return str(pred), 0.35

    except Exception:
        return heuristic_cuisine_guess(food_name)

# Endpoinys

@app.get("/health")
def health():
    return {"ok": True}


@app.post("/cuisine/suggest", response_model=CuisineSuggestResponse)
def cuisine_suggest(payload: CuisineSuggestRequest):
    food_name = payload.food_name.strip()
    if len(food_name) < 3:
        return CuisineSuggestResponse(cuisine="Other", confidence=0.0)

    cuisine, confidence = predict_cuisine(food_name)
    return CuisineSuggestResponse(cuisine=cuisine, confidence=confidence)


@app.post("/meals", response_model=MealResponse)
def create_meal(meal: MealCreate):
    # Normalize for emprty str
    cuisine_in = (meal.cuisine or "").strip()
    suggested = None

    if cuisine_in == "":
        cuisine_guess, conf = predict_cuisine(meal.food_name)
        cuisine_in = cuisine_guess
        suggested = CuisineSuggestion(cuisine=cuisine_guess, confidence=conf)

    record = {
        "id": str(uuid.uuid4()),
        "date": meal.date.isoformat(),
        "meal_type": meal.meal_type,
        "food_name": meal.food_name,
        "category": meal.category,
        "cuisine": cuisine_in,
        "rating": meal.rating,
        "cost": meal.cost,
        "mood": meal.mood,
        "notes": meal.notes,
    }

    MEALS.insert(0, record)

    return MealResponse(**record, cuisine_suggestion=suggested)


@app.get("/meals", response_model=List[MealResponse])
def get_meals():
    return [MealResponse(**m, cuisine_suggestion=None) for m in MEALS]


@app.delete("/meals/{meal_id}")
def delete_meal(meal_id: str):
    global MEALS
    before = len(MEALS)
    MEALS = [m for m in MEALS if m["id"] != meal_id]
    after = len(MEALS)

    if after == before:
        raise HTTPException(status_code=404, detail="Meal not found")

    return {"deleted": 1}


@app.post("/demo/reset")
def demo_reset():
    """
    Clears memory. Great for demos.
    """
    cleared = len(MEALS)
    MEALS.clear()
    return {"cleared": cleared}


@app.post("/demo/seed")
def demo_seed():
    """
    Seeds fake meals for a demo year.
    """
    sample = [
        ("2024-01-03", "Breakfast", "Bagel with Lox", "Home", "American", 4, 8.0),
        ("2024-01-05", "Lunch", "Pho", "Restaurant", "Vietnamese", 5, 18.0),
        ("2024-01-08", "Dinner", "Burrito Bowl", "Takeout", "Mexican", 4, 14.0),
        ("2024-02-10", "Dinner", "Sushi", "Restaurant", "Japanese", 5, 35.0),
        ("2024-02-14", "Lunch", "Ratatouille", "Home", "French", 4, 12.0),
        ("2024-03-29", "Dinner", "Surf and Turf", "Restaurant", "American", 5, 62.0),
        ("2024-03-31", "Dinner", "Ceviche", "Home", "Peruvian", 5, 20.0),
    ]

    rows = []
    i = 0
    while len(rows) < 48:
        d, mt, fn, cat, cuis, rating, cost = sample[i % len(sample)]
        rows.append(
            {
                "id": f"seed-{len(rows)+1:03d}",
                "date": d,
                "meal_type": mt,
                "food_name": fn,
                "category": cat,
                "cuisine": cuis,
                "rating": rating,
                "cost": cost,
                "mood": None,
                "notes": None,
            }
        )
        i += 1

    # Add to memory w newest first
    MEALS[:0] = rows[::-1]  
    return {"seeded": len(rows)}


@app.get("/wrapped", response_model=WrappedResponse)
def wrapped(year: int = Query(..., ge=1900, le=2100), month: Optional[int] = Query(None, ge=1, le=12)):
    if not MEALS:
        # Empty response with correct shape
        monthly_counts = [{"month": f"{year}-{m:02d}", "meals": 0} for m in range(1, 13)]
        return WrappedResponse(
            period=WrappedPeriod(year=year, month=month),
            total_meals=0,
            top_cuisines=[],
            top_foods=[],
            category_split={"Home": 0.0, "Restaurant": 0.0, "Takeout": 0.0},
            meal_type_breakdown={"Breakfast": 0, "Lunch": 0, "Dinner": 0, "Snack": 0},
            monthly_counts=[MonthCount(**x) for x in monthly_counts],
            longest_streak_days=0,
            highest_rated_meal=None,
            most_expensive_meal=None,
            fun_badges=[],
        )

    df = pd.DataFrame(MEALS).copy()

    # Parse dates
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date"])

    # Filter by year/month
    df = df[df["date"].dt.year == year]
    if month is not None:
        df = df[df["date"].dt.month == month]

    total = int(len(df))

    # If nothing in eriod, return empty
    if total == 0:
        monthly_counts = [{"month": f"{year}-{m:02d}", "meals": 0} for m in range(1, 13)]
        return WrappedResponse(
            period=WrappedPeriod(year=year, month=month),
            total_meals=0,
            top_cuisines=[],
            top_foods=[],
            category_split={"Home": 0.0, "Restaurant": 0.0, "Takeout": 0.0},
            meal_type_breakdown={"Breakfast": 0, "Lunch": 0, "Dinner": 0, "Snack": 0},
            monthly_counts=[MonthCount(**x) for x in monthly_counts],
            longest_streak_days=0,
            highest_rated_meal=None,
            most_expensive_meal=None,
            fun_badges=[],
        )

    # Top cuisines
    top_cuisines_series = df["cuisine"].fillna("Other").value_counts().head(5)
    top_cuisines = [CountItem(cuisine=str(k), count=int(v)) for k, v in top_cuisines_series.items()]

    # Top foods
    top_foods_series = df["food_name"].fillna("Unknown").value_counts().head(10)
    top_foods = [CountItem(food_name=str(k), count=int(v)) for k, v in top_foods_series.items()]

    # Category split 
    cat_counts = df["category"].value_counts()
    category_split = {
        "Home": float(cat_counts.get("Home", 0) / total),
        "Restaurant": float(cat_counts.get("Restaurant", 0) / total),
        "Takeout": float(cat_counts.get("Takeout", 0) / total),
    }

    # Meal type breakdown
    meal_type_counts = df["meal_type"].value_counts()
    meal_type_breakdown = {
        "Breakfast": int(meal_type_counts.get("Breakfast", 0)),
        "Lunch": int(meal_type_counts.get("Lunch", 0)),
        "Dinner": int(meal_type_counts.get("Dinner", 0)),
        "Snack": int(meal_type_counts.get("Snack", 0)),
    }

    # Monthly counts 
    df["month_key"] = df["date"].dt.strftime("%Y-%m")
    month_counts = df["month_key"].value_counts().to_dict()
    monthly_counts = []
    for m in range(1, 13):
        key = f"{year}-{m:02d}"
        monthly_counts.append(MonthCount(month=key, meals=int(month_counts.get(key, 0))))

    # Longest streak of consecutive days
    days = sorted(df["date"].dt.date.unique())
    longest = 0
    current = 0
    prev = None
    for d in days:
        if prev is None or (d - prev).days == 1:
            current += 1
        else:
            current = 1
        longest = max(longest, current)
        prev = d

    # Highest rated meal
    highest_rated_meal = None
    if df["rating"].notna().any():
        best = df.dropna(subset=["rating"]).sort_values(["rating", "date"], ascending=[False, False]).iloc[0]
        highest_rated_meal = BestRated(
            food_name=str(best["food_name"]),
            date=str(best["date"].date()),
            rating=int(best["rating"]),
        )

    # Most expensive meal
    most_expensive_meal = None
    if df["cost"].notna().any():
        expensive = df.dropna(subset=["cost"]).sort_values(["cost", "date"], ascending=[False, False]).iloc[0]
        most_expensive_meal = MostExpensive(
            food_name=str(expensive["food_name"]),
            date=str(expensive["date"].date()),
            cost=float(expensive["cost"]),
        )

    # Fun badges 
    fun_badges: List[str] = []
    if most_expensive_meal and most_expensive_meal.cost >= 50:
        fun_badges.append("Fine Dining Moment")
    if category_split["Home"] >= 0.7:
        fun_badges.append("Home Chef Era")
    if len(top_cuisines) >= 3:
        fun_badges.append("Cuisine Explorer")

    return WrappedResponse(
        period=WrappedPeriod(year=year, month=month),
        total_meals=total,
        top_cuisines=top_cuisines,
        top_foods=top_foods,
        category_split=category_split,
        meal_type_breakdown=meal_type_breakdown,
        monthly_counts=monthly_counts,
        longest_streak_days=int(longest),
        highest_rated_meal=highest_rated_meal,
        most_expensive_meal=most_expensive_meal,
        fun_badges=fun_badges,
    )
