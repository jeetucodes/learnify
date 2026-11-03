import React, { useEffect, useState } from 'react';
import { Play, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTopicMastery, getRevisionQuestions } from '../lib/storage';
import { ProgressBar } from '../components/ProgressBar';
import {
  SugaryBrain,
  SugaryAlert,
  SugaryCheck,
  SugaryCalendar,
  SugaryClock,
} from '../components/SugaryIcons';
import type { TopicMastery, Question } from '../types/database';

interface RevisionScreenProps {
  onStartRevisionQuiz: (questions: Question[]) => void;
  onNavigate: (route: string) => void;
}

export const RevisionScreen: React.FC<RevisionScreenProps> = ({
  onStartRevisionQuiz,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [masteries, setMasteries] = useState<TopicMastery[]>([]);
  const [weakTopics, setWeakTopics] = useState<TopicMastery[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      getTopicMastery(user.id).then((res) => {
        setMasteries(res);
        setWeakTopics(res.filter((m) => m.needs_revision));
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const handleStart = async () => {
    if (!user) return;
    setStarting(true);
    try {
      const q = await getRevisionQuestions(user.id);
      onStartRevisionQuiz(q);
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 text-[var(--dp-color-ink)]">
        <div className="w-10 h-10 rounded-full border-3 border-indigo-200 border-t-indigo-600 animate-spin mb-4"></div>
        <span className="text-sm font-bold text-slate-600">Scanning revision queue...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 text-left">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/80 border border-indigo-100/90 shadow-[0_8px_24px_rgba(79,70,229,0.06)] p-6 sm:p-10 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1 text-xs font-bold text-indigo-700 mb-3 border border-indigo-100 shadow-xs">
            <SugaryCalendar size={18} />
            <span>Daily Spaced Repetition Queue</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">
            Today's Revision Queue
          </h1>
          <p className="mt-2 text-xs sm:text-base text-slate-600 leading-relaxed font-medium">
            The automated Leitner algorithm monitors your accuracy and schedules questions right before memory decay sets in.
          </p>
        </div>

        {weakTopics.length > 0 && (
          <button
            type="button"
            onClick={handleStart}
            disabled={starting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-full text-base font-bold flex items-center justify-center gap-2 shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer shrink-0 self-start md:self-auto"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{starting ? 'Generating Quiz...' : 'Start Revision Quiz'}</span>
          </button>
        )}
      </div>

      {/* Weak Topics Shelf */}
      {weakTopics.length > 0 ? (
        <div className="bg-white border border-rose-200/80 shadow-[0_8px_24px_rgba(244,63,94,0.04)] p-6 sm:p-8 rounded-3xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-rose-100">
            <div className="flex items-center gap-2.5">
              <SugaryAlert size={22} />
              <h2 className="text-lg font-black text-slate-900">
                {weakTopics.length} Critical Topics Requiring Attention
              </h2>
            </div>
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
              Threshold: &lt; 60% Accuracy
            </span>
          </div>

          <div className="space-y-3">
            {weakTopics.map((topic) => (
              <div
                key={topic.topic_id}
                className="bg-slate-50/70 border border-slate-200/80 p-5 rounded-2xl space-y-3"
              >
                <div className="flex justify-between items-start text-xs">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      {topic.topic_title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                      <SugaryClock size={14} />
                      <span>{topic.unit_title} · Due for revision</span>
                    </div>
                  </div>
                  <span className="font-mono tabular-nums font-bold text-xs px-2.5 py-1 rounded-full bg-rose-100 text-rose-900">
                    {topic.accuracy}% ({topic.correct_attempts}/{topic.total_attempts} pass)
                  </span>
                </div>

                <ProgressBar progress={topic.accuracy} colorClass="bg-rose-500" heightClass="h-2" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Zero Weak Topics State */
        <div className="bg-white border border-emerald-200/80 shadow-[0_8px_24px_rgba(16,185,129,0.06)] p-8 sm:p-12 rounded-3xl text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
            <SugaryCheck size={36} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              All Clear! Zero Weak Topics
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto font-medium">
              Your accuracy across all attempted topics is above 60%. Keep up the momentum by practicing new syllabus units.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('practice')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-full text-sm font-bold inline-flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Practice New Units</span>
          </button>
        </div>
      )}

      {/* Overview of Mastered Topics */}
      <div className="bg-white border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 sm:p-8 rounded-3xl">
        <div className="flex items-center gap-2.5 mb-4">
          <SugaryBrain size={22} />
          <h3 className="text-lg font-black text-slate-900">
            Mastered Topics ({masteries.filter((m) => !m.needs_revision && m.total_attempts > 0).length})
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {masteries
            .filter((m) => !m.needs_revision && m.total_attempts > 0)
            .map((m) => (
              <div
                key={m.topic_id}
                className="bg-emerald-50/60 border border-emerald-200/70 p-4 rounded-2xl flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{m.topic_title}</h4>
                  <span className="text-xs text-slate-500 font-medium">{m.unit_title}</span>
                </div>
                <span className="font-mono tabular-nums font-black text-xs bg-white border border-emerald-200 px-2.5 py-1 rounded-full text-emerald-800 shadow-xs">
                  {m.accuracy}%
                </span>
              </div>
            ))}
        </div>
      </div>

    </div>
  );
};
