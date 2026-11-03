import React, { useEffect, useState } from 'react';
import {
  Flame,
  Zap,
  BookOpen,
  RotateCcw,
  Sparkles,
  Swords,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Trophy,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTopicMastery } from '../lib/storage';
import { Heatmap } from '../components/Heatmap';
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
        <div className="w-10 h-10 rounded-full border-3 border-[var(--dp-color-surface-support)] border-t-[var(--dp-color-primary-action)] animate-spin mb-4"></div>
        <span className="text-sm font-bold text-[var(--dp-color-ink)]">Loading your dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      
      {/* 1. Hero Welcome Cushion (Violet Cushion) */}
      <div className="clay-cushion-violet p-6 sm:p-10 lg:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6 text-left">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FFFDF7]/70 px-3.5 py-1 text-xs font-bold text-[var(--dp-color-ink)] mb-4 shadow-xs">
            <Trophy className="h-3.5 w-3.5 text-[#D97706]" />
            <span>Database Management Systems · College Exam Prep</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--dp-color-ink)] leading-tight">
            Welcome back, {user ? user.name.split(' ')[0] : 'Student'}! 👋
          </h1>
          <p className="mt-2 text-base sm:text-lg text-[var(--dp-color-ink-secondary)] leading-relaxed">
            You're on a <span className="font-bold text-[var(--dp-color-ink)]">{user?.streak || 0}-day streak</span>. Solve 10 questions to maintain your daily streak and earn +100 XP.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('practice')}
            className="clay-btn-primary px-8 py-3.5 text-base font-bold flex items-center justify-center gap-2 clay-focus cursor-pointer whitespace-nowrap shadow-md"
          >
            <span>Continue Practice</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          
          <button
            type="button"
            onClick={() => onNavigate('upload')}
            className="clay-btn-secondary px-6 py-2.5 text-sm font-bold flex items-center justify-center gap-2 clay-focus cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="h-4 w-4 text-[var(--dp-color-primary-action)]" />
            <span>Upload Notes AI</span>
          </button>
        </div>
      </div>

      {/* 2. Four Tactile Stat Cushions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Stat 1: Daily Streak (Warm Yellow) */}
        <div className="clay-cushion-yellow p-5 sm:p-6 text-left flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--dp-color-ink-secondary)]">
              Daily Streak
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFFDF7] shadow-xs">
              <Flame className="w-5 h-5 text-[#D97706] fill-[#D97706]" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-[var(--dp-color-ink)]">
              {user?.streak || 0}d
            </span>
            <span className="block text-xs font-semibold text-[var(--dp-color-ink-secondary)] mt-0.5">
              Active daily streak 🔥
            </span>
          </div>
        </div>

        {/* Stat 2: Total XP (Cream Cushion) */}
        <div className="clay-cushion-cream p-5 sm:p-6 text-left flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--dp-color-ink-secondary)]">
              Total XP
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--dp-color-surface-warm)] shadow-xs">
              <Zap className="w-5 h-5 text-[var(--dp-color-ink)]" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-[var(--dp-color-ink)]">
              {user?.xp || 0}
            </span>
            <span className="block text-xs font-semibold text-[var(--dp-color-ink-secondary)] mt-0.5">
              +10 XP per question
            </span>
          </div>
        </div>

        {/* Stat 3: Accuracy (Mint Cushion) */}
        <div className="clay-cushion-mint p-5 sm:p-6 text-left flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--dp-color-ink-secondary)]">
              Accuracy
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFFDF7] shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-[var(--dp-color-primary-action)]" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-[var(--dp-color-ink)]">
              {averageAccuracy}%
            </span>
            <span className="block text-xs font-semibold text-[var(--dp-color-ink-secondary)] mt-0.5">
              {totalAttempted} of {masteryList.length} topics tried
            </span>
          </div>
        </div>

        {/* Stat 4: Weak Topics (Soft-Pink Tray) */}
        <div className="clay-tray-pink p-5 sm:p-6 text-left flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--dp-color-ink-secondary)]">
              Weak Topics
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFFDF7] shadow-xs">
              <AlertCircle className="w-5 h-5 text-[#E11D48]" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-[var(--dp-color-ink)]">
              {weakTopics.length}
            </span>
            <span className="block text-xs font-semibold text-[var(--dp-color-ink-secondary)] mt-0.5">
              Needs spaced revision
            </span>
          </div>
        </div>

      </div>

      {/* 3. Quick Action Cards (4 Playful Clay Portals) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Action 1: Syllabus Practice */}
        <div
          onClick={() => onNavigate('practice')}
          className="clay-cushion-cream p-6 rounded-3xl text-left cursor-pointer transition-all duration-180 hover:-translate-y-1.5 active:scale-[0.98] clay-focus group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--dp-color-surface-support)] shadow-xs mb-4">
            <BookOpen className="h-6 w-6 text-[#2B2540]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--dp-color-ink)] group-hover:text-[var(--dp-color-primary-action)] transition-colors">
            Syllabus Practice
          </h3>
          <p className="mt-1 text-sm text-[var(--dp-color-ink-secondary)]">
            Explore 3 units and 40 verified college MCQs.
          </p>
          <div className="mt-4 flex items-center text-xs font-bold text-[var(--dp-color-primary-action)]">
            <span>Start Practice</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Action 2: Notes-to-Quiz AI */}
        <div
          onClick={() => onNavigate('upload')}
          className="clay-cushion-violet p-6 rounded-3xl text-left cursor-pointer transition-all duration-180 hover:-translate-y-1.5 active:scale-[0.98] clay-focus group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFFDF7] shadow-xs mb-4">
            <Sparkles className="h-6 w-6 text-[#4A3FD1]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--dp-color-ink)] group-hover:text-[var(--dp-color-primary-action)] transition-colors">
            Notes-to-Quiz AI
          </h3>
          <p className="mt-1 text-sm text-[var(--dp-color-ink-secondary)]">
            Upload course slides and get 10 custom MCQs.
          </p>
          <div className="mt-4 flex items-center text-xs font-bold text-[var(--dp-color-ink)]">
            <span>Upload Notes</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Action 3: 1v1 Peer Battle */}
        <div
          onClick={() => onNavigate('battle')}
          className="clay-cushion-yellow p-6 rounded-3xl text-left cursor-pointer transition-all duration-180 hover:-translate-y-1.5 active:scale-[0.98] clay-focus group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFFDF7] shadow-xs mb-4">
            <Swords className="h-6 w-6 text-[#2B2540]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--dp-color-ink)] group-hover:text-[var(--dp-color-primary-action)] transition-colors">
            1v1 Speed Battle
          </h3>
          <p className="mt-1 text-sm text-[var(--dp-color-ink-secondary)]">
            Challenge classmates to a live 5-question duel.
          </p>
          <div className="mt-4 flex items-center text-xs font-bold text-[var(--dp-color-ink)]">
            <span>Enter Lobby</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Action 4: Smart Revision Queue */}
        <div
          onClick={() => onNavigate('revision')}
          className="clay-cushion-blue p-6 rounded-3xl text-left cursor-pointer transition-all duration-180 hover:-translate-y-1.5 active:scale-[0.98] clay-focus group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFFDF7] shadow-xs mb-4">
            <RotateCcw className="h-6 w-6 text-[#2B2540]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--dp-color-ink)] group-hover:text-[var(--dp-color-primary-action)] transition-colors">
            Smart Revision
          </h3>
          <p className="mt-1 text-sm text-[var(--dp-color-ink-secondary)]">
            Target weak concepts with spaced repetition.
          </p>
          <div className="mt-4 flex items-center text-xs font-bold text-[var(--dp-color-ink)]">
            <span>Revise Weak Areas</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* 4. Weak Topics Alert (if any exist) */}
      {weakTopics.length > 0 && (
        <div className="clay-tray-pink p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFFDF7] shadow-xs">
              <AlertCircle className="h-6 w-6 text-[#E11D48]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--dp-color-ink)]">
                {weakTopics.length} Weak {weakTopics.length === 1 ? 'Topic' : 'Topics'} Flagged for Revision
              </h3>
              <p className="text-sm text-[var(--dp-color-ink-secondary)] mt-0.5">
                Concepts with under 60% accuracy need attention before your exams.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {weakTopics.slice(0, 3).map((w) => (
                  <span
                    key={w.topic_id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#FFFDF7] text-[var(--dp-color-ink)] shadow-xs"
                  >
                    {w.topic_title} ({w.accuracy}%)
                  </span>
                ))}
                {weakTopics.length > 3 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#FFFDF7] text-[var(--dp-color-ink-secondary)]">
                    +{weakTopics.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('revision')}
            className="clay-btn-primary px-6 py-3 text-sm font-bold clay-focus cursor-pointer whitespace-nowrap self-start sm:self-center"
          >
            Start Revision
          </button>
        </div>
      )}

      {/* 5. Topic Mastery Shelf in Cream Tray */}
      <div className="clay-tray-cream p-6 sm:p-10 rounded-3xl text-left">
        <Heatmap
          masteryList={masteryList}
          onSelectTopic={(topicId) => onNavigate('practice', { topicId })}
        />
      </div>

    </div>
  );
};
