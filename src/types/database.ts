export interface Profile {
  id: string;
  name: string;
  avatar_url?: string;
  xp: number;
  streak: number;
  last_active: string;
  college?: string;
  specialization?: string;
  bio?: string;
  created_at?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  icon: string;
}

export interface Unit {
  id: string;
  subject_id: string;
  unit_number: number;
  title: string;
}

export interface Topic {
  id: string;
  unit_id: string;
  title: string;
  order_index: number;
}

export interface Question {
  id: string;
  topic_id?: string | null;
  question: string;
  options: string[]; // 4 options
  answer_index: number; // 0-3
  explanation: string;
  source: 'ai' | 'pyq' | 'seed';
  source_passage?: string;
  created_by?: string;
  flagged?: boolean;
  content_hash?: string;
  created_at?: string;
}

export interface Attempt {
  id: string;
  user_id: string;
  question_id: string;
  topic_id: string;
  correct: boolean;
  selected_index: number;
  created_at: string;
}

export interface TopicMastery {
  topic_id: string;
  topic_title: string;
  unit_title: string;
  total_attempts: number;
  correct_attempts: number;
  accuracy: number; // 0 to 100
  needs_revision: boolean; // accuracy < 60% with at least 1 attempt
}

export interface BattleRoom {
  id: string;
  code: string;
  host_id: string;
  topic_id?: string | null;
  status: 'lobby' | 'live' | 'finished' | 'waiting' | 'in_progress' | 'completed';
  question_ids: string[];
  current_index?: number;
  current_question_index?: number;
  question_started_at?: string;
  started_at?: string;
  created_at?: string;
}

export interface BattlePlayer {
  room_id: string;
  user_id: string;
  display_name: string;
  score: number;
  joined_at?: string;
}

export interface BattleAnswer {
  room_id: string;
  user_id: string;
  question_index: number;
  selected_index: number;
  correct: boolean;
  time_ms: number;
  created_at?: string;
}

export interface BattleParticipant {
  id: string;
  room_id: string;
  user_id: string;
  name: string;
  score: number;
  answers: {
    question_index: number;
    selected_index: number;
    correct: boolean;
    points: number;
  }[];
  joined_at?: string;
}

export interface NoteRecord {
  id: string;
  user_id: string;
  title: string;
  storage_path?: string;
  created_at?: string;
}

export interface GenerationCacheRecord {
  hash: string;
  questions: any;
  created_at?: string;
}
