import React, { useState, useEffect } from 'react';

interface UserAccount {
  email: string;
  fullName: string;
  role: string;
  createdAt?: string;
}

interface HomeDashboardProps {
  userProfile?: any;
  meals?: any[];
  reminders?: any[];
  pointsTotal?: number;
  setActiveTab?: (tab: string) => void;
  onAuthChange?: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ setActiveTab, onAuthChange }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [error, setError] = useState('');

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

  const checkUser = () => {
    const active = localStorage.getItem('nutrinexus_current_user');
    if (active) {
      try {
        setCurrentUser(JSON.parse(active));
      } catch (e) {
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
  };

  const ADMIN_ACCOUNT: UserAccount = {
    email: 'ngx7687@gmail.com',
    fullName: 'System Administrator',
    role: 'Admin',
    createdAt: '2026-03-01'
  };

  useEffect(() => {
    // 1. Ensure ngx7687@gmail.com always exists in local storage
    const rawUsers = localStorage.getItem('nutrinexus_users');
    let currentUsers: UserAccount[] = rawUsers ? JSON.parse(rawUsers) : [];

    const adminExists = currentUsers.some(
      (u) => u.email.toLowerCase() === ADMIN_ACCOUNT.email.toLowerCase()
    );

    if (!adminExists) {
      currentUsers = [ADMIN_ACCOUNT, ...currentUsers.filter(u => u.email !== ADMIN_ACCOUNT.email)];
      localStorage.setItem('nutrinexus_users', JSON.stringify(currentUsers));
    }

    // 2. Check active session
    checkUser();
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);

  // Sign-in handler
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const users = JSON.parse(localStorage.getItem('nutrinexus_users') || '[]');
    const found = users.find((u: any) => u.email === email);

    if (!found) {
      setError('Account not found with this email. Please check your credentials or sign up.');
      return;
    }

    const alphanumericRegex = /^[A-Za-z0-9]+$/;
    if (!alphanumericRegex.test(password) || password.length < 6) {
      setError('Invalid password format.');
      return;
    }

    localStorage.setItem('nutrinexus_current_user', JSON.stringify(found));
    localStorage.setItem('nutrinexus_last_activity', Date.now().toString());
    setCurrentUser(found);
    if (onAuthChange) onAuthChange();
    window.location.reload();
  };

  // Sign-out handler
  const handleSignOut = () => {
    localStorage.removeItem('nutrinexus_current_user');
    localStorage.removeItem('nutrinexus_last_activity');
    setCurrentUser(null);
    if (onAuthChange) onAuthChange();
    window.location.reload();
  };

  // Forgot Password handler
  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetMessage('Please enter your registered email address.');
      return;
    }

    const users = JSON.parse(localStorage.getItem('nutrinexus_users') || '[]');
    const exists = users.some((u: any) => u.email === resetEmail);

    if (exists) {
      setResetMessage(`Password reset instructions have been sent to ${resetEmail}.`);
    } else {
      setResetMessage('Email not found in registered accounts.');
    }
  };

  // IF LOGGED OUT: Show Sign-In & Forgot Password
  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6 my-10">
        <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-100 space-y-6">
          <div className="text-center space-y-2">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">NutriNexus V4</span>
            <h2 className="text-3xl font-bold text-slate-800">Welcome to Your Health Hub</h2>
            <p className="text-sm text-slate-500">Sign in to track meals, monitor glycemic health, and manage reminders.</p>
          </div>

          {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}

          {!isForgotPassword ? (
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

              <div className="flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(true); setResetMessage(''); }}
                  className="text-emerald-600 hover:underline font-medium"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition shadow-sm"
              >
                Sign In
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="text-center">
                <h3 className="font-bold text-slate-800 text-lg">Reset Your Password</h3>
                <p className="text-xs text-slate-500">Enter your email to receive recovery steps.</p>
              </div>

              {resetMessage && <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200">{resetMessage}</div>}

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Registered Email</label>
                <input
                  type="email"
                  placeholder="e.g. user@nutrinexus.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full p-3 border rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="w-1/2 py-2.5 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition"
                >
                  Back to Sign In
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg text-sm font-medium hover:bg-emerald-700 transition shadow-sm"
                >
                  Send Reset Link
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // IF LOGGED IN: Show Personalized Dashboard with Sign Out button
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
};
