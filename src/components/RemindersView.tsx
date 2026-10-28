import React, { useState, useEffect } from 'react';
import { Reminder } from '../types';
import { Bell, Plus, CheckCircle, Clock, Trash2, AlertCircle } from 'lucide-react';

interface RemindersViewProps {
  reminders: Reminder[];
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  onUpdateReminderStatus: (reminderId: string, status: Reminder['status']) => Promise<void>;
  onDeleteReminder?: (reminderId: string) => Promise<void>;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  reminders: propReminders,
  onAddReminder,
  onUpdateReminderStatus,
  onDeleteReminder,
}) => {
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    if (propReminders && propReminders.length > 0) return propReminders;
    const saved = localStorage.getItem('nutrinexus_reminders');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        userId: 'guest',
        type: 'medication',
        title: 'Metformin 500mg',
        dateTime: '28/10/2026 03:00 PM',
        repeatRule: 'Daily',
        notes: 'Take with food',
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
    ];
  });

  useEffect(() => {
    if (propReminders && propReminders.length > 0) {
      setReminders(propReminders);
    }
  }, [propReminders]);

  useEffect(() => {
    localStorage.setItem('nutrinexus_reminders', JSON.stringify(reminders));
  }, [reminders]);

  const [isCreating, setIsCreating] = useState(false);
  const [type, setType] = useState('medication');
  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState('28/10/2026 03:00 PM');
  const [repeatRule, setRepeatRule] = useState('Once');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please fill out the title field.');
      return;
    }

    try {
      await onAddReminder({
        type: type as any,
        title: title.trim(),
        dateTime,
        repeatRule,
        notes: notes.trim(),
        status: 'pending',
      });

      const newReminder: Reminder = {
        id: Date.now().toString(),
        userId: 'guest',
        type: type as any,
        title: title.trim(),
        dateTime,
        repeatRule,
        notes: notes.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      setReminders([newReminder, ...reminders]);
      setTitle('');
      setNotes('');
      setError('');
      setIsCreating(false);
    } catch (err) {
      console.error(err);
      setError('Failed to save reminder');
    }
  };

  const handleDelete = async (id: string) => {
    if (onDeleteReminder) {
      await onDeleteReminder(id);
    }
    setReminders(reminders.filter(r => r.id !== id));
  };

  const toggleComplete = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'taken' || currentStatus === 'done' ? 'pending' : 'taken';
    if (onUpdateReminderStatus) {
      await onUpdateReminderStatus(id, newStatus);
    }
    setReminders(reminders.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 pb-24 md:pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Health & Medication Reminders</h2>
          <p className="text-sm text-slate-500">Manage your daily medications, appointments, and check-ups.</p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm"
          >
            + New Reminder
          </button>
        )}
      </div>

      {isCreating ? (
        <form onSubmit={handleSaveReminder} className="bg-white p-6 rounded-xl shadow-md space-y-4 border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Create New Reminder</h3>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full p-2.5 border rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="medication">Medication</option>
                <option value="appointment">Appointment</option>
                <option value="Blood Glucose Check">Blood Glucose Check</option>
                <option value="Exercise">Exercise</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Title *</label>
              <input
                type="text"
                placeholder="e.g. Metformin 500mg or Cardiologist"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setError(''); }}
                className="w-full p-2.5 border rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Date & Time</label>
              <input
                type="text"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full p-2.5 border rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Repeat Rule</label>
              <select
                value={repeatRule}
                onChange={(e) => setRepeatRule(e.target.value)}
                className="w-full p-2.5 border rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Once">Once</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Notes / Instructions</label>
            <input
              type="text"
              placeholder="e.g. Take with food"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 border rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition shadow-sm"
            >
              Save Reminder
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {reminders.length === 0 ? (
            <div className="bg-white p-10 rounded-xl shadow-sm text-center border border-slate-100">
              <p className="text-slate-500">No reminder records found. Click "+ New Reminder" to add one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {reminders.map((reminder) => {
                const isCompleted = reminder.status === 'taken' || reminder.status === 'done' || (reminder as any).completed;
                return (
                  <div 
                    key={reminder.id}
                    className={`p-4 bg-white rounded-xl shadow-sm border flex items-center justify-between transition ${isCompleted ? 'opacity-60 bg-slate-50' : 'border-slate-200'}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => toggleComplete(reminder.id, reminder.status)}
                        className="mt-1.5 h-4 w-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full capitalize">
                            {reminder.type}
                          </span>
                          <h4 className={`font-bold text-slate-800 ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                            {reminder.title}
                          </h4>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          🕒 {reminder.dateTime} • <span className="text-slate-500">{reminder.repeatRule}</span>
                        </p>
                        {reminder.notes && (
                          <p className="text-xs text-slate-500 mt-1 italic">Note: {reminder.notes}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(reminder.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
