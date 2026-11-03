import { z } from 'zod';
import { supabase, isSupabaseConfigured } from './supabase';
import { SEED_SUBJECTS, SEED_UNITS, SEED_TOPICS, SEED_QUESTIONS } from './seedData';
import type {
  Profile,
  Subject,
  Unit,
  Topic,
  Question,
  Attempt,
  TopicMastery,
  BattleRoom,
  BattleParticipant,
} from '../types/database';

// Zod schema for client-side validation of generated AI quiz questions
export const QuestionSchema = z.object({
  question: z.string().min(5),
  options: z.array(z.string().min(1)).length(4),
  answer_index: z.number().int().min(0).max(3),
  explanation: z.string().min(5),
});

export const GeneratedQuizSchema = z.object({
  questions: z.array(QuestionSchema),
});

const STORAGE_KEYS = {
  CURRENT_USER: 'learnify_current_user',
  PROFILES: 'learnify_profiles',
  QUESTIONS: 'learnify_questions',
  ATTEMPTS: 'learnify_attempts',
  BATTLE_ROOMS: 'learnify_battle_rooms',
  BATTLE_PARTICIPANTS: 'learnify_battle_participants',
  CACHE_NOTES: 'learnify_notes_cache',
  CUSTOM_TOPICS: 'learnify_custom_topics',
};

// Local storage helpers
export function safeUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getLocalItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

// Initialize seed questions if not present in storage
export function initializeSeedData(): void {
  const existingQuestions = getLocalItem<Question[]>(STORAGE_KEYS.QUESTIONS, []);
  if (existingQuestions.length === 0) {
    setLocalItem(STORAGE_KEYS.QUESTIONS, SEED_QUESTIONS);
  }
}

// ----------------------------------------------------
// 1. Auth & Profiles
// ----------------------------------------------------
export async function getProfile(userId: string): Promise<Profile | null> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (!error && data) return data as Profile;
    } catch (e) {
      console.warn('Supabase getProfile failed, fallback to local:', e);
    }
  }

  const profiles = getLocalItem<Record<string, Profile>>(STORAGE_KEYS.PROFILES, {});
  return profiles[userId] || null;
}

export async function saveProfile(profile: Profile): Promise<Profile> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('profiles').upsert(profile).select().single();
      if (!error && data) return data as Profile;
    } catch (e) {
      console.warn('Supabase saveProfile failed, fallback to local:', e);
    }
  }

  const profiles = getLocalItem<Record<string, Profile>>(STORAGE_KEYS.PROFILES, {});
  profiles[profile.id] = profile;
  setLocalItem(STORAGE_KEYS.PROFILES, profiles);
  return profile;
}

// ----------------------------------------------------
// 2. Syllabus & Questions
// ----------------------------------------------------
export async function getSubjects(): Promise<Subject[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('subjects').select('*');
      if (!error && data && data.length > 0) return data as Subject[];
    } catch (e) {
      console.warn('Supabase getSubjects fallback to local:', e);
    }
  }
  return SEED_SUBJECTS;
}

export async function getUnits(subjectId: string): Promise<Unit[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('units').select('*').eq('subject_id', subjectId).order('unit_number');
      if (!error && data && data.length > 0) return data as Unit[];
    } catch (e) {
      console.warn('Supabase getUnits fallback to local:', e);
    }
  }
  return SEED_UNITS.filter((u) => u.subject_id === subjectId);
}

export async function getTopics(unitId: string): Promise<Topic[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('topics').select('*').eq('unit_id', unitId).order('order_index');
      if (!error && data && data.length > 0) return data as Topic[];
    } catch (e) {
      console.warn('Supabase getTopics fallback to local:', e);
    }
  }
  return SEED_TOPICS.filter((t) => t.unit_id === unitId);
}

export async function getAllTopics(): Promise<Topic[]> {
  const customTopics = getLocalItem<Topic[]>(STORAGE_KEYS.CUSTOM_TOPICS, []);
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('topics').select('*').order('order_index');
      if (!error && data && data.length > 0) {
        return [...customTopics, ...(data as Topic[])];
      }
    } catch (e) {
      console.warn('Supabase getAllTopics fallback to local:', e);
    }
  }
  return [...customTopics, ...SEED_TOPICS];
}

export async function saveCustomTopic(topic: Topic): Promise<Topic> {
  const customTopics = getLocalItem<Topic[]>(STORAGE_KEYS.CUSTOM_TOPICS, []);
  const exists = customTopics.some((t) => t.id === topic.id);
  const updated = exists
    ? customTopics.map((t) => (t.id === topic.id ? topic : t))
    : [topic, ...customTopics];
  setLocalItem(STORAGE_KEYS.CUSTOM_TOPICS, updated);

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('topics').insert(topic);
    } catch (e) {
      console.warn('Supabase saveCustomTopic fallback to local:', e);
    }
  }
  return topic;
}

export async function getQuestionsByTopic(topicId: string): Promise<Question[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('questions').select('*').eq('topic_id', topicId);
      if (!error && data && data.length > 0) return data as Question[];
    } catch (e) {
      console.warn('Supabase getQuestionsByTopic fallback to local:', e);
    }
  }

  const allQuestions = getLocalItem<Question[]>(STORAGE_KEYS.QUESTIONS, SEED_QUESTIONS);
  return allQuestions.filter((q) => q.topic_id === topicId);
}

export async function flagQuestion(questionId: string): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('questions').update({ flagged: true }).eq('id', questionId);
    } catch (e) {
      console.warn('Supabase flagQuestion fallback to local:', e);
    }
  }

  const allQuestions = getLocalItem<Question[]>(STORAGE_KEYS.QUESTIONS, SEED_QUESTIONS);
  const updated = allQuestions.map((q) => (q.id === questionId ? { ...q, flagged: true } : q));
  setLocalItem(STORAGE_KEYS.QUESTIONS, updated);
}

// ----------------------------------------------------
// 3. Practice Attempts & XP / Streak System
// ----------------------------------------------------
export async function recordAttempt(
  userId: string,
  questionId: string,
  topicId: string,
  correct: boolean,
  selectedIndex: number
): Promise<{ xpEarned: number; newTotalXp: number; newStreak: number }> {
  const xpEarned = correct ? 10 : 0;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.rpc('record_attempt', {
        p_user_id: userId,
        p_question_id: questionId,
        p_topic_id: topicId,
        p_correct: correct,
        p_selected_index: selectedIndex,
      });
      if (!error && data) {
        return {
          xpEarned: data.xp_earned,
          newTotalXp: data.total_xp,
          newStreak: data.streak,
        };
      }
    } catch (e) {
      console.warn('Supabase recordAttempt RPC error, fallback to local:', e);
    }
  }

  // Local calculation
  const attempts = getLocalItem<Attempt[]>(STORAGE_KEYS.ATTEMPTS, []);
  const newAttempt: Attempt = {
    id: safeUUID(),
    user_id: userId,
    question_id: questionId,
    topic_id: topicId,
    correct,
    selected_index: selectedIndex,
    created_at: new Date().toISOString(),
  };
  attempts.push(newAttempt);
  setLocalItem(STORAGE_KEYS.ATTEMPTS, attempts);

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('attempts').insert({
        id: newAttempt.id,
        user_id: newAttempt.user_id,
        question_id: newAttempt.question_id,
        topic_id: newAttempt.topic_id,
        correct: newAttempt.correct,
        selected_index: newAttempt.selected_index,
      });
    } catch (e) {
      // Ignore if table pending creation
    }
  }

  // Update profile
  const profile = (await getProfile(userId)) || {
    id: userId,
    name: 'Student',
    xp: 0,
    streak: 1,
    last_active: new Date().toISOString(),
  };

  const today = new Date().toISOString().split('T')[0];
  const lastActiveDate = profile.last_active ? profile.last_active.split('T')[0] : '';

  let newStreak = profile.streak || 1;
  if (lastActiveDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (lastActiveDate === yesterday) {
      newStreak += 1;
    } else if (lastActiveDate !== '') {
      newStreak = 1;
    }
  }

  const updatedProfile: Profile = {
    ...profile,
    xp: (profile.xp || 0) + xpEarned,
    streak: newStreak,
    last_active: new Date().toISOString(),
  };

  await saveProfile(updatedProfile);

  return {
    xpEarned,
    newTotalXp: updatedProfile.xp,
    newStreak: updatedProfile.streak,
  };
}

export async function awardBattleXP(userId: string, xpAmount: number): Promise<number> {
  const profile = await getProfile(userId);
  if (!profile) return xpAmount;

  const newTotalXp = (profile.xp || 0) + xpAmount;
  const updatedProfile: Profile = {
    ...profile,
    xp: newTotalXp,
    last_active: new Date().toISOString(),
  };

  await saveProfile(updatedProfile);
  return newTotalXp;
}

export async function getUserAttempts(userId: string): Promise<Attempt[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('attempts').select('*').eq('user_id', userId);
      if (!error && data) return data as Attempt[];
    } catch (e) {
      console.warn('Supabase getUserAttempts fallback to local:', e);
    }
  }

  const attempts = getLocalItem<Attempt[]>(STORAGE_KEYS.ATTEMPTS, []);
  return attempts.filter((a) => a.user_id === userId);
}

// ----------------------------------------------------
// 4. Mastery & Revision Calculation
// ----------------------------------------------------
export async function getTopicMastery(userId: string): Promise<TopicMastery[]> {
  const [topics, attempts] = await Promise.all([getAllTopics(), getUserAttempts(userId)]);

  return topics.map((topic) => {
    const topicAttempts = attempts.filter((a) => a.topic_id === topic.id);
    const total = topicAttempts.length;
    const correct = topicAttempts.filter((a) => a.correct).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const unit = SEED_UNITS.find((u) => u.id === topic.unit_id);

    return {
      topic_id: topic.id,
      topic_title: topic.title,
      unit_title: unit ? `Unit ${unit.unit_number}: ${unit.title}` : 'DBMS',
      total_attempts: total,
      correct_attempts: correct,
      accuracy,
      // Needs revision if attempted and accuracy is below 60%
      needs_revision: total > 0 && accuracy < 60,
    };
  });
}

export async function getRevisionQuestions(userId: string): Promise<Question[]> {
  const masteries = await getTopicMastery(userId);
  const weakTopicIds = masteries.filter((m) => m.needs_revision).map((m) => m.topic_id);

  if (weakTopicIds.length === 0) {
    // If no weak topics yet, pick questions from topics with lowest accuracy or default sample
    const allQuestions = getLocalItem<Question[]>(STORAGE_KEYS.QUESTIONS, SEED_QUESTIONS);
    return allQuestions.slice(0, 10);
  }

  const allQuestions = getLocalItem<Question[]>(STORAGE_KEYS.QUESTIONS, SEED_QUESTIONS);
  const filtered = allQuestions.filter((q) => q.topic_id && weakTopicIds.includes(q.topic_id));

  // Shuffle and pick up to 10
  return filtered.sort(() => 0.5 - Math.random()).slice(0, 10);
}

// ----------------------------------------------------
// 5. Notes-to-Quiz (AI & Caching)
// ----------------------------------------------------
export async function getCachedQuestionsByHash(contentHash: string): Promise<Question[] | null> {
  // Check local cache first
  const cacheMap = getLocalItem<Record<string, Question[]>>(STORAGE_KEYS.CACHE_NOTES, {});
  if (cacheMap[contentHash] && cacheMap[contentHash].length > 0) {
    return cacheMap[contentHash];
  }

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('content_hash', contentHash)
        .limit(10);
      if (!error && data && data.length >= 5) {
        return data as Question[];
      }
    } catch (e) {
      console.warn('Supabase cache lookup fallback:', e);
    }
  }

  return null;
}

export async function saveGeneratedQuestions(
  questions: Omit<Question, 'id'>[],
  contentHash?: string
): Promise<Question[]> {
  const newQuestions: Question[] = questions.map((q) => ({
    ...q,
    id: safeUUID(),
    created_at: new Date().toISOString(),
    content_hash: contentHash,
  }));

  // Save to local storage
  const allQuestions = getLocalItem<Question[]>(STORAGE_KEYS.QUESTIONS, SEED_QUESTIONS);
  const updatedQuestions = [...allQuestions, ...newQuestions];
  setLocalItem(STORAGE_KEYS.QUESTIONS, updatedQuestions);

  // Cache by hash
  if (contentHash) {
    const cacheMap = getLocalItem<Record<string, Question[]>>(STORAGE_KEYS.CACHE_NOTES, {});
    cacheMap[contentHash] = newQuestions;
    setLocalItem(STORAGE_KEYS.CACHE_NOTES, cacheMap);
  }

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('questions').insert(newQuestions);
    } catch (e) {
      console.warn('Supabase saveGeneratedQuestions fallback:', e);
    }
  }

  return newQuestions;
}

// ----------------------------------------------------
// 6. Live Battle System (Supabase Realtime + RPC)
// ----------------------------------------------------
export function generateRoomCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return result;
}

// Multi-tab sync channel (same browser)
const battleBroadcastChannels = new Map<string, BroadcastChannel>();

export function getBattleChannel(roomCode: string): BroadcastChannel {
  const code = roomCode.trim().toUpperCase();
  if (!battleBroadcastChannels.has(code)) {
    const channel = new BroadcastChannel(`learnify_battle_${code}`);
    battleBroadcastChannels.set(code, channel);
  }
  return battleBroadcastChannels.get(code)!;
}

// Global cross-device Supabase Realtime channel (WebSockets)
const battleSupabaseChannels = new Map<string, any>();

export function getBattleSupabaseChannel(roomCode: string) {
  const code = roomCode.trim().toUpperCase();
  if (!isSupabaseConfigured()) return null;
  if (!battleSupabaseChannels.has(code)) {
    const ch = supabase.channel(`battle_${code}`, {
      config: { broadcast: { self: true } },
    });
    battleSupabaseChannels.set(code, ch);
  }
  return battleSupabaseChannels.get(code);
}

/**
 * Broadcasts an event to both local tabs and remote Supabase WebSockets
 */
export async function broadcastBattleEvent(roomCode: string, type: string, payload: any) {
  const upperCode = roomCode.trim().toUpperCase();

  // 1. Same-origin tabs via BroadcastChannel
  try {
    getBattleChannel(upperCode).postMessage({ type, ...payload });
  } catch (e) {
    console.warn('BroadcastChannel error:', e);
  }

  // 2. Global WebSockets across all devices
  const ch = getBattleSupabaseChannel(upperCode);
  if (ch) {
    try {
      await ch.send({
        type: 'broadcast',
        event: type,
        payload,
      });
    } catch (e) {
      console.warn('Supabase Realtime broadcast notice:', e);
    }
  }
}

/**
 * Discovers a battle room hosted on another device via Supabase Realtime
 */
export async function discoverBattleRoomRemote(
  code: string
): Promise<{ room: BattleRoom; participants: BattleParticipant[] } | null> {
  const upperCode = code.trim().toUpperCase();
  const ch = getBattleSupabaseChannel(upperCode);
  if (!ch) return null;

  return new Promise((resolve) => {
    let resolved = false;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    }, 3500);

    const onRoomState = (payload: any) => {
      if (!resolved && payload?.payload?.room) {
        resolved = true;
        clearTimeout(timer);
        resolve({
          room: payload.payload.room,
          participants: payload.payload.participants || [],
        });
      }
    };

    // Attach .on() BEFORE subscribe!
    ch.on('broadcast', { event: 'ROOM_STATE' }, onRoomState);

    const sendRequest = () => {
      ch.send({
        type: 'broadcast',
        event: 'REQUEST_ROOM',
        payload: { code: upperCode },
      }).catch(() => {});
    };

    ch.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        sendRequest();
        setTimeout(() => {
          if (!resolved) sendRequest();
        }, 800);
      }
    });

    // Also trigger immediately in case already in subscribed state
    sendRequest();
  });
}

export async function createBattleRoom(
  hostId: string,
  hostName: string,
  topicId?: string
): Promise<BattleRoom> {
  const code = generateRoomCode();
  const roomId = safeUUID();

  // Pick 10 random questions from topic or syllabus
  let selectedQuestions: Question[] = [];
  if (topicId) {
    selectedQuestions = await getQuestionsByTopic(topicId);
  }
  if (selectedQuestions.length === 0) {
    const allQuestions = getLocalItem<Question[]>(STORAGE_KEYS.QUESTIONS, SEED_QUESTIONS);
    selectedQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 10);
  } else {
    selectedQuestions = selectedQuestions.sort(() => 0.5 - Math.random()).slice(0, 10);
  }

  const questionIds = selectedQuestions.map((q) => q.id);

  const room: BattleRoom = {
    id: roomId,
    code,
    host_id: hostId,
    topic_id: topicId || null,
    status: 'lobby',
    question_ids: questionIds,
    current_index: 0,
    current_question_index: 0,
    created_at: new Date().toISOString(),
  };

  const participant: BattleParticipant = {
    id: safeUUID(),
    room_id: room.id,
    user_id: hostId,
    name: hostName,
    score: 0,
    answers: [],
    joined_at: new Date().toISOString(),
  };

  // 1. Insert into Supabase if remote table exists
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('battle_rooms').insert({
        id: room.id,
        code: room.code,
        host_id: hostId,
        topic_id: topicId || null,
        status: 'lobby',
        question_ids: questionIds,
        current_index: 0,
      });

      await supabase.from('battle_players').insert({
        room_id: room.id,
        user_id: hostId,
        display_name: hostName,
        score: 0,
      });
    } catch {
      // Gracefully fall back to Realtime WebSockets if database tables are unmigrated
    }
  }

  // 2. Local cache fallback
  const rooms = getLocalItem<Record<string, BattleRoom>>(STORAGE_KEYS.BATTLE_ROOMS, {});
  rooms[code] = room;
  rooms[room.id] = room;
  setLocalItem(STORAGE_KEYS.BATTLE_ROOMS, rooms);

  const participants = getLocalItem<Record<string, BattleParticipant[]>>(STORAGE_KEYS.BATTLE_PARTICIPANTS, {});
  participants[code] = [participant];
  participants[room.id] = [participant];
  setLocalItem(STORAGE_KEYS.BATTLE_PARTICIPANTS, participants);

  // Initialize Supabase Realtime channel
  getBattleSupabaseChannel(code);

  await broadcastBattleEvent(code, 'ROOM_UPDATED', { room, participants: [participant] });

  return room;
}

export async function getBattleRoom(codeOrId: string): Promise<BattleRoom | null> {
  const normalized = codeOrId.trim().toUpperCase();

  // 1. Local storage check first (immediate)
  const rooms = getLocalItem<Record<string, BattleRoom>>(STORAGE_KEYS.BATTLE_ROOMS, {});
  if (rooms[normalized] || rooms[codeOrId]) {
    return rooms[normalized] || rooms[codeOrId];
  }

  // 2. Remote database check if configured
  if (isSupabaseConfigured()) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(codeOrId);
      const query = supabase.from('battle_rooms').select('*');
      const { data, error } = isUuid
        ? await query.eq('id', codeOrId).single()
        : await query.eq('code', normalized).single();

      if (!error && data) {
        const loadedRoom: BattleRoom = {
          id: data.id,
          code: data.code,
          host_id: data.host_id,
          topic_id: data.topic_id,
          status: data.status,
          question_ids: Array.isArray(data.question_ids) ? data.question_ids : JSON.parse(data.question_ids || '[]'),
          current_index: data.current_index ?? data.current_question_index ?? 0,
          current_question_index: data.current_index ?? data.current_question_index ?? 0,
          question_started_at: data.question_started_at,
          started_at: data.started_at,
          created_at: data.created_at,
        };
        rooms[normalized] = loadedRoom;
        rooms[loadedRoom.id] = loadedRoom;
        setLocalItem(STORAGE_KEYS.BATTLE_ROOMS, rooms);
        return loadedRoom;
      }
    } catch (e) {
      console.warn('Supabase getBattleRoom fallback:', e);
    }
  }

  return null;
}

export async function getBattleParticipants(codeOrId: string): Promise<BattleParticipant[]> {
  const normalized = codeOrId.trim().toUpperCase();

  // 1. Local storage check
  const participants = getLocalItem<Record<string, BattleParticipant[]>>(STORAGE_KEYS.BATTLE_PARTICIPANTS, {});
  if (participants[normalized] && participants[normalized].length > 0) {
    return participants[normalized];
  }
  if (participants[codeOrId] && participants[codeOrId].length > 0) {
    return participants[codeOrId];
  }

  // 2. Remote database check
  if (isSupabaseConfigured()) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(codeOrId);
      let targetRoomId = codeOrId;
      if (!isUuid) {
        const r = await getBattleRoom(codeOrId);
        if (r) targetRoomId = r.id;
      }

      const { data, error } = await supabase
        .from('battle_players')
        .select('*')
        .eq('room_id', targetRoomId)
        .order('score', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped = data.map((p) => ({
          id: p.user_id,
          room_id: p.room_id,
          user_id: p.user_id,
          name: p.display_name,
          score: p.score,
          answers: [],
          joined_at: p.joined_at,
        }));
        participants[normalized] = mapped;
        participants[codeOrId] = mapped;
        setLocalItem(STORAGE_KEYS.BATTLE_PARTICIPANTS, participants);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase getBattleParticipants fallback:', e);
    }
  }

  return participants[normalized] || participants[codeOrId] || [];
}

export async function joinBattleRoom(
  code: string,
  userId: string,
  userName: string
): Promise<{ room: BattleRoom; participants: BattleParticipant[] }> {
  const upperCode = code.trim().toUpperCase();

  // 1. Check local storage
  let room = await getBattleRoom(upperCode);

  // 2. If not in local storage, discover across devices via Supabase Realtime
  if (!room) {
    const remote = await discoverBattleRoomRemote(upperCode);
    if (remote) {
      room = remote.room;
      const rooms = getLocalItem<Record<string, BattleRoom>>(STORAGE_KEYS.BATTLE_ROOMS, {});
      rooms[upperCode] = room;
      rooms[room.id] = room;
      setLocalItem(STORAGE_KEYS.BATTLE_ROOMS, rooms);

      const parts = getLocalItem<Record<string, BattleParticipant[]>>(STORAGE_KEYS.BATTLE_PARTICIPANTS, {});
      parts[upperCode] = remote.participants;
      parts[room.id] = remote.participants;
      setLocalItem(STORAGE_KEYS.BATTLE_PARTICIPANTS, parts);
    }
  }

  if (!room) {
    throw new Error(`Room '${upperCode}' not found. Please verify the 5-character match code or ensure the host is in the lobby.`);
  }

  if (room.status !== 'lobby' && room.status !== 'waiting') {
    throw new Error('Battle already in progress or completed.');
  }

  const participants = await getBattleParticipants(upperCode);
  if (participants.length >= 4 && !participants.some((p) => p.user_id === userId)) {
    throw new Error('Battle room is full (maximum 4 players).');
  }

  const existing = participants.find((p) => p.user_id === userId);
  let updatedParticipants = [...participants];

  if (!existing) {
    const newParticipant: BattleParticipant = {
      id: safeUUID(),
      room_id: room.id,
      user_id: userId,
      name: userName,
      score: 0,
      answers: [],
      joined_at: new Date().toISOString(),
    };
    updatedParticipants.push(newParticipant);

    const allParticipants = getLocalItem<Record<string, BattleParticipant[]>>(STORAGE_KEYS.BATTLE_PARTICIPANTS, {});
    allParticipants[upperCode] = updatedParticipants;
    allParticipants[room.id] = updatedParticipants;
    setLocalItem(STORAGE_KEYS.BATTLE_PARTICIPANTS, allParticipants);

    await broadcastBattleEvent(upperCode, 'JOIN_ROOM', { player: newParticipant });
  }

  await broadcastBattleEvent(upperCode, 'PLAYERS_UPDATED', {
    room,
    participants: updatedParticipants,
  });

  return { room, participants: updatedParticipants };
}

/**
 * Adds an AI practice rival bot to an existing lobby
 */
export async function addBotToBattleRoom(roomCode: string): Promise<BattleParticipant[]> {
  const upperCode = roomCode.trim().toUpperCase();
  const room = await getBattleRoom(upperCode);
  if (!room) throw new Error('Room not found');

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

  const current = await getBattleParticipants(upperCode);
  const updated = [...current.filter((p) => !p.user_id.startsWith('bot_')), botPlayer];

  const allParts = getLocalItem<Record<string, BattleParticipant[]>>(STORAGE_KEYS.BATTLE_PARTICIPANTS, {});
  allParts[upperCode] = updated;
  allParts[room.id] = updated;
  setLocalItem(STORAGE_KEYS.BATTLE_PARTICIPANTS, allParts);

  await broadcastBattleEvent(upperCode, 'PLAYERS_UPDATED', { participants: updated });
  return updated;
}

/**
 * Instantly launches a solo battle against the AI rival bot
 */
export async function startInstantBotBattle(
  userId: string,
  userName: string,
  topicId?: string
): Promise<{ room: BattleRoom; participants: BattleParticipant[] }> {
  const room = await createBattleRoom(userId, userName, topicId);
  await addBotToBattleRoom(room.code);
  return startBattle(room.code, userId);
}

export async function startBattle(
  code: string,
  hostId: string
): Promise<{ room: BattleRoom; participants: BattleParticipant[] }> {
  const upperCode = code.trim().toUpperCase();
  const room = await getBattleRoom(upperCode);
  if (!room) throw new Error('Room not found');
  if (room.host_id !== hostId) throw new Error('Only the room host can start the battle');

  const participants = await getBattleParticipants(upperCode);
  const nowIso = new Date().toISOString();

  const updatedRoom: BattleRoom = {
    ...room,
    status: 'live',
    current_index: 0,
    current_question_index: 0,
    question_started_at: nowIso,
    started_at: nowIso,
  };

  const rooms = getLocalItem<Record<string, BattleRoom>>(STORAGE_KEYS.BATTLE_ROOMS, {});
  rooms[upperCode] = updatedRoom;
  rooms[room.id] = updatedRoom;
  setLocalItem(STORAGE_KEYS.BATTLE_ROOMS, rooms);

  await broadcastBattleEvent(upperCode, 'ROOM_UPDATED', {
    room: updatedRoom,
    participants,
  });

  return { room: updatedRoom, participants };
}

export async function submitBattleAnswer(
  roomId: string,
  code: string,
  userId: string,
  questionIndex: number,
  selectedIndex: number,
  secondsRemaining = 15
): Promise<{ correct: boolean; answer_index: number; pointsAwarded: number; newScore: number }> {
  const upperCode = code.trim().toUpperCase();

  const allQuestions = getLocalItem<Question[]>(STORAGE_KEYS.QUESTIONS, SEED_QUESTIONS);
  const room = await getBattleRoom(upperCode);
  const targetQId = room?.question_ids[questionIndex];
  const question = allQuestions.find((q) => q.id === targetQId);

  const correctIdx = question?.answer_index ?? 0;
  const isCorrect = correctIdx === selectedIndex;
  const speedBonus = isCorrect ? Math.round(Math.min(15, Math.max(0, secondsRemaining)) * 3.33) : 0;
  const points = isCorrect ? 100 + speedBonus : 0;

  const participants = await getBattleParticipants(upperCode);
  const updatedParticipants = participants.map((p) => {
    if (p.user_id === userId) {
      return {
        ...p,
        score: p.score + points,
      };
    }
    return p;
  });

  const allParticipants = getLocalItem<Record<string, BattleParticipant[]>>(STORAGE_KEYS.BATTLE_PARTICIPANTS, {});
  allParticipants[upperCode] = updatedParticipants;
  allParticipants[roomId] = updatedParticipants;
  if (room?.id) allParticipants[room.id] = updatedParticipants;
  setLocalItem(STORAGE_KEYS.BATTLE_PARTICIPANTS, allParticipants);

  const me = updatedParticipants.find((p) => p.user_id === userId);

  await broadcastBattleEvent(upperCode, 'SCORE_UPDATED', {
    participants: updatedParticipants,
    userId,
    newScore: me?.score || 0,
  });

  return {
    correct: isCorrect,
    answer_index: correctIdx,
    pointsAwarded: points,
    newScore: me?.score || 0,
  };
}

export async function advanceBattleQuestion(
  roomId: string,
  code: string
): Promise<{ currentIndex: number; status: string; totalQuestions: number }> {
  const upperCode = code.trim().toUpperCase();
  const room = await getBattleRoom(upperCode);
  if (!room) throw new Error('Room not found');

  const nextIdx = (room.current_index ?? 0) + 1;
  const total = room.question_ids.length;
  const newStatus = nextIdx >= total ? 'finished' : 'live';

  const updatedRoom: BattleRoom = {
    ...room,
    current_index: nextIdx,
    current_question_index: nextIdx,
    status: newStatus as any,
    question_started_at: new Date().toISOString(),
  };

  const rooms = getLocalItem<Record<string, BattleRoom>>(STORAGE_KEYS.BATTLE_ROOMS, {});
  rooms[upperCode] = updatedRoom;
  rooms[roomId] = updatedRoom;
  rooms[room.id] = updatedRoom;
  setLocalItem(STORAGE_KEYS.BATTLE_ROOMS, rooms);

  await broadcastBattleEvent(upperCode, 'ROOM_UPDATED', {
    room: updatedRoom,
  });

  return {
    currentIndex: nextIdx,
    status: newStatus,
    totalQuestions: total,
  };
}

export async function getQuestionsForBattle(questionIds: string[]): Promise<Question[]> {
  if (isSupabaseConfigured() && questionIds.length > 0) {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .in('id', questionIds);

      if (!error && data && data.length > 0) {
        // Return matching questions with answer_index HIDDEN (-1) for client security!
        const found: Question[] = [];
        for (const id of questionIds) {
          const q = data.find((item: any) => item.id === id);
          if (q) {
            found.push({ ...q, answer_index: -1 } as Question);
          }
        }
        return found;
      }
    } catch (e) {
      console.warn('Supabase getQuestionsForBattle notice:', e);
    }
  }

  const allQuestions = getLocalItem<Question[]>(STORAGE_KEYS.QUESTIONS, SEED_QUESTIONS);
  const localFound: Question[] = [];
  for (const id of questionIds) {
    const q = allQuestions.find((item) => item.id === id);
    if (q) {
      localFound.push({ ...q, answer_index: -1 });
    }
  }
  return localFound;
}

export function subscribeToBattle(
  roomId: string,
  code: string,
  onRoomUpdate: (room: BattleRoom) => void,
  onPlayersUpdate: (players: BattleParticipant[]) => void
): () => void {
  const upperCode = code.trim().toUpperCase();
  const bc = getBattleChannel(upperCode);

  // 1. Same-browser BroadcastChannel sync
  const handleBcMessage = (e: MessageEvent) => {
    const data = e.data;
    if (data?.type === 'ROOM_UPDATED' && data.room) {
      onRoomUpdate(data.room);
    }
    if (data?.type === 'PLAYERS_UPDATED' && data.participants) {
      onPlayersUpdate(data.participants);
    }
    if (data?.type === 'SCORE_UPDATED' && data.participants) {
      onPlayersUpdate(data.participants);
    }
  };

  bc.addEventListener('message', handleBcMessage);

  // 2. Cross-device WebSockets via Supabase Realtime Broadcast
  const ch = getBattleSupabaseChannel(upperCode);

  const handleRequestRoom = async () => {
    const currentRoom = await getBattleRoom(upperCode);
    const currentParts = await getBattleParticipants(upperCode);
    if (currentRoom) {
      ch?.send({
        type: 'broadcast',
        event: 'ROOM_STATE',
        payload: { room: currentRoom, participants: currentParts },
      }).catch(() => {});
    }
  };

  const handleJoinRoom = async (event: any) => {
    const player = event?.payload?.player;
    if (player) {
      const currentParts = await getBattleParticipants(upperCode);
      if (!currentParts.some((p) => p.user_id === player.user_id)) {
        const updated = [...currentParts, player];
        const allParts = getLocalItem<Record<string, BattleParticipant[]>>(STORAGE_KEYS.BATTLE_PARTICIPANTS, {});
        allParts[upperCode] = updated;
        allParts[roomId] = updated;
        setLocalItem(STORAGE_KEYS.BATTLE_PARTICIPANTS, allParts);
        onPlayersUpdate(updated);

        // Acknowledge update to channel
        ch?.send({
          type: 'broadcast',
          event: 'PLAYERS_UPDATED',
          payload: { participants: updated },
        }).catch(() => {});
      }
    }
  };

  const handleRoomUpdated = (event: any) => {
    if (event?.payload?.room) {
      const r = event.payload.room;
      const rooms = getLocalItem<Record<string, BattleRoom>>(STORAGE_KEYS.BATTLE_ROOMS, {});
      rooms[upperCode] = r;
      rooms[roomId] = r;
      rooms[r.id] = r;
      setLocalItem(STORAGE_KEYS.BATTLE_ROOMS, rooms);
      onRoomUpdate(r);
    }
  };

  const handlePlayersUpdated = (event: any) => {
    if (event?.payload?.participants) {
      const parts = event.payload.participants;
      const allParts = getLocalItem<Record<string, BattleParticipant[]>>(STORAGE_KEYS.BATTLE_PARTICIPANTS, {});
      allParts[upperCode] = parts;
      allParts[roomId] = parts;
      setLocalItem(STORAGE_KEYS.BATTLE_PARTICIPANTS, allParts);
      onPlayersUpdate(parts);
    }
  };

  const handleScoreUpdated = (event: any) => {
    if (event?.payload?.participants) {
      const parts = event.payload.participants;
      const allParts = getLocalItem<Record<string, BattleParticipant[]>>(STORAGE_KEYS.BATTLE_PARTICIPANTS, {});
      allParts[upperCode] = parts;
      allParts[roomId] = parts;
      setLocalItem(STORAGE_KEYS.BATTLE_PARTICIPANTS, allParts);
      onPlayersUpdate(parts);
    }
  };

  if (ch) {
    ch.on('broadcast', { event: 'REQUEST_ROOM' }, handleRequestRoom);
    ch.on('broadcast', { event: 'JOIN_ROOM' }, handleJoinRoom);
    ch.on('broadcast', { event: 'ROOM_UPDATED' }, handleRoomUpdated);
    ch.on('broadcast', { event: 'PLAYERS_UPDATED' }, handlePlayersUpdated);
    ch.on('broadcast', { event: 'SCORE_UPDATED' }, handleScoreUpdated);
    ch.subscribe();
  }

  return () => {
    bc.removeEventListener('message', handleBcMessage);
  };
}

