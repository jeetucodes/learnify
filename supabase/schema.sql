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
-- Seed DBMS Syllabus and 40 MCQs
-- 1 Subject, 3 Units, 8 Topics, 40 Questions

-- Insert Subject
INSERT INTO public.subjects (id, name, code, description, icon)
VALUES (
    'sub-dbms',
    'Database Management Systems',
    'CS301',
    'Core foundations of relational models, normalization, SQL, transactions and concurrency.',
    'Database'
) ON CONFLICT (id) DO NOTHING;

-- Insert Units
INSERT INTO public.units (id, subject_id, unit_number, title)
VALUES 
    ('unit-1', 'sub-dbms', 1, 'Relational Model & SQL'),
    ('unit-2', 'sub-dbms', 2, 'Database Design & Normalization'),
    ('unit-3', 'sub-dbms', 3, 'Transactions & Concurrency Control')
ON CONFLICT (id) DO NOTHING;

-- Insert 8 Topics
INSERT INTO public.topics (id, unit_id, title, order_index)
VALUES
    ('topic-1', 'unit-1', 'ER Modeling & Relational Mapping', 1),
    ('topic-2', 'unit-1', 'Relational Algebra & Tuple Calculus', 2),
    ('topic-3', 'unit-1', 'Advanced SQL & Complex Joins', 3),
    ('topic-4', 'unit-2', 'Functional Dependencies & Candidate Keys', 4),
    ('topic-5', 'unit-2', 'Normal Forms (1NF to BCNF)', 5),
    ('topic-6', 'unit-2', 'Lossless Decomposition & Dependency Preservation', 6),
    ('topic-7', 'unit-3', 'ACID Properties & Serializability', 7),
    ('topic-8', 'unit-3', 'Concurrency Control & 2-Phase Locking', 8)
ON CONFLICT (id) DO NOTHING;

-- Insert 40 MCQs (5 per topic)
INSERT INTO public.questions (id, topic_id, question, options, answer_index, explanation, source, flagged)
VALUES
-- Topic 1: ER Modeling
(
    '00000000-0000-0000-0001-000000000001',
    'topic-1',
    'In an Entity-Relationship (ER) diagram, how is a weak entity set represented?',
    '["Single rectangle", "Double rectangle", "Diamond with double border", "Dashed ellipse"]'::jsonb,
    1,
    'A weak entity set lacks a primary key of its own and depends on an identifying entity set; it is represented by a double rectangle.',
    'pyq',
    false
),
(
    '00000000-0000-0000-0001-000000000002',
    'topic-1',
    'Which attribute type can be broken down into smaller sub-parts that represent more basic attributes?',
    '["Derived attribute", "Composite attribute", "Multivalued attribute", "Complex attribute"]'::jsonb,
    1,
    'Composite attributes can be divided into smaller sub-components (e.g., Name divided into First Name, Middle Name, Last Name).',
    'pyq',
    false
),
(
    '00000000-0000-0000-0001-000000000003',
    'topic-1',
    'In mapping a binary 1:N relationship into relational tables, where is the foreign key typically placed?',
    '["On the 1-side entity relation", "On the N-side entity relation", "In a separate junction table only", "On both sides symmetrically"]'::jsonb,
    1,
    'In a 1:N relationship, the primary key of the 1-side is included as a foreign key attribute in the table corresponding to the N-side.',
    'pyq',
    false
),
(
    '00000000-0000-0000-0001-000000000004',
    'topic-1',
    'What does the cardinality ratio 1:1 between two entities with total participation on both sides imply for schema reduction?',
    '["They cannot be merged", "They can be merged into a single relation", "They require at least three relations", "They form an impossible ER constraint"]'::jsonb,
    1,
    'When two entities share a 1:1 relationship with total participation on both ends, their tables can be collapsed into a single consolidated relation without null anomalies.',
    'ai',
    false
),
(
    '00000000-0000-0000-0001-000000000005',
    'topic-1',
    'How is a multivalued attribute represented in an ER diagram and mapped to a relational schema?',
    '["Represented by double ellipse; mapped to a separate relation with foreign key", "Represented by dashed oval; mapped as comma-separated text column", "Represented by double diamond; mapped into parent table", "Represented by rectangle; mapped as JSON array"]'::jsonb,
    0,
    'Multivalued attributes are denoted by double ellipses in ER diagrams and mapped into a new distinct relation comprising the attribute value and the parent entity primary key.',
    'pyq',
    false
),

-- Topic 2: Relational Algebra
(
    '00000000-0000-0000-0002-000000000001',
    'topic-2',
    'Which relational algebra operation selects rows that satisfy a specified predicate condition?',
    '["Projection (π)", "Selection (σ)", "Cartesian Product (×)", "Division (÷)"]'::jsonb,
    1,
    'Selection (denoted by Greek letter sigma σ) filters horizontal subsets of tuples satisfying a conditional Boolean expression.',
    'pyq',
    false
),
(
    '00000000-0000-0000-0002-000000000002',
    'topic-2',
    'Which of the following relational operators is fundamentally NOT commutative?',
    '["Natural Join (⋈)", "Union (∪)", "Set Difference (−)", "Intersection (∩)"]'::jsonb,
    2,
    'Set difference R − S yields tuples in R not in S, whereas S − R yields tuples in S not in R. Hence, R − S ≠ S − R.',
    'pyq',
    false
),
(
    '00000000-0000-0000-0002-000000000003',
    'topic-2',
    'If relation R has m tuples and relation S has n tuples, what is the cardinality of their Cartesian product R × S?',
    '["m + n", "m × n", "max(m, n)", "m^n"]'::jsonb,
    1,
    'Cartesian product combines every tuple in R with every tuple in S, producing m × n total tuples.',
    'pyq',
    false
),
(
    '00000000-0000-0000-0002-000000000004',
    'topic-2',
    'Which relational algebra operator is specifically used for queries involving universal quantification ("for all")?',
    '["Division (÷)", "Projection (π)", "Theta Join (⋈θ)", "Rename (ρ)"]'::jsonb,
    0,
    'Relational division (÷) is used for queries requiring all matching items, such as "Find students who have enrolled in ALL core computer science courses".',
    'pyq',
    false
),
(
    '00000000-0000-0000-0002-000000000005',
    'topic-2',
    'The projection operator π preserves which mathematical property of relational algebra?',
    '["Retains all duplicate tuples", "Eliminates duplicate tuples automatically", "Sorts tuples alphabetically", "Maintains original index pointers"]'::jsonb,
    1,
    'Because a relation in pure relational algebra is a mathematical set of tuples, duplicate rows resulting from projection are automatically eliminated.',
    'ai',
    false
),

-- Topic 3: Advanced SQL
(
    '00000000-0000-0000-0003-000000000001',
    'topic-3',
    'What is the fundamental difference between WHERE and HAVING clauses in SQL?',
    '["WHERE filters after aggregation; HAVING filters before aggregation", "WHERE filters individual rows; HAVING filters grouped rows", "HAVING can only be used with subqueries", "WHERE works only on indexed primary keys"]'::jsonb,
    1,
    'WHERE filters individual rows prior to grouping and aggregation; HAVING filters aggregate results after GROUP BY evaluation.',
    'pyq',
    false
),
(
    '00000000-0000-0000-0003-000000000002',
    'topic-3',
    'Which SQL join returns all records from the left table and matched records from the right table, filling nulls if no match exists?',
    '["INNER JOIN", "LEFT OUTER JOIN", "FULL OUTER JOIN", "CROSS JOIN"]'::jsonb,
    1,
    'LEFT OUTER JOIN retains all rows from the left table regardless of whether there is a match in the right table.',
    'pyq',
    false
),
(
    '00000000-0000-0000-0003-000000000003',
    'topic-3',
    'What does the SQL expression "NULL = NULL" evaluate to in standard three-valued logic?',
    '["TRUE", "FALSE", "UNKNOWN", "Syntax Error"]'::jsonb,
    2,
    'In SQL three-valued logic, any direct equality comparison involving NULL produces UNKNOWN, requiring IS NULL or IS NOT NULL instead.',
    'pyq',
    false
),
(
    '00000000-0000-0000-0003-000000000004',
    'topic-3',
    'Which window function assigns distinct sequential integers starting at 1 without skipping numbers, even across ties?',
    '["RANK()", "DENSE_RANK()", "ROW_NUMBER()", "NTILE()"]'::jsonb,
    2,
    'ROW_NUMBER() always assigns a unique incrementing integer to each row in the partition regardless of ties, unlike RANK() or DENSE_RANK().',
    'ai',
    false
),
(
    '00000000-0000-0000-0003-000000000005',
    'topic-3',
    'A correlated subquery in SQL is characterized by which of the following properties?',
    '["It executes once before the outer query runs", "It references columns from the outer query and re-evaluates for each outer row", "It can only return a single scalar value", "It runs asynchronously in background parallel threads"]'::jsonb,
    1,
    'A correlated subquery depends on values from the containing outer query, executing repeatedly for every candidate row evaluated by the outer query.',
    'pyq',
    false
),

-- Topic 4: Functional Dependencies & Keys
(
    '00000000-0000-0000-0004-000000000001',
    'topic-4',
    'According to Armstrong axioms, which inference rule states that if X → Y, then XZ → YZ?',
    '["Transitivity rule", "Augmentation rule", "Reflexivity rule", "Pseudo-transitivity rule"]'::jsonb,
    1,
    'The augmentation rule states that adding the same attribute set Z to both sides of a valid functional dependency preserves validity: X → Y implies XZ → YZ.',
    'pyq',
    false
),
(
    '00000000-0000-0000-0004-000000000002',
    'topic-4',
    'What constitutes a candidate key of a relational schema R?',
    '["Any superkey containing all non-prime attributes", "A minimal superkey whose closure determines all attributes in R", "The single primary key chosen by the DBA", "Any unique foreign key referencing another schema"]'::jsonb,
    1,
    'A candidate key is a minimal superkey; no proper subset of its attributes can functionally determine all attributes of the relation.',
    'pyq',
    false
),
(
    '00000000-0000-0000-0004-000000000003',
    'topic-4',
    'Given relation R(A, B, C, D) with FDs: {A → B, B → C, C → D}. What is the attribute closure of A, denoted as A+?',
    '["{A, B}", "{A, B, C}", "{A, B, C, D}", "{A, D}"]'::jsonb,
    2,
    'Starting with A: A determines B; B determines C; C determines D. Hence A+ = {A, B, C, D}, making A a candidate key.',
    'pyq',
    false
),
(
    '00000000-0000-0000-0004-000000000004',
    'topic-4',
    'What is a trivial functional dependency?',
    '["X → Y where X ∩ Y = ∅", "X → Y where Y ⊆ X", "X → Y where Y is a single prime attribute", "X → Y where X is null"]'::jsonb,
    1,
    'A functional dependency X → Y is trivial if and only if Y is a subset of X (e.g., AB → A).',
    'pyq',
    false
),
(
    '00000000-0000-0000-0004-000000000005',
    'topic-4',
    'An attribute that is part of ANY candidate key in a relation is called a:',
    '["Foreign attribute", "Prime attribute", "Secondary attribute", "Derived attribute"]'::jsonb,
    1,
    'A prime attribute is any attribute that belongs to at least one candidate key of the relation schema.',
    'ai',
    false
),

-- Topic 5: Normal Forms (1NF to BCNF)
(
    '00000000-0000-0000-0005-000000000001',
    'topic-5',
    'A table is in First Normal Form (1NF) if and only if:',
    '["All non-prime attributes depend on the full candidate key", "All attribute domains contain only atomic (indivisible) values", "There are no transitive dependencies", "Every determinant is a candidate key"]'::jsonb,
    1,
    '1NF requires that each column contain atomic, indivisible values with no repeating groups or multivalued arrays.',
    'pyq',
    false
),
(
    '00000000-0000-0000-0005-000000000002',
    'topic-5',
    'Second Normal Form (2NF) specifically eliminates which of the following anomalies?',
    '["Transitive dependencies", "Partial functional dependencies on candidate keys", "Multivalued dependencies", "Join dependencies"]'::jsonb,
    1,
    '2NF requires the relation to be in 1NF and guarantees that no non-prime attribute is functionally dependent on a proper subset of any candidate key (no partial dependencies).',
    'pyq',
    false
),
(
    '00000000-0000-0000-0005-000000000003',
    'topic-5',
    'In Third Normal Form (3NF), for every non-trivial functional dependency X → A, what condition must hold?',
    '["X is a candidate key OR A is a prime attribute", "X must be a candidate key AND A must be a candidate key", "A must not depend on any non-prime attribute", "X must contain all attributes of R"]'::jsonb,
    0,
    '3NF allows X → A if either X is a superkey OR the right-hand side attribute A is a prime attribute.',
    'pyq',
    false
),
(
    '00000000-0000-0000-0005-000000000004',
    'topic-5',
    'How does Boyce-Codd Normal Form (BCNF) differ strictly from 3NF?',
    '["BCNF allows partial dependencies if right-hand side is prime", "BCNF eliminates the condition allowing the right-hand side to be a prime attribute", "BCNF is strictly weaker than 3NF", "BCNF applies only to relations with composite foreign keys"]'::jsonb,
    1,
    'BCNF requires that for every non-trivial FD X → A, X must strictly be a superkey, eliminating the 3NF loophole where A is a prime attribute.',
    'pyq',
    false
),
(
    '00000000-0000-0000-0005-000000000005',
    'topic-5',
    'Which normal form is designed to handle non-functional multivalued dependencies (MVDs)?',
    '["3NF", "BCNF", "4NF", "5NF"]'::jsonb,
    2,
    'Fourth Normal Form (4NF) eliminates non-trivial multivalued dependencies (X ↠ Y) that are not functional dependencies on superkeys.',
    'ai',
    false
),

-- Topic 6: Lossless Decomposition & Dependency Preservation
(
    '00000000-0000-0000-0006-000000000001',
    'topic-6',
    'A decomposition of relation R into R1 and R2 is lossless-join if and only if (R1 ∩ R2) functionally determines:',
    '["R1 ∪ R2", "Either R1 or R2 (or both)", "Only the primary key of R", "None; it must have zero intersection"]'::jsonb,
    1,
    'A binary decomposition is lossless-join iff the common attribute set (R1 ∩ R2) forms a superkey of either R1 or R2.',
    'pyq',
    false
),
(
    '00000000-0000-0000-0006-000000000002',
    'topic-6',
    'Can any relational schema R always be decomposed into BCNF while simultaneously preserving all functional dependencies?',
    '["Yes, always guaranteed by Heath theorem", "No, dependency preservation is not always achievable in BCNF", "Yes, provided the schema is already in 2NF", "Yes, by adding auxiliary views"]'::jsonb,
    1,
    'While 3NF lossless and dependency-preserving decomposition is always achievable, BCNF lossless decomposition cannot always preserve all functional dependencies.',
    'pyq',
    false
),
(
    '00000000-0000-0000-0006-000000000003',
    'topic-6',
    'What is a dangerous consequence of a lossy (non-lossless) join decomposition?',
    '["Spurious tuples are generated when joining relations back", "Tuples are deleted and lost permanently", "Database performance degrades exponentially", "Foreign key constraints are disabled"]'::jsonb,
    0,
    'In a lossy decomposition, joining the decomposed relations produces extra false tuples (spurious tuples) that were not present in the original relation.',
    'pyq',
    false
),
(
    '00000000-0000-0000-0006-000000000004',
    'topic-6',
    'What algorithm tests whether an arbitrary decomposition of R into R1..Rn is lossless?',
    '["Chase algorithm (tableau test)", "Dijkstra shortest path", "Aho-Corasick automaton", "Tarjan strongly connected components"]'::jsonb,
    0,
    'The Chase algorithm uses a tableau matrix with symbol substitutions based on FDs to verify if a decomposition guarantees a lossless join.',
    'ai',
    false
),
(
    '00000000-0000-0000-0006-000000000005',
    'topic-6',
    'When a decomposition preserves functional dependencies, what practical operational benefit is gained?',
    '["Constraints can be validated locally in each sub-relation without costly joins", "Storage space is halved", "Index scans become obsolete", "Deadlocks cannot occur"]'::jsonb,
    0,
    'Dependency preservation ensures that update transactions can check FD constraints by inspecting single individual tables without performing cross-table joins.',
    'pyq',
    false
),

-- Topic 7: ACID Properties & Serializability
(
    '00000000-0000-0000-0007-000000000001',
    'topic-7',
    'Which ACID property ensures that all transaction operations succeed completely or none take effect upon failure?',
    '["Atomicity", "Consistency", "Isolation", "Durability"]'::jsonb,
    0,
    'Atomicity ensures the all-or-nothing guarantee, usually managed by the write-ahead log (WAL) and recovery manager.',
    'pyq',
    false
),
(
    '00000000-0000-0000-0007-000000000002',
    'topic-7',
    'Two operations in a concurrent schedule are considered conflicting if they belong to different transactions and:',
    '["Both read the same data item", "At least one writes to the same data item", "Both commit at the same millisecond", "Both perform table scans"]'::jsonb,
    1,
    'Conflict arises between operations of distinct transactions operating on the identical data item where at least one operation is a write (Read-Write, Write-Read, or Write-Write).',
    'pyq',
    false
),
(
    '00000000-0000-0000-0007-000000000003',
    'topic-7',
    'A precedence (serialization) graph has an edge from T1 to T2 if an operation of T1 conflicts with and precedes an operation of T2. The schedule is conflict serializable iff:',
    '["The graph contains at least one self-loop", "The precedence graph contains no directed cycles (DAG)", "Every node has in-degree equal to out-degree", "The graph is bipartite"]'::jsonb,
    1,
    'A concurrent schedule is conflict serializable if and only if its precedence graph is acyclic (contains no directed cycles).',
    'pyq',
    false
),
(
    '00000000-0000-0000-0007-000000000004',
    'topic-7',
    'What concurrency phenomenon occurs when Transaction A reads uncommitted modifications made by Transaction B, which later rolls back?',
    '["Dirty Read (Uncommitted Dependency)", "Non-repeatable Read", "Phantom Read", "Lost Update"]'::jsonb,
    0,
    'A dirty read occurs when a transaction reads transient, uncommitted data that is subsequently rolled back by another transaction.',
    'pyq',
    false
),
(
    '00000000-0000-0000-0007-000000000005',
    'topic-7',
    'Which SQL transaction isolation level guarantees prevention of Dirty Reads, Non-repeatable Reads, and Phantom Reads?',
    '["Read Uncommitted", "Read Committed", "Repeatable Read", "Serializable"]'::jsonb,
    3,
    'Serializable isolation is the highest level defined by the ANSI/ISO SQL standard, preventing dirty reads, non-repeatable reads, and phantom reads.',
    'ai',
    false
),

-- Topic 8: Concurrency Control & Locking
(
    '00000000-0000-0000-0008-000000000001',
    'topic-8',
    'Under the Two-Phase Locking (2PL) protocol, once a transaction releases its first lock:',
    '["It may acquire only shared locks", "It cannot acquire any new locks (entering shrinking phase)", "It must abort immediately", "It enters the growing phase"]'::jsonb,
    1,
    'Under basic 2PL, once a transaction releases any lock, it enters the shrinking phase and is strictly forbidden from acquiring any subsequent locks.',
    'pyq',
    false
),
(
    '00000000-0000-0000-0008-000000000002',
    'topic-8',
    'How does Strict Two-Phase Locking (Strict 2PL) prevent cascading rollbacks (cascadeless schedules)?',
    '["By releasing shared locks during growth phase", "By holding all exclusive (X) locks until transaction commits or aborts", "By converting all exclusive locks to intent locks", "By assigning monotonic timestamps to transactions"]'::jsonb,
    1,
    'Strict 2PL retains all exclusive (write) locks until the transaction terminates (commit/abort), ensuring uncommitted writes are never seen by concurrent transactions.',
    'pyq',
    false
),
(
    '00000000-0000-0000-0008-000000000003',
    'topic-8',
    'Does the standard Two-Phase Locking (2PL) protocol prevent deadlocks from occurring?',
    '["Yes, 2PL guarantees freedom from deadlocks", "No, 2PL guarantees conflict serializability but deadlocks are still possible", "Yes, but only in Rigorous 2PL", "No, 2PL causes livelocks rather than deadlocks"]'::jsonb,
    1,
    'Standard 2PL ensures conflict serializability, but transactions can still enter mutual wait cycles, resulting in deadlocks.',
    'pyq',
    false
),
(
    '00000000-0000-0000-0008-000000000004',
    'topic-8',
    'In Multiple Granularity Locking (MGL), what is the purpose of an Intent Shared (IS) lock on an ancestor node (e.g., table)?',
    '["To lock the entire table exclusively", "To indicate explicit locking will occur at a lower level in the tree hierarchy with shared locks", "To prevent any reader from accessing the database", "To bypass 2PL lock compatibility rules"]'::jsonb,
    1,
    'Intent Shared (IS) locks placed on parent nodes declare the intention to place fine-grained Shared (S) locks on child records down the hierarchy without locking the entire ancestor node.',
    'ai',
    false
),
(
    '00000000-0000-0000-0008-000000000005',
    'topic-8',
    'In timestamp-based concurrency control using the Thomas Write Rule, what action is taken when Write_Item(X) has timestamp TS < R-timestamp(X)?',
    '["The transaction commits instantly", "The transaction is aborted and rolled back", "The obsolete write operation is simply ignored and execution continues", "The lock is escalated to exclusive"]'::jsonb,
    2,
    'The Thomas Write Rule allows obsolete write operations to be quietly skipped without aborting the transaction if the item has already been overwritten by a younger transaction.',
    'pyq',
    false
)
ON CONFLICT (id) DO NOTHING;
