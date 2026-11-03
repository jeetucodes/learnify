import React, { useState, useEffect } from 'react';
import {
  Flag,
  ArrowRight,
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
import {
  SugaryBolt,
  SugaryCheck,
  SugaryAlert,
  SugaryLightbulb,
} from '../components/SugaryIcons';
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
    <div className="max-w-3xl mx-auto space-y-5 pb-20 text-left">
      
      {/* Top Header Controls Bar */}
      <div className="bg-white border border-slate-200/80 shadow-xs p-4 rounded-3xl flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onExit}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
        >
          ✕ Exit Quiz
        </button>

        <span className="text-sm font-extrabold text-slate-900 max-w-[200px] sm:max-w-xs truncate">
          {topicTitle || 'Practice Session'}
        </span>

        <div className="bg-amber-50 border border-amber-200/80 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-extrabold text-amber-900 shadow-xs">
          <SugaryBolt size={18} />
          <span className="font-mono tabular-nums">+{totalXpEarned} XP</span>
        </div>
      </div>

      {/* Progress & Question Counter */}
      <div className="bg-white border border-slate-200/80 shadow-xs p-5 rounded-3xl space-y-2.5">
        <div className="flex justify-between items-center text-xs font-bold text-slate-700">
          <span className="font-mono tabular-nums font-extrabold">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="font-mono tabular-nums text-indigo-600 font-extrabold">
            Score: {score} Correct
          </span>
        </div>
        <ProgressBar progress={progressPercent} heightClass="h-2.5" />
      </div>

      {/* Question Card */}
      <div className="bg-white border border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.03)] p-6 sm:p-9 rounded-3xl space-y-6 relative">
        
        {/* Source metadata & Flag action */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700">
            {currentQ.source === 'pyq' ? (
              <>
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Past Exam Question (PYQ)</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>AI Generated MCQ</span>
              </>
            )}
          </span>

          <button
            type="button"
            onClick={handleFlag}
            disabled={flagged}
            className={`inline-flex items-center gap-1.5 text-xs font-bold transition px-3 py-1 rounded-full ${
              flagged
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'text-slate-400 hover:text-rose-600 hover:bg-slate-50'
            }`}
            title="Report inaccurate question"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>{flagged ? 'Flagged' : 'Report'}</span>
          </button>
        </div>

        {/* Question Text */}
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
          {currentQ.question}
        </h2>

        {/* Option Tiles */}
        <div className="space-y-3 pt-2">
          {currentQ.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrectAnswer = idx === currentQ.answer_index;

            let tileStyle = 'bg-white hover:bg-slate-50/80 border border-slate-200/90 text-slate-800 hover:-translate-y-0.5 shadow-xs';

            if (isAnswered) {
              if (isCorrectAnswer) {
                tileStyle = 'bg-emerald-50/90 border-2 border-emerald-500 font-bold text-emerald-950 shadow-xs';
              } else if (isSelected) {
                tileStyle = 'bg-rose-50/90 border-2 border-rose-500 font-bold text-rose-950 shadow-xs';
              } else {
                tileStyle = 'opacity-50 bg-slate-50 border border-slate-200 text-slate-500';
              }
            }

            return (
              <button
                key={option}
                type="button"
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-4 sm:p-5 rounded-2xl flex items-center justify-between text-left transition-all duration-180 ${tileStyle} cursor-pointer`}
              >
                <div className="flex items-center gap-3.5 pr-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-mono font-black text-sm text-slate-700 shadow-xs">
                    {letters[idx] || idx + 1}
                  </span>
                  <span className="text-base font-semibold leading-relaxed">
                    {option}
                  </span>
                </div>

                {isAnswered && (
                  <div className="shrink-0">
                    {isCorrectAnswer ? (
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 bg-white px-2.5 py-1 rounded-full shadow-xs border border-emerald-200">
                        <SugaryCheck size={16} />
                        <span>Correct +10 XP</span>
                      </div>
                    ) : isSelected ? (
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-rose-800 bg-white px-2.5 py-1 rounded-full shadow-xs border border-rose-200">
                        <SugaryAlert size={16} />
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
          <div className="bg-indigo-50/70 border border-indigo-100 p-5 sm:p-6 rounded-2xl space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                <SugaryLightbulb size={24} />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-800 block">
                  Concept Rationale & Insight
                </span>
                <p className="text-sm text-slate-700 mt-1 leading-relaxed font-medium">
                  {currentQ.explanation}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-indigo-100/80">
              <button
                type="button"
                onClick={handleNext}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
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
