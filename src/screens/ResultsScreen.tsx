import React, { useEffect, useState } from 'react';
import {
  Trophy,
  Zap,
  RotateCcw,
  Home,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { triggerConfetti } from '../components/Confetti';
import { getAllTopics } from '../lib/storage';
import type { Topic } from '../types/database';

interface ResultsScreenProps {
  score: number;
  total: number;
  xpEarned: number;
  weakTopicIds: string[];
  onNavigate: (route: string, params?: any) => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  score,
  total,
  xpEarned,
  weakTopicIds,
  onNavigate,
}) => {
  const [weakTopics, setWeakTopics] = useState<Topic[]>([]);
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;

  useEffect(() => {
    if (percent >= 50) {
      triggerConfetti();
    }

    if (weakTopicIds.length > 0) {
      getAllTopics().then((topics) => {
        setWeakTopics(topics.filter((t) => weakTopicIds.includes(t.id)));
      });
    }
  }, [percent, weakTopicIds]);

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20 text-center font-clay">
      
      {/* Celebration Card in Cream Tray */}
      <div className="clay-tray-cream p-8 sm:p-10 rounded-3xl space-y-6">
        
        {/* Trophy Cushion */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-[var(--dp-color-surface-warm)] flex items-center justify-center shadow-[inset_3px_3px_6px_rgba(255,255,255,0.9),inset_-3px_-3px_6px_rgba(56,49,90,0.12)]">
            <Trophy className="w-10 h-10 text-[#D97706]" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--dp-color-primary-action)] text-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[var(--dp-color-surface-warm)]" />
          </span>
        </div>

        {/* Heading & Subtitle */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--dp-color-ink)]">
            {percent >= 80 ? 'Mastery Unlocked! 🎉' : percent >= 60 ? 'Well Done! 👏' : 'Keep Practicing! 💪'}
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-[var(--dp-color-ink-secondary)]">
            {percent >= 60
              ? 'Great job! Your answers and XP have been recorded to your profile.'
              : 'Mistakes are where learning happens. Review weak topics to reinforce concepts.'}
          </p>
        </div>

        {/* Score & XP Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* Score Card (Mint Cushion) */}
          <div className="clay-cushion-mint p-5 rounded-2xl flex flex-col items-center justify-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--dp-color-ink-secondary)]">
              Accuracy
            </span>
            <span className="text-3xl font-extrabold font-mono tabular-nums text-[var(--dp-color-ink)] mt-1">
              {score} / {total}
            </span>
            <span className="text-xs font-bold text-[#065F46] mt-0.5">
              {percent}% Correct
            </span>
          </div>

          {/* XP Card (Warm Yellow Cushion) */}
          <div className="clay-cushion-yellow p-5 rounded-2xl flex flex-col items-center justify-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--dp-color-ink-secondary)]">
              XP Earned
            </span>
            <div className="flex items-center gap-1.5 text-3xl font-extrabold font-mono tabular-nums text-[var(--dp-color-ink)] mt-1">
              <Zap className="w-6 h-6 text-[#D97706] fill-[#D97706]" />
              <span>+{xpEarned}</span>
            </div>
            <span className="text-xs font-bold text-[var(--dp-color-ink-secondary)] mt-0.5">
              +10 XP per hit
            </span>
          </div>

        </div>

        {/* Weak Topics Analysis Module (Soft-Pink Tray) */}
        {weakTopics.length > 0 ? (
          <div className="clay-tray-pink p-5 sm:p-6 rounded-2xl text-left space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#E11D48]" />
              <h3 className="text-sm font-bold text-[var(--dp-color-ink)]">
                Weak Topics to Review ({weakTopics.length})
              </h3>
            </div>
            <p className="text-xs text-[var(--dp-color-ink-secondary)]">
              Questions from these topics were answered incorrectly during this session:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {weakTopics.map((wt) => (
                <span
                  key={wt.id}
                  className="px-3 py-1 bg-[#FFFDF7] rounded-full text-xs font-bold text-[var(--dp-color-ink)] shadow-xs"
                >
                  {wt.title}
                </span>
              ))}
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigate('revision')}
                className="clay-btn-secondary px-4 py-2 text-xs font-bold clay-focus cursor-pointer w-full sm:w-auto"
              >
                Review in Spaced Repetition Queue
              </button>
            </div>
          </div>
        ) : (
          <div className="clay-cushion-mint p-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-[#065F46]">
            <CheckCircle2 className="w-4 h-4 text-[#059669]" />
            <span>Zero mistakes in this session! Flawless run.</span>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('practice')}
            className="clay-btn-secondary flex-1 py-3.5 px-6 text-sm font-bold flex items-center justify-center gap-2 clay-focus cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Practice Another Topic</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="clay-btn-primary flex-1 py-3.5 px-6 text-sm font-bold flex items-center justify-center gap-2 clay-focus cursor-pointer shadow-md"
          >
            <Home className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </button>
        </div>

      </div>

    </div>
  );
};
