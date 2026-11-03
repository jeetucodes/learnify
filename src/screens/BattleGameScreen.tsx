import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  submitBattleAnswer,
  advanceBattleQuestion,
  getQuestionsForBattle,
  getBattleParticipants,
  subscribeToBattle,
  awardBattleXP,
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
  SugaryFlame,
} from '../components/SugaryIcons';
import type { BattleRoom, BattleParticipant, Question } from '../types/database';

interface BattleGameScreenProps {
  room: BattleRoom;
  initialParticipants: BattleParticipant[];
  onExit: () => void;
}

export const BattleGameScreen: React.FC<BattleGameScreenProps> = ({
  room: initialRoom,
  initialParticipants,
  onExit,
}) => {
  const { user, updateUserStats } = useAuth();
  const [room, setRoom] = useState<BattleRoom>(initialRoom);
  const [participants, setParticipants] = useState<BattleParticipant[]>(initialParticipants);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState<{
    correct: boolean;
    points: number;
  } | null>(null);
  const [revealedAnswerIndex, setRevealedAnswerIndex] = useState<number | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [awardedXp, setAwardedXp] = useState<number | null>(null);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);

  const correctAnswersCountRef = useRef(0);
  const xpAwardedRef = useRef(false);
  const advancedForIndexRef = useRef<number | null>(null);
  const roomRef = useRef<BattleRoom>(initialRoom);
  roomRef.current = room;

  // 1. Fetch questions securely (answer_index is hidden as -1 initially)
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoadingQuestions(true);
      try {
        const fetched = await getQuestionsForBattle(initialRoom.question_ids);
        if (isMounted) {
          if (fetched.length > 0) {
            setQuestions(fetched);
          } else {
            // Fallback to seed questions with answer_index obscured
            setQuestions(
              SEED_QUESTIONS.slice(0, 10).map((q) => ({
                ...q,
                answer_index: -1,
              }))
            );
          }
        }
      } catch (err) {
        console.warn('Error loading battle questions:', err);
        if (isMounted) {
          setQuestions(
            SEED_QUESTIONS.slice(0, 10).map((q) => ({
              ...q,
              answer_index: -1,
            }))
          );
        }
      } finally {
        if (isMounted) setLoadingQuestions(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [initialRoom.id]);

  // 2. Realtime subscription to room changes and player leaderboard updates
  useEffect(() => {
    const unsubscribe = subscribeToBattle(
      room.id,
      room.code,
      (updatedRoom) => {
        setRoom((prev) => {
          if (updatedRoom.current_index !== prev.current_index) {
            // Host or server advanced to next question
            setSelectedOption(null);
            setHasAnswered(false);
            setAnswerResult(null);
            setRevealedAnswerIndex(null);
          }
          if (updatedRoom.status === 'finished') {
            setIsGameOver(true);
          }
          return updatedRoom;
        });
      },
      (updatedPlayers) => {
        setParticipants([...updatedPlayers].sort((a, b) => b.score - a.score));
      }
    );

    getBattleParticipants(room.id).then((p) => {
      setParticipants([...p].sort((a, b) => b.score - a.score));
    });

    return () => {
      unsubscribe();
    };
  }, [room.id, room.code]);

  const currentQIndex = room.current_index ?? 0;
  const currentQ = questions[currentQIndex] || questions[0] || SEED_QUESTIONS[0];

  // 3. Synchronized Server Countdown
  // Computes remaining time based on server question_started_at so all clients stay strictly in sync
  useEffect(() => {
    if (isGameOver) return;

    const timer = setInterval(() => {
      const current = roomRef.current;
      if (!current.question_started_at) {
        setTimeLeft(15);
        return;
      }

      const startedMs = new Date(current.question_started_at).getTime();
      const elapsedSeconds = Math.floor((Date.now() - startedMs) / 1000);
      const remaining = Math.max(0, 15 - elapsedSeconds);
      setTimeLeft(remaining);

      // Timer reached 0: close answering and trigger host advance
      if (remaining <= 0) {
        setHasAnswered(true);

        const isHost = user && current.host_id === user.id;
        if (isHost && advancedForIndexRef.current !== (current.current_index ?? 0)) {
          advancedForIndexRef.current = current.current_index ?? 0;
          // Small buffer to allow clients to see the round end state
          setTimeout(() => {
            advanceBattleQuestion(current.id, current.code).then((adv) => {
              if (adv.status === 'finished') {
                setIsGameOver(true);
              }
            });
          }, 1200);
        }
      }
    }, 250);

    return () => clearInterval(timer);
  }, [isGameOver, user?.id]);

  // 4. Simulated Rival Bot (if room has simulated bot players)
  useEffect(() => {
    if (isGameOver) return;
    const botOpponent = participants.find((p) => p.user_id.startsWith('bot_'));
    if (!botOpponent) return;

    const delay = 2500 + Math.random() * 3500;
    const timeout = setTimeout(() => {
      const botCorrect = Math.random() < 0.7;
      const botPoints = botCorrect ? 100 + Math.floor(Math.random() * 40) : 0;
      setParticipants((prev) =>
        prev
          .map((p) =>
            p.user_id === botOpponent.user_id
              ? { ...p, score: p.score + botPoints }
              : p
          )
          .sort((a, b) => b.score - a.score)
      );
    }, delay);

    return () => clearTimeout(timeout);
  }, [currentQIndex, isGameOver]);

  // 5. Submit Player Answer
  const handleSelectOption = async (optionIndex: number) => {
    if (hasAnswered || timeLeft <= 0 || isGameOver || !user) return;

    setSelectedOption(optionIndex);
    setHasAnswered(true);

    try {
      const res = await submitBattleAnswer(
        room.id,
        room.code,
        user.id,
        currentQIndex,
        optionIndex,
        timeLeft
      );

      setAnswerResult({ correct: res.correct, points: res.pointsAwarded });
      setRevealedAnswerIndex(res.answer_index !== undefined ? res.answer_index : null);

      if (res.correct) {
        correctAnswersCountRef.current += 1;
        setCorrectAnswersCount((c) => c + 1);
      }

      // Refresh participants
      const fresh = await getBattleParticipants(room.id);
      setParticipants([...fresh].sort((a, b) => b.score - a.score));

      // If host, check if all players have answered to advance sooner
      const isHost = room.host_id === user.id;
      if (isHost && participants.length <= 2 && advancedForIndexRef.current !== currentQIndex) {
        // Can optionally auto advance if all players submitted
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
  };

  // 6. Game Over & XP Awarding (+50 XP for Winner, +10 XP per correct question)
  useEffect(() => {
    if (isGameOver && user && !xpAwardedRef.current) {
      xpAwardedRef.current = true;
      const sorted = [...participants].sort((a, b) => b.score - a.score);
      const isWinner = sorted.length > 0 && sorted[0].user_id === user.id;
      const correctCount = correctAnswersCountRef.current;
      const totalBonus = (isWinner ? 50 : 0) + correctCount * 10;

      setAwardedXp(totalBonus);
      awardBattleXP(user.id, totalBonus).then((newXp) => {
        updateUserStats(totalBonus, newXp, user.streak || 1);
      });
      triggerConfetti();
    }
  }, [isGameOver, user, participants, updateUserStats]);

  const sortedPlayers = [...participants].sort((a, b) => b.score - a.score);
  const myRank = sortedPlayers.findIndex((p) => p.user_id === user?.id) + 1;
  const isWinner = myRank === 1;

  if (loadingQuestions) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h3 className="text-base font-bold text-slate-800">Synchronizing Battle Arena...</h3>
        <p className="text-xs text-slate-500 mt-1">Retrieving verified question cards</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 text-left">
      {/* 1. Live Multiplayer Leaderboard Bar */}
      <div className="bg-white border border-slate-200/80 shadow-[0_6px_20px_rgba(0,0,0,0.03)] p-4 sm:p-5 rounded-3xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Active Players Grid (Up to 4 Players) */}
          <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start flex-1">
            {sortedPlayers.map((player, idx) => {
              const isMe = player.user_id === user?.id;
              const medals = ['🥇', '🥈', '🥉', '4th'];
              return (
                <div
                  key={player.user_id}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border transition-all ${
                    isMe
                      ? 'bg-indigo-50 border-indigo-200 shadow-xs'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className="text-sm">{medals[idx] || `${idx + 1}th`}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-black truncate max-w-[90px] ${
                          isMe ? 'text-indigo-900' : 'text-slate-800'
                        }`}
                      >
                        {isMe ? 'YOU' : player.name.split(' ')[0]}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-mono font-black tabular-nums block ${
                        isMe ? 'text-indigo-600' : 'text-slate-600'
                      }`}
                    >
                      {player.score} pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center 15s Countdown with 3D Sugary Clock */}
          <div className="flex items-center gap-3 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-4">
            <div className="relative flex items-center justify-center">
              <SugaryClock size={42} />
              <span
                className={`absolute inset-0 flex items-center justify-center font-mono font-black text-xs pt-1 ${
                  timeLeft <= 5 ? 'text-rose-600 animate-pulse font-extrabold' : 'text-slate-900'
                }`}
              >
                {timeLeft}s
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-400 block">
                ROUND
              </span>
              <span className="text-xs font-bold text-slate-700 font-mono">
                {currentQIndex + 1} / {questions.length}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Main Question Arena */}
      <div className="bg-white border border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.03)] p-6 sm:p-9 rounded-3xl space-y-6 relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">
            Speed Duel · Question {currentQIndex + 1} of {questions.length}
          </span>
          <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            <SugaryBolt size={14} /> 100 pts + up to 50 speed bonus
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
          {currentQ?.question}
        </h2>

        {/* Options */}
        <div className="space-y-3">
          {currentQ?.options?.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isRevealedCorrect = revealedAnswerIndex !== null && idx === revealedAnswerIndex;

            let tileStyle =
              'bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-800 hover:-translate-y-0.5 shadow-xs';

            if (hasAnswered || timeLeft <= 0) {
              if (isRevealedCorrect) {
                tileStyle = 'bg-emerald-50 border-2 border-emerald-500 font-bold text-emerald-950';
              } else if (isSelected && !isRevealedCorrect && revealedAnswerIndex !== null) {
                tileStyle = 'bg-rose-50 border-2 border-rose-500 font-bold text-rose-950';
              } else if (isSelected && revealedAnswerIndex === null) {
                tileStyle = 'bg-indigo-50 border-2 border-indigo-400 font-bold text-indigo-950';
              } else {
                tileStyle = 'opacity-50 bg-slate-50 border border-slate-200';
              }
            }

            return (
              <button
                key={option}
                type="button"
                disabled={hasAnswered || timeLeft <= 0}
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-4 sm:p-5 rounded-2xl flex items-center justify-between text-left transition-all duration-180 ${tileStyle} cursor-pointer`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-slate-100 font-mono font-black text-sm flex items-center justify-center text-slate-700 shadow-xs">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-base font-semibold leading-relaxed">{option}</span>
                </div>

                {revealedAnswerIndex !== null && isRevealedCorrect && (
                  <SugaryCheck size={20} className="shrink-0" />
                )}
                {revealedAnswerIndex !== null && isSelected && !isRevealedCorrect && (
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
              ? `⚡ Speed Hit! +${answerResult.points} points added to your score!`
              : 'Incorrect choice! 0 points for this round.'}
          </div>
        )}

        {/* Time's up banner if player didn't answer */}
        {timeLeft <= 0 && !selectedOption && (
          <div className="p-3.5 rounded-2xl text-center text-sm font-bold bg-amber-50 border border-amber-200 text-amber-900">
            ⏳ Round timer ended! Preparing next question...
          </div>
        )}
      </div>

      {/* 3. Game Over & Final Results Podium Modal */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 shadow-2xl p-6 sm:p-9 rounded-3xl max-w-lg w-full text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
              {isWinner ? <SugaryTrophy size={48} /> : <SugaryStar size={48} />}
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                {isWinner ? 'Match Victory! 🏆' : `Rank #${myRank} Final Standing`}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Official real-time duel finished. Match XP credited to profile.
              </p>
            </div>

            {/* Final Leaderboard Podium */}
            <div className="space-y-2 bg-slate-50/70 p-3 rounded-2xl border border-slate-200">
              {sortedPlayers.map((p, idx) => {
                const isMe = p.user_id === user?.id;
                const badges = ['🥇 Champion', '🥈 Runner-up', '🥉 3rd Place', '4th Place'];
                return (
                  <div
                    key={p.user_id}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      isMe ? 'bg-indigo-50 border border-indigo-200 font-bold' : 'bg-white border border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-black text-slate-500">
                        {badges[idx]}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {isMe ? 'You' : p.name}
                      </span>
                    </div>
                    <span className="font-mono text-base font-black text-indigo-700">
                      {p.score} pts
                    </span>
                  </div>
                );
              })}
            </div>

            {/* XP Award Breakdown */}
            <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl text-left space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                <span className="flex items-center gap-1.5">
                  <SugaryFlame size={16} /> Match Performance XP
                </span>
                <span className="font-mono text-sm font-black text-amber-700">
                  +{awardedXp ?? ((isWinner ? 50 : 0) + correctAnswersCount * 10)} XP
                </span>
              </div>
              <div className="text-[11px] text-amber-800/80 flex items-center justify-between pt-1 border-t border-amber-200/60">
                <span>
                  {isWinner ? 'Victory Bonus (+50 XP) + ' : ''}
                  {correctAnswersCount} Correct Answers (+
                  {correctAnswersCount * 10} XP)
                </span>
                <span className="font-bold text-emerald-700">Added to Profile</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onExit}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-full text-sm font-bold shadow-sm cursor-pointer transition-all hover:shadow-md"
              >
                Play Again ⚔️
              </button>
              <button
                type="button"
                onClick={onExit}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-full text-sm font-bold cursor-pointer transition-all"
              >
                Back to Lobby
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
