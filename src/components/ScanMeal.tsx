import React, { useState } from 'react';
import { Upload, Loader2, Check, AlertCircle, Plus, Trash2, HeartPulse, Sparkles } from 'lucide-react';
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
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [mealResult, setMealResult] = useState<{
    mealName: string;
    calories: number;
    protein: number;
    fiber: number;
    carbs: number;
    fats: number;
    ingredients: string[];
    healthTip: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSelectedImage(result);
      setMealResult(null);
      setError(null);
      setSuccessMsg(null);
    };
    reader.readAsDataURL(file);
  };

  // Trigger Gemini scan via /api/analyze-meal
  const handleAnalyzeMeal = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: selectedImage,
          mimeType,
          userContext: userProfile || {},
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();
      setMealResult(data);
    } catch (err: any) {
      console.error('Meal analysis failed:', err);
      setError(err.message || 'Failed to analyze meal. Please check your network.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Confirm and save meal
  const handleConfirmMeal = async () => {
    if (!mealResult) return;
    setSaving(true);
    setError(null);
    try {
      // Estimate glycemic load: (Carbs - Fiber) * 0.5 (average GI ~50)
      const netCarbs = Math.max(0, mealResult.carbs - mealResult.fiber);
      const glycemicLoad = Math.round((50 * netCarbs) / 100 * 10) / 10;
      const glycemicImpact = glycemicLoad <= 10 ? 'low' : glycemicLoad <= 19 ? 'medium' : 'high';

      const foodItems: FoodItem[] = [{
        name: mealResult.mealName,
        portion_g: 350,
        calories: mealResult.calories,
        carbs_g: mealResult.carbs,
        fiber_g: mealResult.fiber,
        sugar_g: Math.round(mealResult.carbs * 0.2),
        protein_g: mealResult.protein,
        fat_g: mealResult.fats,
        estimated_gi: 55,
      }];

      const targetCalories = userProfile?.targets.calories || 2000;
      const calorieFitScore = Math.max(0, 100 - Math.abs(mealResult.calories - (targetCalories / 3)) / (targetCalories / 3) * 50);
      const glycemicScore = glycemicImpact === 'low' ? 100 : glycemicImpact === 'medium' ? 75 : 40;
      const nutritionScore = Math.round((calorieFitScore * 0.4) + (glycemicScore * 0.6));

      await onSaveMeal({
        userId: userProfile?.uid || 'guest',
        foods: foodItems,
        glycemicLoad,
        glycemicImpact,
        confidence: 0.95,
        notes: mealResult.ingredients.join(', '),
        nutritionScore,
        tip: mealResult.healthTip,
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
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 pb-24 md:pb-12">
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-emerald-600" /> Clinical AI Nutritionist
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Upload or drop a meal image here (e.g., Nasi Lemak, Chicken Rice) for expert clinical analysis and blood sugar management insight.
          </p>
        </div>

        {/* Image Preview Area */}
        <div className="border-2 border-dashed border-emerald-300 p-6 rounded-xl text-center relative hover:bg-emerald-50/40 transition">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          {selectedImage ? (
            <img src={selectedImage} alt="Meal preview" className="max-h-64 mx-auto rounded-lg object-cover shadow-sm" />
          ) : (
            <div className="space-y-2 py-6">
              <Upload className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-slate-600 font-medium">Upload or drop a meal image here (Click to browse)</p>
              <p className="text-xs text-slate-400">Supports JPEG, PNG, WEBP</p>
            </div>
          )}
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
          className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-md"
        >
          {isAnalyzing ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
              Analyzing Meal with Clinical AI...
            </>
          ) : (
            'Analyze Meal'
          )}
        </button>
      </div>

      {/* Analysis Results Card */}
      {mealResult && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100 space-y-6 animate-fadeIn">
          <div className="border-b pb-4 flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Clinical Nutritionist Assessment
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">{mealResult.mealName}</h3>
            </div>
          </div>

          {/* Macros Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border text-center">
              <span className="text-xs text-slate-500 block">Calories</span>
              <span className="text-xl font-bold text-slate-800">{mealResult.calories} kcal</span>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center">
              <span className="text-xs text-emerald-600 font-medium block">Protein</span>
              <span className="text-xl font-bold text-emerald-700">{mealResult.protein}g</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border text-center">
              <span className="text-xs text-slate-500 block">Carbs</span>
              <span className="text-xl font-bold text-slate-800">{mealResult.carbs}g</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border text-center">
              <span className="text-xs text-slate-500 block">Fats / Fiber</span>
              <span className="text-lg font-bold text-slate-800">{mealResult.fats}g / {mealResult.fiber}g</span>
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Identified Ingredients</h4>
            <div className="flex flex-wrap gap-2">
              {mealResult.ingredients.map((ing: string, idx: number) => (
                <span key={idx} className="bg-slate-100 text-slate-800 text-xs font-medium px-3 py-1 rounded-full">
                  {ing}
                </span>
              ))}
            </div>
          </div>

          {/* Health Tip */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl">
            <h4 className="font-semibold text-amber-800 text-sm">Clinical & Glycemic Tip</h4>
            <p className="text-sm text-amber-700 mt-1">{mealResult.healthTip}</p>
          </div>

          <button
            onClick={handleConfirmMeal}
            disabled={saving}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            Confirm & Save Meal to Log
          </button>
        </div>
      )}
    </div>
  );
};
