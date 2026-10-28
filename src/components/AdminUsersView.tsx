import React, { useState, useEffect } from 'react';

interface UserAccount {
  email: string;
  fullName: string;
  role: 'Admin' | 'User';
  createdAt: string;
}

export default function AdminUsersView() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [error, setError] = useState<string>('');

  // Load registered users from localStorage
  const loadUsers = () => {
    const savedUsers = localStorage.getItem('nutrinexus_users');
    if (savedUsers) {
      try {
        setUsers(JSON.parse(savedUsers));
      } catch (e) {
        console.error('Failed to parse users database', e);
      }
    } else {
      // Default fallback users if none exist
      const defaultUsers: UserAccount[] = [
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
      setUsers(defaultUsers);
      localStorage.setItem('nutrinexus_users', JSON.stringify(defaultUsers));
    }
  };

  useEffect(() => {
    loadUsers();
    window.addEventListener('storage', loadUsers);
    return () => window.removeEventListener('storage', loadUsers);
  }, []);

  const handleRemoveUser = (emailToRemove: string) => {
    const currentUser = JSON.parse(localStorage.getItem('nutrinexus_current_user') || '{}');
    
    if (emailToRemove === currentUser.email) {
      setError('You cannot delete your own active admin account.');
      return;
    }

    const updatedUsers = users.filter(u => u.email !== emailToRemove);
    setUsers(updatedUsers);
    localStorage.setItem('nutrinexus_users', JSON.stringify(updatedUsers));
    setError('');
    
    if (selectedUser?.email === emailToRemove) {
      setSelectedUser(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 pb-24 md:pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">Admin Security Portal</span>
          <h2 className="text-2xl font-bold text-slate-800 mt-1">User Directory & Details</h2>
          <p className="text-sm text-slate-500">View and manage all registered user accounts in NutriNexus.</p>
        </div>
        <div className="px-4 py-2 bg-slate-50 border rounded-lg text-center">
          <span className="text-xs text-slate-400 block font-semibold uppercase">Total Users</span>
          <span className="text-xl font-bold text-slate-800">{users.length}</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="p-4">User Name & Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {users.map((user) => (
                <tr key={user.email} className="hover:bg-slate-50/80 transition">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{user.fullName || 'Unnamed User'}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      user.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 text-xs">{user.createdAt || 'N/A'}</td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
                    >
                      View Details
                    </button>
                    {user.role !== 'Admin' && (
                      <button
                        onClick={() => handleRemoveUser(user.email)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full p-6 rounded-2xl shadow-xl space-y-4 border border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase">User Profile Details</span>
                <h3 className="text-xl font-bold text-slate-800">{selectedUser.fullName}</h3>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border text-sm">
              <div>
                <span className="text-xs text-slate-400 block font-semibold uppercase">Email Username</span>
                <span className="text-slate-800 font-medium">{selectedUser.email}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-semibold uppercase">Account Role</span>
                <span className={selectedUser.role === 'Admin' ? 'text-purple-600 font-bold' : 'text-emerald-700 font-semibold'}>
                  {selectedUser.role}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-semibold uppercase">Registration Date</span>
                <span className="text-slate-700">{selectedUser.createdAt || 'N/A'}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
