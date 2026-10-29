import React, { useState, useEffect } from 'react';

interface UserAccount {
  email: string;
  fullName: string;
  role: 'Admin' | 'User';
  password?: string;
  createdAt: string;
}

interface HomeDashboardProps {
  userProfile?: any;
  meals?: any[];
  reminders?: any[];
  pointsTotal?: number;
  setActiveTab?: (tab: string) => void;
  onAuthChange?: () => void;
}

const DEFAULT_ADMIN: UserAccount = {
  email: 'ngx7687@gmail.com',
  fullName: 'System Administrator',
  role: 'Admin',
  password: 'ngx7687',
  createdAt: '2026-03-01'
};

export function HomeDashboard({ setActiveTab, onAuthChange }: HomeDashboardProps) {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  
  // Auth view mode: 'signin' | 'signup' | 'reset'
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset'>('signin');

  // Form Fields
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Status & Feedback
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 8-Hour Inactivity Timeout Logic
  useEffect(() => {
    const INACTIVITY_LIMIT = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

    const checkInactivity = () => {
      const activeUser = localStorage.getItem('nutrinexus_current_user');
      if (!activeUser) return;

      const lastActive = localStorage.getItem('nutrinexus_last_activity');
      if (lastActive) {
        const elapsed = Date.now() - parseInt(lastActive, 10);
        if (elapsed > INACTIVITY_LIMIT) {
          // Time expired: Log out automatically
          localStorage.removeItem('nutrinexus_current_user');
          localStorage.removeItem('nutrinexus_last_activity');
          setCurrentUser(null);
          alert('Your session has expired due to 8 hours of inactivity. Please sign in again.');
          window.location.reload();
        }
      }
    };

    const updateActivity = () => {
      if (localStorage.getItem('nutrinexus_current_user')) {
        localStorage.setItem('nutrinexus_last_activity', Date.now().toString());
      }
    };

    // Initialize activity stamp on load if logged in
    if (localStorage.getItem('nutrinexus_current_user') && !localStorage.getItem('nutrinexus_last_activity')) {
      updateActivity();
    }

    // Event listeners for user activity
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);

    // Check inactivity every 60 seconds
    const interval = setInterval(checkInactivity, 60000);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      clearInterval(interval);
    };
  }, []);

  // Auto-seed admin and load active user
  const checkUserAndSeed = () => {
    // 1. Ensure admin account always exists in localStorage
    const rawUsers = localStorage.getItem('nutrinexus_users');
    let users: UserAccount[] = rawUsers ? JSON.parse(rawUsers) : [];

    const adminIndex = users.findIndex(
      (u) => u.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase()
    );

    if (adminIndex === -1) {
      users.push(DEFAULT_ADMIN);
      localStorage.setItem('nutrinexus_users', JSON.stringify(users));
    } else if (users[adminIndex].role !== 'Admin') {
      users[adminIndex].role = 'Admin';
      localStorage.setItem('nutrinexus_users', JSON.stringify(users));
    }

    // 2. Load current session
    const active = localStorage.getItem('nutrinexus_current_user');
    if (active) {
      try {
        setCurrentUser(JSON.parse(active));
      } catch {
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    checkUserAndSeed();
    window.addEventListener('storage', checkUserAndSeed);
    return () => window.removeEventListener('storage', checkUserAndSeed);
  }, []);

  const alphanumericRegex = /^[A-Za-z0-9]+$/;

  // 1. SIGN IN HANDLER
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const users: UserAccount[] = JSON.parse(localStorage.getItem('nutrinexus_users') || '[]');
    const cleanedEmail = email.trim().toLowerCase();

    const found = users.find((u) => u.email.trim().toLowerCase() === cleanedEmail);

    if (!found) {
      setError('Account not found with this email. Please check your credentials or sign up.');
      return;
    }

    if (found.password && found.password !== password) {
      setError('Incorrect password. Please try again or use Reset Password.');
      return;
    }

    if (!alphanumericRegex.test(password) || password.length < 6) {
      setError('Password must be at least 6 alphanumeric characters.');
      return;
    }

    localStorage.setItem('nutrinexus_current_user', JSON.stringify(found));
    localStorage.setItem('nutrinexus_last_activity', Date.now().toString());
    setCurrentUser(found);
    if (onAuthChange) onAuthChange();
    window.location.reload();
  };

  // 2. SIGN UP HANDLER
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }

    const cleanedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!alphanumericRegex.test(password) || password.length < 6) {
      setError('Password must be at least 6 alphanumeric characters (no symbols).');
      return;
    }

    const users: UserAccount[] = JSON.parse(localStorage.getItem('nutrinexus_users') || '[]');
    if (users.some((u) => u.email.toLowerCase() === cleanedEmail)) {
      setError('An account with this email already exists. Please sign in instead.');
      return;
    }

    const newUser: UserAccount = {
      email: cleanedEmail,
      fullName: fullName.trim(),
      role: cleanedEmail === DEFAULT_ADMIN.email.toLowerCase() ? 'Admin' : 'User',
      password: password,
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updated = [...users, newUser];
    localStorage.setItem('nutrinexus_users', JSON.stringify(updated));
    localStorage.setItem('nutrinexus_current_user', JSON.stringify(newUser));
    localStorage.setItem('nutrinexus_last_activity', Date.now().toString());

    // Pre-fill profile record
    const profile = JSON.parse(localStorage.getItem('nutrinexus_profile') || '{}');
    localStorage.setItem('nutrinexus_profile', JSON.stringify({
      ...profile,
      email: newUser.email,
      fullName: newUser.fullName
    }));

    setCurrentUser(newUser);
    if (onAuthChange) onAuthChange();
    window.location.reload();
  };

  // 3. PASSWORD RESET HANDLER
  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const cleanedEmail = email.trim().toLowerCase();
    if (!cleanedEmail) {
      setError('Please enter your registered email address.');
      return;
    }

    if (!alphanumericRegex.test(newPassword) || newPassword.length < 6) {
      setError('New password must be at least 6 alphanumeric characters.');
      return;
    }

    const users: UserAccount[] = JSON.parse(localStorage.getItem('nutrinexus_users') || '[]');
    const userIndex = users.findIndex((u) => u.email.toLowerCase() === cleanedEmail);

    if (userIndex === -1) {
      setError('No account found with this email.');
      return;
    }

    users[userIndex].password = newPassword;
    localStorage.setItem('nutrinexus_users', JSON.stringify(users));

    setSuccessMessage('Password successfully updated! You can now sign in with your new password.');
    setPassword('');
    setNewPassword('');
    setTimeout(() => {
      setAuthMode('signin');
      setSuccessMessage('');
    }, 2000);
  };

  // SIGN OUT HANDLER
  const handleSignOut = () => {
    localStorage.removeItem('nutrinexus_current_user');
    localStorage.removeItem('nutrinexus_last_activity');
    setCurrentUser(null);
    if (onAuthChange) onAuthChange();
    window.location.reload();
  };

  // -------------------------------------------------------------
  // NOT LOGGED IN: TABS FOR SIGN-IN, SIGN-UP, AND RESET PASSWORD
  // -------------------------------------------------------------
  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white rounded-2xl shadow-md border border-slate-100 space-y-6 my-10">
        <div className="text-center space-y-2">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
            NutriNexus V4
          </span>
          <h2 className="text-3xl font-bold text-slate-800">Welcome to Your Health Hub</h2>
          <p className="text-sm text-slate-500">
            Sign in to track meals, monitor glycemic health, and manage reminders.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => { setAuthMode('signin'); setError(''); setSuccessMessage(''); }}
            className={`flex-1 py-2 text-center text-sm font-semibold border-b-2 transition ${
              authMode === 'signin'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('signup'); setError(''); setSuccessMessage(''); }}
            className={`flex-1 py-2 text-center text-sm font-semibold border-b-2 transition ${
              authMode === 'signup'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('reset'); setError(''); setSuccessMessage(''); }}
            className={`flex-1 py-2 text-center text-sm font-semibold border-b-2 transition ${
              authMode === 'reset'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Reset Password
          </button>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}
        {successMessage && <div className="p-3 bg-emerald-50 text-emerald-800 text-sm rounded-lg border border-emerald-200">{successMessage}</div>}

        {/* SIGN IN VIEW */}
        {authMode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email Address</label>
              <input
                type="email"
                placeholder="e.g. user@nutrinexus.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Password</label>
              <input
                type="password"
                placeholder="Alphanumeric password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition shadow-sm"
            >
              Sign In
            </button>
          </form>
        )}

        {/* SIGN UP VIEW */}
        {authMode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Full Name</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 border rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email Address</label>
              <input
                type="email"
                placeholder="e.g. user@nutrinexus.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Password (Min 6 alphanumeric)</label>
              <input
                type="password"
                placeholder="Create alphanumeric password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition shadow-sm"
            >
              Create Account
            </button>
          </form>
        )}

        {/* RESET PASSWORD VIEW */}
        {authMode === 'reset' && (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Registered Email</label>
              <input
                type="email"
                placeholder="e.g. user@nutrinexus.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">New Password</label>
              <input
                type="password"
                placeholder="Enter new alphanumeric password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 border rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition shadow-sm"
            >
              Update Password
            </button>
          </form>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // LOGGED IN: PERSONALIZED DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 pb-24 md:pb-12">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">Active Session (8h Inactivity Timer)</span>
          <h2 className="text-2xl font-bold text-slate-800 mt-1">Welcome back, {currentUser.fullName || currentUser.email}!</h2>
          <p className="text-sm text-slate-500">Role: <strong className="text-slate-700">{currentUser.role}</strong></p>
        </div>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-semibold transition shadow-xs flex items-center gap-2"
        >
          🚪 Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => setActiveTab && setActiveTab('scan')} 
          className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:border-emerald-300 transition"
        >
          <span className="text-xs font-bold text-slate-400 uppercase">Quick Action</span>
          <h3 className="font-bold text-slate-800 text-lg mt-1">Scan a Meal</h3>
          <p className="text-xs text-slate-500 mt-1">Upload food photos to analyze calories, protein, and fiber instantly.</p>
        </div>
        <div 
          onClick={() => setActiveTab && setActiveTab('profile')} 
          className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:border-emerald-300 transition"
        >
          <span className="text-xs font-bold text-slate-400 uppercase">Health Tracker</span>
          <h3 className="font-bold text-slate-800 text-lg mt-1">Profile & Glycemic Goals</h3>
          <p className="text-xs text-slate-500 mt-1">Review your calculated TDEE, protein targets, and lab values.</p>
        </div>
        <div 
          onClick={() => setActiveTab && setActiveTab('reminders')} 
          className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:border-emerald-300 transition"
        >
          <span className="text-xs font-bold text-slate-400 uppercase">Reminders</span>
          <h3 className="font-bold text-slate-800 text-lg mt-1">Medication & Schedule</h3>
          <p className="text-xs text-slate-500 mt-1">Keep track of your daily dosages and health check-ups.</p>
        </div>
      </div>
    </div>
  );
}
