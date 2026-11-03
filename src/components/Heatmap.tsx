import React from 'react';
import type { TopicMastery } from '../types/database';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface HeatmapProps {
  masteryList: TopicMastery[];
  onSelectTopic?: (topicId: string) => void;
}

export const Heatmap: React.FC<HeatmapProps> = ({ masteryList, onSelectTopic }) => {
  return (
    <div className="w-full">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-bold text-[var(--dp-color-ink)]">
            Topic Mastery Matrix
          </h3>
          <p className="text-xs text-[var(--dp-color-ink-secondary)]">
            Live syllabus retention breakdown by topic
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2.5 text-xs font-semibold text-[var(--dp-color-ink-secondary)]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--dp-color-surface-support)] text-[var(--dp-color-ink)] font-bold text-[11px]">
            <CheckCircle2 className="w-3 h-3 text-[#2B2540]" /> Mastered
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--dp-color-surface-compare)] text-[var(--dp-color-ink)] font-bold text-[11px]">
            <AlertCircle className="w-3 h-3 text-[#2B2540]" /> Weak
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E5E8F5] text-[var(--dp-color-ink-secondary)] font-bold text-[11px]">
            <Clock className="w-3 h-3" /> New
          </span>
        </div>
      </div>

      {/* Grid of Clay Topic Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {masteryList.map((m, idx) => {
          const hasAttempts = m.total_attempts > 0;
          const isCritical = hasAttempts && m.accuracy < 60;
          const isMastered = hasAttempts && m.accuracy >= 75;

          const cardStyle = isCritical
            ? 'clay-tray-pink border border-[#F8CFE3]'
            : isMastered
            ? 'clay-cushion-mint border border-[#BFEFD9]'
            : hasAttempts
            ? 'clay-cushion-yellow border border-[#FFE29A]'
            : 'clay-cushion-cream border border-[#FFFDF7]';

          return (
            <button
              key={m.topic_id}
              type="button"
              onClick={() => onSelectTopic && onSelectTopic(m.topic_id)}
              className={`${cardStyle} text-left p-4 rounded-2xl transition-all duration-180 hover:-translate-y-1 active:scale-[0.98] flex flex-col justify-between min-h-[110px] clay-focus cursor-pointer group`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--dp-color-ink-secondary)]">
                  Topic #{String(idx + 1).padStart(2, '0')}
                </span>
                {isCritical ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFFDF7] text-[var(--dp-color-ink)] shadow-sm">
                    Revise
                  </span>
                ) : isMastered ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFFDF7] text-[var(--dp-color-ink)] shadow-sm">
                    Mastered
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-[var(--dp-color-ink-secondary)]">
                    {hasAttempts ? 'Learning' : 'Unstarted'}
                  </span>
                )}
              </div>

              <div className="text-sm font-bold text-[var(--dp-color-ink)] line-clamp-2 leading-snug">
                {m.topic_title}
              </div>

              <div className="mt-3 pt-2 border-t border-[#38315A]/10 flex items-center justify-between text-xs font-mono tabular-nums">
                <span className="font-bold text-[var(--dp-color-ink)]">
                  {hasAttempts ? `${m.accuracy}%` : '—'}
                </span>
                <span className="text-[var(--dp-color-ink-secondary)]">
                  {m.total_attempts} {m.total_attempts === 1 ? 'attempt' : 'attempts'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
