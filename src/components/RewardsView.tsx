import React from 'react';
import { PointEntry, Reward } from '../types';
import { Trophy, Award, Star, Clock } from 'lucide-react';

interface RewardsViewProps {
  pointsTotal: number;
  pointsLedger: PointEntry[];
  rewards: Reward[];
}

export const RewardsView: React.FC<RewardsViewProps> = ({
  pointsTotal,
  pointsLedger,
  rewards,
}) => {
  const nextTierPoints = pointsTotal < 100 ? 100 : pointsTotal < 300 ? 300 : pointsTotal < 600 ? 600 : 1000;
  const rewardProgress = Math.min(100, Math.round((pointsTotal / nextTierPoints) * 100));

  const badges = [
    { title: 'Consistency Champion', threshold: 100, icon: '🔥', unlocked: pointsTotal >= 100 },
    { title: 'Glycemic Guardian', threshold: 300, icon: '🛡️', unlocked: pointsTotal >= 300 },
    { title: 'Nutrition Master', threshold: 600, icon: '🥗', unlocked: pointsTotal >= 600 },
    { title: 'Wellness Legend', threshold: 1000, icon: '👑', unlocked: pointsTotal >= 1000 },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 pb-24 md:pb-12">
      {/* Rewards Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-amber-400/30 text-amber-100 px-3 py-1 rounded-full text-xs font-medium">
            <Trophy className="w-3.5 h-3.5 text-amber-200" /> Rewards & Achievement Tiers
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">Your Wellness Rewards</h2>
          <p className="text-amber-100 text-sm max-w-md">
            Earn points for logging meals, maintaining low glycemic impact, taking medication on time, and keeping daily streaks.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center min-w-[180px]">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-100">Total Points</div>
          <div className="text-4xl font-black text-white mt-1">{pointsTotal}</div>
        </div>
      </div>

      {/* Progress & Badges */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" /> Badge Tiers & Level Progress
          </h3>
          <span className="text-xs text-gray-500 font-medium">{pointsTotal} / {nextTierPoints} pts to next tier</span>
        </div>

        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
          <div
            className="bg-amber-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${rewardProgress}%` }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          {badges.map((badge, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl border flex flex-col items-center text-center transition ${
                badge.unlocked
                  ? 'bg-amber-50/60 border-amber-200 shadow-xs'
                  : 'bg-gray-50 border-gray-200 opacity-60 grayscale'
              }`}
            >
              <div className="text-4xl mb-3">{badge.icon}</div>
              <h4 className="font-bold text-gray-900 text-sm">{badge.title}</h4>
              <span className="text-xs text-amber-700 font-semibold mt-1">{badge.threshold} pts</span>
              <span className={`text-[10px] font-bold uppercase mt-2 px-2 py-0.5 rounded-full ${
                badge.unlocked ? 'bg-amber-200 text-amber-900' : 'bg-gray-200 text-gray-600'
              }`}>
                {badge.unlocked ? 'Unlocked' : 'Locked'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Points Ledger */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500" /> Points Ledger History
        </h3>

        {pointsLedger.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            No points recorded yet. Log meals or complete reminders to earn points!
          </div>
        ) : (
          <div className="space-y-3">
            {pointsLedger.map((entry) => (
              <div key={entry.id} className="bg-gray-50 border border-gray-100 p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <div className="font-semibold text-gray-800 text-sm">{entry.reason}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5" /> {new Date(entry.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="text-emerald-700 font-bold text-base bg-emerald-100 px-3 py-1 rounded-xl">
                  +{entry.points} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
