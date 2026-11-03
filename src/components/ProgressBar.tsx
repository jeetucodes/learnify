import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number; // 0 to 100
  colorClass?: string;
  heightClass?: string;
  showLabel?: boolean;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  colorClass = 'bg-[var(--dp-color-primary-action)]',
  heightClass = 'h-3',
  showLabel = false,
  label = 'Progress',
}) => {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-bold text-[var(--dp-color-ink-secondary)]">
          <span>{label}</span>
          <span className="font-mono tabular-nums text-[var(--dp-color-ink)] font-bold">{Math.round(clamped)}%</span>
        </div>
      )}
      {/* Recessed Clay meter track */}
      <div className={`w-full bg-[#E5E8F5] rounded-full overflow-hidden ${heightClass} shadow-[inset_2px_2px_4px_rgba(56,49,90,0.16),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] relative p-0.5`}>
        <motion.div
          className={`h-full rounded-full ${colorClass} shadow-[0_2px_6px_rgba(74,63,209,0.25)] relative overflow-hidden`}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Subtle upper highlight */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-white/30 rounded-full pointer-events-none" />
        </motion.div>
      </div>
    </div>
  );
};
