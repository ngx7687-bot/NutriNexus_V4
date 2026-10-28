import React from 'react';
import { Home, Camera, Utensils, Bell, Trophy, User as UserIcon, LogOut, ShieldAlert } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  userProfile: UserProfile | null;
  onLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  userProfile,
  onLogin,
  onLogout,
}) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'scan', label: 'Scan Meal', icon: Camera },
    { id: 'meals', label: 'Meals', icon: Utensils },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'rewards', label: 'Rewards', icon: Trophy },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      {/* Medical Disclaimer Banner */}
      <div className="bg-emerald-900 text-emerald-50 px-4 py-1 text-xs text-center font-medium flex items-center justify-center gap-2">
        <ShieldAlert className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
        <span>NutriNexus provides general estimates and wellness guidance, not medical advice. Consult your doctor for medical decisions.</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-md text-lg">
            NN
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-none">NutriNexus</h1>
            <span className="text-xs text-emerald-600 font-semibold tracking-wide">AI HEALTH COMPANION</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Auth Section */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-semibold text-gray-800">{userProfile?.name || user.displayName || 'User'}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-9 h-9 rounded-full border-2 border-emerald-500 shadow-xs" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  {(userProfile?.name || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <button
                onClick={onLogout}
                title="Sign out"
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-xl text-sm shadow-sm transition flex items-center gap-2"
            >
              Sign In with Google
            </button>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-3 flex justify-around items-center z-50 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg transition ${
                isActive ? 'text-emerald-600 font-semibold' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
              <span className="text-[10px] mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
