import React, { useState } from 'react';
import { UserProfile, HealthRecord } from '../types';
import { User, Activity, Heart, Check, AlertTriangle } from 'lucide-react';

interface ProfileOnboardingProps {
  user: any;
  userProfile: UserProfile | null;
  healthRecord: HealthRecord | null;
  onSaveProfile: (profile: UserProfile, health: HealthRecord) => Promise<void>;
}

export const ProfileOnboarding: React.FC<ProfileOnboardingProps> = ({
  user,
  userProfile,
  healthRecord,
  onSaveProfile,
}) => {
  const [name, setName] = useState<string>(userProfile?.name || user?.displayName || '');
  const [email, setEmail] = useState<string>(userProfile?.email || user?.email || '');
  const [age, setAge] = useState<number>(userProfile?.age || 35);
  const [sex, setSex] = useState<'male' | 'female' | 'other'>(userProfile?.sex || 'male');
  const [weightKg, setWeightKg] = useState<number>(userProfile?.weightKg || 70);
  const [heightCm, setHeightCm] = useState<number>(userProfile?.heightCm || 175);
  const [activityLevel, setActivityLevel] = useState<UserProfile['activityLevel']>(
    userProfile?.activityLevel || 'moderate'
  );
  const [contactNumber, setContactNumber] = useState<string>(userProfile?.contactNumber || '60143344931');

  // Health Record
  const [conditionsInput, setConditionsInput] = useState<string>(
    healthRecord?.conditions?.join(', ') || 'Type 2 Diabetes'
  );
  const [medicationsInput, setMedicationsInput] = useState<string>(
    healthRecord?.medications?.join(', ') || ''
  );
  const [allergiesInput, setAllergiesInput] = useState<string>(
    healthRecord?.allergies?.join(', ') || ''
  );
  const [hba1c, setHba1c] = useState<number | ''>(healthRecord?.hba1c ?? 13);
  const [fastingGlucose, setFastingGlucose] = useState<number | ''>(healthRecord?.fastingGlucose ?? 6);

  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [results, setResults] = useState<any | null>(null);

  const handleCalculateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);

    try {
      const heightM = heightCm / 100;
      const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;

      let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
      if (sex === 'male') {
        bmr += 5;
      } else {
        bmr -= 161;
      }
      bmr = Math.round(bmr);

      const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        very_active: 1.725,
        extra_active: 1.9,
      };

      const tdee = Math.round(bmr * activityMultipliers[activityLevel]);
      const conditions = conditionsInput.split(',').map(s => s.trim()).filter(Boolean);
      const hba1cVal = typeof hba1c === 'number' ? hba1c : 0;
      const isDiabetesOrPre = conditions.some(c => 
        c.toLowerCase().includes('diabetes') || c.toLowerCase().includes('pre-diabetes') || c.toLowerCase().includes('insulin')
      ) || hba1cVal >= 6.5;

      const calories = tdee;
      const carbPct = isDiabetesOrPre ? 0.35 : 0.50;
      const proteinPct = 0.30;
      const fatPct = 0.35;

      const carbsG = Math.round((calories * carbPct) / 4);
      const proteinG = Math.round((calories * proteinPct) / 4);
      const fatG = Math.round((calories * fatPct) / 9);
      const fiberG = 30;
      const sugarG = isDiabetesOrPre ? 25 : 50;

      const newProfile: UserProfile = {
        uid: user?.uid || 'guest',
        name,
        email,
        age,
        sex,
        weightKg,
        heightCm,
        activityLevel,
        contactNumber,
        bmi,
        bmr,
        tdee,
        targets: {
          calories: calories - 400,
          carbsG,
          proteinG,
          fatG,
          fiberG,
          sugarG,
        },
        updatedAt: new Date().toISOString(),
      };

      const newHealth: HealthRecord = {
        conditions,
        medications: medicationsInput.split(',').map(s => s.trim()).filter(Boolean),
        allergies: allergiesInput.split(',').map(s => s.trim()).filter(Boolean),
        hba1c: hba1c !== '' ? Number(hba1c) : undefined,
        fastingGlucose: fastingGlucose !== '' ? Number(fastingGlucose) : undefined,
        updatedAt: new Date().toISOString(),
      };

      await onSaveProfile(newProfile, newHealth);

      const warnings = hba1cVal > 8.0 ? [
        `HbA1c is significantly elevated (${hba1cVal}%). Consult your physician immediately.`,
        "Prioritize lean proteins and low-glycemic foods to help manage glucose levels."
      ] : [];

      setResults({
        tdee,
        targetCalories: calories - 400,
        dailyProtein: proteinG,
        macros: { protein: proteinG, carbs: carbsG, fats: fatG },
        warnings,
      });

      setSuccessMsg('Profile Calculated Successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 pb-24 md:pb-12">
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Profile & Health Calculations</h2>
          <p className="text-gray-600 text-sm mt-1">
            Configure your biometric details, activity level, and clinical lab values.
          </p>
        </div>

        {successMsg && !results && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium">
            <Check className="w-5 h-5 shrink-0" /> {successMsg}
          </div>
        )}

        {!results ? (
          <form onSubmit={handleCalculateAndSave} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
                <User className="w-4 h-4 text-emerald-600" /> Personal & Biometric Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    required
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Sex</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value as any)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    required
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Activity Level & Contact */}
            <div className="space-y-4 pt-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
                <Activity className="w-4 h-4 text-emerald-600" /> Activity Level & Contact
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Activity Level</label>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value as any)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium"
                  >
                    <option value="sedentary">Sedentary (little or no exercise)</option>
                    <option value="light">Light (exercise 1-3 times/week)</option>
                    <option value="moderate">Moderate (exercise 3-5 times/week)</option>
                    <option value="very_active">Very Active (exercise 6-7 times/week)</option>
                    <option value="extra_active">Extra Active (very heavy exercise / physical job)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Contact Number (SMS / WhatsApp)</label>
                  <input
                    type="tel"
                    placeholder="e.g. 60143344931"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Health Record */}
            <div className="space-y-4 pt-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
                <Heart className="w-4 h-4 text-emerald-600" /> Health Record & Clinical Lab Values
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Health Conditions (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Type 2 Diabetes"
                    value={conditionsInput}
                    onChange={(e) => setConditionsInput(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Current Medications</label>
                  <input
                    type="text"
                    placeholder="e.g. Metformin, Insulin"
                    value={medicationsInput}
                    onChange={(e) => setMedicationsInput(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Allergies</label>
                  <input
                    type="text"
                    placeholder="e.g. Peanuts, Gluten"
                    value={allergiesInput}
                    onChange={(e) => setAllergiesInput(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">HbA1c (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 13"
                      value={hba1c}
                      onChange={(e) => setHba1c(e.target.value !== '' ? Number(e.target.value) : '')}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Fasting Glucose</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 6"
                      value={fastingGlucose}
                      onChange={(e) => setFastingGlucose(e.target.value !== '' ? Number(e.target.value) : '')}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-md"
            >
              {saving ? 'Calculating...' : 'Calculate & Save Profile'}
            </button>
          </form>
        ) : (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
              <h3 className="text-lg font-bold text-emerald-900">Profile Calculated Successfully!</h3>
              <p className="text-sm text-emerald-700">Your personalized nutritional targets are ready.</p>
            </div>

            {/* Results Grid including Protein */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border text-center">
                <span className="text-xs text-slate-500 block">Daily Calories</span>
                <span className="text-xl font-bold text-slate-800">{results.targetCalories} kcal</span>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center">
                <span className="text-xs text-emerald-600 font-medium block">Daily Protein</span>
                <span className="text-xl font-bold text-emerald-700">{results.dailyProtein}g</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border text-center">
                <span className="text-xs text-slate-500 block">TDEE</span>
                <span className="text-xl font-bold text-slate-800">{results.tdee} kcal</span>
              </div>
            </div>

            {results.warnings.length > 0 && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl">
                <h4 className="font-semibold text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" /> Clinical Recommendations
                </h4>
                <ul className="list-disc list-inside text-sm text-amber-700 mt-2 space-y-1">
                  {results.warnings.map((w: string, idx: number) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => setResults(null)}
              className="w-full py-3 bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300 transition"
            >
              Edit Profile Inputs
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
