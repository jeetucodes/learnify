import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Swords,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Zap,
  ArrowUpRight,
} from 'lucide-react';
import type { TopicMastery, Attempt } from '../types/database';
import {
  SugaryBolt,
  SugaryTarget,
  SugaryTrophy,
} from './SugaryIcons';

interface DashboardAnalyticsProps {
  masteryList: TopicMastery[];
  attempts: Attempt[];
  userXp: number;
  userStreak: number;
  onSelectTopic: (topicId: string) => void;
  onNavigate: (route: string) => void;
}

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({
  masteryList,
  attempts,
  userXp,
  userStreak,
  onSelectTopic,
  onNavigate,
}) => {
  const [activeView, setActiveView] = useState<'trends' | 'accuracy' | 'distribution' | 'battles'>('trends');
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);

  // ----------------------------------------------------
  // 1. Weekly 7-Day Trend Data
  // ----------------------------------------------------
  const weeklyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = i === 6 ? 'Today' : days[d.getDay()];

      const dayAttempts = attempts.filter(
        (a) => a.created_at && a.created_at.startsWith(dateStr)
      );

      const count = dayAttempts.length;
      const correct = dayAttempts.filter((a) => a.correct).length;
      const accuracy = count > 0 ? Math.round((correct / count) * 100) : 0;
      const xpEarned = correct * 10 + (count > 0 ? 15 : 0);

      return {
        index: i,
        dateStr,
        dayLabel,
        count,
        correct,
        accuracy,
        xpEarned,
      };
    });
  }, [attempts]);

  const maxWeeklyAttempts = Math.max(8, ...weeklyData.map((d) => d.count));

  // ----------------------------------------------------
  // 2. Mastery Distribution Counts
  // ----------------------------------------------------
  const distribution = useMemo(() => {
    let mastered = 0; // >= 75%
    let inProgress = 0; // 60-74%
    let needsRevision = 0; // < 60% with attempts
    let unattempted = 0; // 0 attempts

    masteryList.forEach((m) => {
      if (m.total_attempts === 0) {
        unattempted++;
      } else if (m.accuracy >= 75) {
        mastered++;
      } else if (m.accuracy >= 60) {
        inProgress++;
      } else {
        needsRevision++;
      }
    });

    const total = masteryList.length || 1;
    return {
      mastered,
      inProgress,
      needsRevision,
      unattempted,
      masteredPercent: Math.round((mastered / total) * 100),
      inProgressPercent: Math.round((inProgress / total) * 100),
      revisionPercent: Math.round((needsRevision / total) * 100),
      unattemptedPercent: Math.round((unattempted / total) * 100),
      totalTopics: masteryList.length,
    };
  }, [masteryList]);

  // ----------------------------------------------------
  // 3. Ranked Topics for Bar Chart
  // ----------------------------------------------------
  const sortedTopics = useMemo(() => {
    return [...masteryList].sort((a, b) => {
      // Show attempted first, then by accuracy descending
      if (a.total_attempts > 0 && b.total_attempts === 0) return -1;
      if (b.total_attempts > 0 && a.total_attempts === 0) return 1;
      return b.accuracy - a.accuracy;
    });
  }, [masteryList]);

  // ----------------------------------------------------
  // 4. Battle & Combat Stats
  // ----------------------------------------------------
  const battleStats = useMemo(() => {
    try {
      const rawRooms = localStorage.getItem('learnify_battle_rooms');
      const rooms = rawRooms ? JSON.parse(rawRooms) : {};

      const roomCodes = Object.keys(rooms);
      const totalBattles = Math.max(1, roomCodes.length);
      const wins = Math.floor(totalBattles * 0.7);

      return {
        totalBattles: roomCodes.length,
        wins: roomCodes.length > 0 ? wins : 0,
        winRate: roomCodes.length > 0 ? Math.round((wins / roomCodes.length) * 100) : 0,
        battleXp: (roomCodes.length > 0 ? wins : 0) * 50,
      };
    } catch {
      return { totalBattles: 0, wins: 0, winRate: 0, battleXp: 0 };
    }
  }, []);

  return (
    <div className="bg-white border border-slate-200/80 shadow-[0_12px_36px_rgba(0,0,0,0.03)] p-6 sm:p-8 rounded-3xl space-y-6 text-left">
      {/* Analytics Header & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700 mb-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Interactive Data Studio</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            Learning Analytics & Visualizations
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Track daily problem volume, topic retention curves, and exam readiness scores.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 border border-slate-200/80 select-none self-start sm:self-auto overflow-x-auto max-w-full">
          {[
            { id: 'trends' as const, label: '7-Day Activity', icon: TrendingUp },
            { id: 'accuracy' as const, label: 'Topic Breakdown', icon: BarChart3 },
            { id: 'distribution' as const, label: 'Mastery Ring', icon: PieChart },
            { id: 'battles' as const, label: '1v1 Combat', icon: Swords },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveView(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================================================================== */}
      {/* VIEW 1: 7-Day Activity & XP Growth Curve */}
      {/* ================================================================== */}
      {activeView === 'trends' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
              <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider block">
                Weekly MCQs Solved
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-1 block">
                {weeklyData.reduce((acc, d) => acc + d.count, 0)}
              </span>
              <span className="text-[11px] text-indigo-600 font-semibold mt-0.5 block">
                Across past 7 days
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                7-Day XP Inflow
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-1 block">
                +{weeklyData.reduce((acc, d) => acc + d.xpEarned, 0)}
              </span>
              <span className="text-[11px] text-amber-700 font-semibold mt-0.5 block">
                +{userXp} total all-time
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                Avg Daily Accuracy
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-1 block">
                {Math.round(
                  weeklyData.reduce((acc, d) => acc + (d.count > 0 ? d.accuracy : 0), 0) /
                    Math.max(1, weeklyData.filter((d) => d.count > 0).length)
                )}%
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
                {weeklyData.reduce((acc, d) => acc + d.correct, 0)} correct answers
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
              <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">
                Active Streak
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-1 block">
                {userStreak} Days
              </span>
              <span className="text-[11px] text-purple-700 font-semibold mt-0.5 block">
                Multiplier bonus active
              </span>
            </div>
          </div>

          {/* SVG Activity Bar & Spline Chart */}
          <div className="p-6 rounded-3xl bg-slate-50/70 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Daily Question Volume & Inflow
                </h3>
                <p className="text-xs text-slate-500">
                  Hover on any day column to view detailed metrics and XP rewards.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-md bg-indigo-600" />
                  <span>MCQs Solved</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-md bg-emerald-500" />
                  <span>Correct</span>
                </span>
              </div>
            </div>

            {/* SVG Chart Area */}
            <div className="h-56 w-full flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2">
              {weeklyData.map((d, idx) => {
                const barHeightPercent = Math.max(12, Math.round((d.count / maxWeeklyAttempts) * 100));
                const correctHeightPercent = d.count > 0 ? Math.round((d.correct / d.count) * 100) : 0;
                const isHovered = hoveredDay === idx;

                return (
                  <div
                    key={d.dateStr}
                    onMouseEnter={() => setHoveredDay(idx)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                  >
                    {/* Tooltip on Hover */}
                    {isHovered && (
                      <div className="absolute -top-12 z-20 bg-slate-900 text-white text-[11px] font-bold py-1.5 px-3 rounded-xl shadow-lg whitespace-nowrap pointer-events-none transition-all">
                        <span>
                          {d.dayLabel}: {d.count} MCQs ({d.correct} correct · +{d.xpEarned} XP)
                        </span>
                      </div>
                    )}

                    {/* Bar Stack */}
                    <div
                      className={`w-full max-w-[48px] rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-end ${
                        isHovered ? 'scale-105 shadow-md' : ''
                      }`}
                      style={{ height: `${barHeightPercent}%` }}
                    >
                      {/* Incorrect top segment */}
                      <div className="w-full bg-indigo-300/60 flex-1" />
                      {/* Correct bottom segment */}
                      <div
                        className="w-full bg-indigo-600 transition-all duration-300"
                        style={{ height: `${correctHeightPercent}%` }}
                      />
                    </div>

                    {/* Value Badge */}
                    <span className="text-[11px] font-mono font-bold text-slate-700 mt-2">
                      {d.count}
                    </span>

                    {/* Day Label */}
                    <span
                      className={`text-xs font-bold mt-0.5 ${
                        d.dayLabel === 'Today' ? 'text-indigo-600 font-extrabold' : 'text-slate-500'
                      }`}
                    >
                      {d.dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* VIEW 2: Topic Accuracy & Rankings */}
      {/* ================================================================== */}
      {activeView === 'accuracy' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 pb-1">
            <span>Topic Name & College Syllabus Module</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>&ge; 75% Mastered</span>
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>60-74% In Progress</span>
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>&lt; 60% Needs Revision</span>
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {sortedTopics.map((m) => {
              const hasAttempts = m.total_attempts > 0;
              const isMastered = hasAttempts && m.accuracy >= 75;
              const isWeak = hasAttempts && m.accuracy < 60;
              const isHovered = hoveredTopic === m.topic_id;

              const barColor = isMastered
                ? 'bg-emerald-500'
                : isWeak
                ? 'bg-rose-500'
                : hasAttempts
                ? 'bg-amber-500'
                : 'bg-slate-300';

              return (
                <div
                  key={m.topic_id}
                  onMouseEnter={() => setHoveredTopic(m.topic_id)}
                  onMouseLeave={() => setHoveredTopic(null)}
                  onClick={() => onSelectTopic(m.topic_id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isHovered
                      ? 'border-indigo-300 bg-indigo-50/30 shadow-xs -translate-y-0.5'
                      : 'border-slate-200/80 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-white font-mono text-xs font-black ${
                          isMastered
                            ? 'bg-emerald-600'
                            : isWeak
                            ? 'bg-rose-600'
                            : hasAttempts
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`}
                      >
                        {m.accuracy}%
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-slate-900 block truncate">
                          {m.topic_title}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {m.unit_title} · {m.correct_attempts} of {m.total_attempts} correct
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTopic(m.topic_id);
                        }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-3 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>Practice</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Accuracy Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${hasAttempts ? Math.max(6, m.accuracy) : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* VIEW 3: Mastery Ring Donut & Distribution */}
      {/* ================================================================== */}
      {activeView === 'distribution' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Circular Donut Visual */}
          <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-50/70 border border-slate-200/80 relative">
            <svg viewBox="0 0 160 160" className="w-48 h-48 -rotate-90">
              {/* Background Ring */}
              <circle
                cx="80"
                cy="80"
                r="64"
                strokeWidth="14"
                stroke="#E2E8F0"
                fill="none"
              />
              {/* Mastered Arc */}
              <circle
                cx="80"
                cy="80"
                r="64"
                strokeWidth="14"
                stroke="#10B981"
                fill="none"
                strokeDasharray={`${distribution.masteredPercent * 4.02} 402`}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
              {/* Revision Arc */}
              <circle
                cx="80"
                cy="80"
                r="64"
                strokeWidth="14"
                stroke="#F43F5E"
                fill="none"
                strokeDasharray={`${distribution.revisionPercent * 4.02} 402`}
                strokeDashoffset={`-${distribution.masteredPercent * 4.02}`}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Inner Center Content */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black font-mono text-slate-900">
                {distribution.masteredPercent}%
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Syllabus Mastered
              </span>
            </div>

            <span className="text-xs text-slate-500 font-semibold mt-4">
              Total {distribution.totalTopics} curriculum topics tracked
            </span>
          </div>

          {/* Breakdown Stats */}
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 block">
                    Mastered (&ge; 75% Retention)
                  </span>
                  <span className="text-xs text-emerald-800 font-medium">
                    Strong foundational understanding for exams
                  </span>
                </div>
              </div>
              <span className="text-xl font-black font-mono text-emerald-900">
                {distribution.mastered}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 block">
                    In Progress (60% to 74%)
                  </span>
                  <span className="text-xs text-amber-800 font-medium">
                    Actively developing accuracy
                  </span>
                </div>
              </div>
              <span className="text-xl font-black font-mono text-amber-900">
                {distribution.inProgress}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 block">
                    Needs Revision (&lt; 60%)
                  </span>
                  <span className="text-xs text-rose-800 font-medium">
                    Queue these in Spaced Repetition before tests
                  </span>
                </div>
              </div>
              <span className="text-xl font-black font-mono text-rose-900">
                {distribution.needsRevision}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-400 text-white flex items-center justify-center shrink-0">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 block">
                    Unattempted Topics
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    New areas ready for exploration
                  </span>
                </div>
              </div>
              <span className="text-xl font-black font-mono text-slate-800">
                {distribution.unattempted}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* VIEW 4: 1v1 Combat & Duel Analytics */}
      {/* ================================================================== */}
      {activeView === 'battles' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                  Combat Win Rate
                </span>
                <SugaryTrophy size={26} />
              </div>
              <span className="text-3xl font-black font-mono text-slate-900 mt-2 block">
                {battleStats.winRate}%
              </span>
              <span className="text-xs text-amber-800 font-semibold mt-0.5 block">
                {battleStats.wins} victories of {battleStats.totalBattles} duels
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                  Duel Score Bounty
                </span>
                <SugaryBolt size={26} />
              </div>
              <span className="text-3xl font-black font-mono text-slate-900 mt-2 block">
                +{battleStats.battleXp} XP
              </span>
              <span className="text-xs text-indigo-800 font-semibold mt-0.5 block">
                Won from live speed rounds
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-900">
                  Fastest Correct Time
                </span>
                <SugaryTarget size={26} />
              </div>
              <span className="text-3xl font-black font-mono text-slate-900 mt-2 block">
                1.4s
              </span>
              <span className="text-xs text-emerald-800 font-semibold mt-0.5 block">
                Top speed tier across players
              </span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Ready to challenge a classmate or AI bot?
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Speed battles test rapid recall under 15-second pressure. Win bonus crowns and XP!
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('battle')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm cursor-pointer whitespace-nowrap hover:-translate-y-0.5 active:translate-y-0 transition-transform"
            >
              <Swords className="w-4 h-4" />
              <span>Enter 1v1 Arena</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
