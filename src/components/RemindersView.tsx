import React, { useState } from 'react';
import { Reminder } from '../types';
import { Bell, Plus, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface RemindersViewProps {
  reminders: Reminder[];
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  onUpdateReminderStatus: (reminderId: string, status: Reminder['status']) => Promise<void>;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  reminders,
  onAddReminder,
  onUpdateReminderStatus,
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [type, setType] = useState<Reminder['type']>('medication');
  const [title, setTitle] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [dateTime, setDateTime] = useState<string>(
    new Date(Date.now() + 3600000).toISOString().slice(0, 16)
  );
  const [repeatRule, setRepeatRule] = useState<string>('Daily');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setLoading(true);
    try {
      await onAddReminder({
        type,
        title,
        notes,
        dateTime,
        repeatRule,
        status: 'pending',
      });
      setTitle('');
      setNotes('');
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 pb-24 md:pb-12">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Health & Medication Reminders</h2>
            <p className="text-gray-600 text-sm mt-1">Never miss a dose or doctor appointment. Log your responses instantly.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Add Reminder
          </button>
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="bg-emerald-50/70 border border-emerald-200 p-6 rounded-2xl space-y-4 animate-fadeIn">
            <h3 className="text-lg font-bold text-gray-900">Create New Reminder</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium"
                >
                  <option value="medication">Medication</option>
                  <option value="appointment">Doctor Appointment</option>
                  <option value="other">Other Health Check</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metformin 500mg or Cardiologist"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Repeat Rule</label>
                <select
                  value={repeatRule}
                  onChange={(e) => setRepeatRule(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium"
                >
                  <option value="Once">Once</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Notes / Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Take with food"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-xl text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl text-sm font-semibold shadow-md transition"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reminders List */}
        {reminders.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-800">No reminders created</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Add your medications or doctor appointments to stay on track and notify your family companions if needed.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reminders.map((reminder) => {
              const timeFormatted = new Date(reminder.dateTime).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={reminder.id}
                  className={`border rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition ${
                    reminder.status === 'taken' || reminder.status === 'done'
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : reminder.status === 'skipped'
                      ? 'bg-gray-50 border-gray-200 opacity-75'
                      : 'bg-white border-gray-200 shadow-xs'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        reminder.type === 'medication'
                          ? 'bg-blue-100 text-blue-800'
                          : reminder.type === 'appointment'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {reminder.type}
                      </span>
                      <span className="text-xs text-gray-500">• {reminder.repeatRule}</span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-base">{reminder.title}</h4>
                    <p className="text-xs text-gray-600">{reminder.notes || 'No instructions provided.'}</p>
                    <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1 pt-1">
                      <Clock className="w-3.5 h-3.5" /> Due: {timeFormatted}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {reminder.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => onUpdateReminderStatus(reminder.id, reminder.type === 'medication' ? 'taken' : 'done')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center gap-1 shadow-xs"
                        >
                          <CheckCircle className="w-4 h-4" /> {reminder.type === 'medication' ? 'Take' : 'Done'}
                        </button>
                        <button
                          onClick={() => onUpdateReminderStatus(reminder.id, 'snoozed')}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold px-3.5 py-2 rounded-xl transition"
                        >
                          Snooze
                        </button>
                        <button
                          onClick={() => onUpdateReminderStatus(reminder.id, 'skipped')}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-2 rounded-xl transition"
                        >
                          Skip
                        </button>
                      </>
                    ) : (
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-xl capitalize ${
                        reminder.status === 'taken' || reminder.status === 'done'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        Status: {reminder.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
