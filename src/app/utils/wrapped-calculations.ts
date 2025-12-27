import { Meal, WrappedData } from '../types';
import { getLocalDateString } from './date';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;
const CATEGORIES = ['Home', 'Restaurant', 'Takeout'] as const;

const DEFAULT_WRAPPED: WrappedData = {
  totalMeals: 0,
  topCuisines: [],
  topFoods: [],
  categorySplit: { Home: 0, Restaurant: 0, Takeout: 0 },
  mealTypeBreakdown: { Breakfast: 0, Lunch: 0, Dinner: 0, Snack: 0 },
  longestStreakDays: 0,
  highestRatedMeal: null,
  mostExpensiveMeal: null,
  monthlyCounts: Array.from({ length: 12 }).map((_, index) => ({
    month: `${new Date().getFullYear()}-${String(index + 1).padStart(2, '0')}`,
    meals: 0
  })),
  funBadges: []
};

export function calculateWrappedData(meals: Meal[]): WrappedData {
  if (!meals.length) {
    return DEFAULT_WRAPPED;
  }

  const parsed = meals
    .map((meal) => ({
      ...meal,
      dateObj: new Date(meal.date)
    }))
    .filter((meal) => !Number.isNaN(meal.dateObj.getTime()))
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  if (!parsed.length) {
    return DEFAULT_WRAPPED;
  }

  const totalMeals = parsed.length;
  const cuisineCounts = new Map<string, number>();
  const foodCounts = new Map<string, number>();
  const categoryCounts: Record<typeof CATEGORIES[number], number> = {
    Home: 0,
    Restaurant: 0,
    Takeout: 0
  };
  const mealTypeBreakdown: Record<typeof MEAL_TYPES[number], number> = {
    Breakfast: 0,
    Lunch: 0,
    Dinner: 0,
    Snack: 0
  };

  parsed.forEach((meal) => {
    const cuisineKey = meal.cuisine?.trim() || 'Unknown';
    cuisineCounts.set(cuisineKey, (cuisineCounts.get(cuisineKey) || 0) + 1);

    const foodKey = meal.foodName.trim().toLowerCase();
    foodCounts.set(foodKey, (foodCounts.get(foodKey) || 0) + 1);

    if (meal.category in categoryCounts) {
      categoryCounts[meal.category as typeof CATEGORIES[number]] += 1;
    }
    if (meal.mealType in mealTypeBreakdown) {
      mealTypeBreakdown[meal.mealType as typeof MEAL_TYPES[number]] += 1;
    }
  });

  const topCuisines = [...cuisineCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cuisine, count]) => ({ cuisine, count }));

  const topFoods = [...foodCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([foodName, count]) => ({ foodName: titleCase(foodName), count }));

  const categorySplit = Object.fromEntries(
    CATEGORIES.map((category) => [
      category,
      Number((categoryCounts[category] / totalMeals || 0).toFixed(2))
    ])
  ) as WrappedData['categorySplit'];

  const longestStreakDays = getLongestStreak(parsed.map((meal) => meal.dateObj));

  const highestRated = parsed
    .filter((meal) => typeof meal.rating === 'number')
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];

  const highestRatedMeal = highestRated
    ? {
        foodName: highestRated.foodName,
        rating: highestRated.rating || 0,
        date: highestRated.date
      }
    : null;

  const mostExpensive = parsed
    .filter((meal) => typeof meal.cost === 'number')
    .sort((a, b) => (b.cost || 0) - (a.cost || 0))[0];

  const mostExpensiveMeal = mostExpensive
    ? {
        foodName: mostExpensive.foodName,
        cost: mostExpensive.cost || 0,
        date: mostExpensive.date
      }
    : null;

  const focusYear = parsed[parsed.length - 1].dateObj.getFullYear();
  const monthlyCounts = Array.from({ length: 12 }).map((_, index) => {
    const month = index + 1;
    const mealsInMonth = parsed.filter(
      (meal) =>
        meal.dateObj.getFullYear() === focusYear && meal.dateObj.getMonth() + 1 === month
    ).length;
    return {
      month: `${focusYear}-${String(month).padStart(2, '0')}`,
      meals: mealsInMonth
    };
  });

  const funBadges = buildBadges(categorySplit, longestStreakDays);

  return {
    totalMeals,
    topCuisines,
    topFoods,
    categorySplit,
    mealTypeBreakdown,
    longestStreakDays,
    highestRatedMeal,
    mostExpensiveMeal,
    monthlyCounts,
    funBadges
  };
}

export function getTodayStats(meals: Meal[]) {
  const today = getLocalDateString();
  const todayMeals = meals.filter((m) => m.date === today);

  const cuisineCounts: { [key: string]: number } = {};
  todayMeals.forEach((meal) => {
    cuisineCounts[meal.cuisine] = (cuisineCounts[meal.cuisine] || 0) + 1;
  });
  const topCuisine = Object.entries(cuisineCounts).reduce(
    (max, [name, count]) => (count > max.count ? { name, count } : max),
    { name: '', count: 0 }
  );

  const home = todayMeals.filter((m) => m.category === 'Home').length;
  const takeout = todayMeals.filter((m) => m.category === 'Takeout').length;
  const restaurant = todayMeals.filter((m) => m.category === 'Restaurant').length;

  let homeVsTakeout = '';
  if (home > 0 || takeout > 0 || restaurant > 0) {
    homeVsTakeout = `${home} home / ${restaurant} restaurant / ${takeout} takeout`;
  }

  return {
    count: todayMeals.length,
    topCuisine: topCuisine.name,
    homeVsTakeout
  };
}

function getLongestStreak(dates: Date[]): number {
  if (!dates.length) return 0;
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());

  let longest = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const currentDate = sorted[i];
    const dayDiff = Math.floor(
      (currentDate.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (dayDiff === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else if (dayDiff > 1) {
      current = 1;
    }
  }

  return longest;
}

function buildBadges(categorySplit: WrappedData['categorySplit'], streak: number) {
  const badges: string[] = [];
  if (categorySplit.Home > 0.6) {
    badges.push('Home Chef Arc');
  }
  if (categorySplit.Takeout > 0.4) {
    badges.push('Takeout Era');
  }
  if (streak >= 14) {
    badges.push('Consistent Logger');
  }
  if (!badges.length) {
    badges.push('Epicurean Explorer');
  }
  return badges;
}

function titleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1));
}
