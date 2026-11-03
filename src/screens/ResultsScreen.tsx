import React, { useEffect, useState } from 'react';
import {
  RotateCcw,
  Home,
} from 'lucide-react';
import { triggerConfetti } from '../components/Confetti';
import { getAllTopics } from '../lib/storage';
import {
  SugaryTrophy,
  SugaryBolt,
  SugaryCheck,
  SugaryAlert,
  SugaryStar,
  SugaryBubbleHeart,
} from '../components/SugaryIcons';
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
    <div className="max-w-xl mx-auto space-y-6 pb-20 text-center">
      
      {/* Celebration Card */}
      <div className="bg-white border border-slate-200/80 shadow-[0_12px_36px_rgba(79,70,229,0.06)] p-8 sm:p-10 rounded-3xl space-y-6">
        
        {/* 3D Sugary Trophy or Star */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-24 h-24 rounded-3xl bg-amber-50/80 border border-amber-200/60 flex items-center justify-center shadow-xs">
            {percent >= 60 ? (
              <SugaryTrophy size={54} />
            ) : (
              <SugaryStar size={54} />
            )}
          </div>
        </div>

        {/* Heading & Subtitle */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
            {percent >= 80 ? 'Mastery Unlocked! 🎉' : percent >= 60 ? 'Well Done! 👏' : 'Keep Practicing! 💪'}
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-slate-600 font-medium">
            {percent >= 60
              ? 'Great job! Your answers and XP have been recorded to your profile.'
              : 'Mistakes are where learning happens. Review weak topics to reinforce concepts.'}
          </p>
        </div>

        {/* Score & XP Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* Score Card */}
          <div className="bg-emerald-50/80 border border-emerald-200/80 p-5 rounded-2xl flex flex-col items-center justify-center">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
              Accuracy
            </span>
            <span className="text-3xl font-black font-mono tabular-nums text-slate-900 mt-1">
              {score} / {total}
            </span>
            <span className="text-xs font-extrabold text-emerald-700 mt-0.5">
              {percent}% Correct
            </span>
          </div>

          {/* XP Card */}
          <div className="bg-amber-50/80 border border-amber-200/80 p-5 rounded-2xl flex flex-col items-center justify-center">
            <span className="text-xs font-black uppercase tracking-wider text-amber-800">
              XP Earned
            </span>
            <div className="flex items-center gap-1.5 text-3xl font-black font-mono tabular-nums text-slate-900 mt-1">
              <SugaryBolt size={24} />
              <span>+{xpEarned}</span>
            </div>
            <span className="text-xs font-extrabold text-amber-700 mt-0.5">
              +10 XP per correct
            </span>
          </div>

        </div>

        {/* Weak Topics Analysis Module */}
        {weakTopics.length > 0 ? (
          <div className="bg-rose-50/80 border border-rose-200/80 p-5 sm:p-6 rounded-2xl text-left space-y-3">
            <div className="flex items-center gap-2">
              <SugaryAlert size={20} />
              <h3 className="text-sm font-extrabold text-rose-900">
                Weak Topics to Review ({weakTopics.length})
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Questions from these topics were answered incorrectly during this session:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {weakTopics.map((wt) => (
                <span
                  key={wt.id}
                  className="px-3 py-1 bg-white border border-rose-200 rounded-full text-xs font-extrabold text-rose-900 shadow-xs"
                >
                  {wt.title}
                </span>
              ))}
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigate('revision')}
                className="bg-white hover:bg-slate-50 text-rose-800 border border-rose-200 px-4 py-2 rounded-full text-xs font-extrabold cursor-pointer w-full sm:w-auto shadow-xs"
              >
                Review in Spaced Repetition Queue
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-extrabold text-emerald-800">
            <SugaryCheck size={18} />
            <span>Zero mistakes in this session! Flawless run.</span>
          </div>
        )}

        {/* Encouraging Tip Pill */}
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 py-1">
          <SugaryBubbleHeart size={16} />
          <span>Every question completed builds your exam mastery!</span>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('practice')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 flex-1 py-3 px-6 rounded-full text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Practice Another Topic</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1 py-3 px-6 rounded-full text-sm font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </button>
        </div>

      </div>

    </div>
  );
};
