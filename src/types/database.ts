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
  status: 'waiting' | 'in_progress' | 'completed';
  question_ids: string[];
  current_question_index: number;
  started_at?: string;
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
