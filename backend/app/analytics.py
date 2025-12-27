"""Analytics helpers built with pandas for Food Wrapped."""

from __future__ import annotations

# Import typing helpers for clarity.
from typing import Any, Dict, List, Optional

# Import pandas for DataFrame manipulation.
import pandas as pd


def meals_to_df(meals: List[Dict[str, Any]]) -> pd.DataFrame:
  """Convert a list of meal dictionaries into a cleaned DataFrame."""
  df = pd.DataFrame(meals)  # Create a DataFrame directly from the list
  if df.empty:  # Handle empty lists gracefully
    return pd.DataFrame(  # Build an empty frame with required columns
      columns=[
        "id",
        "date",
        "meal_type",
        "food_name",
        "category",
        "cuisine",
        "rating",
        "cost",
        "mood",
        "notes",
        "food_name_norm",
      ]
    )
  for column in ["meal_type", "food_name", "category", "cuisine", "notes"]:  # Loop through string columns
    df[column] = df[column].fillna("").astype(str).str.strip()  # Strip whitespace and fill blanks
  df["date"] = pd.to_datetime(df["date"], errors="coerce")  # Parse date strings
  df["meal_type"] = df["meal_type"].str.title()  # Normalize meal type casing
  df["category"] = df["category"].str.title()  # Normalize category casing
  df["cuisine"] = df["cuisine"].str.title()  # Normalize cuisine casing
  df["food_name_norm"] = df["food_name"].str.lower()  # Create normalized food name
  return df  # Return the cleaned DataFrame


def filter_period(df: pd.DataFrame, year: int, month: Optional[int]) -> pd.DataFrame:
  """Return a DataFrame filtered by the requested year and optional month."""
  filtered = df[df["date"].dt.year == year]  # Filter by year
  if month:  # Only filter by month when provided
    filtered = filtered[filtered["date"].dt.month == month]  # Filter by month
  return filtered  # Return the filtered DataFrame


def compute_longest_streak_days(df: pd.DataFrame) -> int:
  """Compute the longest consecutive-day logging streak."""
  if df.empty or df["date"].dropna().empty:  # Handle no data cases
    return 0  # No streak when no dates exist
  ordered_dates = sorted(df["date"].dropna().dt.date.unique())  # Sorted unique dates
  longest = 1  # Initialize longest streak
  current = 1  # Initialize current streak
  for index in range(1, len(ordered_dates)):  # Iterate over dates
    delta = (ordered_dates[index] - ordered_dates[index - 1]).days  # Compute day difference
    if delta == 1:  # Check for consecutive days
      current += 1  # Increment current streak
      longest = max(longest, current)  # Update longest streak
    else:
      current = 1  # Reset streak when a gap appears
  return longest  # Return the max streak


def _leaderboard(series: pd.Series, limit: int, key: str) -> List[Dict[str, Any]]:
  """Convert a value_counts result into a list of dictionaries."""
  counts = series.value_counts().head(limit)  # Count values and limit results
  return [{key: str(index), "count": int(count)} for index, count in counts.items()]  # Convert to dict list


def _category_split(df: pd.DataFrame) -> Dict[str, float]:
  """Return the share of meals per category."""
  counts = df["category"].value_counts()  # Count meals per category
  total = float(len(df)) if len(df) else 1.0  # Avoid division by zero
  return {  # Build normalized dictionary
    "Home": float(counts.get("Home", 0) / total),
    "Restaurant": float(counts.get("Restaurant", 0) / total),
    "Takeout": float(counts.get("Takeout", 0) / total),
  }


def _meal_type_breakdown(df: pd.DataFrame) -> Dict[str, int]:
  """Return a dictionary counting each meal type."""
  breakdown = {"Breakfast": 0, "Lunch": 0, "Dinner": 0, "Snack": 0}  # Initialize dict
  counts = df["meal_type"].value_counts()  # Count occurrences
  for key in breakdown:  # Iterate through expected keys
    breakdown[key] = int(counts.get(key, 0))  # Fill each key
  return breakdown  # Return the filled dictionary


def _monthly_counts(df: pd.DataFrame, year: int) -> List[Dict[str, Any]]:
  """Return a list containing meal counts for each month of the year."""
  results: List[Dict[str, Any]] = []  # Prepare list for monthly rows
  for month in range(1, 13):  # Iterate through 12 months
    label = f"{year}-{month:02d}"  # Format month label
    count = int(  # Compute count for this month
      len(df[(df["date"].dt.year == year) & (df["date"].dt.month == month)])
    )
    results.append({"month": label, "meals": count})  # Append to list
  return results  # Return month-by-month counts


def _highlighted_meal(df: pd.DataFrame, metric: str) -> Optional[Dict[str, Any]]:
  """Return a featured meal dictionary for the requested metric."""
  subset = df.dropna(subset=[metric])  # Remove rows without metric values
  if subset.empty:  # Return None when nothing qualifies
    return None
  order = subset.sort_values(by=[metric, "date"], ascending=[False, False])  # Sort rows
  row = order.iloc[0]  # Pick the top row
  result: Dict[str, Any] = {  # Build shared fields
    "food_name": str(row["food_name"]),
    "date": row["date"].date().isoformat(),
  }
  if metric == "rating":  # Attach rating when requested
    result["rating"] = int(row["rating"])
  if metric == "cost":  # Attach cost when requested
    result["cost"] = float(row["cost"])
  return result  # Return the highlighted entry


def _badge_rules(
  split: Dict[str, float],
  streak: int,
  most_expensive: Optional[Dict[str, Any]],
) -> List[str]:
  """Generate badge strings based on summary statistics."""
  badges: List[str] = []  # Initialize badge list
  if split["Home"] > 0.60:  # Home cooking badge threshold
    badges.append("Home Chef Arc")
  if split["Takeout"] > 0.40:  # Takeout badge threshold
    badges.append("Takeout Era")
  if streak >= 14:  # Streak badge threshold
    badges.append("Consistency Streak")
  if most_expensive and most_expensive.get("cost", 0) >= 50:  # Expensive badge
    badges.append("Fine Dining Moment")
  return badges  # Return badges


def wrapped_summary(meals: List[Dict[str, Any]], year: int, month: Optional[int]) -> Dict[str, Any]:
  """Compute the wrapped analytics response."""
  df = meals_to_df(meals)  # Convert to DataFrame for analytics
  summary: Dict[str, Any] = {  # Initialize summary with defaults
    "period": {"year": year, "month": month},
    "total_meals": 0,
    "top_cuisines": [],
    "top_foods": [],
    "category_split": {"Home": 0.0, "Restaurant": 0.0, "Takeout": 0.0},
    "meal_type_breakdown": {"Breakfast": 0, "Lunch": 0, "Dinner": 0, "Snack": 0},
    "monthly_counts": _monthly_counts(df, year),
    "longest_streak_days": 0,
    "highest_rated_meal": None,
    "most_expensive_meal": None,
    "fun_badges": [],
  }
  if df.empty:  # Return early when there are no meals at all
    return summary
  period_df = filter_period(df, year, month)  # Filter by year/month
  summary["total_meals"] = int(len(period_df))  # Update totals
  if period_df.empty:  # If the filtered view is empty, return defaults
    return summary
  summary["top_cuisines"] = _leaderboard(  # Compute cuisine leaderboard
    period_df["cuisine"].replace("", "Unknown"), 5, "cuisine"
  )
  food_board = _leaderboard(period_df["food_name_norm"], 10, "food_name_norm")  # Compute food leaderboard
  name_map = (  # Map normalized names to display casing
    period_df.sort_values("date")
    .drop_duplicates(subset=["food_name_norm"])
    .set_index("food_name_norm")["food_name"]
    .to_dict()
  )
  summary["top_foods"] = [  # Convert to final format
    {"food_name": name_map.get(item["food_name_norm"], "Unknown"), "count": item["count"]}
    for item in food_board
  ]
  summary["category_split"] = _category_split(period_df)  # Category percentages
  summary["meal_type_breakdown"] = _meal_type_breakdown(period_df)  # Meal type counts
  summary["longest_streak_days"] = compute_longest_streak_days(period_df)  # Longest streak
  summary["highest_rated_meal"] = _highlighted_meal(period_df, "rating")  # Highest rated meal
  summary["most_expensive_meal"] = _highlighted_meal(period_df, "cost")  # Most expensive meal
  summary["fun_badges"] = _badge_rules(  # Compute fun badges
    summary["category_split"],
    summary["longest_streak_days"],
    summary["most_expensive_meal"],
  )
  return summary  # Return the populated summary
