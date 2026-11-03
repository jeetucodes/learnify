# Learnify 🚀
> **Practice. Compete. Revise.**

A gamified exam-prep web app for college students built with **React 19**, **Vite**, **TypeScript**, **Tailwind CSS v4**, **Supabase** (Auth, Postgres, Realtime, Edge Functions), **Framer Motion**, and **Lucide Icons**.

---

## Features

1. **Auth & Gamified Profiles**
   - Email/password authentication, Google OAuth, and Instant Guest Demo mode.
   - Profile attributes: `id`, `name`, `avatar_url`, `xp`, `streak`, `last_active`.
   - Daily streak tracking with streak shield protection and +10 XP per correct MCQ answer.

2. **DBMS Syllabus & Questions Seed**
   - Seeded subject: **Database Management Systems (CS301)** with **3 Units** and **8 Topics**:
     - Unit 1: Relational Model & SQL (*ER Modeling, Relational Algebra, Advanced SQL*)
     - Unit 2: Database Design & Normalization (*Functional Dependencies, 1NF to BCNF, Lossless Decomposition*)
     - Unit 3: Transaction Management & Concurrency (*ACID Properties, 2-Phase Locking*)
   - **40 curated university-level MCQs** with conceptual explanations, answer indices, and source attribution (`pyq` or `ai`).

3. **Practice Quiz**
   - Unit and topic browser.
   - Interactive 10-question MCQ quiz with instant visual feedback (green checkmark for correct, red cross for wrong).
   - In-depth explanation card revealed after answering.
   - Question reporting ("Report Wrong Question") which immediately flags the question in the database (`flagged = true`).
   - Server/client attempt tracking recording `user_id`, `question_id`, `topic_id`, and `correct`.

4. **Notes-to-Quiz AI**
   - In-browser PDF text extraction powered by `pdfjs-dist`.
   - Content hashing via SHA-256 for instant caching (the same document never calls the AI API twice).
   - Calls Supabase Edge Function (`/supabase/functions/generate-quiz/index.ts`) integrating **Google Gemini API** (`gemini-1.5-flash`) with fallback to **Groq** (`llama-3.3-70b-versatile`).
   - Client and server output validation using **Zod** schema.
   - Automatic local generation fallback ensures zero downtime when testing offline.

5. **Topic Mastery & Today's Revision**
   - Dynamically calculates accuracy percentage per topic from historical attempts.
   - Red-to-green topic mastery heatmap on the Home dashboard.
   - **Revision Rule**: Any topic with accuracy under 60% is automatically routed into "Today's Revision".
   - "Start Revision Quiz" loads only the questions from weak topics to turn red/amber boxes into green.

6. **Live 15s Battle Arena**
   - Host generates a 5-letter room code (e.g., `DBMS1`).
   - 2 to 4 players join the lobby via the code.
   - All players receive the exact same 10 MCQs with a synchronized 15-second timer per question.
   - Server-side scoring (100 base points + speed bonus based on seconds remaining).
   - Real-time leaderboard updates with animated reordering and a victory podium.
   - Dual-channel synchronization: Supabase Realtime channels + BroadcastChannel API for multi-tab / dual browser testing.

---

## Project Structure

```
Learnify/
├── src/
│   ├── components/
│   │   ├── Navbar.tsx             # Header with brand, streak & XP counters
│   │   ├── BottomNav.tsx          # Mobile bottom tab bar
│   │   ├── ProgressBar.tsx        # Framer Motion animated progress bar
│   │   ├── Heatmap.tsx            # Red-to-green mastery heatmap
│   │   └── Confetti.tsx           # Celebratory canvas-confetti
│   ├── context/
│   │   └── AuthContext.tsx        # Supabase Auth & session manager
│   ├── lib/
│   │   ├── supabase.ts            # Supabase client initializer
│   │   ├── seedData.ts            # Seed DBMS syllabus and 40 MCQs
│   │   ├── pdfExtractor.ts        # pdfjs-dist text extraction + SHA-256
│   │   └── storage.ts             # Storage layer, scoring RPCs & sync
│   ├── screens/
│   │   ├── LoginScreen.tsx        # Email + Google auth & guest login
│   │   ├── HomeScreen.tsx         # Dashboard, XP, streak, heatmap, revision
│   │   ├── PracticeScreen.tsx     # Subject, unit, topic browser
│   │   ├── QuizScreen.tsx         # 10 MCQs, instant feedback, flag question
│   │   ├── ResultsScreen.tsx      # Score, XP earned, weak topics, confetti
│   │   ├── RevisionScreen.tsx     # < 60% accuracy revision set
│   │   ├── UploadNotesScreen.tsx  # PDF upload, AI generation & caching
│   │   ├── BattleLobbyScreen.tsx  # 5-letter room code lobby (2-4 players)
│   │   ├── BattleGameScreen.tsx   # 15s timer, live leaderboard, server scores
│   │   └── ProfileScreen.tsx      # User statistics, levels, badges, logout
│   ├── types/
│   │   └── database.ts            # TypeScript definitions
│   ├── App.tsx                    # Screen router & state orchestration
│   ├── index.css                  # Tailwind CSS v4 root stylesheet
│   └── main.tsx
├── supabase/
│   ├── migrations/
│   │   ├── 20261103000000_init_learnify.sql  # Schema, RLS, functions & RPCs
│   │   └── 20261103000001_seed_dbms.sql      # DBMS syllabus & 40 MCQs seed
│   └── functions/
│       └── generate-quiz/
│           ├── index.ts           # Deno Edge function with Gemini & Groq fallback
│           └── deno.json
├── .env.example
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Getting Started

### 1. Prerequisites
- **Node.js** >= 18.0
- **npm** or **pnpm**

### 2. Installation
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Configure your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```
*(Note: If no remote Supabase project is supplied, Learnify automatically operates with full local persistence and instant multi-tab communication so you can test immediately!)*

### 4. Database Setup (Supabase)
To apply the database schema, RLS policies, and seed questions to your remote Supabase instance:
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open the **SQL Editor**.
3. Run the contents of:
   - `/supabase/migrations/20261103000000_init_learnify.sql`
   - `/supabase/migrations/20261103000001_seed_dbms.sql`

### 5. Supabase Edge Functions & Secrets
Deploy the `generate-quiz` Edge Function:
```bash
# Set Edge Function secrets (API keys NEVER touch frontend code)
supabase secrets set GEMINI_API_KEY=your_gemini_api_key
supabase secrets set GROQ_API_KEY=your_groq_api_key

# Deploy the function
supabase functions deploy generate-quiz
```

### 6. Run the Dev Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Testing Flow (End-to-End)

1. **Sign In**:
   - Click "Instant Guest Mode" or sign in with your email/password.
2. **Play a Practice Quiz**:
   - Go to **Practice**, select **Unit 1: Relational Model & SQL**, pick **ER Modeling**.
   - Answer 10 MCQs. Notice the instant green/red feedback, conceptual explanation, and report wrong question button.
   - Earn +10 XP per correct question and view your results card with celebratory confetti.
3. **Upload Notes (Notes-to-Quiz AI)**:
   - Go to **Notes AI** tab.
   - Upload any sample PDF or click "load DBMS sample lecture text".
   - Notice the text extraction, hash generation, and instant 10 MCQs quiz generation.
4. **Mastery & Revision**:
   - Go to **Home**. View the red-to-green topic mastery heatmap and accuracy bars.
   - Topics under 60% accuracy will automatically appear in the **Today's Revision** card.
   - Click **Start Revision** to launch a revision session focusing only on your weak topics!
5. **Live 1v1 Battle**:
   - Open two browser windows (or an incognito window) side by side at `http://localhost:5173`.
   - In Window 1: Go to **Battle**, click **Create New Room** (receives a 5-letter code).
   - In Window 2: Go to **Battle**, enter the 5-letter code and click **Join Battle**.
   - Both windows show 2 players connected in real time.
   - In Window 1 (Host): Click **Start Live Battle Now**.
   - Both players answer the 10 questions with the 15-second countdown timer.
   - Notice the live leaderboard updating and reordering server-side points in real-time!
