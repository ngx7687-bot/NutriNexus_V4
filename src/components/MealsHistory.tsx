import React from 'react';
import { Meal } from '../types';
import { Utensils, Calendar, Flame, Lightbulb, Trash2 } from 'lucide-react';

interface MealsHistoryProps {
  meals: Meal[];
  onDeleteMeal: (mealId: string) => Promise<void>;
}

export const MealsHistory: React.FC<MealsHistoryProps> = ({
  meals,
  onDeleteMeal,
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 pb-24 md:pb-12">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Meal Log & History</h2>
            <p className="text-gray-600 text-sm mt-1">Review your past scanned meals, glycemic loads, nutrition scores, and AI tips.</p>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full">
            {meals.length} Total Meals Logged
          </span>
        </div>

        {meals.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Utensils className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-800">No meals logged yet</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Scan your first meal using the "Scan Meal" tab to start tracking your glycemic impact and nutrition score.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {meals.map((meal) => {
              const totalCalories = meal.foods.reduce((sum, f) => sum + f.calories, 0);
              const totalCarbs = meal.foods.reduce((sum, f) => sum + f.carbs_g, 0);
              const dateStr = new Date(meal.timestamp).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={meal.id} className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-4 hover:shadow-md transition">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        🍽️
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                          <span>Meal Log</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            meal.glycemicImpact === 'low'
                              ? 'bg-emerald-100 text-emerald-800'
                              : meal.glycemicImpact === 'medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {meal.glycemicImpact} Impact (GL: {meal.glycemicLoad})
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" /> {dateStr}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {meal.nutritionScore !== undefined && (
                        <div className="text-right">
                          <div className="text-xs text-gray-500 font-medium">Nutrition Score</div>
                          <div className="text-lg font-bold text-emerald-600">{meal.nutritionScore}/100</div>
                        </div>
                      )}
                      <button
                        onClick={() => onDeleteMeal(meal.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition"
                        title="Delete meal"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Foods Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {meal.foods.map((food, i) => (
                      <div key={i} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="font-semibold text-gray-800 text-sm">{food.name}</div>
                        <div className="text-xs text-gray-500 mt-1 flex justify-between">
                          <span>{food.portion_g}g • {food.calories} kcal</span>
                          <span>Carbs: {food.carbs_g}g</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals & Tip */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-emerald-50/40 p-4 rounded-xl border border-emerald-100/60 text-xs">
                    <div className="font-medium text-emerald-900">
                      Total: <strong>{totalCalories} kcal</strong> | Carbs: <strong>{Math.round(totalCarbs)}g</strong>
                    </div>
                    {meal.tip && (
                      <div className="flex items-center gap-2 text-emerald-800 italic">
                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>"{meal.tip}"</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
