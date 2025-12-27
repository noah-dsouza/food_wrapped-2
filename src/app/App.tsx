import React, { useState, useEffect, useMemo } from 'react';
import { Toaster, toast } from 'sonner';
import { Navigation } from './components/navigation';
import { LogMeal } from './components/log-meal';
import { Timeline } from './components/timeline';
import { Wrapped } from './components/wrapped';
import { SignIn } from './components/sign-in';
import { Meal } from './types';
import { mockMeals } from './data/mock-data';
import { calculateWrappedData, getTodayStats } from './utils/wrapped-calculations';
import { BACKEND_ENABLED, createMealEntry, deleteMealEntry, fetchMealsApi } from './utils/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('log');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [meals, setMeals] = useState<Meal[]>(BACKEND_ENABLED ? [] : mockMeals);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingMeals, setIsLoadingMeals] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, []);

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  useEffect(() => {
    const authed = localStorage.getItem('food-wrapped-demo-auth');
    setIsAuthenticated(authed === 'true');
  }, []);

  // Load meals from backend on sign-in
  useEffect(() => {
    if (!isAuthenticated) return;

    if (!BACKEND_ENABLED) {
      setMeals(mockMeals);
      return;
    }

    let isCancelled = false;
    setIsLoadingMeals(true);
    setLoadError(null);

    fetchMealsApi()
      .then((fetchedMeals) => {
        if (!isCancelled) {
          setMeals(fetchedMeals);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch meals from backend', error);
        if (!isCancelled) {
          setLoadError('Backend is unavailable, showing demo data instead.');
          setMeals(mockMeals);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingMeals(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated]);

  // Meal management
  const handleAddMeal = async (mealData: Omit<Meal, 'id'>) => {
    if (BACKEND_ENABLED) {
      try {
        // Backend can auto-tag cuisine if it’s blank — allowed
        const created = await createMealEntry(mealData);
        setMeals((prev) => [created, ...prev]);
      } catch (error) {
        console.error('Failed to create meal', error);
        toast.error('Unable to reach the backend. Try again or fallback to demo data.');
        throw error;
      }
      return;
    }

    // Demo mode: local only
    const newMeal: Meal = {
      ...mealData,
      id: Date.now().toString()
    };
    setMeals((prev) => [newMeal, ...prev]);
  };

  const handleEditMeal = (meal: Meal) => {
    // In a real app, this would open an edit modal
    console.log('Edit meal:', meal);
  };

  const handleDeleteMeal = async (id: string) => {
    if (BACKEND_ENABLED) {
      try {
        await deleteMealEntry(id);
        setMeals((prev) => prev.filter((m) => m.id !== id));
      } catch (error) {
        console.error('Failed to delete meal', error);
        toast.error('Unable to delete meal right now.');
      }
      return;
    }

    setMeals((prev) => prev.filter((m) => m.id !== id));
  };

  // Calculate data (Wrapped stays client-side for now)
  const wrappedData = useMemo(() => calculateWrappedData(meals), [meals]);
  const todayStats = useMemo(() => getTodayStats(meals), [meals]);

  const handleLogout = () => {
    localStorage.removeItem('food-wrapped-demo-auth');
    setIsAuthenticated(false);
    setMeals(BACKEND_ENABLED ? [] : mockMeals);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SignIn onSuccess={() => setIsAuthenticated(true)} />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--card)',
              color: 'var(--card-foreground)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '12px 16px'
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Subtle texture */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]" />

      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onLogout={handleLogout}
      />

      <main className="px-4 sm:px-6 py-8 md:py-12 pb-24 md:pb-12">
        {loadError && (
          <div className="mb-4 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {loadError}
          </div>
        )}

        {isLoadingMeals && (
          <div className="mb-6 rounded-xl border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            Syncing your meals with the backend...
          </div>
        )}

        {activeTab === 'log' && <LogMeal onAddMeal={handleAddMeal} todayStats={todayStats} />}

        {activeTab === 'timeline' && (
          <Timeline meals={meals} onEditMeal={handleEditMeal} onDeleteMeal={handleDeleteMeal} />
        )}

        {activeTab === 'wrapped' && <Wrapped data={wrappedData} />}
      </main>

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--card)',
            color: 'var(--card-foreground)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '12px 16px'
          }
        }}
      />
    </div>
  );
}
