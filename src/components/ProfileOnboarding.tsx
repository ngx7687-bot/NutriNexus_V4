import React, { useState } from 'react';
import { UserProfile, HealthRecord } from '../types';
import { User, Activity, Heart, Check, Save } from 'lucide-react';

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
  const [contactNumber, setContactNumber] = useState<string>(userProfile?.contactNumber || '');

  // Health Record
  const [conditionsInput, setConditionsInput] = useState<string>(
    healthRecord?.conditions?.join(', ') || ''
  );
  const [medicationsInput, setMedicationsInput] = useState<string>(
    healthRecord?.medications?.join(', ') || ''
  );
  const [allergiesInput, setAllergiesInput] = useState<string>(
    healthRecord?.allergies?.join(', ') || ''
  );
  const [hba1c, setHba1c] = useState<number | ''>(healthRecord?.hba1c ?? '');
  const [fastingGlucose, setFastingGlucose] = useState<number | ''>(healthRecord?.fastingGlucose ?? '');

  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);

    try {
      // Compute BMI, BMR, TDEE in code (Mifflin-St Jeor)
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

      // Check conditions for diabetes / pre-diabetes
      const conditions = conditionsInput.split(',').map(s => s.trim()).filter(Boolean);
      const isDiabetesOrPre = conditions.some(c => 
        c.toLowerCase().includes('diabetes') || c.toLowerCase().includes('pre-diabetes') || c.toLowerCase().includes('insulin')
      );

      // Derive targets
      const calories = tdee;
      // Lower carb and sugar targets if diabetes or pre-diabetes
      const carbPct = isDiabetesOrPre ? 0.35 : 0.50;
      const proteinPct = 0.25;
      const fatPct = 0.25;

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
          calories,
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
      setSuccessMsg('Profile and health calculations saved successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 pb-24 md:pb-12">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Profile & Health Calculations</h2>
          <p className="text-gray-600 text-sm mt-1">
            Configure your biometric details, activity level, and health history. We compute your BMI, BMR (Mifflin-St Jeor), and TDEE automatically.
          </p>
        </div>

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium">
            <Check className="w-5 h-5 shrink-0" /> {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="+1 (555) 000-0000"
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
              <Heart className="w-4 h-4 text-emerald-600" /> Health Record & Lab Values
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Health Conditions (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Type 2 Diabetes, Hypertension"
                  value={conditionsInput}
                  onChange={(e) => setConditionsInput(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Current Medications (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Metformin, Lisinopril"
                  value={medicationsInput}
                  onChange={(e) => setMedicationsInput(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Allergies (comma separated)</label>
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
                    placeholder="e.g. 6.5"
                    value={hba1c}
                    onChange={(e) => setHba1c(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Fasting Glucose</label>
                  <input
                    type="number"
                    placeholder="e.g. 110 mg/dL"
                    value={fastingGlucose}
                    onChange={(e) => setFastingGlucose(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl shadow-md transition flex items-center gap-2"
            >
              <Save className="w-5 h-5" /> Calculate & Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* Calculated Metrics Summary Card */}
      {userProfile && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 space-y-4">
          <h3 className="text-lg font-bold text-emerald-900">Calculated Metrics & Daily Targets</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
              <span className="text-xs text-gray-500 font-semibold uppercase">BMI</span>
              <div className="text-2xl font-black text-gray-900 mt-1">{userProfile.bmi}</div>
              <span className="text-[11px] text-emerald-700 font-medium">
                {userProfile.bmi < 18.5 ? 'Underweight' : userProfile.bmi < 25 ? 'Normal Weight' : userProfile.bmi < 30 ? 'Overweight' : 'Obese'}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
              <span className="text-xs text-gray-500 font-semibold uppercase">BMR</span>
              <div className="text-2xl font-black text-gray-900 mt-1">{userProfile.bmr} <span className="text-sm font-normal text-gray-500">kcal</span></div>
              <span className="text-[11px] text-emerald-700 font-medium">Basal Metabolic Rate</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
              <span className="text-xs text-gray-500 font-semibold uppercase">TDEE</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{userProfile.tdee} <span className="text-sm font-normal text-gray-500">kcal</span></div>
              <span className="text-[11px] text-emerald-700 font-medium">Daily Energy Expenditure</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
              <span className="text-xs text-gray-500 font-semibold uppercase">Calorie Target</span>
              <div className="text-2xl font-black text-gray-900 mt-1">{userProfile.targets.calories} <span className="text-sm font-normal text-gray-500">kcal</span></div>
              <span className="text-[11px] text-emerald-700 font-medium">Customized Target</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
