export interface Meal {
  id: string;
  date: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  foodName: string;
  category: 'Home' | 'Restaurant' | 'Takeout';
  cuisine: string;
  rating?: number;
  cost?: number;
  notes?: string;
}

export interface WrappedData {
  totalMeals: number;
  topCuisines: { cuisine: string; count: number }[];
  topFoods: { foodName: string; count: number }[];
  categorySplit: { Home: number; Restaurant: number; Takeout: number };
  mealTypeBreakdown: { Breakfast: number; Lunch: number; Dinner: number; Snack: number };
  longestStreakDays: number;
  highestRatedMeal: { foodName: string; rating: number; date: string } | null;
  mostExpensiveMeal: { foodName: string; cost: number; date: string } | null;
  monthlyCounts: { month: string; meals: number }[];
  funBadges: string[];
}
