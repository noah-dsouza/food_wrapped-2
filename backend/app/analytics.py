
from __future__ import annotations
from typing import Any, Dict, List, Optional
import pandas as pd


def meals_to_df(meals: List[Dict[str, Any]]) -> pd.DataFrame:
  df = pd.DataFrame(meals)  
  if df.empty: 
    # Build empty frame w required columns
    return pd.DataFrame(  
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
    # Loop through str cols, strip whitespace, prase, normalize, return dataframe
  for column in ["meal_type", "food_name", "category", "cuisine", "notes"]:  
    df[column] = df[column].fillna("").astype(str).str.strip()  
  df["date"] = pd.to_datetime(df["date"], errors="coerce")  
  df["meal_type"] = df["meal_type"].str.title() 
  df["category"] = df["category"].str.title()  
  df["cuisine"] = df["cuisine"].str.title()  
  df["food_name_norm"] = df["food_name"].str.lower()  
  return df 


def filter_period(df: pd.DataFrame, year: int, month: Optional[int]) -> pd.DataFrame:
  filtered = df[df["date"].dt.year == year]  
  if month:  
    filtered = filtered[filtered["date"].dt.month == month] 
  return filtered  


def compute_longest_streak_days(df: pd.DataFrame) -> int:
  if df.empty or df["date"].dropna().empty:  
    return 0 
    
  ordered_dates = sorted(df["date"].dropna().dt.date.unique())  
  longest = 1  
  current = 1  
  # Iterate over dates & compute diff & update streak
  for index in range(1, len(ordered_dates)):  
    delta = (ordered_dates[index] - ordered_dates[index - 1]).days 
    if delta == 1:  
      current += 1  
      longest = max(longest, current) 
    else:
      current = 1  
  return longest  


def _leaderboard(series: pd.Series, limit: int, key: str) -> List[Dict[str, Any]]:
  counts = series.value_counts().head(limit)  
  return [{key: str(index), "count": int(count)} for index, count in counts.items()] 


def _category_split(df: pd.DataFrame) -> Dict[str, float]:
  counts = df["category"].value_counts()  
  total = float(len(df)) if len(df) else 1.0 
  return {  
    "Home": float(counts.get("Home", 0) / total),
    "Restaurant": float(counts.get("Restaurant", 0) / total),
    "Takeout": float(counts.get("Takeout", 0) / total),
  }


def _meal_type_breakdown(df: pd.DataFrame) -> Dict[str, int]:
  breakdown = {"Breakfast": 0, "Lunch": 0, "Dinner": 0, "Snack": 0}  
  counts = df["meal_type"].value_counts() 
# Fill each key, return dict
  for key in breakdown:  
    breakdown[key] = int(counts.get(key, 0))  
  return breakdown  


def _monthly_counts(df: pd.DataFrame, year: int) -> List[Dict[str, Any]]:
  results: List[Dict[str, Any]] = [] 
  # Format months compute count, add to list, get month to moonth counts
  for month in range(1, 13):  
    label = f"{year}-{month:02d}"  
    count = int(  
      len(df[(df["date"].dt.year == year) & (df["date"].dt.month == month)])
    )
    results.append({"month": label, "meals": count})  
  return results  


def _highlighted_meal(df: pd.DataFrame, metric: str) -> Optional[Dict[str, Any]]:
  subset = df.dropna(subset=[metric])  
  if subset.empty:  
    return None
  order = subset.sort_values(by=[metric, "date"], ascending=[False, False]) 
  row = order.iloc[0] 
  result: Dict[str, Any] = {  
    "food_name": str(row["food_name"]),
    "date": row["date"].date().isoformat(),
  }
  if metric == "rating":  
    result["rating"] = int(row["rating"])
  if metric == "cost":  
    result["cost"] = float(row["cost"])
  return result  


def _badge_rules(
  split: Dict[str, float],
  streak: int,
  most_expensive: Optional[Dict[str, Any]],
) -> List[str]:

  # Generate badges
  badges: List[str] = []  
  if split["Home"] > 0.60: 
    badges.append("Home Chef Arc")
  if split["Takeout"] > 0.40:  
    badges.append("Takeout Era")
  if streak >= 14:  
    badges.append("Consistency Streak")
  if most_expensive and most_expensive.get("cost", 0) >= 50:  
    badges.append("Fine Dining Moment")
  return badges  


def wrapped_summary(meals: List[Dict[str, Any]], year: int, month: Optional[int]) -> Dict[str, Any]:
  df = meals_to_df(meals)  
  summary: Dict[str, Any] = { 
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
  if df.empty: 
    return summary
    # Filter n update
  period_df = filter_period(df, year, month)  
  summary["total_meals"] = int(len(period_df))  
  if period_df.empty:  
    return summary
  summary["top_cuisines"] = _leaderboard( 
    period_df["cuisine"].replace("", "Unknown"), 5, "cuisine"
  )
  food_board = _leaderboard(period_df["food_name_norm"], 10, "food_name_norm")  
  name_map = (  
    period_df.sort_values("date")
    .drop_duplicates(subset=["food_name_norm"])
    .set_index("food_name_norm")["food_name"]
    .to_dict()
  )
  summary["top_foods"] = [  
    {"food_name": name_map.get(item["food_name_norm"], "Unknown"), "count": item["count"]}
    for item in food_board
  ]
  summary["category_split"] = _category_split(period_df)  
  summary["meal_type_breakdown"] = _meal_type_breakdown(period_df)  
  summary["longest_streak_days"] = compute_longest_streak_days(period_df)  
  summary["highest_rated_meal"] = _highlighted_meal(period_df, "rating")  
  summary["most_expensive_meal"] = _highlighted_meal(period_df, "cost")  
  summary["fun_badges"] = _badge_rules( 
    summary["category_split"],
    summary["longest_streak_days"],
    summary["most_expensive_meal"],
  )
  return summary  
