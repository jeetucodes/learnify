import React, { useEffect, useState } from 'react';
import {
  Zap,
  Flame,
  Trophy,
  CheckCircle2,
  LogOut,
  History,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserAttempts } from '../lib/storage';
import { ProgressBar } from '../components/ProgressBar';
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
      <div className="flex flex-col justify-center items-center py-24 text-[var(--dp-color-ink)] font-clay">
        <div className="w-10 h-10 rounded-full border-3 border-[var(--dp-color-surface-support)] border-t-[var(--dp-color-primary-action)] animate-spin mb-4"></div>
        <span className="text-sm font-bold">Loading student profile...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4 font-clay">
        <div className="clay-tray-cream p-8 rounded-3xl">
          <p className="text-sm font-bold text-[var(--dp-color-ink)]">You are currently in guest mode</p>
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="clay-btn-primary px-6 py-2.5 mt-4 text-sm font-bold clay-focus cursor-pointer"
          >
            Sign In / Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 text-left font-clay">
      
      {/* Student Profile Card (Violet Cushion) */}
      <div className="clay-cushion-violet p-6 sm:p-10 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          
          {/* Avatar frame */}
          <div className="w-20 h-20 rounded-3xl bg-[#FFFDF7] p-1 flex items-center justify-center text-3xl font-bold text-[var(--dp-color-primary-action)] shadow-md overflow-hidden shrink-0">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <span className="rounded-full bg-[#FFFDF7] px-3 py-0.5 text-xs font-bold text-[var(--dp-color-primary-action)] shadow-xs">
                Level {currentLevel} Scholar
              </span>
              <span className="text-xs font-bold text-[var(--dp-color-ink-secondary)]">
                DBMS Specialization
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--dp-color-ink)] truncate">
              {user.name}
            </h1>
            <p className="text-xs text-[var(--dp-color-ink-secondary)] mt-0.5">
              Member since {new Date(user.last_active).toLocaleDateString()}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="clay-btn-secondary px-4 py-2 text-xs font-bold flex items-center gap-1.5 clay-focus cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Level Progress Bar */}
        <div className="clay-cushion-cream p-4 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-[var(--dp-color-ink)]">
            <span>Next Rank: Level {currentLevel + 1}</span>
            <span className="font-mono tabular-nums text-[var(--dp-color-primary-action)]">
              {xpInCurrentLevel} / 100 XP
            </span>
          </div>
          <ProgressBar progress={xpInCurrentLevel} heightClass="h-2.5" />
        </div>
      </div>

      {/* 4 Tactile Metric Cushions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Streak */}
        <div className="clay-cushion-yellow p-4 rounded-2xl text-left">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--dp-color-ink-secondary)] block">
            Streak
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <Flame className="w-5 h-5 text-[#D97706] fill-[#D97706]" />
            <span className="text-2xl font-extrabold font-mono tabular-nums text-[var(--dp-color-ink)]">
              {user.streak}d
            </span>
          </div>
        </div>

        {/* XP */}
        <div className="clay-cushion-cream p-4 rounded-2xl text-left">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--dp-color-ink-secondary)] block">
            Lifetime XP
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <Zap className="w-5 h-5 text-[var(--dp-color-primary-action)]" />
            <span className="text-2xl font-extrabold font-mono tabular-nums text-[var(--dp-color-ink)]">
              {user.xp}
            </span>
          </div>
        </div>

        {/* Questions Solved */}
        <div className="clay-cushion-blue p-4 rounded-2xl text-left">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--dp-color-ink-secondary)] block">
            Solved
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <CheckCircle2 className="w-5 h-5 text-[var(--dp-color-primary-action)]" />
            <span className="text-2xl font-extrabold font-mono tabular-nums text-[var(--dp-color-ink)]">
              {totalQuestionsAnswered}
            </span>
          </div>
        </div>

        {/* Accuracy */}
        <div className="clay-cushion-mint p-4 rounded-2xl text-left">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--dp-color-ink-secondary)] block">
            Accuracy
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <Trophy className="w-5 h-5 text-[#059669]" />
            <span className="text-2xl font-extrabold font-mono tabular-nums text-[var(--dp-color-ink)]">
              {accuracy}%
            </span>
          </div>
        </div>

      </div>

      {/* Recent Activity History in Cream Tray */}
      <div className="clay-tray-cream p-6 sm:p-8 rounded-3xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#38315A]/[0.08]">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[var(--dp-color-primary-action)]" />
            <h3 className="text-lg font-bold text-[var(--dp-color-ink)]">
              Recent Practice History
            </h3>
          </div>
          <span className="text-xs text-[var(--dp-color-ink-secondary)]">
            Last {Math.min(attempts.length, 5)} attempts
          </span>
        </div>

        {attempts.length === 0 ? (
          <p className="text-sm text-[var(--dp-color-ink-secondary)] py-4 text-center">
            No quiz attempts recorded yet. Start practicing to see your performance log!
          </p>
        ) : (
          <div className="space-y-2.5">
            {attempts.slice(0, 5).map((att) => (
              <div
                key={att.id}
                className="clay-cushion-cream p-4 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs ${
                      att.correct
                        ? 'bg-[var(--dp-color-surface-support)] text-[#065F46]'
                        : 'bg-[var(--dp-color-surface-compare)] text-[#9F1239]'
                    }`}
                  >
                    {att.correct ? '✓' : '✕'}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[var(--dp-color-ink)] block">
                      Topic: {att.topic_id}
                    </span>
                    <span className="text-[11px] text-[var(--dp-color-ink-secondary)]">
                      {new Date(att.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    att.correct
                      ? 'bg-[var(--dp-color-surface-support)] text-[#065F46]'
                      : 'bg-[var(--dp-color-surface-compare)] text-[#9F1239]'
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
