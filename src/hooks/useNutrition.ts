import { useState, useEffect, useCallback } from 'react';
import { getAllFromStore, putInStore, deleteFromStore } from '../services/db';
import { DailyNutritionLog, FoodItem, MealItem, MealType, MealGroup } from '../types';
import { TACO_BRAZILIAN_FOODS } from '../data/tacoDatabase';
import { getLocalDateString } from '../utils/dateUtils';

export function useNutrition() {
  const [nutritionLogs, setNutritionLogs] = useState<DailyNutritionLog[]>([]);
  const [cachedFoods, setCachedFoods] = useState<FoodItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString());
  const [loading, setLoading] = useState<boolean>(true);

  // Refresh nutrition data
  const refreshNutritionData = useCallback(async () => {
    try {
      setLoading(true);
      const [logs, foods] = await Promise.all([
        getAllFromStore<DailyNutritionLog>('nutritionLogs'),
        getAllFromStore<FoodItem>('foodDatabase')
      ]);

      setNutritionLogs(logs);
      setCachedFoods(foods);
    } catch (err) {
      console.error('Failed to load nutrition data from IndexedDB:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshNutritionData();
  }, [refreshNutritionData]);

  // Get current selected date's log
  const currentLog = nutritionLogs.find((l) => l.date === selectedDate) || {
    id: `nut_${selectedDate}`,
    date: selectedDate,
    meals: [
      { mealType: 'Café da Manhã', items: [] },
      { mealType: 'Almoço', items: [] },
      { mealType: 'Lanche', items: [] },
      { mealType: 'Jantar', items: [] },
      { mealType: 'Outros', items: [] }
    ],
    totalCalories: 0
  };

  // Add meal item to current date
  const addMealItem = async (date: string, mealType: MealType, item: Omit<MealItem, 'id'>) => {
    const existingLog = nutritionLogs.find((l) => l.date === date) || {
      id: `nut_${date}`,
      date,
      meals: [
        { mealType: 'Café da Manhã', items: [] },
        { mealType: 'Almoço', items: [] },
        { mealType: 'Lanche', items: [] },
        { mealType: 'Jantar', items: [] },
        { mealType: 'Outros', items: [] }
      ],
      totalCalories: 0
    };

    const newItem: MealItem = {
      ...item,
      id: `mi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };

    const updatedMeals = existingLog.meals.map((mg) => {
      if (mg.mealType === mealType) {
        return { ...mg, items: [...mg.items, newItem] };
      }
      return mg;
    });

    const newTotalCalories = updatedMeals.reduce((acc, mg) => {
      return acc + mg.items.reduce((sub, i) => sub + (i.calories || 0), 0);
    }, 0);

    const updatedLog: DailyNutritionLog = {
      ...existingLog,
      meals: updatedMeals,
      totalCalories: Math.round(newTotalCalories)
    };

    await putInStore('nutritionLogs', updatedLog);
    await refreshNutritionData();
  };

  // Remove meal item from date
  const removeMealItem = async (date: string, mealType: MealType, itemId: string) => {
    const existingLog = nutritionLogs.find((l) => l.date === date);
    if (!existingLog) return;

    const updatedMeals = existingLog.meals.map((mg) => {
      if (mg.mealType === mealType) {
        return { ...mg, items: mg.items.filter((i) => i.id !== itemId) };
      }
      return mg;
    });

    const newTotalCalories = updatedMeals.reduce((acc, mg) => {
      return acc + mg.items.reduce((sub, i) => sub + (i.calories || 0), 0);
    }, 0);

    const updatedLog: DailyNutritionLog = {
      ...existingLog,
      meals: updatedMeals,
      totalCalories: Math.round(newTotalCalories)
    };

    await putInStore('nutritionLogs', updatedLog);
    await refreshNutritionData();
  };

  // Search food items across Local TACO + IndexedDB Cache + Open Food Facts API (with auto-caching!)
  const searchFoods = async (query: string): Promise<FoodItem[]> => {
    if (!query || !query.trim()) return [];
    const q = query.trim().toLowerCase();

    // 1. Search in pre-seeded TACO database
    const tacoMatches = TACO_BRAZILIAN_FOODS.filter((f) => f.name.toLowerCase().includes(q));

    // 2. Search in IndexedDB cached foods
    const cachedMatches = cachedFoods.filter(
      (f) => f.name.toLowerCase().includes(q) && !tacoMatches.some((t) => t.id === f.id)
    );

    const localResults = [...tacoMatches, ...cachedMatches];

    // If we have strong local matches or offline, return local immediately!
    if (localResults.length >= 3 || !navigator.onLine) {
      return localResults;
    }

    // 3. Fallback online search to Open Food Facts API if online
    try {
      const res = await fetch(`https://br.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=true&page_size=5`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.products)) {
          const apiFoods: FoodItem[] = [];
          for (const p of data.products) {
            if (p.product_name && p.nutriments) {
              const energyKcal = Math.round(p.nutriments['energy-kcal_100g'] || p.nutriments['energy-kcal'] || 0);
              if (energyKcal > 0) {
                const foodItem: FoodItem = {
                  id: `off_${p._id || Date.now()}`,
                  name: p.product_name,
                  category: p.brands || 'Industrializado',
                  caloriesPer100g: energyKcal,
                  proteinPer100g: Math.round((p.nutriments.proteins_100g || 0) * 10) / 10,
                  carbsPer100g: Math.round((p.nutriments.carbohydrates_100g || 0) * 10) / 10,
                  fatPer100g: Math.round((p.nutriments.fat_100g || 0) * 10) / 10
                };
                apiFoods.push(foodItem);
                // Auto-cache into IndexedDB so it works 100% offline next time!
                await putInStore('foodDatabase', foodItem);
              }
            }
          }
          await refreshNutritionData();
          return [...localResults, ...apiFoods];
        }
      }
    } catch {
      // Return local results on network error
    }

    return localResults;
  };

  return {
    nutritionLogs,
    currentLog,
    selectedDate,
    setSelectedDate,
    loading,
    addMealItem,
    removeMealItem,
    searchFoods
  };
}
