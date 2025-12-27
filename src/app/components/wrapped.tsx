import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Award, DollarSign, Calendar, Download, Sparkles } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { WrappedData } from '../types';

interface WrappedProps {
  data: WrappedData;
}

export function Wrapped({ data }: WrappedProps) {
  const [countUpValue, setCountUpValue] = useState(0);

  // Hard safety defaults so no black screen if something is missing
  const safeData = useMemo(() => {
    const categorySplit = data?.categorySplit ?? { Home: 0, Restaurant: 0, Takeout: 0 };
    const mealTypeBreakdown = data?.mealTypeBreakdown ?? { Breakfast: 0, Lunch: 0, Dinner: 0, Snack: 0 };
    const monthlyCounts = Array.isArray(data?.monthlyCounts) ? data.monthlyCounts : [];
    const topCuisines = Array.isArray(data?.topCuisines) ? data.topCuisines : [];
    const topFoods = Array.isArray(data?.topFoods) ? data.topFoods : [];
    const funBadges = Array.isArray(data?.funBadges) ? data.funBadges : [];

    return {
      ...data,
      totalMeals: Number(data?.totalMeals ?? 0),
      categorySplit,
      mealTypeBreakdown,
      monthlyCounts,
      topCuisines,
      topFoods,
      funBadges
    };
  }, [data]);

  // Animate count-up for total meals
  useEffect(() => {
    const total = safeData.totalMeals || 0;

    const duration = 1500;
    const steps = 60;
    const increment = total / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= total) {
        setCountUpValue(total);
        clearInterval(timer);
      } else {
        setCountUpValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [safeData.totalMeals]);

  // Chart data
  const categoryData = [
    { name: 'Home', value: Math.round((safeData.categorySplit.Home || 0) * 100), color: '#4ade80' },
    { name: 'Restaurant', value: Math.round((safeData.categorySplit.Restaurant || 0) * 100), color: '#f97316' },
    { name: 'Takeout', value: Math.round((safeData.categorySplit.Takeout || 0) * 100), color: '#38bdf8' }
  ];

  const mealTypeData = [
    { name: 'Breakfast', value: safeData.mealTypeBreakdown.Breakfast || 0 },
    { name: 'Lunch', value: safeData.mealTypeBreakdown.Lunch || 0 },
    { name: 'Dinner', value: safeData.mealTypeBreakdown.Dinner || 0 },
    { name: 'Snack', value: safeData.mealTypeBreakdown.Snack || 0 }
  ];

  const monthlyTrend = safeData.monthlyCounts.map((entry) => ({
    month: String(entry.month || '').split('-')[1] || '',
    label: entry.month,
    meals: entry.meals || 0
  }));

  const mealTypeColors = ['#7c3aed', '#0ea5e9', '#f59e0b', '#84cc16'];
  const badgeColors = ['bg-primary/10 text-primary', 'bg-secondary text-secondary-foreground', 'bg-accent/40 text-accent-foreground'];
  const topCuisine = safeData.topCuisines[0];
  const topFood = safeData.topFoods[0];

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {/* Header */}
        <div className="mb-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <h1 className="mb-2">Your Food Wrapped</h1>
            <p className="text-muted-foreground">Your year in meals.</p>
          </motion.div>

          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Showing your latest year of meals</span>
            </div>
            <Button variant="ghost" className="sm:ml-auto">
              <Download className="w-5 h-5" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Hero - Total Meals */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-8"
        >
          <Card className="text-center py-12 bg-gradient-to-br from-primary/5 to-accent/30">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <p className="text-muted-foreground mb-2">Total Meals</p>
              <div className="text-7xl tabular-nums mb-4" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {countUpValue}
              </div>
              <p className="text-sm text-muted-foreground">Insights based on your logs.</p>
            </motion.div>
          </Card>
        </motion.div>

        {/* Insights Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3>Most Eaten</h3>
              </div>
              <div className="text-3xl mb-1">{topFood ? topFood.foodName : 'Log a meal'}</div>
              <p className="text-muted-foreground">
                {topFood ? `${topFood.count} repeats this year` : 'We will showcase your favorites here.'}
              </p>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-primary" />
                <h3>Top Cuisine</h3>
              </div>
              <div className="text-3xl mb-1">{topCuisine ? topCuisine.cuisine : 'Too early to tell'}</div>
              <p className="text-muted-foreground">
                {topCuisine ? `${topCuisine.count} logged meals` : 'Keep logging to crown a cuisine.'}
              </p>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                <h3>Longest Streak</h3>
              </div>
              <div className="text-3xl mb-1">{safeData.longestStreakDays || 0}</div>
              <p className="text-muted-foreground">consecutive days logging</p>
            </Card>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card>
              <h3 className="mb-6">Home vs Restaurant vs Takeout</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '8px 12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4 flex-wrap">
                {categoryData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm">
                      {item.name} ({item.value}%)
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}>
            <Card>
              <h3 className="mb-6">Meal Type Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mealTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" tick={{ fill: 'var(--muted-foreground)' }} />
                  <YAxis stroke="var(--muted-foreground)" tick={{ fill: 'var(--muted-foreground)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '8px 12px'
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} animationBegin={0} animationDuration={800}>
                    {mealTypeData.map((entry, index) => (
                      <Cell key={entry.name} fill={mealTypeColors[index % mealTypeColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="lg:col-span-2"
          >
            <Card>
              <h3 className="mb-6">Monthly Check-ins</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" tick={{ fill: 'var(--muted-foreground)' }} />
                  <YAxis stroke="var(--muted-foreground)" tick={{ fill: 'var(--muted-foreground)' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '8px 12px'
                    }}
                    labelFormatter={(label) => `Month ${label}`}
                  />
                  <Line type="monotone" dataKey="meals" stroke="#4ade80" strokeWidth={3} dot={{ r: 4, fill: '#4ade80' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </div>

        {/* Share */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }} className="mt-8">
          <Card className="text-center">
            <h3 className="mb-2">Share Your Wrapped</h3>
            <p className="text-muted-foreground mb-6">Download shareable story cards</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="primary">Download Summary</Button>
              <Button variant="secondary">Download All Cards</Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
