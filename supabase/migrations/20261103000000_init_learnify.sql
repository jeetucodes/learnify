-- Learnify Schema Migration
-- Features: Auth & Profiles, Subjects, Units, Topics, Questions, Attempts, Battle Rooms, Battle Participants

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    xp INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    last_active TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Subjects, Units, Topics
CREATE TABLE IF NOT EXISTS public.subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    icon TEXT
);

CREATE TABLE IF NOT EXISTS public.units (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    unit_number INTEGER NOT NULL,
    title TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.topics (
    id TEXT PRIMARY KEY,
    unit_id TEXT NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0
);

-- 3. Questions
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id TEXT REFERENCES public.topics(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of 4 strings
    answer_index INTEGER NOT NULL, -- 0-3
    explanation TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('ai', 'pyq', 'seed')),
    flagged BOOLEAN NOT NULL DEFAULT FALSE,
    content_hash TEXT, -- To cache Notes-to-Quiz text
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for cache lookup
CREATE INDEX IF NOT EXISTS idx_questions_content_hash ON public.questions(content_hash);
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON public.questions(topic_id);

-- 4. Attempts (for mastery, history, revision)
CREATE TABLE IF NOT EXISTS public.attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    topic_id TEXT REFERENCES public.topics(id) ON DELETE SET NULL,
    correct BOOLEAN NOT NULL,
    selected_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attempts_user_topic ON public.attempts(user_id, topic_id);

-- 5. Live Battle Rooms
CREATE TABLE IF NOT EXISTS public.battle_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(5) UNIQUE NOT NULL,
    host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed')),
    question_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    current_question_index INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Battle Participants
CREATE TABLE IF NOT EXISTS public.battle_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.battle_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(room_id, user_id)
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_participants ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone authenticated can read profiles (needed for battle leaderboard), user can update only their own
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Syllabus & Questions: Everyone can read
CREATE POLICY "Everyone can read subjects" ON public.subjects
    FOR SELECT USING (true);

CREATE POLICY "Everyone can read units" ON public.units
    FOR SELECT USING (true);

CREATE POLICY "Everyone can read topics" ON public.topics
    FOR SELECT USING (true);

CREATE POLICY "Everyone can read questions" ON public.questions
    FOR SELECT USING (true);

-- Allow authenticated users to insert questions (Notes-to-Quiz / AI generated)
CREATE POLICY "Users can insert questions" ON public.questions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow reporting wrong questions (flagged = true)
CREATE POLICY "Users can flag questions" ON public.questions
    FOR UPDATE USING (true) WITH CHECK (true);

-- Attempts: Users see only their own attempts
CREATE POLICY "Users can view own attempts" ON public.attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts" ON public.attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Battle Rooms & Participants:
CREATE POLICY "Battle rooms viewable by authenticated users" ON public.battle_rooms
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Host can insert/update battle room" ON public.battle_rooms
    FOR ALL USING (auth.uid() = host_id);

CREATE POLICY "Battle participants viewable by room participants" ON public.battle_participants
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can join battle rooms" ON public.battle_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own battle participation" ON public.battle_participants
    FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- REALTIME REPLICATION
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_participants;

-- ==========================================
-- SERVER-SIDE FUNCTIONS (Stored Procedures)
-- ==========================================

-- Function to handle user creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, avatar_url, xp, streak, last_active)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
        0,
        1,
        now()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Server-side function to record a quiz attempt and award +10 XP + streak
CREATE OR REPLACE FUNCTION public.record_attempt(
    p_user_id UUID,
    p_question_id UUID,
    p_topic_id TEXT,
    p_correct BOOLEAN,
    p_selected_index INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_xp_gain INTEGER := 0;
    v_new_xp INTEGER;
    v_streak INTEGER;
    v_last_active TIMESTAMPTZ;
    v_today DATE := CURRENT_DATE;
    v_last_active_date DATE;
BEGIN
    -- 1. Insert attempt
    INSERT INTO public.attempts (user_id, question_id, topic_id, correct, selected_index)
    VALUES (p_user_id, p_question_id, p_topic_id, p_correct, p_selected_index);

    -- 2. Calculate XP
    IF p_correct THEN
        v_xp_gain := 10;
    END IF;

    -- 3. Update profile XP & Streak
    SELECT xp, streak, last_active INTO v_new_xp, v_streak, v_last_active
    FROM public.profiles WHERE id = p_user_id;

    v_last_active_date := v_last_active::DATE;
    
    IF v_last_active_date = v_today THEN
        -- Already active today, streak stays
        NULL;
    ELSIF v_last_active_date = v_today - 1 THEN
        -- Active yesterday, increment streak
        v_streak := v_streak + 1;
    ELSE
        -- Streak broke, reset to 1
        v_streak := 1;
    END IF;

    v_new_xp := COALESCE(v_new_xp, 0) + v_xp_gain;

    UPDATE public.profiles
    SET xp = v_new_xp,
        streak = v_streak,
        last_active = now()
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'xp_earned', v_xp_gain,
        'total_xp', v_new_xp,
        'streak', v_streak
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Server-side battle answer submission & scoring function
CREATE OR REPLACE FUNCTION public.submit_battle_answer(
    p_room_code VARCHAR(5),
    p_user_id UUID,
    p_question_index INTEGER,
    p_selected_index INTEGER,
    p_seconds_remaining NUMERIC
)
RETURNS JSONB AS $$
DECLARE
    v_room_id UUID;
    v_question_ids JSONB;
    v_target_q_id UUID;
    v_correct_idx INTEGER;
    v_is_correct BOOLEAN := FALSE;
    v_points INTEGER := 0;
    v_current_score INTEGER := 0;
    v_answers JSONB;
BEGIN
    -- Find room
    SELECT id, question_ids INTO v_room_id, v_question_ids
    FROM public.battle_rooms
    WHERE code = UPPER(p_room_code) AND status = 'in_progress';

    IF v_room_id IS NULL THEN
        RAISE EXCEPTION 'Room not found or not in progress';
    END IF;

    -- Get question id
    v_target_q_id := (v_question_ids->>p_question_index)::UUID;
    SELECT answer_index INTO v_correct_idx
    FROM public.questions WHERE id = v_target_q_id;

    IF v_correct_idx = p_selected_index THEN
        v_is_correct := TRUE;
        -- Speed bonus: base 100 points + up to 50 speed points based on remaining time (out of 15s)
        v_points := 100 + ROUND(LEAST(15, GREATEST(0, p_seconds_remaining)) * 3.33)::INTEGER;
    END IF;

    -- Update participant record
    SELECT score, answers INTO v_current_score, v_answers
    FROM public.battle_participants
    WHERE room_id = v_room_id AND user_id = p_user_id;

    v_answers := COALESCE(v_answers, '[]'::jsonb) || jsonb_build_object(
        'question_index', p_question_index,
        'selected_index', p_selected_index,
        'correct', v_is_correct,
        'points', v_points
    );

    UPDATE public.battle_participants
    SET score = v_current_score + v_points,
        answers = v_answers
    WHERE room_id = v_room_id AND user_id = p_user_id;

    RETURN jsonb_build_object(
        'correct', v_is_correct,
        'points_awarded', v_points,
        'total_score', v_current_score + v_points
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
