-- Migration: 20261103000003_core_features.sql
-- Description: Core features support for PDF Notes, AI Question Generation, and Live Multiplayer Battles

-- 1. Extend questions table
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS source_passage TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Notes Table for uploaded PDF tracking
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    storage_path TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notes" ON public.notes
    FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- 3. Generation Cache & Generation Log
CREATE TABLE IF NOT EXISTS public.generation_cache (
    hash TEXT PRIMARY KEY,
    questions JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.generation_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read generation cache" ON public.generation_cache
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert into generation cache" ON public.generation_cache
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.generation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generation_log_user_time ON public.generation_log(user_id, created_at);
ALTER TABLE public.generation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and log generation requests" ON public.generation_log
    FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- 4. Battle Rooms & Status Alignment
ALTER TABLE public.battle_rooms ADD COLUMN IF NOT EXISTS topic_id TEXT REFERENCES public.topics(id) ON DELETE SET NULL;
ALTER TABLE public.battle_rooms ADD COLUMN IF NOT EXISTS current_index INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.battle_rooms ADD COLUMN IF NOT EXISTS question_started_at TIMESTAMPTZ;

-- Adjust status check to accommodate 'lobby', 'live', 'finished', 'waiting', 'in_progress', 'completed'
ALTER TABLE public.battle_rooms DROP CONSTRAINT IF EXISTS battle_rooms_status_check;
ALTER TABLE public.battle_rooms ADD CONSTRAINT battle_rooms_status_check 
    CHECK (status IN ('lobby', 'live', 'finished', 'waiting', 'in_progress', 'completed'));

-- 5. Battle Players (normalized live player leaderboard)
CREATE TABLE IF NOT EXISTS public.battle_players (
    room_id UUID NOT NULL REFERENCES public.battle_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_battle_players_room ON public.battle_players(room_id);
ALTER TABLE public.battle_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Battle players viewable by authenticated users" ON public.battle_players
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Users can join battle players" ON public.battle_players
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own player row" ON public.battle_players
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- 6. Battle Answers (server-validated answers)
CREATE TABLE IF NOT EXISTS public.battle_answers (
    room_id UUID NOT NULL REFERENCES public.battle_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_index INTEGER NOT NULL,
    selected_index INTEGER NOT NULL,
    correct BOOLEAN NOT NULL,
    time_ms INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (room_id, user_id, question_index)
);

CREATE INDEX IF NOT EXISTS idx_battle_answers_lookup ON public.battle_answers(room_id, user_id, question_index);
ALTER TABLE public.battle_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own battle answers" ON public.battle_answers
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id);

-- 7. Supabase Realtime Publication
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_rooms;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_players;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 8. Storage bucket for notes
INSERT INTO storage.buckets (id, name, public)
VALUES ('notes', 'notes', false)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
    CREATE POLICY "Allow authenticated uploads to user notes folder" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'notes' AND (storage.foldername(name))[1] = (auth.uid())::text);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "Allow users to read their own notes" ON storage.objects
        FOR SELECT TO authenticated
        USING (bucket_id = 'notes' AND (storage.foldername(name))[1] = (auth.uid())::text);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 9. RPC: submit_answer (Server-authoritative scoring & validation)
CREATE OR REPLACE FUNCTION public.submit_answer(
    p_room_id UUID,
    p_question_index INTEGER,
    p_selected_index INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room RECORD;
    v_player RECORD;
    v_target_qid UUID;
    v_target_qid_text TEXT;
    v_correct_idx INTEGER;
    v_is_correct BOOLEAN := FALSE;
    v_elapsed NUMERIC;
    v_points INTEGER := 0;
    v_new_score INTEGER;
BEGIN
    -- 1. Verify user is authenticated
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- 2. Verify room is active and question index matches current_index
    SELECT * INTO v_room FROM public.battle_rooms WHERE id = p_room_id;
    IF v_room IS NULL THEN
        RAISE EXCEPTION 'Battle room not found';
    END IF;

    IF v_room.status NOT IN ('live', 'in_progress') THEN
        RAISE EXCEPTION 'Battle room is not currently live';
    END IF;

    IF COALESCE(v_room.current_index, v_room.current_question_index, 0) != p_question_index THEN
        RAISE EXCEPTION 'Question index mismatch. Current question has moved on.';
    END IF;

    -- 3. Verify player is a member of the room
    SELECT * INTO v_player FROM public.battle_players WHERE room_id = p_room_id AND user_id = v_user_id;
    IF v_player IS NULL THEN
        RAISE EXCEPTION 'Player is not registered in this battle room';
    END IF;

    -- 4. Check if answer already submitted
    IF EXISTS (
        SELECT 1 FROM public.battle_answers 
        WHERE room_id = p_room_id AND user_id = v_user_id AND question_index = p_question_index
    ) THEN
        RAISE EXCEPTION 'Answer already submitted for this question';
    END IF;

    -- 5. Validate server timer (15 seconds + 1.5s network grace)
    IF v_room.question_started_at IS NOT NULL THEN
        v_elapsed := EXTRACT(EPOCH FROM (now() - v_room.question_started_at));
        IF v_elapsed > 16.5 THEN
            RAISE EXCEPTION 'Time expired for this question';
        END IF;
    ELSE
        v_elapsed := 5.0;
    END IF;

    -- 6. Retrieve question ID from question_ids (support JSONB or UUID[] representation)
    IF pg_typeof(v_room.question_ids) = 'jsonb'::regtype THEN
        v_target_qid_text := v_room.question_ids->>p_question_index;
    ELSE
        v_target_qid_text := (v_room.question_ids)[p_question_index + 1]::TEXT;
    END IF;

    IF v_target_qid_text IS NULL THEN
        RAISE EXCEPTION 'Invalid question index';
    END IF;

    v_target_qid := v_target_qid_text::UUID;

    -- 7. Query correctness from public.questions directly
    SELECT answer_index INTO v_correct_idx FROM public.questions WHERE id = v_target_qid;
    IF v_correct_idx IS NULL THEN
        RAISE EXCEPTION 'Question data not found';
    END IF;

    IF v_correct_idx = p_selected_index THEN
        v_is_correct := TRUE;
        -- Base 100 points + up to 50 speed points based on remaining time
        v_points := 100 + GREATEST(0, LEAST(50, ROUND((15.0 - v_elapsed) * 3.33)))::INTEGER;
    END IF;

    -- 8. Insert into battle_answers
    INSERT INTO public.battle_answers (
        room_id, user_id, question_index, selected_index, correct, time_ms
    ) VALUES (
        p_room_id, v_user_id, p_question_index, p_selected_index, v_is_correct, ROUND(v_elapsed * 1000)::INTEGER
    );

    -- 9. Update player score
    UPDATE public.battle_players
    SET score = score + v_points
    WHERE room_id = p_room_id AND user_id = v_user_id
    RETURNING score INTO v_new_score;

    RETURN jsonb_build_object(
        'correct', v_is_correct,
        'answer_index', v_correct_idx,
        'points_awarded', v_points,
        'new_score', v_new_score
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. RPC: advance_question (Host only control)
CREATE OR REPLACE FUNCTION public.advance_question(
    p_room_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room RECORD;
    v_next_idx INTEGER;
    v_total_q INTEGER;
    v_new_status TEXT;
    v_winner RECORD;
BEGIN
    SELECT * INTO v_room FROM public.battle_rooms WHERE id = p_room_id;
    IF v_room IS NULL THEN
        RAISE EXCEPTION 'Room not found';
    END IF;

    IF v_room.host_id != v_user_id THEN
        RAISE EXCEPTION 'Only the room host can advance the question';
    END IF;

    IF pg_typeof(v_room.question_ids) = 'jsonb'::regtype THEN
        v_total_q := jsonb_array_length(v_room.question_ids);
    ELSE
        v_total_q := array_length(v_room.question_ids, 1);
    END IF;

    v_next_idx := COALESCE(v_room.current_index, 0) + 1;

    IF v_next_idx >= v_total_q THEN
        v_new_status := 'finished';
        
        -- Award XP to profiles upon game completion
        -- 1st place gets +50 bonus XP, all players get +10 XP per correct answer
        FOR v_winner IN (
            SELECT user_id, score,
                   ROW_NUMBER() OVER(ORDER BY score DESC) as rank
            FROM public.battle_players
            WHERE room_id = p_room_id
        ) LOOP
            UPDATE public.profiles
            SET xp = xp + (CASE WHEN v_winner.rank = 1 THEN 50 ELSE 10 END),
                last_active = now()
            WHERE id = v_winner.user_id;
        END LOOP;

        UPDATE public.battle_rooms
        SET status = 'finished',
            current_index = v_next_idx
        WHERE id = p_room_id;
    ELSE
        v_new_status := 'live';
        UPDATE public.battle_rooms
        SET status = 'live',
            current_index = v_next_idx,
            question_started_at = now()
        WHERE id = p_room_id;
    END IF;

    RETURN jsonb_build_object(
        'current_index', v_next_idx,
        'status', v_new_status,
        'total_questions', v_total_q
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
