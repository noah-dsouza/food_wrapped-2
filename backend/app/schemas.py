# backend/app/schemas.py
# Pydantic schemas (request/response shapes) for the API.

from __future__ import annotations

from datetime import date
from typing import Literal, Optional, List

from pydantic import BaseModel, Field


# ------------ Cuisine Suggest ------------

class CuisineSuggestRequest(BaseModel):
    # What the user typed (e.g., "chicken burrito bowl")
    food_name: str = Field(..., min_length=1)


class CuisineSuggestResponse(BaseModel):
    # Model's best guess (e.g., "Mexican")
    cuisine: str
    # Confidence in [0, 1] if model supports probabilities; else heuristic
    confidence: float = Field(..., ge=0.0, le=1.0)


# ------------ Meals ------------

MealType = Literal["Breakfast", "Lunch", "Dinner", "Snack"]
Category = Literal["Home", "Restaurant", "Takeout"]


class MealBase(BaseModel):
    # ISO date string "YYYY-MM-DD"
    date: date

    # Backend uses snake_case
    meal_type: MealType
    food_name: str = Field(..., min_length=1)
    category: Category

    # Optional: frontend may send "" and we’ll fix it in main.py
    cuisine: Optional[str] = None

    rating: Optional[int] = Field(None, ge=1, le=5)
    cost: Optional[float] = Field(None, ge=0.0)
    mood: Optional[str] = None
    notes: Optional[str] = None


class MealCreate(MealBase):
    pass


class CuisineSuggestion(BaseModel):
    cuisine: str
    confidence: float = Field(..., ge=0.0, le=1.0)


class MealResponse(MealBase):
    id: str
    cuisine_suggestion: Optional[CuisineSuggestion] = None


# ------------ Wrapped ------------

class CountItem(BaseModel):
    cuisine: Optional[str] = None
    food_name: Optional[str] = None
    count: int


class MonthCount(BaseModel):
    month: str  # "YYYY-MM"
    meals: int


class BestRated(BaseModel):
    food_name: str
    date: str
    rating: int


class MostExpensive(BaseModel):
    food_name: str
    date: str
    cost: float


class WrappedPeriod(BaseModel):
    year: int
    month: Optional[int] = None


class WrappedResponse(BaseModel):
    period: WrappedPeriod
    total_meals: int
    top_cuisines: List[CountItem]
    top_foods: List[CountItem]

    category_split: dict
    meal_type_breakdown: dict
    monthly_counts: List[MonthCount]

    longest_streak_days: int
    highest_rated_meal: Optional[BestRated] = None
    most_expensive_meal: Optional[MostExpensive] = None
    fun_badges: List[str]
