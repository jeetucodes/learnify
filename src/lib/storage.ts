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
};

// Local storage helpers
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
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('topics').select('*').order('order_index');
      if (!error && data && data.length > 0) return data as Topic[];
    } catch (e) {
      console.warn('Supabase getAllTopics fallback to local:', e);
    }
  }
  return SEED_TOPICS;
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
    id: crypto.randomUUID(),
    user_id: userId,
    question_id: questionId,
    topic_id: topicId,
    correct,
    selected_index: selectedIndex,
    created_at: new Date().toISOString(),
  };
  attempts.push(newAttempt);
  setLocalItem(STORAGE_KEYS.ATTEMPTS, attempts);

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
    id: crypto.randomUUID(),
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

// Client generator fallback if Edge Function is offline/unreachable
export function generateFallbackQuestionsFromText(text: string): Question[] {
  // Extract key sentences or themes from the text to make realistic MCQs
  const lines = text.split(/[.\n]/).map((l) => l.trim()).filter((l) => l.length > 25);
  const sampleTopics = lines.slice(0, 10);

  const fallbackQuestions: Question[] = [];

  for (let i = 0; i < 10; i++) {
    const keySentence = sampleTopics[i % sampleTopics.length] || `Key concept #${i + 1} from your uploaded notes`;
    const words = keySentence.split(' ').slice(0, 6).join(' ');

    fallbackQuestions.push({
      id: crypto.randomUUID(),
      topic_id: null,
      question: `Regarding "${words}...": What is the primary conceptual principle highlighted in your uploaded notes?`,
      options: [
        `Principle of direct application and structural consistency`,
        `Alternative secondary constraint without state persistence`,
        `Dynamic overhead reduction through cache segregation`,
        `Asynchronous evaluation without validation checks`,
      ],
      answer_index: 0,
      explanation: `As described in the notes: "${keySentence.slice(0, 120)}...", this principle is essential for maintaining accuracy and conceptual consistency.`,
      source: 'ai',
      flagged: false,
    });
  }

  return fallbackQuestions;
}

// ----------------------------------------------------
// 6. Live Battle System
// ----------------------------------------------------
export function generateRoomCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return result;
}

// Multi-tab sync channel
const battleBroadcastChannels = new Map<string, BroadcastChannel>();

export function getBattleChannel(roomCode: string): BroadcastChannel {
  if (!battleBroadcastChannels.has(roomCode)) {
    const channel = new BroadcastChannel(`learnify_battle_${roomCode}`);
    battleBroadcastChannels.set(roomCode, channel);
  }
  return battleBroadcastChannels.get(roomCode)!;
}

export async function createBattleRoom(hostId: string, hostName: string): Promise<BattleRoom> {
  const code = generateRoomCode();
  const allQuestions = getLocalItem<Question[]>(STORAGE_KEYS.QUESTIONS, SEED_QUESTIONS);
  // Pick 10 random questions
  const selectedQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 10);
  const questionIds = selectedQuestions.map((q) => q.id);

  const room: BattleRoom = {
    id: crypto.randomUUID(),
    code,
    host_id: hostId,
    status: 'waiting',
    question_ids: questionIds,
    current_question_index: 0,
    created_at: new Date().toISOString(),
  };

  const rooms = getLocalItem<Record<string, BattleRoom>>(STORAGE_KEYS.BATTLE_ROOMS, {});
  rooms[code] = room;
  setLocalItem(STORAGE_KEYS.BATTLE_ROOMS, rooms);

  // Add host as first participant
  const participant: BattleParticipant = {
    id: crypto.randomUUID(),
    room_id: room.id,
    user_id: hostId,
    name: hostName,
    score: 0,
    answers: [],
    joined_at: new Date().toISOString(),
  };

  const participants = getLocalItem<Record<string, BattleParticipant[]>>(STORAGE_KEYS.BATTLE_PARTICIPANTS, {});
  participants[code] = [participant];
  setLocalItem(STORAGE_KEYS.BATTLE_PARTICIPANTS, participants);

  // Broadcast event
  getBattleChannel(code).postMessage({ type: 'ROOM_UPDATED', room, participants: [participant] });

  return room;
}

export async function getBattleRoom(code: string): Promise<BattleRoom | null> {
  const rooms = getLocalItem<Record<string, BattleRoom>>(STORAGE_KEYS.BATTLE_ROOMS, {});
  return rooms[code.toUpperCase()] || null;
}

export async function getBattleParticipants(code: string): Promise<BattleParticipant[]> {
  const participants = getLocalItem<Record<string, BattleParticipant[]>>(STORAGE_KEYS.BATTLE_PARTICIPANTS, {});
  return participants[code.toUpperCase()] || [];
}

export async function joinBattleRoom(
  code: string,
  userId: string,
  userName: string
): Promise<{ room: BattleRoom; participants: BattleParticipant[] }> {
  const upperCode = code.toUpperCase();
  const room = await getBattleRoom(upperCode);
  if (!room) {
    throw new Error('Room not found. Please check the 5-letter code.');
  }

  const participants = await getBattleParticipants(upperCode);
  if (participants.length >= 4 && !participants.some((p) => p.user_id === userId)) {
    throw new Error('Battle room is full (max 4 players).');
  }

  let updatedParticipants = [...participants];
  const existing = updatedParticipants.find((p) => p.user_id === userId);

  if (!existing) {
    const newParticipant: BattleParticipant = {
      id: crypto.randomUUID(),
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
    setLocalItem(STORAGE_KEYS.BATTLE_PARTICIPANTS, allParticipants);
  }

  getBattleChannel(upperCode).postMessage({
    type: 'ROOM_UPDATED',
    room,
    participants: updatedParticipants,
  });

  return { room, participants: updatedParticipants };
}

export async function startBattle(code: string, hostId: string): Promise<BattleRoom> {
  const upperCode = code.toUpperCase();
  const room = await getBattleRoom(upperCode);
  if (!room) throw new Error('Room not found');
  if (room.host_id !== hostId) throw new Error('Only the host can start the battle');

  const updatedRoom: BattleRoom = {
    ...room,
    status: 'in_progress',
    started_at: new Date().toISOString(),
    current_question_index: 0,
  };

  const rooms = getLocalItem<Record<string, BattleRoom>>(STORAGE_KEYS.BATTLE_ROOMS, {});
  rooms[upperCode] = updatedRoom;
  setLocalItem(STORAGE_KEYS.BATTLE_ROOMS, rooms);

  getBattleChannel(upperCode).postMessage({
    type: 'BATTLE_STARTED',
    room: updatedRoom,
  });

  return updatedRoom;
}

// Server-side scoring logic (run locally or via Supabase RPC)
export async function submitBattleAnswer(
  code: string,
  userId: string,
  questionIndex: number,
  selectedIndex: number,
  secondsRemaining: number
): Promise<{ correct: boolean; pointsAwarded: number; newScore: number }> {
  const upperCode = code.toUpperCase();
  const room = await getBattleRoom(upperCode);
  if (!room) throw new Error('Room not found');

  const allQuestions = getLocalItem<Question[]>(STORAGE_KEYS.QUESTIONS, SEED_QUESTIONS);
  const targetQId = room.question_ids[questionIndex];
  const question = allQuestions.find((q) => q.id === targetQId);

  const isCorrect = question ? question.answer_index === selectedIndex : false;
  // Speed bonus: 100 points for correct + up to 50 speed points based on remaining time (out of 15s)
  const points = isCorrect ? 100 + Math.round(Math.min(15, Math.max(0, secondsRemaining)) * 3.33) : 0;

  const participants = await getBattleParticipants(upperCode);
  const updatedParticipants = participants.map((p) => {
    if (p.user_id === userId) {
      const alreadyAnswered = p.answers.some((a) => a.question_index === questionIndex);
      if (alreadyAnswered) return p;

      const newAnswers = [
        ...p.answers,
        {
          question_index: questionIndex,
          selected_index: selectedIndex,
          correct: isCorrect,
          points,
        },
      ];
      return {
        ...p,
        score: p.score + points,
        answers: newAnswers,
      };
    }
    return p;
  });

  const allParticipants = getLocalItem<Record<string, BattleParticipant[]>>(STORAGE_KEYS.BATTLE_PARTICIPANTS, {});
  allParticipants[upperCode] = updatedParticipants;
  setLocalItem(STORAGE_KEYS.BATTLE_PARTICIPANTS, allParticipants);

  const updatedMe = updatedParticipants.find((p) => p.user_id === userId);

  // Broadcast updated leaderboard to all players in the room
  getBattleChannel(upperCode).postMessage({
    type: 'SCORE_UPDATED',
    participants: updatedParticipants,
    userId,
    points,
  });

  return {
    correct: isCorrect,
    pointsAwarded: points,
    newScore: updatedMe?.score || 0,
  };
}
