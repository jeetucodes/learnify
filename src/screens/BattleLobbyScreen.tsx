import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Users,
  Play,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  createBattleRoom,
  joinBattleRoom,
  startBattle,
  getBattleParticipants,
  getBattleChannel,
} from '../lib/storage';
import { SugarySwords, SugaryTrophy, SugarySparkles } from '../components/SugaryIcons';
import type { BattleRoom, BattleParticipant } from '../types/database';

interface BattleLobbyScreenProps {
  onStartGame: (room: BattleRoom, participants: BattleParticipant[]) => void;
}

export const BattleLobbyScreen: React.FC<BattleLobbyScreenProps> = ({ onStartGame }) => {
  const { user } = useAuth();
  const [room, setRoom] = useState<BattleRoom | null>(null);
  const [participants, setParticipants] = useState<BattleParticipant[]>([]);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!room) return;

    const channel = getBattleChannel(room.code);
    const handleMessage = (e: MessageEvent) => {
      const data = e.data;
      if (data?.type === 'ROOM_UPDATED') {
        setRoom(data.room);
        setParticipants(data.participants);
      } else if (data?.type === 'BATTLE_STARTED') {
        onStartGame(data.room, participants);
      }
    };

    channel.addEventListener('message', handleMessage);

    getBattleParticipants(room.code).then((p) => {
      setParticipants(p);
    });

    return () => {
      channel.removeEventListener('message', handleMessage);
    };
  }, [room?.code, onStartGame, participants]);

  const handleCreateRoom = async () => {
    if (!user) return;
    setError(null);
    setLoading(true);
    try {
      const newRoom = await createBattleRoom(user.id, user.name);
      setRoom(newRoom);
      const parts = await getBattleParticipants(newRoom.code);
      setParticipants(parts);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize battle room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !joinCodeInput.trim()) return;

    setError(null);
    setLoading(true);
    try {
      const { room: joinedRoom, participants: parts } = await joinBattleRoom(
        joinCodeInput.trim().toUpperCase(),
        user.id,
        user.name
      );
      setRoom(joinedRoom);
      setParticipants(parts);
    } catch (err: any) {
      setError(err.message || 'Room code verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStartBattle = async () => {
    if (!room || !user) return;
    setError(null);
    setLoading(true);
    try {
      const started = await startBattle(room.code, user.id);
      onStartGame(started, participants);
    } catch (err: any) {
      setError(err.message || 'Failed to start battle');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isHost = room && user && room.host_id === user.id;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 text-left">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-amber-50/90 via-white to-orange-50/80 border border-amber-200/80 p-6 sm:p-10 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_8px_24px_rgba(245,158,11,0.06)]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1 text-xs font-bold text-amber-900 mb-3 border border-amber-200/80 shadow-xs">
            <SugarySwords size={18} />
            <span>Real-time Multiplayer Duel</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">
            1v1 Speed Battle
          </h1>
          <p className="mt-2 text-xs sm:text-base text-slate-600 leading-relaxed max-w-lg">
            Challenge a classmate to 5 rapid-fire questions. Fastest correct answer claims the crown and bonus XP!
          </p>
        </div>

        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white border border-amber-200 shadow-xs self-start sm:self-auto">
          <SugaryTrophy size={38} />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-xs sm:text-sm font-bold text-rose-800">
          {error}
        </div>
      )}

      {/* Main Container */}
      {!room ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Create Room Card */}
          <div className="bg-white border border-slate-200/80 shadow-[0_8px_24px_rgba(0,0,0,0.02)] p-7 sm:p-8 rounded-3xl flex flex-col justify-between space-y-6">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shadow-xs mb-4">
                <SugarySparkles size={34} />
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Host a Battle Room
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed font-medium">
                Create a private 6-digit match code and share it with your friend.
              </p>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleCreateRoom}
              className="bg-indigo-600 hover:bg-indigo-700 text-white w-full py-3.5 rounded-full text-base font-bold flex items-center justify-center gap-2 shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Creating...' : 'Create Battle Room'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Join Room Card */}
          <div className="bg-white border border-slate-200/80 shadow-[0_8px_24px_rgba(0,0,0,0.02)] p-7 sm:p-8 rounded-3xl flex flex-col justify-between space-y-6">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-xs mb-4">
                <Users className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Join with Room Code
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed font-medium">
                Enter the 6-character room code from your opponent to jump into their lobby.
              </p>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-3">
              <input
                type="text"
                maxLength={6}
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="ENTER CODE (E.G. X7K9P2)"
                className="w-full h-12 rounded-full bg-slate-50 border border-slate-200 px-5 text-center font-mono tracking-widest text-base font-black text-slate-900 uppercase placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <button
                type="submit"
                disabled={loading || joinCodeInput.length < 4}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 w-full py-3.5 rounded-full text-base font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Joining...' : 'Enter Battle Room'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      ) : (
        /* Active Waiting Lobby */
        <div className="bg-white border border-slate-200/80 shadow-[0_12px_36px_rgba(0,0,0,0.03)] p-8 sm:p-10 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#38315A]/10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--dp-color-ink-secondary)] block">
                Active Battle Room
              </span>
              <div className="flex items-center gap-3 mt-1">
                <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-widest text-[var(--dp-color-ink)]">
                  {room.code}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="clay-btn-secondary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 clay-focus cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#059669]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs font-bold text-[var(--dp-color-ink-secondary)]">
                Status: Waiting for players
              </span>
              <span className="block text-sm font-bold text-[var(--dp-color-ink)]">
                {participants.length} / 2 Players Connected
              </span>
            </div>
          </div>

          {/* Participant Cushions */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--dp-color-ink-secondary)] mb-3">
              Fighters in Lobby
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {participants.map((p, idx) => (
                <div
                  key={p.user_id}
                  className="clay-cushion-cream p-4 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--dp-color-accent)] text-[var(--dp-color-ink)] font-bold flex items-center justify-center shadow-xs">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-base text-[var(--dp-color-ink)] block">
                        {p.name}
                      </span>
                      <span className="text-xs text-[var(--dp-color-ink-secondary)]">
                        {idx === 0 ? '👑 Room Host' : '⚔️ Challenger'}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--dp-color-surface-support)] text-[var(--dp-color-ink)]">
                    Ready
                  </span>
                </div>
              ))}

              {participants.length < 2 && (
                <div className="border-2 border-dashed border-[#38315A]/15 rounded-2xl p-4 flex items-center justify-center text-xs font-bold text-[var(--dp-color-ink-secondary)] min-h-[72px]">
                  <span>Waiting for opponent to join...</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setRoom(null)}
              className="clay-btn-secondary px-5 py-2.5 text-sm font-bold clay-focus cursor-pointer w-full sm:w-auto"
            >
              Leave Room
            </button>

            {isHost ? (
              <button
                type="button"
                disabled={loading}
                onClick={handleStartBattle}
                className="clay-btn-primary px-8 py-3.5 text-base font-bold flex items-center justify-center gap-2 clay-focus cursor-pointer shadow-md w-full sm:w-auto"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Speed Duel Now</span>
              </button>
            ) : (
              <div className="text-xs font-bold text-[var(--dp-color-ink-secondary)]">
                Waiting for host to launch the duel...
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
