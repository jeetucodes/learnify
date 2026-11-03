import React, { useState, useEffect } from 'react';
import {
  Flag,
  ArrowRight,
  HelpCircle,
  Zap,
  Check,
  X,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getQuestionsByTopic,
  recordAttempt,
  flagQuestion,
} from '../lib/storage';
import { ProgressBar } from '../components/ProgressBar';
import type { Question } from '../types/database';

interface QuizScreenProps {
  topicId: string;
  topicTitle?: string;
  customQuestions?: Question[];
  onFinish: (result: {
    score: number;
    total: number;
    xpEarned: number;
    weakTopics: string[];
  }) => void;
  onExit: () => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  topicId,
  topicTitle,
  customQuestions,
  onFinish,
  onExit,
}) => {
  const { user, updateUserStats } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [incorrectTopicIds, setIncorrectTopicIds] = useState<Set<string>>(new Set());
  const [flagged, setFlagged] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (customQuestions && customQuestions.length > 0) {
        setQuestions(customQuestions);
      } else {
        const q = await getQuestionsByTopic(topicId);
        setQuestions(q.slice(0, 10));
      }
      setLoading(false);
    }
    load();
  }, [topicId, customQuestions]);

  const currentQ = questions[currentIndex];

  const handleSelectOption = async (index: number) => {
    if (isAnswered || !currentQ || !user) return;

    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === currentQ.answer_index;
    if (isCorrect) {
      setScore((s) => s + 1);
      setTotalXpEarned((x) => x + 10);
    } else {
      if (currentQ.topic_id) {
        setIncorrectTopicIds((prev) => new Set(prev).add(currentQ.topic_id!));
      }
    }

    try {
      const res = await recordAttempt(
        user.id,
        currentQ.id,
        currentQ.topic_id || topicId || 'notes-quiz',
        isCorrect,
        index
      );
      updateUserStats(res.xpEarned, res.newTotalXp, res.newStreak);
    } catch (err) {
      console.error('Failed to record attempt:', err);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setFlagged(false);
    } else {
      onFinish({
        score: score + (selectedOption === currentQ?.answer_index ? 1 : 0),
        total: questions.length,
        xpEarned: totalXpEarned + (selectedOption === currentQ?.answer_index ? 10 : 0),
        weakTopics: Array.from(incorrectTopicIds),
      });
    }
  };

  const handleFlag = async () => {
    if (!currentQ || flagged) return;
    try {
      await flagQuestion(currentQ.id);
      setFlagged(true);
    } catch (err) {
      console.error('Failed to flag question:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 text-[var(--dp-color-ink)] font-clay">
        <div className="w-10 h-10 rounded-full border-3 border-[var(--dp-color-surface-support)] border-t-[var(--dp-color-primary-action)] animate-spin mb-4"></div>
        <span className="text-sm font-bold">Loading questions...</span>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="clay-tray-cream p-8 rounded-3xl">
          <h3 className="text-lg font-bold text-[var(--dp-color-ink)]">No Questions Found</h3>
          <p className="text-sm text-[var(--dp-color-ink-secondary)] mt-1">
            This topic currently has no calibrated MCQs in the question bank.
          </p>
          <button
            type="button"
            onClick={onExit}
            className="clay-btn-primary px-6 py-2.5 mt-5 text-sm font-bold clay-focus cursor-pointer"
          >
            Return to Topics
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = ((currentIndex + 1) / questions.length) * 100;
  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 text-left">
      
      {/* Top Header Controls Bar */}
      <div className="clay-cushion-cream p-4 rounded-3xl flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onExit}
          className="clay-btn-secondary px-4 py-1.5 text-xs font-bold clay-focus cursor-pointer"
        >
          ✕ Exit Quiz
        </button>

        <span className="text-sm font-bold text-[var(--dp-color-ink)] max-w-[200px] sm:max-w-xs truncate">
          {topicTitle || 'Practice Session'}
        </span>

        <div className="clay-cushion-yellow px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold text-[var(--dp-color-ink)] shadow-xs">
          <Zap className="w-3.5 h-3.5 text-[#D97706]" />
          <span className="font-mono tabular-nums font-extrabold">+{totalXpEarned} XP</span>
        </div>
      </div>

      {/* Progress & Question Counter */}
      <div className="clay-tray-cream p-5 rounded-3xl space-y-2.5">
        <div className="flex justify-between items-center text-xs font-bold text-[var(--dp-color-ink)]">
          <span className="font-mono tabular-nums">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="font-mono tabular-nums text-[var(--dp-color-primary-action)]">
            Score: {score} Correct
          </span>
        </div>
        <ProgressBar progress={progressPercent} heightClass="h-2.5" />
      </div>

      {/* Question Card in Cream Tray */}
      <div className="clay-tray-cream p-6 sm:p-10 rounded-3xl space-y-6 relative">
        
        {/* Source metadata & Flag action */}
        <div className="flex items-center justify-between pb-3 border-b border-[#38315A]/[0.08]">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EEF0FB] text-[var(--dp-color-ink)]">
            {currentQ.source === 'pyq' ? (
              <>
                <BookOpen className="w-3.5 h-3.5 text-[var(--dp-color-primary-action)]" />
                <span>Past Exam Question (PYQ)</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                <span>AI Generated MCQ</span>
              </>
            )}
          </span>

          <button
            type="button"
            onClick={handleFlag}
            disabled={flagged}
            className={`inline-flex items-center gap-1.5 text-xs font-bold transition px-3 py-1 rounded-full clay-focus ${
              flagged
                ? 'bg-[var(--dp-color-surface-compare)] text-[var(--dp-color-ink)]'
                : 'text-[var(--dp-color-ink-secondary)] hover:text-[#E11D48] hover:bg-[#EEF0FB]'
            }`}
            title="Report inaccurate question"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>{flagged ? 'Flagged' : 'Report'}</span>
          </button>
        </div>

        {/* Question Text */}
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--dp-color-ink)] leading-snug">
          {currentQ.question}
        </h2>

        {/* Option Tiles as Tactile Clay Buttons */}
        <div className="space-y-3 pt-2">
          {currentQ.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrectAnswer = idx === currentQ.answer_index;

            let tileStyle = 'clay-cushion-cream text-[var(--dp-color-ink)] hover:-translate-y-0.5';

            if (isAnswered) {
              if (isCorrectAnswer) {
                tileStyle = 'clay-cushion-mint border-2 border-[#10B981] font-bold text-[var(--dp-color-ink)]';
              } else if (isSelected) {
                tileStyle = 'clay-tray-pink border-2 border-[#E11D48] font-bold text-[var(--dp-color-ink)]';
              } else {
                tileStyle = 'opacity-60 bg-[#EEF0FB] text-[var(--dp-color-ink-secondary)]';
              }
            }

            return (
              <button
                key={option}
                type="button"
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-4 sm:p-5 rounded-2xl flex items-center justify-between text-left transition-all duration-180 clay-focus ${tileStyle} cursor-pointer`}
              >
                <div className="flex items-center gap-3.5 pr-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FFFDF7] font-mono font-bold text-sm text-[var(--dp-color-ink)] shadow-xs">
                    {letters[idx] || idx + 1}
                  </span>
                  <span className="text-base font-semibold leading-relaxed">
                    {option}
                  </span>
                </div>

                {isAnswered && (
                  <div className="shrink-0">
                    {isCorrectAnswer ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#065F46] bg-[#FFFDF7] px-2.5 py-1 rounded-full shadow-xs">
                        <Check className="w-4 h-4 text-[#059669]" />
                        <span>Correct +10 XP</span>
                      </div>
                    ) : isSelected ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#9F1239] bg-[#FFFDF7] px-2.5 py-1 rounded-full shadow-xs">
                        <X className="w-4 h-4 text-[#E11D48]" />
                        <span>Incorrect</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation & Next Step Drawer */}
        {isAnswered && (
          <div className="clay-cushion-blue p-5 sm:p-6 rounded-2xl space-y-4 pt-4 border border-[#C9E4FB]">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-[var(--dp-color-primary-action)] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--dp-color-ink-secondary)] block">
                  Concept Rationale
                </span>
                <p className="text-sm text-[var(--dp-color-ink)] mt-1 leading-relaxed">
                  {currentQ.explanation}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#38315A]/10">
              <button
                type="button"
                onClick={handleNext}
                className="clay-btn-primary px-8 py-3 text-sm font-bold flex items-center gap-2 clay-focus cursor-pointer shadow-md"
              >
                <span>{currentIndex + 1 < questions.length ? 'Next Question' : 'Complete Quiz'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
