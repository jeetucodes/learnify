import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTopicMastery } from '../lib/storage';
import { Heatmap } from '../components/Heatmap';
import {
  SugaryFlame,
  SugaryBolt,
  SugaryTarget,
  SugaryBook,
  SugarySwords,
  SugarySparkles,
  SugaryBrain,
  SugaryAlert,
  SugaryCalendar,
  SugaryStar,
} from '../components/SugaryIcons';
import type { TopicMastery } from '../types/database';

interface HomeScreenProps {
  onNavigate: (route: string, params?: any) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [masteryList, setMasteryList] = useState<TopicMastery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      getTopicMastery(user.id).then((res) => {
        setMasteryList(res);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const weakTopics = masteryList.filter((m) => m.needs_revision);
  const totalAttempted = masteryList.filter((m) => m.total_attempts > 0).length;
  const averageAccuracy =
    totalAttempted > 0
      ? Math.round(
          masteryList.reduce((acc, curr) => acc + (curr.total_attempts > 0 ? curr.accuracy : 0), 0) /
            totalAttempted
        )
      : 0;

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 text-[var(--dp-color-ink)]">
        <div className="w-10 h-10 rounded-full border-3 border-indigo-200 border-t-indigo-600 animate-spin mb-4"></div>
        <span className="text-sm font-bold text-slate-600">Loading your dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-16">
      
      {/* 1. Hero Welcome Card with 3D Sugary Accents */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/80 border border-indigo-100/90 shadow-[0_10px_30px_-8px_rgba(79,70,229,0.08)] p-6 sm:p-9 lg:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 text-left">
        
        {/* Soft background ambient glow */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-violet-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-xl relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-1 text-xs font-bold text-slate-800 mb-3.5 border border-indigo-100 shadow-xs">
            <SugaryStar size={16} />
            <span>DBMS Relational Console · College Exam Prep</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Welcome back, {user ? user.name.split(' ')[0] : 'Student'}! 👋
          </h1>
          <p className="mt-2.5 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            You're on a <span className="font-extrabold text-indigo-700">{user?.streak || 0}-day streak</span>. Complete 10 MCQs today to keep your streak burning and claim +100 XP.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 relative z-10">
          <button
            type="button"
            onClick={() => onNavigate('practice')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3 rounded-full text-base font-bold flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(79,70,229,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer whitespace-nowrap"
          >
            <span>Continue Practice</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          
          <button
            type="button"
            onClick={() => onNavigate('create')}
            className="bg-white/90 hover:bg-white text-indigo-900 border border-indigo-200/80 px-6 py-2.5 rounded-full text-sm font-bold flex items-center justify-center gap-2 shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="h-4 w-4 text-indigo-600" />
            <span>Create Quiz Studio</span>
          </button>
        </div>
      </div>

      {/* 2. Four Crisp Stat Cards with 3D Sugary Icons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Stat 1: Daily Streak */}
        <div className="bg-white rounded-2xl border border-amber-200/70 shadow-[0_4px_16px_rgba(245,158,11,0.06)] p-5 text-left flex flex-col justify-between transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800">
              Daily Streak
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50/80 border border-amber-200/60 shadow-xs">
              <SugaryFlame size={28} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl sm:text-4xl font-black font-mono tabular-nums text-slate-900">
              {user?.streak || 0}d
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 mt-1">
              <SugaryCalendar size={13} />
              <span>Daily goal active</span>
            </div>
          </div>
        </div>

        {/* Stat 2: Total XP */}
        <div className="bg-white rounded-2xl border border-indigo-200/70 shadow-[0_4px_16px_rgba(79,70,229,0.06)] p-5 text-left flex flex-col justify-between transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-800">
              Total XP
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50/80 border border-indigo-200/60 shadow-xs">
              <SugaryBolt size={28} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl sm:text-4xl font-black font-mono tabular-nums text-slate-900">
              {user?.xp || 0}
            </span>
            <span className="block text-xs font-semibold text-indigo-700 mt-1">
              +10 XP per correct MCQ
            </span>
          </div>
        </div>

        {/* Stat 3: Accuracy */}
        <div className="bg-white rounded-2xl border border-emerald-200/70 shadow-[0_4px_16px_rgba(16,185,129,0.06)] p-5 text-left flex flex-col justify-between transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
              Accuracy
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50/80 border border-emerald-200/60 shadow-xs">
              <SugaryTarget size={28} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl sm:text-4xl font-black font-mono tabular-nums text-slate-900">
              {averageAccuracy}%
            </span>
            <span className="block text-xs font-semibold text-emerald-700 mt-1">
              {totalAttempted} of {masteryList.length} topics tried
            </span>
          </div>
        </div>

        {/* Stat 4: Weak Topics */}
        <div className="bg-white rounded-2xl border border-rose-200/70 shadow-[0_4px_16px_rgba(244,63,94,0.06)] p-5 text-left flex flex-col justify-between transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-800">
              Weak Topics
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50/80 border border-rose-200/60 shadow-xs">
              <SugaryAlert size={28} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl sm:text-4xl font-black font-mono tabular-nums text-slate-900">
              {weakTopics.length}
            </span>
            <span className="block text-xs font-semibold text-rose-700 mt-1">
              Needs spaced revision
            </span>
          </div>
        </div>

      </div>

      {/* 3. Quick Action Portals with 3D Sugary Icons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Action 1: Syllabus Practice */}
        <div
          onClick={() => onNavigate('practice')}
          className="bg-white rounded-3xl border border-slate-200/80 hover:border-indigo-300 p-6 text-left cursor-pointer transition-all duration-200 hover:-translate-y-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_28px_rgba(79,70,229,0.08)] group"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 border border-sky-100 shadow-xs mb-4">
            <SugaryBook size={34} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
            Syllabus Practice
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed">
            Explore 3 units and 40 verified college MCQs.
          </p>
          <div className="mt-4 flex items-center text-xs font-extrabold text-indigo-600">
            <span>Start Practice</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Action 2: Notes-to-Quiz AI */}
        <div
          onClick={() => onNavigate('upload')}
          className="bg-white rounded-3xl border border-slate-200/80 hover:border-indigo-300 p-6 text-left cursor-pointer transition-all duration-200 hover:-translate-y-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_28px_rgba(79,70,229,0.08)] group"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 border border-purple-100 shadow-xs mb-4">
            <SugarySparkles size={34} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
            Notes-to-Quiz AI
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed">
            Upload course slides and get 10 custom MCQs.
          </p>
          <div className="mt-4 flex items-center text-xs font-extrabold text-indigo-600">
            <span>Upload Notes</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Action 3: 1v1 Speed Battle */}
        <div
          onClick={() => onNavigate('battle')}
          className="bg-white rounded-3xl border border-slate-200/80 hover:border-indigo-300 p-6 text-left cursor-pointer transition-all duration-200 hover:-translate-y-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_28px_rgba(79,70,229,0.08)] group"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100 shadow-xs mb-4">
            <SugarySwords size={34} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
            1v1 Speed Battle
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed">
            Challenge classmates to a live 5-question duel.
          </p>
          <div className="mt-4 flex items-center text-xs font-extrabold text-indigo-600">
            <span>Enter Lobby</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Action 4: Smart Revision Queue */}
        <div
          onClick={() => onNavigate('revision')}
          className="bg-white rounded-3xl border border-slate-200/80 hover:border-indigo-300 p-6 text-left cursor-pointer transition-all duration-200 hover:-translate-y-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_28px_rgba(79,70,229,0.08)] group"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 shadow-xs mb-4">
            <SugaryBrain size={34} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
            Smart Revision
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed">
            Target weak concepts with spaced repetition.
          </p>
          <div className="mt-4 flex items-center text-xs font-extrabold text-indigo-600">
            <span>Revise Weak Areas</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* 4. Weak Topics Alert (if any exist) */}
      {weakTopics.length > 0 && (
        <div className="bg-gradient-to-r from-rose-50 via-white to-rose-50/70 border border-rose-200/80 rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left shadow-xs">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white border border-rose-200 shadow-xs">
              <SugaryAlert size={32} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                {weakTopics.length} Weak {weakTopics.length === 1 ? 'Topic' : 'Topics'} Flagged for Revision
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Concepts with under 60% accuracy need attention before your exams.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {weakTopics.slice(0, 3).map((w) => (
                  <span
                    key={w.topic_id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white border border-rose-200 text-rose-900 shadow-xs"
                  >
                    {w.topic_title} ({w.accuracy}%)
                  </span>
                ))}
                {weakTopics.length > 3 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-500 border border-slate-200">
                    +{weakTopics.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('revision')}
            className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer whitespace-nowrap self-start sm:self-center"
          >
            Start Revision
          </button>
        </div>
      )}

      {/* 5. Topic Mastery Shelf in Crisp White Card */}
      <div className="bg-white border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 sm:p-9 rounded-3xl text-left">
        <Heatmap
          masteryList={masteryList}
          onSelectTopic={(topicId) => onNavigate('practice', { topicId })}
        />
      </div>

    </div>
  );
};
