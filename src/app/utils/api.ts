// src/app/utils/api.ts

import type { Meal } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
export const BACKEND_ENABLED = String(import.meta.env.VITE_ENABLE_BACKEND).toLowerCase() === 'true';

export async function fetchMealsApi(): Promise<Meal[]> {
  const res = await fetch(`${API_BASE_URL}/meals`);
  if (!res.ok) throw new Error(`Failed to fetch meals: ${res.status}`);
  return res.json();
}

export async function createMealEntry(meal: Omit<Meal, 'id'>): Promise<Meal> {
  const res = await fetch(`${API_BASE_URL}/meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date: meal.date,
      meal_type: meal.mealType,
      food_name: meal.foodName,
      category: meal.category,
      cuisine: meal.cuisine,
      rating: meal.rating ?? null,
      cost: meal.cost ?? null,
      mood: (meal as any).mood ?? null,
      notes: meal.notes ?? null
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create meal failed: ${res.status} ${text}`);
  }

  const data = await res.json();

  // map backend -> frontend shape (snake_case -> camelCase)
  return {
    id: data.id,
    date: data.date,
    mealType: data.meal_type,
    foodName: data.food_name,
    category: data.category,
    cuisine: data.cuisine,
    rating: data.rating ?? undefined,
    cost: data.cost ?? undefined,
    notes: data.notes ?? undefined
  };
}

export async function deleteMealEntry(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/meals/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
}

export async function suggestCuisine(foodName: string): Promise<{ cuisine: string; confidence: number } | null> {
  // Don’t spam backend for tiny inputs
  const trimmed = foodName.trim();
  if (trimmed.length < 3) return null;

  // This endpoint MUST exist in backend. If it doesn’t, see section 5 below.
  const res = await fetch(`${API_BASE_URL}/cuisine/suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ food_name: trimmed })
  });

  if (!res.ok) return null;

  const data = await res.json();
  return { cuisine: data.cuisine, confidence: data.confidence };
}
