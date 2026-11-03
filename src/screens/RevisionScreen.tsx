import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Play, BookOpen, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTopicMastery, getRevisionQuestions } from '../lib/storage';
import { ProgressBar } from '../components/ProgressBar';
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
      <div className="flex flex-col justify-center items-center py-24 text-[var(--dp-color-ink)] font-clay">
        <div className="w-10 h-10 rounded-full border-3 border-[var(--dp-color-surface-support)] border-t-[var(--dp-color-primary-action)] animate-spin mb-4"></div>
        <span className="text-sm font-bold">Scanning revision queue...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 text-left font-clay">
      
      {/* Header Banner (Violet Cushion) */}
      <div className="clay-cushion-violet p-6 sm:p-10 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FFFDF7]/70 px-3.5 py-1 text-xs font-bold text-[var(--dp-color-ink)] mb-3 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-[var(--dp-color-primary-action)]" />
            <span>Spaced Repetition Engine</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[var(--dp-color-ink)] leading-tight">
            Today's Revision Queue
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[var(--dp-color-ink-secondary)] leading-relaxed">
            The automated Leitner algorithm monitors your accuracy and schedules questions right before memory decay sets in.
          </p>
        </div>

        {weakTopics.length > 0 && (
          <button
            type="button"
            onClick={handleStart}
            disabled={starting}
            className="clay-btn-primary px-8 py-3.5 text-base font-bold flex items-center justify-center gap-2 clay-focus cursor-pointer shadow-md shrink-0 self-start md:self-auto"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{starting ? 'Generating Quiz...' : 'Start Revision Quiz'}</span>
          </button>
        )}
      </div>

      {/* Weak Topics Shelf (Soft-Pink Tray) */}
      {weakTopics.length > 0 ? (
        <div className="clay-tray-pink p-6 sm:p-8 rounded-3xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#38315A]/10">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-[#E11D48]" />
              <h2 className="text-lg font-bold text-[var(--dp-color-ink)]">
                {weakTopics.length} Critical Topics Requiring Attention
              </h2>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FFFDF7] text-[var(--dp-color-ink)] shadow-xs">
              Threshold: &lt; 60% Accuracy
            </span>
          </div>

          <div className="space-y-3">
            {weakTopics.map((topic) => (
              <div
                key={topic.topic_id}
                className="clay-cushion-cream p-5 rounded-2xl space-y-3"
              >
                <div className="flex justify-between items-start text-xs">
                  <div>
                    <h3 className="font-bold text-base text-[var(--dp-color-ink)]">
                      {topic.topic_title}
                    </h3>
                    <span className="text-xs text-[var(--dp-color-ink-secondary)]">
                      {topic.unit_title}
                    </span>
                  </div>
                  <span className="font-mono tabular-nums font-bold text-xs px-2.5 py-1 rounded-full bg-[var(--dp-color-surface-compare)] text-[var(--dp-color-ink)]">
                    {topic.accuracy}% ({topic.correct_attempts}/{topic.total_attempts} pass)
                  </span>
                </div>

                <ProgressBar progress={topic.accuracy} colorClass="bg-[#E11D48]" heightClass="h-2" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Zero Weak Topics State (Mint Cushion) */
        <div className="clay-cushion-mint p-8 sm:p-12 rounded-3xl text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#FFFDF7] flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8 text-[#059669]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--dp-color-ink)]">
              All Clear! Zero Weak Topics
            </h2>
            <p className="text-sm text-[var(--dp-color-ink-secondary)] mt-1 max-w-md mx-auto">
              Your accuracy across all attempted topics is above 60%. Keep up the momentum by practicing new syllabus units.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('practice')}
            className="clay-btn-primary px-6 py-2.5 text-sm font-bold clay-focus cursor-pointer inline-flex items-center gap-2 shadow-sm"
          >
            <BookOpen className="w-4 h-4" />
            <span>Practice New Units</span>
          </button>
        </div>
      )}

      {/* Overview of Mastered Topics */}
      <div className="clay-tray-cream p-6 sm:p-8 rounded-3xl">
        <h3 className="text-lg font-bold text-[var(--dp-color-ink)] mb-4">
          Mastered Topics ({masteries.filter((m) => !m.needs_revision && m.total_attempts > 0).length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {masteries
            .filter((m) => !m.needs_revision && m.total_attempts > 0)
            .map((m) => (
              <div
                key={m.topic_id}
                className="clay-cushion-mint p-4 rounded-2xl flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-sm text-[var(--dp-color-ink)]">{m.topic_title}</h4>
                  <span className="text-xs text-[var(--dp-color-ink-secondary)]">{m.unit_title}</span>
                </div>
                <span className="font-mono tabular-nums font-bold text-xs bg-[#FFFDF7] px-2.5 py-1 rounded-full text-[var(--dp-color-ink)] shadow-xs">
                  {m.accuracy}%
                </span>
              </div>
            ))}
        </div>
      </div>

    </div>
  );
};
