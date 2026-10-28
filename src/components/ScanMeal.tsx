import React, { useState } from 'react';
import { Upload, Loader2, Check, AlertCircle, Sparkles, HeartPulse } from 'lucide-react';
import { UserProfile, Meal, FoodItem } from '../types';

interface ScanMealProps {
  userProfile: UserProfile | null;
  onSaveMeal: (meal: Omit<Meal, 'id'>) => Promise<void>;
  setActiveTab: (tab: string) => void;
}

export const ScanMeal: React.FC<ScanMealProps> = ({
  userProfile,
  onSaveMeal,
  setActiveTab,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mealResult, setMealResult] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setSelectedImage(uploadEvent.target?.result as string);
        setMealResult(null);
        setError(null);
        setSuccessMsg(null);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleAnalyzeMeal = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: selectedImage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze meal with AI.');
      }

      setMealResult(data);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Server error communicating with Google AI Studio.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmMeal = async () => {
    if (!mealResult) return;
    setSaving(true);
    setError(null);
    try {
      const netCarbs = Math.max(0, (mealResult.carbs || 50) - (mealResult.fiber || 5));
      const glycemicLoad = Math.round((55 * netCarbs) / 100 * 10) / 10;
      const glycemicImpact = glycemicLoad <= 10 ? 'low' : glycemicLoad <= 19 ? 'medium' : 'high';

      const foodItems: FoodItem[] = [{
        name: mealResult.mealName || 'Scanned Meal',
        portion_g: 350,
        calories: mealResult.calories || 500,
        carbs_g: mealResult.carbs || 50,
        fiber_g: mealResult.fiber || 5,
        sugar_g: Math.round((mealResult.carbs || 50) * 0.2),
        protein_g: mealResult.protein || 20,
        fat_g: mealResult.fats || 20,
        estimated_gi: 55,
      }];

      const targetCalories = userProfile?.targets.calories || 2000;
      const calorieFitScore = Math.max(0, 100 - Math.abs((mealResult.calories || 500) - (targetCalories / 3)) / (targetCalories / 3) * 50);
      const glycemicScore = glycemicImpact === 'low' ? 100 : glycemicImpact === 'medium' ? 75 : 40;
      const nutritionScore = Math.round((calorieFitScore * 0.4) + (glycemicScore * 0.6));

      await onSaveMeal({
        userId: userProfile?.uid || 'guest',
        foods: foodItems,
        glycemicLoad,
        glycemicImpact,
        confidence: 0.95,
        notes: mealResult.ingredients?.join(', ') || '',
        nutritionScore,
        tip: mealResult.healthTip || 'Maintain steady blood glucose levels with balanced macronutrients.',
        timestamp: new Date().toISOString(),
      });

      setSuccessMsg('Meal successfully saved to your log and points awarded!');
      setTimeout(() => {
        setActiveTab('meals');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save meal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6 pb-24 md:pb-12">
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100 space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <HeartPulse className="w-6 h-6 text-emerald-600" /> Scan Meal & Nutrition (Live AI)
        </h2>

        <div className="border-2 border-dashed border-emerald-300 p-4 rounded-xl text-center relative bg-emerald-50/50 hover:bg-emerald-50 transition cursor-pointer">
          {selectedImage ? (
            <div className="space-y-2">
              <img src={selectedImage} alt="Uploaded meal" className="max-h-64 mx-auto rounded-lg object-cover shadow-sm" />
              <p className="text-xs text-emerald-700 font-medium">Image loaded. Click or drag to change image.</p>
            </div>
          ) : (
            <div className="py-8 space-y-2">
              <Upload className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-slate-600 font-medium">Upload or select a meal image</p>
            </div>
          )}
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" /> {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium flex items-center gap-2">
            <Check className="w-5 h-5 shrink-0" /> {successMsg}
          </div>
        )}

        <button
          onClick={handleAnalyzeMeal}
          disabled={isAnalyzing || !selectedImage}
          className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-sm"
        >
          {isAnalyzing ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
              Analyzing with Google AI Studio...
            </>
          ) : (
            'Analyze Meal with AI'
          )}
        </button>

        {mealResult && (
          <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-4 animate-fadeIn">
            <div>
              <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-200 text-emerald-800 rounded-full flex items-center gap-1 w-fit">
                <Sparkles className="w-3 h-3" /> AI Verified Accuracy
              </span>
              <h3 className="text-lg font-bold text-emerald-900 mt-1">{mealResult.mealName}</h3>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-xs">
                <span className="text-xs text-slate-500 block">Calories</span>
                <span className="text-lg font-bold text-slate-800">{mealResult.calories} kcal</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-xs">
                <span className="text-xs text-slate-500 block">Protein</span>
                <span className="text-lg font-bold text-emerald-700">{mealResult.protein}g</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-xs">
                <span className="text-xs text-slate-500 block">Fiber</span>
                <span className="text-lg font-bold text-emerald-700">{mealResult.fiber}g</span>
              </div>
            </div>

            {mealResult.ingredients && (
              <div className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-emerald-100">
                <strong>Detected Ingredients:</strong> {mealResult.ingredients.join(', ')}
              </div>
            )}

            {mealResult.healthTip && (
              <div className="bg-white p-3 rounded-lg border border-emerald-100 text-xs text-slate-700">
                <strong className="text-emerald-800 block mb-1">Clinical Insight:</strong>
                {mealResult.healthTip}
              </div>
            )}

            <button
              onClick={handleConfirmMeal}
              disabled={saving}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Confirm & Save to Meal Log
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
