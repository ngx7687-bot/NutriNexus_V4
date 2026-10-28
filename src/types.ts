export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  age: number;
  sex: 'male' | 'female' | 'other';
  weightKg: number;
  heightCm: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active';
  contactNumber: string;
  bmi: number;
  bmr: number;
  tdee: number;
  targets: {
    calories: number;
    carbsG: number;
    proteinG: number;
    fatG: number;
    fiberG: number;
    sugarG: number;
  };
  updatedAt: string;
}

export interface HealthRecord {
  conditions: string[];
  medications: string[];
  allergies: string[];
  hba1c?: number;
  fastingGlucose?: number;
  updatedAt: string;
}

export interface FoodItem {
  name: string;
  portion_g: number;
  calories: number;
  carbs_g: number;
  fiber_g: number;
  sugar_g: number;
  protein_g: number;
  fat_g: number;
  estimated_gi: number;
}

export interface Meal {
  id: string;
  userId: string;
  foods: FoodItem[];
  glycemicLoad: number;
  glycemicImpact: 'low' | 'medium' | 'high';
  confidence: number;
  notes: string;
  nutritionScore?: number;
  tip?: string;
  timestamp: string;
}

export interface PointEntry {
  id: string;
  userId: string;
  points: number;
  reason: string;
  timestamp: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  badgeIcon: string;
  unlockedAt: string;
}

export interface Reminder {
  id: string;
  userId: string;
  type: 'medication' | 'appointment' | 'other';
  title: string;
  notes: string;
  dateTime: string;
  repeatRule: string;
  status: 'pending' | 'taken' | 'done' | 'snoozed' | 'skipped';
  createdAt: string;
}

export interface ReminderLog {
  id: string;
  reminderId: string;
  action: 'taken' | 'done' | 'snoozed' | 'skipped' | 'missed';
  timestamp: string;
}

export interface Companion {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  email: string;
  consentStatus: 'pending' | 'confirmed';
  shareReminders: boolean;
  shareHighGlycemicAlerts: boolean;
  gracePeriodMinutes: number;
  createdAt: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}
