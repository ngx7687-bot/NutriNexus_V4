import React, { useState } from 'react';
import { Camera, Upload, Loader2, Check, RefreshCw, AlertCircle, Plus, Trash2 } from 'lucide-react';
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
  const [loading, setLoading] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<{
    foods: FoodItem[];
    glycemic_load: number;
    glycemic_impact: 'low' | 'medium' | 'high';
    confidence: number;
    notes: string;
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
      // Extract base64 part
      const base64 = result.split(',')[1];
      setSelectedImage(base64);
      setScanResult(null);
      setError(null);
      setSuccessMsg(null);
    };
    reader.readAsDataURL(file);
  };

  // Trigger Gemini scan
  const handleScan = async () => {
    if (!selectedImage) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType,
          userContext: userProfile || {},
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to scan meal');
      setScanResult(data);
    } catch (err: any) {
      setError(err.message || 'Error communicating with AI server');
    } finally {
      setLoading(false);
    }
  };

  // Recalculate glycemic load when foods are edited
  const recalculateTotals = (foods: FoodItem[]) => {
    let totalGL = 0;
    foods.forEach(f => {
      totalGL += (f.estimated_gi * f.carbs_g) / 100;
    });
    const impact = (totalGL <= 10 ? 'low' : totalGL <= 19 ? 'medium' : 'high') as 'low' | 'medium' | 'high';
    return { totalGL, impact };
  };

  // Edit food item property
  const handleFoodChange = (index: number, field: keyof FoodItem, value: any) => {
    if (!scanResult) return;
    const updatedFoods = [...scanResult.foods];
    updatedFoods[index] = {
      ...updatedFoods[index],
      [field]: value,
    };
    const { totalGL, impact } = recalculateTotals(updatedFoods);
    setScanResult({
      ...scanResult,
      foods: updatedFoods,
      glycemic_load: Math.round(totalGL * 10) / 10,
      glycemic_impact: impact,
    });
  };

  // Add new food item
  const handleAddFood = () => {
    if (!scanResult) return;
    const newFood: FoodItem = {
      name: 'New Food Item',
      portion_g: 100,
      calories: 150,
      carbs_g: 20,
      fiber_g: 2,
      sugar_g: 5,
      protein_g: 5,
      fat_g: 4,
      estimated_gi: 50,
    };
    const updatedFoods = [...scanResult.foods, newFood];
    const { totalGL, impact } = recalculateTotals(updatedFoods);
    setScanResult({
      ...scanResult,
      foods: updatedFoods,
      glycemic_load: Math.round(totalGL * 10) / 10,
      glycemic_impact: impact,
    });
  };

  // Remove food item
  const handleRemoveFood = (index: number) => {
    if (!scanResult) return;
    const updatedFoods = scanResult.foods.filter((_, i) => i !== index);
    const { totalGL, impact } = recalculateTotals(updatedFoods);
    setScanResult({
      ...scanResult,
      foods: updatedFoods,
      glycemic_load: Math.round(totalGL * 10) / 10,
      glycemic_impact: impact,
    });
  };

  // Confirm and save meal
  const handleConfirmMeal = async () => {
    if (!scanResult) return;
    setSaving(true);
    setError(null);
    try {
      // Get AI tip for this meal
      let tip = "Enjoy your meal mindfully and stay hydrated.";
      try {
        const tipRes = await fetch('/api/tip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mealSummary: scanResult,
            userHealth: userProfile || {},
          }),
        });
        const tipData = await tipRes.json();
        if (tipData.tip) tip = tipData.tip;
      } catch (e) {
        console.error("Tip fetch error:", e);
      }

      // Calculate nutrition score (0-100)
      const targetCalories = userProfile?.targets.calories || 2000;
      const mealCalories = scanResult.foods.reduce((sum, f) => sum + f.calories, 0);
      const calorieFitScore = Math.max(0, 100 - Math.abs(mealCalories - (targetCalories / 3)) / (targetCalories / 3) * 50);
      const glycemicScore = scanResult.glycemic_impact === 'low' ? 100 : scanResult.glycemic_impact === 'medium' ? 75 : 40;
      const nutritionScore = Math.round((calorieFitScore * 0.4) + (glycemicScore * 0.6));

      await onSaveMeal({
        userId: userProfile?.uid || 'guest',
        foods: scanResult.foods,
        glycemicLoad: scanResult.glycemic_load,
        glycemicImpact: scanResult.glycemic_impact,
        confidence: scanResult.confidence,
        notes: scanResult.notes,
        nutritionScore,
        tip,
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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 pb-24 md:pb-12">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Food Scan & Glycemic Impact</h2>
          <p className="text-gray-600 text-sm mt-1">
            Upload or take a photo of your meal. Our AI analyzes food components, estimates glycemic load, and provides customized feedback.
          </p>
        </div>

        {/* Upload / Capture Section */}
        <div className="border-2 border-dashed border-emerald-200 rounded-2xl p-8 text-center bg-emerald-50/30 flex flex-col items-center justify-center relative hover:bg-emerald-50/50 transition">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          {selectedImage ? (
            <div className="space-y-4">
              <img
                src={`data:${mimeType};base64,${selectedImage}`}
                alt="Selected meal"
                className="max-h-64 mx-auto rounded-xl shadow-md object-contain"
              />
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-100 px-3 py-1 rounded-full">
                Image loaded successfully. Click or drag to change.
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Camera className="w-8 h-8" />
              </div>
              <div className="font-semibold text-gray-800">Tap to Take Photo or Upload Meal Image</div>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">Supports JPEG, PNG, WEBP. Your photo is securely processed with AI.</p>
            </div>
          )}
        </div>

        {selectedImage && !scanResult && (
          <div className="flex justify-center">
            <button
              onClick={handleScan}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3 rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Analyzing Meal with AI...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" /> Scan & Analyze Meal
                </>
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" /> {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium">
            <Check className="w-5 h-5 shrink-0" /> {successMsg}
          </div>
        )}
      </div>

      {/* Scan Results Card */}
      {scanResult && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-gray-900">Scan Results & Glycemic Estimate</h3>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                  scanResult.glycemic_impact === 'low'
                    ? 'bg-emerald-100 text-emerald-800'
                    : scanResult.glycemic_impact === 'medium'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {scanResult.glycemic_impact} Impact (GL: {scanResult.glycemic_load})
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Confidence: <strong className="text-gray-700">{(scanResult.confidence * 100).toFixed(0)}%</strong> • {scanResult.notes}
              </p>
            </div>
            <button
              onClick={handleAddFood}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Food Item
            </button>
          </div>

          {/* Foods Table / Cards */}
          <div className="space-y-4">
            {scanResult.foods.map((food, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-4">
                  <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Food Name</label>
                  <input
                    type="text"
                    value={food.name}
                    onChange={(e) => handleFoodChange(index, 'name', e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-sm font-medium text-gray-900"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Portion (g)</label>
                  <input
                    type="number"
                    value={food.portion_g}
                    onChange={(e) => handleFoodChange(index, 'portion_g', Number(e.target.value))}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-sm font-medium text-gray-900"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Calories</label>
                  <input
                    type="number"
                    value={food.calories}
                    onChange={(e) => handleFoodChange(index, 'calories', Number(e.target.value))}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-sm font-medium text-gray-900"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Carbs (g) / GI</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={food.carbs_g}
                      onChange={(e) => handleFoodChange(index, 'carbs_g', Number(e.target.value))}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-sm font-medium text-gray-900"
                      title="Carbs (g)"
                    />
                    <input
                      type="number"
                      value={food.estimated_gi}
                      onChange={(e) => handleFoodChange(index, 'estimated_gi', Number(e.target.value))}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-sm font-medium text-gray-900"
                      title="Estimated GI"
                    />
                  </div>
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    onClick={() => handleRemoveFood(index)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    title="Remove item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
            <div className="text-xs text-emerald-900 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Glycemic load per food = GI × carbs (g) / 100. Low ≤ 10, Medium 11-19, High ≥ 20. Estimates, not medical advice.</span>
            </div>
            <button
              onClick={handleConfirmMeal}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-md transition flex items-center gap-2 shrink-0 disabled:opacity-50 text-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Confirm & Log Meal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
