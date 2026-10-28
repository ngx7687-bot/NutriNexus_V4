import React, { useState, useEffect } from 'react';

interface MealRecord {
  id: string;
  mealName: string;
  calories: number;
  protein: number;
  fiber: number;
  carbs: number;
  fats: number;
  image?: string;
  date: string;
  healthTip?: string;
}

interface MealsHistoryProps {
  meals?: any[];
  onDeleteMeal?: (mealId: string) => Promise<void>;
}

export const MealsHistory: React.FC<MealsHistoryProps> = ({ onDeleteMeal }) => {
  const [meals, setMeals] = useState<MealRecord[]>([]);

  const loadMeals = () => {
    const savedMeals = localStorage.getItem('nutrinexus_meals');
    if (savedMeals) {
      try {
        setMeals(JSON.parse(savedMeals));
      } catch (e) {
        console.error("Failed to parse saved meals", e);
      }
    } else {
      setMeals([]);
    }
  };

  useEffect(() => {
    loadMeals();

    // Listen for custom event when a meal is saved in another tab/component
    window.addEventListener('nutrinexus_meal_saved', loadMeals);
    window.addEventListener('storage', loadMeals);

    return () => {
      window.removeEventListener('nutrinexus_meal_saved', loadMeals);
      window.removeEventListener('storage', loadMeals);
    };
  }, []);

  const handleDeleteMeal = async (id: string) => {
    const updated = meals.filter(m => m.id !== id);
    setMeals(updated);
    localStorage.setItem('nutrinexus_meals', JSON.stringify(updated));
    if (onDeleteMeal) {
      try {
        await onDeleteMeal(id);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 pb-24 md:pb-12">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Meal Log & History</h2>
          <p className="text-sm text-slate-500">Review your past scanned meals, nutrition scores, and AI tips.</p>
        </div>
        <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full shadow-2xs">
          {meals.length} Total Meals Logged
        </span>
      </div>

      {meals.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm text-center border border-slate-100 space-y-3">
          <div className="w-14 h-14 mx-auto bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 font-bold text-2xl">🍽️</div>
          <h3 className="font-bold text-slate-800 text-lg">No meals logged yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Scan your first meal using the "Scan Meal" tab to start tracking your calories, protein, fiber, and glycemic impact.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {meals.map((meal) => (
            <div key={meal.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between hover:border-emerald-200 transition">
              <div className="flex items-center gap-4">
                {meal.image ? (
                  <img src={meal.image} alt={meal.mealName} className="w-16 h-16 rounded-lg object-cover shadow-xs border border-slate-100" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">🍽️</div>
                )}
                <div>
                  <span className="text-xs font-medium text-slate-400">{meal.date}</span>
                  <h4 className="font-bold text-slate-800 text-lg">{meal.mealName}</h4>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs font-semibold">
                    <span className="text-slate-700">🔥 {meal.calories} kcal</span>
                    <span className="text-emerald-700">🥩 {meal.protein}g Protein</span>
                    <span className="text-emerald-700">🌾 {meal.fiber}g Fiber</span>
                  </div>
                  {meal.healthTip && (
                    <p className="text-xs text-slate-500 mt-1 italic">Tip: {meal.healthTip}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
                <button
                  onClick={() => handleDeleteMeal(meal.id)}
                  className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-medium transition"
                >
                  Delete Log
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
