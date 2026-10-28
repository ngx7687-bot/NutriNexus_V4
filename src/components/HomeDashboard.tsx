import React from 'react';
import { UserProfile, Meal, Reminder } from '../types';
import { Camera, Utensils, Bell, Trophy, ArrowRight, Flame, Zap, HeartPulse, CheckCircle2 } from 'lucide-react';

interface HomeDashboardProps {
  userProfile: UserProfile | null;
  meals: Meal[];
  reminders: Reminder[];
  pointsTotal: number;
  setActiveTab: (tab: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  userProfile,
  meals,
  reminders,
  pointsTotal,
  setActiveTab,
}) => {
  if (!userProfile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-8 sm:p-12">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <HeartPulse className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Welcome to NutriNexus</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Your AI-powered nutrition and health companion. Please complete your profile setup to calculate your personalized TDEE, macronutrient targets, and glycemic guidelines.
          </p>
          <button
            onClick={() => setActiveTab('profile')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3 rounded-xl shadow-md transition flex items-center gap-2 mx-auto"
          >
            Set Up Your Profile <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Calculate today's totals
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMeals = meals.filter(m => m.timestamp.startsWith(todayStr));
  
  const totalCalories = todayMeals.reduce((acc, m) => acc + m.foods.reduce((sum, f) => sum + f.calories, 0), 0);
  const totalCarbs = todayMeals.reduce((acc, m) => acc + m.foods.reduce((sum, f) => sum + f.carbs_g, 0), 0);
  const totalProtein = todayMeals.reduce((acc, m) => acc + m.foods.reduce((sum, f) => sum + f.protein_g, 0), 0);
  const totalFat = todayMeals.reduce((acc, m) => acc + m.foods.reduce((sum, f) => sum + f.fat_g, 0), 0);
  const totalFiber = todayMeals.reduce((acc, m) => acc + m.foods.reduce((sum, f) => sum + f.fiber_g, 0), 0);
  const totalSugar = todayMeals.reduce((acc, m) => acc + m.foods.reduce((sum, f) => sum + f.sugar_g, 0), 0);

  // Average nutrition score for today
  const avgScore = todayMeals.length > 0
    ? Math.round(todayMeals.reduce((acc, m) => acc + (m.nutritionScore || 75), 0) / todayMeals.length)
    : 85;

  // Score color
  const scoreColor = avgScore >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : avgScore >= 60 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-red-600 bg-red-50 border-red-200';

  // Next reminder
  const nextReminder = reminders.filter(r => r.status === 'pending')[0];

  // Reward tier calculation
  const nextTierPoints = pointsTotal < 100 ? 100 : pointsTotal < 300 ? 300 : pointsTotal < 600 ? 600 : 1000;
  const rewardProgress = Math.min(100, Math.round((pointsTotal / nextTierPoints) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24 md:pb-12">
      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/10 skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/30 text-emerald-100 px-3 py-1 rounded-full text-xs font-medium mb-3">
              <Zap className="w-3.5 h-3.5 text-amber-300" /> Daily Health Companion Active
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">Hello, {userProfile.name}! 👋</h2>
            <p className="text-emerald-100 text-sm sm:text-base mt-1 max-w-xl">
              Your TDEE target is <strong className="text-white">{userProfile.tdee} kcal</strong>. Stay consistent with your meals and medication to maintain your streak.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab('scan')}
              className="bg-white text-emerald-800 hover:bg-emerald-50 font-semibold px-5 py-3 rounded-xl shadow-md transition flex items-center gap-2 text-sm"
            >
              <Camera className="w-4 h-4 text-emerald-600" /> Scan Meal
            </button>
            <button
              onClick={() => setActiveTab('reminders')}
              className="bg-emerald-800/60 hover:bg-emerald-800 text-white font-medium px-4 py-3 rounded-xl backdrop-blur-xs transition flex items-center gap-2 text-sm border border-emerald-500/40"
            >
              <Bell className="w-4 h-4" /> Reminders
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Nutrition Score & Calorie Progress */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-emerald-600" /> Today's Nutrition Overview
            </h3>
            <span className="text-xs text-gray-500">{todayMeals.length} meals logged today</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Nutrition Score Card */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between ${scoreColor}`}>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Nutrition Score</span>
                <div className="text-3xl font-extrabold mt-1">{avgScore}/100</div>
              </div>
              <div className="text-xs mt-3 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Based on target balance & glycemic load
              </div>
            </div>

            {/* Calories Card */}
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Calories</span>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {totalCalories} <span className="text-sm font-normal text-gray-500">/ {userProfile.targets.calories} kcal</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalCalories / userProfile.targets.calories) * 100)}%` }}
                />
              </div>
            </div>

            {/* Glycemic Load Summary */}
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Glycemic Load</span>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {todayMeals.reduce((acc, m) => acc + m.glycemicLoad, 0).toFixed(1)}
                  <span className="text-xs font-normal text-emerald-600 ml-2 font-medium">
                    {todayMeals.length > 0 ? (todayMeals[todayMeals.length - 1].glycemicImpact.toUpperCase() + ' IMPACT') : 'No meals yet'}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" /> Target GL &lt; 20 per meal
              </div>
            </div>
          </div>

          {/* Macronutrients Progress */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-bold text-gray-800">Macronutrients Progress</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Carbs */}
              <div>
                <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                  <span>Carbohydrates</span>
                  <span>{Math.round(totalCarbs)}g / {userProfile.targets.carbsG}g</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, (totalCarbs / userProfile.targets.carbsG) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Protein */}
              <div>
                <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                  <span>Protein</span>
                  <span>{Math.round(totalProtein)}g / {userProfile.targets.proteinG}g</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, (totalProtein / userProfile.targets.proteinG) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Fat */}
              <div>
                <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                  <span>Fat</span>
                  <span>{Math.round(totalFat)}g / {userProfile.targets.fatG}g</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, (totalFat / userProfile.targets.fatG) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Fiber & Sugar */}
              <div>
                <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                  <span>Fiber ({Math.round(totalFiber)}g) / Sugar ({Math.round(totalSugar)}g)</span>
                  <span className="text-emerald-600 font-semibold">Target Limits</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    className="bg-purple-500 h-full"
                    style={{ width: `${Math.min(100, (totalFiber / userProfile.targets.fiberG) * 50)}%` }}
                  />
                  <div
                    className="bg-rose-400 h-full"
                    style={{ width: `${Math.min(100, (totalSugar / userProfile.targets.sugarG) * 50)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Next Reminder & Rewards Progress */}
        <div className="space-y-6">
          {/* Next Reminder Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-600" /> Next Reminder
              </h3>
              <button
                onClick={() => setActiveTab('reminders')}
                className="text-xs text-emerald-600 font-semibold hover:underline"
              >
                View All
              </button>
            </div>
            {nextReminder ? (
              <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-800 capitalize">
                    {nextReminder.type}
                  </span>
                  <span className="text-xs text-gray-500">{new Date(nextReminder.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <h4 className="font-bold text-gray-900 text-sm">{nextReminder.title}</h4>
                <p className="text-xs text-gray-600 line-clamp-2">{nextReminder.notes || 'No additional notes.'}</p>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 text-sm">
                No pending reminders. Great job staying on track!
              </div>
            )}
          </div>

          {/* Rewards Status Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" /> Rewards & Points
              </h3>
              <button
                onClick={() => setActiveTab('rewards')}
                className="text-xs text-emerald-600 font-semibold hover:underline"
              >
                Ledger
              </button>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 p-4 rounded-xl flex items-center justify-between mb-4">
              <div>
                <span className="text-xs text-amber-800 font-medium">Total Points Earned</span>
                <div className="text-3xl font-extrabold text-amber-900 mt-0.5">{pointsTotal} pts</div>
              </div>
              <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center font-bold shadow-md">
                🏆
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                <span>Progress to Next Reward Tier</span>
                <span>{pointsTotal} / {nextTierPoints} pts</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${rewardProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
