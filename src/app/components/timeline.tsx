import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronDown, EllipsisVertical, Pencil, Trash2 } from 'lucide-react';
import { Card } from './ui/card';
import { Chip } from './ui/chip';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Rating } from './ui/rating';
import { Meal } from '../types';
import { cuisineOptions } from '../data/mock-data';

interface TimelineProps {
  meals: Meal[];
  onEditMeal: (meal: Meal) => void;
  onDeleteMeal: (id: string) => Promise<void> | void;
}

export function Timeline({ meals, onEditMeal, onDeleteMeal }: TimelineProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const filteredMeals = useMemo(() => {
    return meals.filter((meal) => {
      const matchesSearch = meal.foodName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMealType = selectedMealTypes.length === 0 || selectedMealTypes.includes(meal.mealType);
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(meal.category);
      const matchesCuisine = !selectedCuisine || meal.cuisine === selectedCuisine;

      return matchesSearch && matchesMealType && matchesCategory && matchesCuisine;
    });
  }, [meals, searchQuery, selectedMealTypes, selectedCategories, selectedCuisine]);

  const groupedMeals = useMemo(() => {
    const groups: { [key: string]: Meal[] } = {};
    filteredMeals.forEach((meal) => {
      const date = new Date(meal.date);
      const key = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      if (!groups[key]) groups[key] = [];
      groups[key].push(meal);
    });
    return groups;
  }, [filteredMeals]);

  const toggleFilter = (filter: string, setFilter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setFilter((prev) => (prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]));
  };

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="mb-6">
          <h2 className="mb-1">Timeline</h2>
          <p className="text-muted-foreground">Your meal history</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search meals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11"
              />
            </div>

            {/* Meal Type Filters */}
            <div>
              <label className="text-sm text-foreground/80 mb-2 block">Meal Type</label>
              <div className="flex flex-wrap gap-2">
                {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => (
                  <Chip
                    key={type}
                    variant="filter"
                    active={selectedMealTypes.includes(type)}
                    onClick={() => toggleFilter(type, setSelectedMealTypes)}
                  >
                    {type}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Category Filters */}
            <div>
              <label className="text-sm text-foreground/80 mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {['Home', 'Restaurant', 'Takeout'].map((category) => (
                  <Chip
                    key={category}
                    variant="filter"
                    active={selectedCategories.includes(category)}
                    onClick={() => toggleFilter(category, setSelectedCategories)}
                  >
                    {category}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Cuisine Filter */}
            <div>
              <label className="text-sm text-foreground/80 mb-2 block">Cuisine</label>
              <select
                value={selectedCuisine}
                onChange={(e) => setSelectedCuisine(e.target.value)}
                className="px-4 py-2 bg-input-background rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all w-full max-w-xs"
              >
                <option value="">All Cuisines</option>
                {cuisineOptions.map((cuisine) => (
                  <option key={cuisine} value={cuisine}>
                    {cuisine}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Timeline Feed */}
        <div className="space-y-6">
          {Object.keys(groupedMeals).length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-muted-foreground">No meals logged yet.</p>
            </Card>
          ) : (
            Object.entries(groupedMeals).map(([date, dayMeals]) => (
              <div key={date}>
                <h3 className="mb-3 text-muted-foreground">{date}</h3>
                <div className="space-y-3">
                  {dayMeals.map((meal, index) => (
                    <motion.div
                      key={meal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card hover className="relative">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4>{meal.foodName}</h4>
                              <Badge variant="meal">{meal.mealType}</Badge>
                              <Badge variant="cuisine">{meal.cuisine}</Badge>
                              <Badge variant="category">{meal.category}</Badge>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {meal.rating && (
                                <div className="flex items-center gap-1.5">
                                  <Rating value={meal.rating} readonly max={5} />
                                </div>
                              )}
                              {meal.cost && <span>${meal.cost.toFixed(2)}</span>}
                            </div>

                            {/* Expandable Notes */}
                            {meal.notes && (
                              <AnimatePresence>
                                {expandedMeal === meal.id && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <p className="text-sm text-foreground/80 pt-2 border-t border-border mt-2">
                                      {meal.notes}
                                    </p>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            )}

                            {meal.notes && (
                              <button
                                onClick={() => setExpandedMeal(expandedMeal === meal.id ? null : meal.id)}
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                {expandedMeal === meal.id ? 'Hide' : 'Show'} notes
                                <ChevronDown
                                  className={`w-4 h-4 transition-transform ${
                                    expandedMeal === meal.id ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>
                            )}
                          </div>

                          {/* More Menu */}
                          <div className="relative">
                            <button
                              onClick={() => setActiveMenu(activeMenu === meal.id ? null : meal.id)}
                              className="p-2 hover:bg-accent rounded-lg transition-colors"
                            >
                              <EllipsisVertical className="w-5 h-5" />
                            </button>

                            <AnimatePresence>
                              {activeMenu === meal.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute right-0 top-full mt-2 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-10 min-w-[160px]"
                                >
                                  <button
                                    onClick={() => {
                                      onEditMeal(meal);
                                      setActiveMenu(null);
                                    }}
                                    className="w-full px-4 py-2.5 text-left hover:bg-accent transition-colors flex items-center gap-2 text-sm"
                                  >
                                    <Pencil className="w-4 h-4" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      onDeleteMeal(meal.id);
                                      setActiveMenu(null);
                                    }}
                                    className="w-full px-4 py-2.5 text-left hover:bg-accent transition-colors flex items-center gap-2 text-sm text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
