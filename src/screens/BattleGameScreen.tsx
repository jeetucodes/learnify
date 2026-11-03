import React, { useState, useEffect, useRef } from 'react';
import {
  Crown,
  Medal,
  CheckCircle2,
  XCircle,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  submitBattleAnswer,
  getBattleChannel,
  getBattleParticipants,
} from '../lib/storage';
import { SEED_QUESTIONS } from '../lib/seedData';
import { triggerConfetti } from '../components/Confetti';
import type { BattleRoom, BattleParticipant, Question } from '../types/database';

interface BattleGameScreenProps {
  room: BattleRoom;
  initialParticipants: BattleParticipant[];
  onExit: () => void;
}

export const BattleGameScreen: React.FC<BattleGameScreenProps> = ({
  room,
  initialParticipants,
  onExit,
}) => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<BattleParticipant[]>(initialParticipants);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState<{
    correct: boolean;
    points: number;
  } | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);

  const questions: Question[] = room.question_ids
    .map((id) => SEED_QUESTIONS.find((q) => q.id === id))
    .filter(Boolean) as Question[];

  const currentQ = questions[currentQIndex] || SEED_QUESTIONS[0];
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const channel = getBattleChannel(room.code);

    const handleMessage = (e: MessageEvent) => {
      const data = e.data;
      if (data?.type === 'SCORE_UPDATED') {
        setParticipants(data.participants);
      }
    };

    channel.addEventListener('message', handleMessage);

    getBattleParticipants(room.code).then((p) => {
      setParticipants(p);
    });

    return () => {
      channel.removeEventListener('message', handleMessage);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [room.code]);

  const handleTimeExpired = () => {
    if (currentQIndex + 1 < questions.length) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      setIsGameOver(true);
      triggerConfetti();
    }
  };

  useEffect(() => {
    if (isGameOver) return;

    setTimeLeft(15);
    setSelectedOption(null);
    setHasAnswered(false);
    setAnswerResult(null);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeExpired();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQIndex, isGameOver]);

  const handleSelectOption = async (optionIndex: number) => {
    if (hasAnswered || isGameOver || !user) return;

    setSelectedOption(optionIndex);
    setHasAnswered(true);

    const isCorrect = optionIndex === currentQ.answer_index;
    const timeBonus = Math.max(0, timeLeft * 2);
    const points = isCorrect ? 10 + timeBonus : 0;

    setAnswerResult({ correct: isCorrect, points });

    try {
      await submitBattleAnswer(
        room.code,
        user.id,
        currentQIndex,
        optionIndex,
        timeLeft
      );
      const updated = await getBattleParticipants(room.code);
      setParticipants(updated);
    } catch (err) {
      console.error(err);
    }

    setTimeout(() => {
      if (currentQIndex + 1 < questions.length) {
        setCurrentQIndex((prev) => prev + 1);
      } else {
        setIsGameOver(true);
        triggerConfetti();
      }
    }, 1200);
  };

  const myParticipant = participants.find((p) => p.user_id === user?.id);
  const opponent = participants.find((p) => p.user_id !== user?.id) || {
    id: 'opponent-placeholder',
    room_id: room.id,
    user_id: 'opponent',
    name: 'Opponent',
    score: 0,
    answers: [],
  };

  const isWinner = myParticipant && myParticipant.score >= opponent.score;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 text-left font-clay">
      
      {/* Live Duel Split Scoreboard */}
      <div className="clay-tray-cream p-4 sm:p-6 rounded-3xl">
        <div className="grid grid-cols-12 gap-3 items-center">
          
          {/* Player (Left) */}
          <div className="col-span-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--dp-color-primary-action)] text-[#FFFDF7] font-bold flex items-center justify-center shrink-0 shadow-xs">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-[var(--dp-color-ink-secondary)] block">YOU</span>
              <span className="text-sm font-bold text-[var(--dp-color-ink)] truncate block">
                {user?.name.split(' ')[0]}
              </span>
              <span className="font-mono text-lg font-extrabold tabular-nums text-[var(--dp-color-primary-action)]">
                {myParticipant?.score || 0} pts
              </span>
            </div>
          </div>

          {/* Center Timer & Round */}
          <div className="col-span-2 flex flex-col items-center justify-center">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center font-mono font-bold text-base shadow-xs ${
                timeLeft <= 5 ? 'clay-tray-pink text-[#E11D48] animate-pulse' : 'clay-cushion-yellow text-[var(--dp-color-ink)]'
              }`}
            >
              {timeLeft}s
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--dp-color-ink-secondary)] mt-1">
              Q {currentQIndex + 1}/{questions.length}
            </span>
          </div>

          {/* Opponent (Right) */}
          <div className="col-span-5 flex items-center justify-end gap-3 text-right">
            <div className="min-w-0">
              <span className="text-xs font-bold text-[var(--dp-color-ink-secondary)] block">OPPONENT</span>
              <span className="text-sm font-bold text-[var(--dp-color-ink)] truncate block">
                {opponent.name}
              </span>
              <span className="font-mono text-lg font-extrabold tabular-nums text-[#D97706]">
                {opponent.score || 0} pts
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[var(--dp-color-surface-warm)] text-[var(--dp-color-ink)] font-bold flex items-center justify-center shrink-0 shadow-xs">
              {opponent.name.charAt(0).toUpperCase()}
            </div>
          </div>

        </div>
      </div>

      {/* Main Question Arena in Cream Tray */}
      <div className="clay-tray-cream p-6 sm:p-10 rounded-3xl space-y-6 relative">
        <div className="flex items-center justify-between pb-3 border-b border-[#38315A]/[0.08]">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--dp-color-ink-secondary)]">
            Speed Round {currentQIndex + 1} of {questions.length}
          </span>
          <span className="text-xs font-bold text-[#D97706] flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 fill-current" /> Fast answers earn time bonus
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-[var(--dp-color-ink)] leading-snug">
          {currentQ.question}
        </h2>

        {/* Options */}
        <div className="space-y-3">
          {currentQ.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === currentQ.answer_index;

            let tileStyle = 'clay-cushion-cream text-[var(--dp-color-ink)] hover:-translate-y-0.5';

            if (hasAnswered) {
              if (isCorrect) {
                tileStyle = 'clay-cushion-mint border-2 border-[#10B981] font-bold';
              } else if (isSelected) {
                tileStyle = 'clay-tray-pink border-2 border-[#E11D48] font-bold';
              } else {
                tileStyle = 'opacity-60 bg-[#EEF0FB]';
              }
            }

            return (
              <button
                key={option}
                type="button"
                disabled={hasAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-4 sm:p-5 rounded-2xl flex items-center justify-between text-left transition-all duration-180 clay-focus ${tileStyle} cursor-pointer`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-[#FFFDF7] font-mono font-bold text-sm flex items-center justify-center text-[var(--dp-color-ink)] shadow-xs">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-base font-semibold leading-relaxed">
                    {option}
                  </span>
                </div>

                {hasAnswered && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" />
                )}
                {hasAnswered && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-[#E11D48] shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Result Toast */}
        {answerResult && (
          <div
            className={`p-3.5 rounded-2xl text-center text-sm font-bold shadow-xs ${
              answerResult.correct
                ? 'clay-cushion-mint text-[#065F46]'
                : 'clay-tray-pink text-[#9F1239]'
            }`}
          >
            {answerResult.correct
              ? `⚡ Speed Hit! +${answerResult.points} points awarded!`
              : 'Missed! 0 points for this round.'}
          </div>
        )}
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2540]/60 backdrop-blur-sm">
          <div className="clay-tray-cream p-8 sm:p-10 rounded-3xl max-w-md w-full text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 rounded-3xl bg-[var(--dp-color-surface-warm)] flex items-center justify-center mx-auto shadow-md">
              {isWinner ? (
                <Crown className="w-10 h-10 text-[#D97706]" />
              ) : (
                <Medal className="w-10 h-10 text-[var(--dp-color-ink-secondary)]" />
              )}
            </div>

            <div>
              <h2 className="text-3xl font-extrabold text-[var(--dp-color-ink)]">
                {isWinner ? 'Victory Claimed! 🏆' : 'Defeat! Good Fight ⚔️'}
              </h2>
              <p className="text-sm text-[var(--dp-color-ink-secondary)] mt-1">
                Final match score committed to student battle ranks.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="clay-cushion-mint p-4 rounded-2xl">
                <span className="text-xs font-bold text-[var(--dp-color-ink-secondary)]">Your Score</span>
                <span className="text-2xl font-extrabold font-mono text-[var(--dp-color-ink)] block mt-0.5">
                  {myParticipant?.score || 0}
                </span>
              </div>

              <div className="clay-cushion-cream p-4 rounded-2xl">
                <span className="text-xs font-bold text-[var(--dp-color-ink-secondary)]">Opponent</span>
                <span className="text-2xl font-extrabold font-mono text-[var(--dp-color-ink)] block mt-0.5">
                  {opponent.score || 0}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onExit}
              className="clay-btn-primary w-full py-3.5 text-base font-bold clay-focus cursor-pointer shadow-md"
            >
              Return to Battle Lobby
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
