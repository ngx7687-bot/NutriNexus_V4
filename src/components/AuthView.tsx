import React, { useState, useEffect } from 'react';
import AdminUsersView from './AdminUsersView';

interface UserAccount {
  email: string;
  fullName: string;
  role: 'Admin' | 'User';
  createdAt: string;
}

interface AuthViewProps {
  onLoginSuccess?: (user: UserAccount) => void;
  onGoogleLogin?: () => void;
  currentUserState?: any;
  onLogoutState?: () => void;
}

export default function AuthView({ onLoginSuccess, onGoogleLogin, currentUserState, onLogoutState }: AuthViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('nutrinexus_users');
    return saved ? JSON.parse(saved) : [
      { 
        email: 'ngx7687@gmail.com', 
        fullName: 'System Administrator', 
        role: 'Admin', 
        createdAt: '2026-01-01' 
      },
      { 
        email: 'admin@nutrinexus.com', 
        fullName: 'System Admin', 
        role: 'Admin', 
        createdAt: '2026-01-01' 
      },
      { 
        email: 'user@nutrinexus.com', 
        fullName: 'John Doe', 
        role: 'User', 
        createdAt: '2026-02-15' 
      }
    ];
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    if (currentUserState) return { email: currentUserState.email, fullName: currentUserState.displayName || 'User', role: currentUserState.email?.includes('admin') ? 'Admin' : 'User', createdAt: '2026-01-01' };
    const active = localStorage.getItem('nutrinexus_current_user');
    return active ? JSON.parse(active) : null;
  });

  useEffect(() => {
    localStorage.setItem('nutrinexus_users', JSON.stringify(users));
  }, [users]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const alphanumericRegex = /^[A-Za-z0-9]+$/;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address for your username.');
      return;
    }

    if (isSignUp && !fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!alphanumericRegex.test(password) || password.length < 6) {
      setError('Password must be at least 6 characters long and contain numbers and alphabets only (no special characters).');
      return;
    }

    if (isSignUp) {
      if (users.some(u => u.email === email)) {
        setError('An account with this email already exists.');
        return;
      }

      const newUser: UserAccount = {
        email,
        fullName: fullName.trim(),
        role: email.includes('admin') ? 'Admin' : 'User',
        createdAt: new Date().toISOString().split('T')[0]
      };

      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      setCurrentUser(newUser);
      localStorage.setItem('nutrinexus_current_user', JSON.stringify(newUser));

      const existingProfile = JSON.parse(localStorage.getItem('nutrinexus_profile') || '{}');
      localStorage.setItem('nutrinexus_profile', JSON.stringify({
        ...existingProfile,
        email: newUser.email,
        fullName: newUser.fullName
      }));

      if (onLoginSuccess) onLoginSuccess(newUser);
    } else {
      const foundUser = users.find(u => u.email === email);
      if (!foundUser) {
        setError('Account not found. Please sign up first.');
        return;
      }

      setCurrentUser(foundUser);
      localStorage.setItem('nutrinexus_current_user', JSON.stringify(foundUser));
      if (onLoginSuccess) onLoginSuccess(foundUser);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('nutrinexus_current_user');
    if (onLogoutState) onLogoutState();
    window.location.reload();
  };

  if (currentUser?.role === 'Admin') {
    return (
      <div className="space-y-4">
        <div className="max-w-5xl mx-auto px-4 pt-4 flex justify-end">
          <button onClick={handleLogout} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition">
            Logout ({currentUser.email})
          </button>
        </div>
        <AdminUsersView />
      </div>
    );
  }

  if (currentUser?.role === 'User') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md text-center space-y-4 my-12">
        <h2 className="text-xl font-bold text-slate-800">Welcome, {currentUser.fullName || currentUser.email}</h2>
        <p className="text-sm text-slate-500">You are logged in as a standard User.</p>
        <button
          onClick={handleLogout}
          className="w-full py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded-xl shadow-md space-y-6 border border-slate-100 my-12">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800">{isSignUp ? 'Create an Account' : 'Sign In to NutriNexus'}</h2>
        <p className="text-sm text-slate-500 mt-1">Use your email address and alphanumeric password</p>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Full Name</label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-3 border rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
              required={isSignUp}
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email Username</label>
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
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Password (Letters & Numbers Only)</label>
          <input
            type="password"
            placeholder="e.g. Password123"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
            required
          />
          <p className="text-xs text-slate-400 mt-1">Must be alphanumeric only (no symbols or special characters).</p>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition shadow-sm"
        >
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>

      {onGoogleLogin && (
        <button
          onClick={onGoogleLogin}
          className="w-full py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition shadow-xs flex items-center justify-center gap-2"
        >
          <span>Sign In with Google</span>
        </button>
      )}

      <div className="text-center pt-2">
        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
          className="text-sm text-emerald-600 hover:underline font-medium"
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}
