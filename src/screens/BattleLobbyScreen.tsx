import React, { useState, useEffect, useRef } from 'react';
import {
  Copy,
  Check,
  Play,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  createBattleRoom,
  joinBattleRoom,
  startBattle,
  getBattleParticipants,
  subscribeToBattle,
  getAllTopics,
} from '../lib/storage';
import {
  SugarySwords,
  SugaryTrophy,
  SugaryEnvelope,
  SugaryBolt,
  SugarySparkles,
} from '../components/SugaryIcons';
import type { BattleRoom, BattleParticipant, Topic } from '../types/database';

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
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');

  const onStartGameRef = useRef(onStartGame);
  useEffect(() => {
    onStartGameRef.current = onStartGame;
  });

  useEffect(() => {
    getAllTopics().then((res) => {
      setTopics(res);
      if (res.length > 0) setSelectedTopicId(res[0].id);
    });
  }, []);

  useEffect(() => {
    if (!room) return;

    // Supabase Realtime + cross-tab subscription
    const unsubscribe = subscribeToBattle(
      room.id,
      room.code,
      (updatedRoom) => {
        setRoom(updatedRoom);
        if (updatedRoom.status === 'live') {
          onStartGameRef.current(updatedRoom, participants);
        }
      },
      (updatedPlayers) => {
        setParticipants(updatedPlayers);
      }
    );

    // Initial fetch of players
    getBattleParticipants(room.id).then((p) => {
      setParticipants(p);
    });

    return () => {
      unsubscribe();
    };
  }, [room?.id, room?.code]);

  const handleCreateRoom = async () => {
    if (!user) return;
    setError(null);
    setLoading(true);
    try {
      const newRoom = await createBattleRoom(user.id, user.name, selectedTopicId || undefined);
      setRoom(newRoom);
      const parts = await getBattleParticipants(newRoom.id);
      setParticipants(parts);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to initialize battle room');
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
      console.error(err);
      setError(err?.message || 'Room code verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBot = () => {
    if (!room) return;
    const botId = 'bot_' + Math.random().toString(36).substring(2, 7);
    const botPlayer: BattleParticipant = {
      id: botId,
      room_id: room.id,
      user_id: botId,
      name: 'DBMS Rival 🧠',
      score: 0,
      answers: [],
      joined_at: new Date().toISOString(),
    };
    setParticipants((prev) => [...prev.filter((p) => !p.user_id.startsWith('bot_')), botPlayer]);
  };

  const handleStartBattle = async () => {
    if (!room || !user) return;
    setError(null);
    setLoading(true);
    try {
      const { room: started, participants: parts } = await startBattle(room.code, user.id);
      onStartGame(started, parts);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to start battle');
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
                Create a private 5-digit match code and challenge peers in real-time.
              </p>
            </div>

            {topics.length > 0 && (
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-600 block">Select Battle Topic</label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
                >
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shadow-xs mb-4">
                <SugaryEnvelope size={34} />
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
        <div className="bg-white border border-slate-200/80 shadow-[0_12px_36px_rgba(0,0,0,0.03)] p-6 sm:p-10 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Active Battle Room
              </span>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-slate-900">
                  {room.code}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Match Code'}</span>
                </button>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs font-bold text-slate-500">
                {participants.length >= 2 ? 'Lobby Status: Ready to Duel' : 'Waiting for challenger'}
              </span>
              <span className="block text-sm font-black text-indigo-700 mt-0.5">
                {participants.length} / 4 Players Connected (Max 4)
              </span>
            </div>
          </div>

          {/* Participant Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Fighters in Lobby
              </h3>
              {participants.length < 2 && isHost && (
                <button
                  type="button"
                  onClick={handleAddBot}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <SugaryBolt size={14} />
                  <span>Add AI Rival</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {participants.map((p, idx) => (
                <div
                  key={p.user_id}
                  className="bg-slate-50/80 border border-slate-200/80 p-4 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shadow-xs">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-base text-slate-900 block">
                        {p.name}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {idx === 0 ? '👑 Room Host' : p.user_id.startsWith('bot_') ? '🤖 AI Practice Rival' : '⚔️ Challenger'}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Ready
                  </span>
                </div>
              ))}

              {participants.length < 2 && (
                <div className="border-2 border-dashed border-indigo-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-indigo-50/30">
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-800 block">
                      Waiting for rival to enter code <span className="font-mono text-indigo-700 font-black">{room.code}</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Or play immediately by adding an AI practice rival!
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddBot}
                    className="bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-full text-xs font-bold shadow-xs cursor-pointer shrink-0 transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span>+ Add AI Rival</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setRoom(null)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-full text-xs font-bold cursor-pointer transition-colors w-full sm:w-auto"
            >
              Leave Room
            </button>

            {isHost ? (
              <button
                type="button"
                disabled={loading}
                onClick={handleStartBattle}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-full text-base font-bold flex items-center justify-center gap-2 shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer w-full sm:w-auto disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{loading ? 'Launching Duel...' : participants.length >= 2 ? 'Start Speed Duel Now' : 'Start Duel (Auto-Match Bot)'}</span>
              </button>
            ) : (
              <div className="text-xs font-bold text-slate-500">
                Waiting for room host to launch the duel...
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
