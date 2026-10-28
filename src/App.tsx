import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, setDoc, getDocs, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { auth, db, loginWithGoogle, logoutUser, handleFirestoreError } from './firebase';
import { UserProfile, HealthRecord, Meal, PointEntry, Reward, Reminder, Companion, OperationType } from './types';
import { Navbar } from './components/Navbar';
import { HomeDashboard } from './components/HomeDashboard';
import { ScanMeal } from './components/ScanMeal';
import { MealsHistory } from './components/MealsHistory';
import { RemindersView } from './components/RemindersView';
import { CompanionsView } from './components/CompanionsView';
import { RewardsView } from './components/RewardsView';
import { ProfileOnboarding } from './components/ProfileOnboarding';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('home');

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [healthRecord, setHealthRecord] = useState<HealthRecord | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [pointsLedger, setPointsLedger] = useState<PointEntry[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      if (firebaseUser) {
        await loadUserData(firebaseUser.uid);
      } else {
        // Load default mock or guest data if desired
        setUserProfile(null);
        setHealthRecord(null);
        setMeals([]);
        setReminders([]);
        setCompanions([]);
        setPointsLedger([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadUserData = async (uid: string) => {
    try {
      // 1. User Profile
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef).catch(err => {
        handleFirestoreError(err, OperationType.GET, `users/${uid}`);
        return null;
      });
      if (userSnap && userSnap.exists()) {
        setUserProfile(userSnap.data() as UserProfile);
      }

      // 2. Health Record
      const healthRef = doc(db, 'users', uid, 'healthRecord', 'primary');
      const healthSnap = await getDoc(healthRef).catch(() => null);
      if (healthSnap && healthSnap.exists()) {
        setHealthRecord(healthSnap.data() as HealthRecord);
      }

      // 3. Meals
      const mealsSnap = await getDocs(collection(db, 'users', uid, 'meals')).catch(() => ({ docs: [] }));
      const loadedMeals: Meal[] = mealsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Meal));
      setMeals(loadedMeals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

      // 4. Reminders
      const remindersSnap = await getDocs(collection(db, 'users', uid, 'reminders')).catch(() => ({ docs: [] }));
      setReminders(remindersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Reminder)));

      // 5. Companions
      const compSnap = await getDocs(collection(db, 'users', uid, 'companions')).catch(() => ({ docs: [] }));
      setCompanions(compSnap.docs.map(d => ({ id: d.id, ...d.data() } as Companion)));

      // 6. Points
      const pointsSnap = await getDocs(collection(db, 'users', uid, 'points')).catch(() => ({ docs: [] }));
      setPointsLedger(pointsSnap.docs.map(d => ({ id: d.id, ...d.data() } as PointEntry)));

    } catch (err) {
      console.error("Error loading user data:", err);
    }
  };

  // Award points helper
  const awardPoints = async (uid: string, points: number, reason: string) => {
    try {
      const pointEntry: Omit<PointEntry, 'id'> = {
        userId: uid,
        points,
        reason,
        timestamp: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, 'users', uid, 'points'), pointEntry);
      const newEntry: PointEntry = { id: docRef.id, ...pointEntry };
      setPointsLedger(prev => [newEntry, ...prev]);
    } catch (err) {
      console.error("Award points error:", err);
    }
  };

  // Save profile and health record
  const handleSaveProfile = async (profile: UserProfile, health: HealthRecord) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), profile);
      await setDoc(doc(db, 'users', user.uid, 'healthRecord', 'primary'), health);
      setUserProfile(profile);
      setHealthRecord(health);
      await awardPoints(user.uid, 50, 'Completed Profile Setup');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  // Save meal
  const handleSaveMeal = async (mealData: Omit<Meal, 'id'>) => {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'meals'), mealData);
      const newMeal: Meal = { id: docRef.id, ...mealData };
      setMeals(prev => [newMeal, ...prev]);
      const pts = mealData.glycemicImpact === 'low' ? 30 : 15;
      await awardPoints(user.uid, pts, `Logged Meal (${mealData.glycemicImpact} Glycemic Impact)`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/meals`);
    }
  };

  // Delete meal
  const handleDeleteMeal = async (mealId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'meals', mealId));
      setMeals(prev => prev.filter(m => m.id !== mealId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/meals/${mealId}`);
    }
  };

  // Add reminder
  const handleAddReminder = async (reminderData: Omit<Reminder, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    try {
      const fullData = {
        ...reminderData,
        userId: user.uid,
        createdAt: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, 'users', user.uid, 'reminders'), fullData);
      const newRem: Reminder = { id: docRef.id, ...fullData };
      setReminders(prev => [...prev, newRem]);
      await awardPoints(user.uid, 10, 'Created Health Reminder');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/reminders`);
    }
  };

  // Update reminder status
  const handleUpdateReminderStatus = async (reminderId: string, status: Reminder['status']) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'reminders', reminderId), { status });
      setReminders(prev => prev.map(r => r.id === reminderId ? { ...r, status } : r));
      if (status === 'taken' || status === 'done') {
        await awardPoints(user.uid, 20, 'Completed Medication / Reminder On Time');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/reminders/${reminderId}`);
    }
  };

  // Add companion
  const handleAddCompanion = async (compData: Omit<Companion, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    try {
      const fullData = {
        ...compData,
        userId: user.uid,
        createdAt: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, 'users', user.uid, 'companions'), fullData);
      const newComp: Companion = { id: docRef.id, ...fullData };
      setCompanions(prev => [...prev, newComp]);
      await awardPoints(user.uid, 25, 'Added Family Companion');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/companions`);
    }
  };

  // Delete companion
  const handleDeleteCompanion = async (companionId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'companions', companionId));
      setCompanions(prev => prev.filter(c => c.id !== companionId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/companions/${companionId}`);
    }
  };

  const pointsTotal = pointsLedger.reduce((sum, p) => sum + p.points, 0);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        userProfile={userProfile}
        onLogin={loginWithGoogle}
        onLogout={logoutUser}
      />

      <main className="flex-1">
        {activeTab === 'home' && (
          <HomeDashboard
            userProfile={userProfile}
            meals={meals}
            reminders={reminders}
            pointsTotal={pointsTotal}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'scan' && (
          <ScanMeal
            userProfile={userProfile}
            onSaveMeal={handleSaveMeal}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'meals' && (
          <MealsHistory
            meals={meals}
            onDeleteMeal={handleDeleteMeal}
          />
        )}
        {activeTab === 'reminders' && (
          <RemindersView
            reminders={reminders}
            onAddReminder={handleAddReminder}
            onUpdateReminderStatus={handleUpdateReminderStatus}
          />
        )}
        {activeTab === 'companions' && (
          <CompanionsView
            companions={companions}
            onAddCompanion={handleAddCompanion}
            onDeleteCompanion={handleDeleteCompanion}
          />
        )}
        {activeTab === 'rewards' && (
          <RewardsView
            pointsTotal={pointsTotal}
            pointsLedger={pointsLedger}
            rewards={rewards}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileOnboarding
            user={user}
            userProfile={userProfile}
            healthRecord={healthRecord}
            onSaveProfile={handleSaveProfile}
          />
        )}
      </main>

      {/* Footer Disclaimer */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500 hidden md:block">
        <p className="max-w-3xl mx-auto px-4">
          NutriNexus provides general estimates and wellness guidance, not medical advice. Consult your doctor for medical decisions.
        </p>
      </footer>
    </div>
  );
}
