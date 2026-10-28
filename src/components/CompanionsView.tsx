import React, { useState } from 'react';
import { Companion } from '../types';
import { Users, Plus, ShieldCheck, AlertTriangle, Trash2, Mail, Phone } from 'lucide-react';

interface CompanionsViewProps {
  companions: Companion[];
  onAddCompanion: (companion: Omit<Companion, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  onDeleteCompanion: (companionId: string) => Promise<void>;
}

export const CompanionsView: React.FC<CompanionsViewProps> = ({
  companions,
  onAddCompanion,
  onDeleteCompanion,
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [relationship, setRelationship] = useState<string>('Family Member');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [shareReminders, setShareReminders] = useState<boolean>(true);
  const [shareHighGlycemicAlerts, setShareHighGlycemicAlerts] = useState<boolean>(true);
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setLoading(true);
    try {
      await onAddCompanion({
        name,
        relationship,
        phoneNumber,
        email,
        consentStatus: 'pending', // Verification link required
        shareReminders,
        shareHighGlycemicAlerts,
        gracePeriodMinutes,
      });
      setName('');
      setPhoneNumber('');
      setEmail('');
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
            <h2 className="text-2xl font-bold text-gray-900">Family Companions & Alerts</h2>
            <p className="text-gray-600 text-sm mt-1">Add trusted family members or caregivers who receive notifications if medication reminders are missed.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Add Companion
          </button>
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="bg-emerald-50/70 border border-emerald-200 p-6 rounded-2xl space-y-4 animate-fadeIn">
            <h3 className="text-lg font-bold text-gray-900">Add Family Companion</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Relationship</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spouse, Daughter, Doctor"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="companion@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Phone Number (WhatsApp / SMS)</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Grace Period (Minutes before alert)</label>
                <input
                  type="number"
                  value={gracePeriodMinutes}
                  onChange={(e) => setGracePeriodMinutes(Number(e.target.value))}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium"
                />
              </div>
              <div className="sm:col-span-2 flex flex-col gap-2 pt-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={shareReminders}
                    onChange={(e) => setShareReminders(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  Share medication and appointment reminders / missed alerts
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={shareHighGlycemicAlerts}
                    onChange={(e) => setShareHighGlycemicAlerts(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  Share high-glycemic meal scan alerts
                </label>
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
                  Send Consent Invitation
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Companions List */}
        {companions.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-800">No family companions added</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Add a family companion so they can be alerted if you miss scheduled medications or health checkups.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {companions.map((comp) => (
              <div key={comp.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900 text-base">{comp.name}</h4>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full">
                      {comp.relationship}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      comp.consentStatus === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {comp.consentStatus === 'confirmed' ? 'Consent Confirmed' : 'Consent Pending'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 flex items-center gap-4 pt-1">
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-gray-400" /> {comp.email}</span>
                    {comp.phoneNumber && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-gray-400" /> {comp.phoneNumber}</span>}
                  </div>
                  <div className="text-[11px] text-gray-500 pt-1">
                    Grace period: {comp.gracePeriodMinutes} mins • Reminders: {comp.shareReminders ? 'Yes' : 'No'} • Glycemic Alerts: {comp.shareHighGlycemicAlerts ? 'Yes' : 'No'}
                  </div>
                </div>
                <button
                  onClick={() => onDeleteCompanion(comp.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  title="Remove companion"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
