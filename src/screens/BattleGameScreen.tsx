import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  submitBattleAnswer,
  getBattleChannel,
  getBattleParticipants,
} from '../lib/storage';
import { SEED_QUESTIONS } from '../lib/seedData';
import { triggerConfetti } from '../components/Confetti';
import {
  SugaryBolt,
  SugaryCheck,
  SugaryAlert,
  SugaryTrophy,
  SugaryClock,
  SugaryStar,
} from '../components/SugaryIcons';
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

    // If opponent is a bot / simulated rival, simulate their answer
    const currentOpponent = participants.find((p) => p.user_id !== user?.id);
    let botTimer: ReturnType<typeof setTimeout> | null = null;
    if (
      currentOpponent &&
      (currentOpponent.user_id.startsWith('bot_') ||
        currentOpponent.user_id === 'opponent' ||
        currentOpponent.user_id === 'opponent-placeholder')
    ) {
      const delayMs = 2500 + Math.random() * 4000;
      botTimer = setTimeout(() => {
        const isBotCorrect = Math.random() < 0.75;
        const botPoints = isBotCorrect ? 10 + Math.floor(Math.random() * 12) : 0;
        setParticipants((prev) =>
          prev.map((p) =>
            p.user_id === currentOpponent.user_id
              ? { ...p, score: p.score + botPoints }
              : p
          )
        );
      }, delayMs);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (botTimer) clearTimeout(botTimer);
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
    <div className="max-w-3xl mx-auto space-y-6 pb-20 text-left">
      
      {/* Live Duel Split Scoreboard */}
      <div className="bg-white border border-slate-200/80 shadow-[0_6px_20px_rgba(0,0,0,0.03)] p-4 sm:p-6 rounded-3xl">
        <div className="grid grid-cols-12 gap-3 items-center">
          
          {/* Player (Left) */}
          <div className="col-span-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black text-indigo-600 block">YOU</span>
              <span className="text-sm font-bold text-slate-900 truncate block">
                {user?.name.split(' ')[0]}
              </span>
              <span className="font-mono text-lg font-black tabular-nums text-indigo-700">
                {myParticipant?.score || 0} pts
              </span>
            </div>
          </div>

          {/* Center Timer & Round with 3D Sugary Clock */}
          <div className="col-span-2 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
              <SugaryClock size={40} />
              <span
                className={`absolute inset-0 flex items-center justify-center font-mono font-black text-xs pt-1 ${
                  timeLeft <= 5 ? 'text-rose-600 animate-pulse font-extrabold' : 'text-slate-900'
                }`}
              >
                {timeLeft}s
              </span>
            </div>
            <span className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-400 mt-1">
              Q {currentQIndex + 1}/{questions.length}
            </span>
          </div>

          {/* Opponent (Right) */}
          <div className="col-span-5 flex items-center justify-end gap-3 text-right">
            <div className="min-w-0">
              <span className="text-xs font-black text-amber-700 block">OPPONENT</span>
              <span className="text-sm font-bold text-slate-900 truncate block">
                {opponent.name}
              </span>
              <span className="font-mono text-lg font-black tabular-nums text-amber-700">
                {opponent.score || 0} pts
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shrink-0 shadow-xs">
              {opponent.name.charAt(0).toUpperCase()}
            </div>
          </div>

        </div>
      </div>

      {/* Main Question Arena */}
      <div className="bg-white border border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.03)] p-6 sm:p-9 rounded-3xl space-y-6 relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">
            Speed Round {currentQIndex + 1} of {questions.length}
          </span>
          <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            <SugaryBolt size={14} /> Fast answers earn time bonus
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
          {currentQ.question}
        </h2>

        {/* Options */}
        <div className="space-y-3">
          {currentQ.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === currentQ.answer_index;

            let tileStyle = 'bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-800 hover:-translate-y-0.5 shadow-xs';

            if (hasAnswered) {
              if (isCorrect) {
                tileStyle = 'bg-emerald-50 border-2 border-emerald-500 font-bold text-emerald-950';
              } else if (isSelected) {
                tileStyle = 'bg-rose-50 border-2 border-rose-500 font-bold text-rose-950';
              } else {
                tileStyle = 'opacity-50 bg-slate-50 border border-slate-200';
              }
            }

            return (
              <button
                key={option}
                type="button"
                disabled={hasAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-4 sm:p-5 rounded-2xl flex items-center justify-between text-left transition-all duration-180 ${tileStyle} cursor-pointer`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-slate-100 font-mono font-black text-sm flex items-center justify-center text-slate-700 shadow-xs">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-base font-semibold leading-relaxed">
                    {option}
                  </span>
                </div>

                {hasAnswered && isCorrect && (
                  <SugaryCheck size={20} className="shrink-0" />
                )}
                {hasAnswered && isSelected && !isCorrect && (
                  <SugaryAlert size={20} className="shrink-0" />
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
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border border-rose-200 text-rose-900'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 shadow-2xl p-8 sm:p-10 rounded-3xl max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
              {isWinner ? (
                <SugaryTrophy size={48} />
              ) : (
                <SugaryStar size={48} />
              )}
            </div>

            <div>
              <h2 className="text-3xl font-black text-slate-900">
                {isWinner ? 'Victory Claimed! 🏆' : 'Defeat! Good Fight ⚔️'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Final match score committed to student battle ranks.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
                <span className="text-xs font-black text-emerald-800">Your Score</span>
                <span className="text-2xl font-black font-mono text-slate-900 block mt-0.5">
                  {myParticipant?.score || 0}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                <span className="text-xs font-black text-slate-500">Opponent</span>
                <span className="text-2xl font-black font-mono text-slate-900 block mt-0.5">
                  {opponent.score || 0}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onExit}
              className="bg-indigo-600 hover:bg-indigo-700 text-white w-full py-3.5 rounded-full text-base font-bold shadow-sm cursor-pointer transition-all"
            >
              Return to Battle Lobby
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
