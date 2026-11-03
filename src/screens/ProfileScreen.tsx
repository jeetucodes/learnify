import React, { useEffect, useState } from 'react';
import {
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserAttempts } from '../lib/storage';
import { ProgressBar } from '../components/ProgressBar';
import {
  SugaryFlame,
  SugaryBolt,
  SugaryTarget,
  SugaryShield,
  SugaryTrophy,
  SugaryCalendar,
  SugaryClock,
} from '../components/SugaryIcons';
import type { Attempt } from '../types/database';

interface ProfileScreenProps {
  onNavigate: (route: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      getUserAttempts(user.id).then((att) => {
        setAttempts(att);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const totalQuestionsAnswered = attempts.length;
  const correctCount = attempts.filter((a) => a.correct).length;
  const accuracy =
    totalQuestionsAnswered > 0
      ? Math.round((correctCount / totalQuestionsAnswered) * 100)
      : 0;

  const userXp = user?.xp || 0;
  const currentLevel = Math.floor(userXp / 100) + 1;
  const xpInCurrentLevel = userXp % 100;

  const handleLogout = async () => {
    await logout();
    onNavigate('login');
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 text-[var(--dp-color-ink)]">
        <div className="w-10 h-10 rounded-full border-3 border-indigo-200 border-t-indigo-600 animate-spin mb-4"></div>
        <span className="text-sm font-bold text-slate-600">Loading student profile...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="bg-white border border-slate-200/80 shadow-xs p-8 rounded-3xl">
          <p className="text-sm font-bold text-slate-800">You are currently in guest mode</p>
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 mt-4 rounded-full text-sm font-bold cursor-pointer"
          >
            Sign In / Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 text-left">
      
      {/* Student Profile Card with 3D Sugary Shield */}
      <div className="bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/80 border border-indigo-100/90 shadow-[0_8px_24px_rgba(79,70,229,0.06)] p-6 sm:p-9 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          
          {/* Avatar frame */}
          <div className="w-20 h-20 rounded-3xl bg-white border border-indigo-200 p-1 flex items-center justify-center text-3xl font-bold text-indigo-700 shadow-xs overflow-hidden shrink-0">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              <SugaryShield size={50} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <span className="rounded-full bg-white border border-indigo-200 px-3 py-0.5 text-xs font-black text-indigo-700 shadow-xs">
                Level {currentLevel} Scholar
              </span>
              <span className="text-xs font-semibold text-slate-500">
                DBMS Specialization
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 truncate">
              {user.name}
            </h1>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-500 mt-1">
              <SugaryCalendar size={15} />
              <span>Member since {new Date(user.last_active).toLocaleDateString()}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Level Progress Bar */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-800">
            <span>Next Rank: Level {currentLevel + 1}</span>
            <span className="font-mono tabular-nums text-indigo-600 font-extrabold">
              {xpInCurrentLevel} / 100 XP
            </span>
          </div>
          <ProgressBar progress={xpInCurrentLevel} heightClass="h-2.5" />
        </div>
      </div>

      {/* 4 Crisp Metric Cards with 3D Sugary Icons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Streak */}
        <div className="bg-white border border-amber-200/70 shadow-xs p-4 rounded-2xl text-left">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 block">
            Streak
          </span>
          <div className="flex items-center gap-2 mt-1.5">
            <SugaryFlame size={24} />
            <span className="text-2xl font-black font-mono tabular-nums text-slate-900">
              {user.streak}d
            </span>
          </div>
        </div>

        {/* XP */}
        <div className="bg-white border border-indigo-200/70 shadow-xs p-4 rounded-2xl text-left">
          <span className="text-[11px] font-black uppercase tracking-wider text-indigo-800 block">
            Lifetime XP
          </span>
          <div className="flex items-center gap-2 mt-1.5">
            <SugaryBolt size={24} />
            <span className="text-2xl font-black font-mono tabular-nums text-slate-900">
              {user.xp}
            </span>
          </div>
        </div>

        {/* Questions Solved */}
        <div className="bg-white border border-emerald-200/70 shadow-xs p-4 rounded-2xl text-left">
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 block">
            Solved
          </span>
          <div className="flex items-center gap-2 mt-1.5">
            <SugaryTarget size={24} />
            <span className="text-2xl font-black font-mono tabular-nums text-slate-900">
              {totalQuestionsAnswered}
            </span>
          </div>
        </div>

        {/* Accuracy */}
        <div className="bg-white border border-purple-200/70 shadow-xs p-4 rounded-2xl text-left">
          <span className="text-[11px] font-black uppercase tracking-wider text-purple-800 block">
            Accuracy
          </span>
          <div className="flex items-center gap-2 mt-1.5">
            <SugaryTrophy size={24} />
            <span className="text-2xl font-black font-mono tabular-nums text-slate-900">
              {accuracy}%
            </span>
          </div>
        </div>

      </div>

      {/* Recent Activity History */}
      <div className="bg-white border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 sm:p-8 rounded-3xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <SugaryClock size={22} />
            <h3 className="text-lg font-bold text-slate-900">
              Recent Practice History
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Last {Math.min(attempts.length, 5)} attempts
          </span>
        </div>

        {attempts.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">
            No quiz attempts recorded yet. Start practicing to see your performance log!
          </p>
        ) : (
          <div className="space-y-2.5">
            {attempts.slice(0, 5).map((att) => (
              <div
                key={att.id}
                className="bg-slate-50/70 border border-slate-200/70 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-xs ${
                      att.correct
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {att.correct ? '✓' : '✕'}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Topic: {att.topic_id}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(att.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                    att.correct
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  {att.correct ? '+10 XP' : '+0 XP'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
