import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { CalendarDays, NotebookPen, Sparkles, UtensilsCrossed } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { SegmentedControl } from './ui/segmented-control';
import { Select } from './ui/select';
import { Rating } from './ui/rating';
import { Card } from './ui/card';
import { Chip } from './ui/chip';
import { cuisineOptions, quickAddItems } from '../data/mock-data';
import { Meal } from '../types';
import { getLocalDateString } from '../utils/date';
import { toast } from 'sonner';
import { BACKEND_ENABLED, suggestCuisine } from '../utils/api';

interface LogMealProps {
  onAddMeal: (meal: Omit<Meal, 'id'>) => Promise<void> | void;
  todayStats: {
    count: number;
    topCuisine: string;
    homeVsTakeout: string;
  };
}

export function LogMeal({ onAddMeal, todayStats }: LogMealProps) {
  const [formData, setFormData] = useState({
    date: getLocalDateString(),
    mealType: 'Lunch' as Meal['mealType'],
    foodName: '',
    category: 'Home' as Meal['category'],
    cuisine: '',
    rating: 0,
    cost: '',
    notes: ''
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track if user manually set cuisine so we don't overwrite it
  const cuisineTouchedRef = useRef(false);

  // Debounce timer
  const suggestTimerRef = useRef<number | null>(null);

  // Auto-suggest cuisine when foodName changes
  useEffect(() => {
    // Only do this in backend mode
    if (!BACKEND_ENABLED) return;

    // If user already manually picked cuisine, don't overwrite
    if (cuisineTouchedRef.current) return;

    const name = formData.foodName.trim();
    if (name.length < 3) return;

    // Clear old timer
    if (suggestTimerRef.current) window.clearTimeout(suggestTimerRef.current);

    suggestTimerRef.current = window.setTimeout(async () => {
      try {
        const suggestion = await suggestCuisine(name);
        if (!suggestion) return;

        // Only set it if still untouched and cuisine empty
        if (!cuisineTouchedRef.current) {
          setFormData((prev) => {
            // If user typed fast and cuisine got set already, leave it
            if (prev.cuisine) return prev;

            // Only set if the suggestion exists in our dropdown list
            // (optional safety - remove if you want free-form)
            const safeCuisine = cuisineOptions.includes(suggestion.cuisine)
              ? suggestion.cuisine
              : suggestion.cuisine;

            return { ...prev, cuisine: safeCuisine };
          });
        }
      } catch (e) {
        // Silent fail: autocomplete is “nice to have”
      }
    }, 450); // debounce

    return () => {
      if (suggestTimerRef.current) window.clearTimeout(suggestTimerRef.current);
    };
  }, [formData.foodName]);

  const steps = [
    {
      id: 1,
      label: 'Plan',
      helper: 'Date & meal setting',
      complete: Boolean(formData.date && formData.mealType && formData.category)
    },
    {
      id: 2,
      label: 'Details',
      helper: 'Dish & cuisine',
      complete: Boolean(formData.foodName && formData.cuisine)
    },
    {
      id: 3,
      label: 'Flavor',
      helper: 'Rating, cost, notes',
      complete: true
    }
  ];

  const totalSteps = steps.length;
  const isCurrentStepComplete = steps[currentStep - 1]?.complete ?? false;
  const nextStepLabel = steps[currentStep]?.label;

  const handleSubmit = async (saveAndAddAnother = false) => {
    if (!formData.foodName || !formData.cuisine) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const meal: Omit<Meal, 'id'> = {
        date: formData.date,
        mealType: formData.mealType,
        foodName: formData.foodName,
        category: formData.category,
        cuisine: formData.cuisine,
        rating: formData.rating || undefined,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        notes: formData.notes || undefined
      };

      await onAddMeal(meal);

      toast.success('Logged.', { duration: 2000 });

      // reset manual cuisine touch when starting fresh
      cuisineTouchedRef.current = false;

      if (saveAndAddAnother) {
        setFormData({
          ...formData,
          foodName: '',
          cuisine: '',
          rating: 0,
          cost: '',
          notes: ''
        });
        setCurrentStep(2);
      } else {
        setFormData({
          date: getLocalDateString(),
          mealType: 'Lunch',
          foodName: '',
          category: 'Home',
          cuisine: '',
          rating: 0,
          cost: '',
          notes: ''
        });
        setCurrentStep(1);
      }
    } catch (error) {
      toast.error('Could not save this meal right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAdd = (item: string) => {
    cuisineTouchedRef.current = false;
    setFormData({ ...formData, foodName: item });
    setCurrentStep(2);
  };

  const handleNextStep = () => {
    if (!isCurrentStepComplete) {
      toast.error('Complete this step to continue.');
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handlePrevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const previewHighlights = [
    { label: 'Meal', value: formData.foodName || 'Name your dish', hint: `${formData.mealType} • ${formData.category}` },
    { label: 'Cuisine', value: formData.cuisine || 'Pick a cuisine', hint: formData.cuisine ? 'Delicious call' : 'Auto-suggest will try 👀' },
    { label: 'Rating', value: formData.rating ? `${formData.rating}/5` : 'Rate it', hint: formData.rating ? 'Chef’s kiss' : 'How was it?' },
    { label: 'Cost', value: formData.cost ? `$${formData.cost}` : 'Add cost', hint: formData.cost ? 'Logged for insights' : 'Optional' }
  ];

  return (
    <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr,400px] gap-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="overflow-hidden">
          <div className="p-6 bg-gradient-to-br from-primary/10 via-accent/40 to-transparent border-b border-border/50">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Food journal</p>
                <h2 className="text-3xl font-semibold mt-1">Curate your next delicious memory</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Break it down into steps and we will keep things organized for Food Wrapped.
                </p>
              </div>

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-5">
                {steps.map((step, index) => {
                  const status =
                    step.complete && index + 1 < currentStep
                      ? 'complete'
                      : index + 1 === currentStep
                      ? 'active'
                      : 'upcoming';

                  return (
                    <div key={step.label} className="flex items-center gap-2">
                      <div
                        className={`size-10 rounded-full flex items-center justify-center border text-sm ${
                          status === 'complete'
                            ? 'bg-primary text-primary-foreground border-primary'
                            : status === 'active'
                            ? 'bg-secondary text-secondary-foreground border-primary/60'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-tight">{step.label}</p>
                        <p className="text-xs text-muted-foreground leading-tight">{step.helper}</p>
                      </div>
                      {index < steps.length - 1 && <span className="hidden sm:block w-8 h-px bg-border" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {currentStep === 1 && (
              <section className="rounded-2xl border border-border/60 bg-muted/30 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Step 1</p>
                    <h3 className="text-lg font-semibold">When & Where</h3>
                    <p className="text-sm text-muted-foreground">
                      Set the vibe with date, meal type, and where it happened.
                    </p>
                  </div>
                  <div className="hidden sm:flex size-12 items-center justify-center rounded-full bg-card shadow-inner">
                    <CalendarDays className="w-6 h-6 text-primary" />
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  <Input
                    type="text"
                    label="Date (YYYY-MM-DD)"
                    placeholder="2024-12-31"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    inputMode="numeric"
                    maxLength={10}
                    pattern="\\d{4}-\\d{2}-\\d{2}"
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <SegmentedControl
                      label="Meal Type"
                      options={['Breakfast', 'Lunch', 'Dinner', 'Snack']}
                      value={formData.mealType}
                      onChange={(value) => setFormData({ ...formData, mealType: value as Meal['mealType'] })}
                    />
                    <SegmentedControl
                      label="Category"
                      options={['Home', 'Restaurant', 'Takeout']}
                      value={formData.category}
                      onChange={(value) => setFormData({ ...formData, category: value as Meal['category'] })}
                    />
                  </div>
                </div>
              </section>
            )}

            {currentStep === 2 && (
              <section className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Step 2</p>
                    <h3 className="text-lg font-semibold">Dish Details</h3>
                    <p className="text-sm text-muted-foreground">
                      Type the dish — if backend is on, we’ll try to auto-guess cuisine.
                    </p>
                  </div>
                  <div className="hidden sm:flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Input
                    label="Food Name"
                    placeholder="What did you eat?"
                    value={formData.foodName}
                    onChange={(e) => {
                      cuisineTouchedRef.current = false; // typing resets “manual lock”
                      setFormData({ ...formData, foodName: e.target.value, cuisine: '' }); // clear cuisine so auto-fill can happen
                    }}
                  />

                  <Select
                    label="Cuisine"
                    options={cuisineOptions}
                    value={formData.cuisine}
                    onChange={(e) => {
                      cuisineTouchedRef.current = true; // user manually chose
                      setFormData({ ...formData, cuisine: e.target.value });
                    }}
                  />
                </div>
              </section>
            )}

            {currentStep === 3 && (
              <section className="rounded-2xl border border-border/60 bg-accent/30 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Step 3</p>
                    <h3 className="text-lg font-semibold">Flavor & Notes</h3>
                    <p className="text-sm text-muted-foreground">Add ratings, cost, and any standout observations.</p>
                  </div>
                  <div className="hidden sm:flex size-12 items-center justify-center rounded-full bg-card">
                    <NotebookPen className="w-5 h-5 text-primary" />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-foreground/80">Rating (Optional)</label>
                    <Rating value={formData.rating} onChange={(value) => setFormData({ ...formData, rating: value })} />
                  </div>

                  <Input
                    type="number"
                    label="Cost (Optional)"
                    placeholder="$"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  />
                </div>

                <Textarea
                  label="Notes (Optional)"
                  placeholder="The crunch, the spice, the nostalgia..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-4"
                />
              </section>
            )}

            {currentStep < totalSteps ? (
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {currentStep > 1 && (
                  <Button variant="secondary" onClick={handlePrevStep} className="flex-1">
                    Back
                  </Button>
                )}
                <Button variant="primary" onClick={handleNextStep} disabled={!isCurrentStepComplete} className="flex-1">
                  Next: {nextStepLabel || 'Review'}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button variant="primary" onClick={() => handleSubmit(false)} isLoading={isSubmitting} className="flex-1">
                  Save Meal
                </Button>
                <Button variant="secondary" onClick={() => handleSubmit(true)} isLoading={isSubmitting} className="flex-1">
                  Save + Add Another
                </Button>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="space-y-6"
      >
        <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-none text-foreground shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Live preview</p>
              <h3>Your card will look like</h3>
            </div>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{formData.date || 'Set a date'}</span>
              <span>
                {formData.mealType} • {formData.category}
              </span>
            </div>
            <h4 className="text-2xl font-semibold mt-2">{formData.foodName || 'Give it a title'}</h4>
            <p className="text-sm text-muted-foreground">{formData.notes || 'Add a quick note to capture the vibe.'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {previewHighlights.map((item) => (
              <div key={item.label} className="rounded-xl border border-white/20 bg-white/5 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                <p className="text-lg font-semibold">{item.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.hint}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3>Today</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Meals logged</span>
              <span className="text-2xl tabular-nums">{todayStats.count}</span>
            </div>
            {todayStats.topCuisine && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Top cuisine</span>
                <span>{todayStats.topCuisine}</span>
              </div>
            )}
            {todayStats.homeVsTakeout && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Split</span>
                <span className="text-sm">{todayStats.homeVsTakeout}</span>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3>Quick Add</h3>
              <p className="text-xs text-muted-foreground">Tap a staple and tweak from there.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickAddItems.map((item) => (
              <Chip key={item} onClick={() => handleQuickAdd(item)} active={formData.foodName === item}>
                {item}
              </Chip>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
