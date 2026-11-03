import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Check,
  Plus,
  Minus,
  Play,
  RotateCw,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LearnifyBrand, LearnifyLogo } from '../components/LearnifyLogo';
import {
  SugaryFlame,
  SugaryBolt,
  SugaryBook,
  SugarySwords,
  SugaryTrophy,
  SugaryStar,
  SugaryTarget,
  SugaryCheck,
  SugarySparkles,
} from '../components/SugaryIcons';

interface LandingPageProps {
  onEnterApp: () => void;
}

/* Molded Clay Objects Cluster with Floating Stat Chips */
const MoldedCluster: React.FC = () => {
  return (
    <div
      className="relative w-full max-w-[500px] h-[360px] sm:h-[420px] lg:h-[460px] mx-auto flex items-center justify-center select-none"
      aria-hidden="true"
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-300/30 via-violet-200/20 to-pink-200/20 rounded-[60px] blur-2xl transform scale-95" />

      {/* Floating Interactive Badge 1 (Top Left) */}
      <div className="absolute top-4 left-2 sm:left-4 z-20 animate-bounce duration-1000 hidden sm:flex items-center gap-2 rounded-full bg-[#FFFDF7] px-3.5 py-1.5 shadow-[0_10px_25px_rgba(56,49,90,0.14),inset_2px_2px_4px_rgba(255,255,255,0.9)] border border-[#38315A]/10">
        <SugaryFlame size={18} />
        <span className="text-xs font-black text-[var(--dp-color-ink)]">7d Streak Active!</span>
      </div>

      {/* Floating Interactive Badge 2 (Bottom Right) */}
      <div className="absolute bottom-6 right-2 sm:right-4 z-20 hidden sm:flex items-center gap-2 rounded-full bg-[var(--dp-color-surface-warm)] px-3.5 py-1.5 shadow-[0_10px_25px_rgba(245,196,91,0.35),inset_2px_2px_4px_rgba(255,255,255,0.9)] border border-amber-300">
        <SugaryBolt size={18} />
        <span className="text-xs font-black text-amber-950">+100 XP Speed Bonus</span>
      </div>

      {/* Floating Interactive Badge 3 (Bottom Left) */}
      <div className="absolute bottom-4 left-6 z-20 hidden md:flex items-center gap-2 rounded-full bg-[var(--dp-color-surface-support)] px-3 py-1 shadow-[0_10px_20px_rgba(52,211,153,0.25)] border border-emerald-300">
        <SugaryCheck size={16} />
        <span className="text-[11px] font-bold text-emerald-950">Unit 2 Mastered</span>
      </div>

      <svg
        viewBox="0 0 500 440"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full max-w-full overflow-visible drop-shadow-[0_20px_35px_rgba(56,49,90,0.16)] relative z-10"
      >
        <defs>
          <linearGradient id="clay-yellow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFF4D0" />
            <stop offset="35%" stopColor="#FFE29A" />
            <stop offset="100%" stopColor="#F5C45B" />
          </linearGradient>

          <linearGradient id="clay-blue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#EBF4FE" />
            <stop offset="40%" stopColor="#C9E4FB" />
            <stop offset="100%" stopColor="#9BC7F3" />
          </linearGradient>

          <linearGradient id="clay-mint" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E5FAF0" />
            <stop offset="40%" stopColor="#BFEFD9" />
            <stop offset="100%" stopColor="#89DEB8" />
          </linearGradient>

          <linearGradient id="clay-pink" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FDEAF2" />
            <stop offset="40%" stopColor="#F8CFE3" />
            <stop offset="100%" stopColor="#ECA0C6" />
          </linearGradient>

          <linearGradient id="clay-violet" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#DFD7FD" />
            <stop offset="40%" stopColor="#B8A7F9" />
            <stop offset="100%" stopColor="#967FF4" />
          </linearGradient>

          <filter id="clay-shadow-soft" x="-20%" y="-20%" width="150%" height="150%">
            <feDropShadow dx="8" dy="12" stdDeviation="12" floodColor="#38315A" floodOpacity="0.16" />
          </filter>
        </defs>

        {/* 1. Backdrop Molded Pillow (Soft violet backing) */}
        <rect
          x="60"
          y="40"
          width="380"
          height="340"
          rx="60"
          fill="url(#clay-violet)"
          opacity="0.32"
          filter="url(#clay-shadow-soft)"
        />

        {/* 2. Molded Book (Mint, bottom-center) */}
        <g filter="url(#clay-shadow-soft)">
          <path
            d="M140 260 C180 250, 220 255, 250 270 C250 330, 250 360, 250 360 C220 345, 180 340, 140 350 Z"
            fill="url(#clay-mint)"
          />
          <path
            d="M360 260 C320 250, 280 255, 250 270 C250 330, 250 360, 250 360 C280 345, 320 340, 360 350 Z"
            fill="url(#clay-mint)"
          />
          <path
            d="M246 270 L254 270 L254 375 L250 368 L246 375 Z"
            fill="#4A3FD1"
            opacity="0.85"
          />
          <ellipse cx="195" cy="275" rx="35" ry="6" fill="#FFFFFF" opacity="0.6" />
          <ellipse cx="305" cy="275" rx="35" ry="6" fill="#FFFFFF" opacity="0.6" />
        </g>

        {/* 3. Molded Trophy (Butter-Yellow, center) */}
        <g filter="url(#clay-shadow-soft)">
          <rect x="210" y="250" width="80" height="20" rx="10" fill="url(#clay-yellow)" />
          <rect x="235" y="215" width="30" height="40" rx="8" fill="url(#clay-yellow)" />
          <path
            d="M195 125 C195 125, 195 210, 250 215 C305 210, 305 125, 305 125 Z"
            fill="url(#clay-yellow)"
          />
          <ellipse cx="250" cy="125" rx="55" ry="14" fill="url(#clay-yellow)" />
          <ellipse cx="250" cy="123" rx="46" ry="10" fill="#FFF9E5" opacity="0.8" />
          <path
            d="M195 135 C165 140, 160 185, 205 190"
            stroke="url(#clay-yellow)"
            strokeWidth="16"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M305 135 C335 140, 340 185, 295 190"
            stroke="url(#clay-yellow)"
            strokeWidth="16"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="250" cy="165" r="16" fill="#FFFDF7" opacity="0.85" />
          <path
            d="M250 154 L253 162 L261 163 L255 168 L257 176 L250 171 L243 176 L245 168 L239 163 L247 162 Z"
            fill="#4A3FD1"
          />
        </g>

        {/* 4. Molded Flame (Soft-Pink & Warm-Yellow, top-left) */}
        <g filter="url(#clay-shadow-soft)">
          <path
            d="M145 150 C125 120, 140 80, 165 65 C170 85, 185 95, 180 115 C195 95, 205 105, 205 130 C205 160, 175 175, 145 150 Z"
            fill="url(#clay-pink)"
          />
          <path
            d="M155 145 C145 130, 150 110, 165 100 C170 112, 178 118, 175 130 C182 120, 188 125, 186 138 C185 155, 168 160, 155 145 Z"
            fill="url(#clay-yellow)"
          />
          <ellipse cx="160" cy="95" rx="6" ry="12" transform="rotate(-20 160 95)" fill="#FFFFFF" opacity="0.75" />
        </g>

        {/* 5. Molded Lightning Bolt (Butter-Yellow, top-right) */}
        <g filter="url(#clay-shadow-soft)">
          <path
            d="M345 55 L310 115 L338 118 L305 180 L360 105 L332 102 Z"
            fill="url(#clay-yellow)"
            stroke="#FFF4D0"
            strokeWidth="6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d="M342 62 L315 110 L336 112"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
          />
        </g>

        {/* 6. Molded Star (Pale-Blue, far right) */}
        <g filter="url(#clay-shadow-soft)">
          <path
            d="M400 170 C400 170, 408 190, 425 195 C408 200, 400 220, 400 220 C400 220, 392 200, 375 195 C392 190, 400 170, 400 170 Z"
            fill="url(#clay-blue)"
          />
          <circle cx="395" cy="190" r="4" fill="#FFFFFF" opacity="0.8" />
        </g>

        {/* 7. Sparkle Pillows (Small accents) */}
        <circle cx="105" cy="220" r="14" fill="url(#clay-blue)" opacity="0.9" filter="url(#clay-shadow-soft)" />
        <circle cx="102" cy="216" r="4" fill="#FFFFFF" opacity="0.8" />

        <circle cx="390" cy="95" r="12" fill="url(#clay-mint)" opacity="0.85" filter="url(#clay-shadow-soft)" />
        <circle cx="387" cy="92" r="3.5" fill="#FFFFFF" opacity="0.8" />
      </svg>
    </div>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const [email, setEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [activeUnitTab, setActiveUnitTab] = useState(1);

  // Interactive Phone Mockup Quiz state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [demoScore, setDemoScore] = useState(0);
  const [demoStreak, setDemoStreak] = useState(1);
  const [showExplanation, setShowExplanation] = useState(false);

  const toggleFaq = (idx: number) => {
    setExpandedFaq(expandedFaq === idx ? null : idx);
  };

  const handleSelectOption = (idx: number) => {
    setSelectedOption(idx);
    setShowExplanation(true);
    if (idx === 1) {
      // Correct!
      setDemoScore(10);
      setDemoStreak(1);
    } else {
      setDemoScore(0);
    }
  };

  const handleResetDemo = () => {
    setSelectedOption(null);
    setShowExplanation(false);
    setDemoScore(0);
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid student email.');
      setWaitlistStatus('error');
      return;
    }

    setWaitlistStatus('loading');
    setErrorMessage('');

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('waitlist').insert([{ email: email.trim().toLowerCase() }]);
        if (error) {
          console.warn('Supabase waitlist notice:', error);
        }
      }

      // Save locally
      const existing = JSON.parse(localStorage.getItem('learnify_waitlist') || '[]');
      if (!existing.includes(email.trim().toLowerCase())) {
        existing.push(email.trim().toLowerCase());
        localStorage.setItem('learnify_waitlist', JSON.stringify(existing));
      }

      setWaitlistStatus('success');
      setEmail('');
    } catch (err: any) {
      console.error(err);
      setWaitlistStatus('success');
    }
  };

  const syllabusUnits = [
    {
      num: 1,
      title: 'ER Model & Relational Algebra',
      mcqCount: 12,
      topics: ['Entity Relationships & Cardinality', 'Candidate Keys & Relational Schema', 'Relational Algebra Operators'],
      examWeight: '25% of Exam',
      color: 'clay-cushion-mint',
    },
    {
      num: 2,
      title: 'SQL & Database Normalization',
      mcqCount: 16,
      topics: ['1NF, 2NF, 3NF & BCNF Rules', 'Functional Dependencies & Lossless Joins', 'Complex Subqueries & Aggregations'],
      examWeight: '35% of Exam',
      color: 'clay-cushion-violet',
    },
    {
      num: 3,
      title: 'Transactions & Concurrency',
      mcqCount: 12,
      topics: ['ACID Properties & Schedules', 'Two-Phase Locking (2PL)', 'Deadlock Prevention & Recovery'],
      examWeight: '20% of Exam',
      color: 'clay-cushion-yellow',
    },
    {
      num: 4,
      title: 'Indexing & Physical Storage',
      mcqCount: 10,
      topics: ['B-Trees & B+ Tree Searching', 'Hashing & Collision Resolution', 'Query Cost & Execution Plans'],
      examWeight: '20% of Exam',
      color: 'clay-cushion-blue',
    },
  ];

  return (
    <div className="min-h-[100svh] w-full max-w-full overflow-x-clip bg-[var(--dp-color-ground)] text-[var(--dp-color-ink)] font-clay antialiased selection:bg-[var(--dp-color-accent)] selection:text-[var(--dp-color-ink)]">
      
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-50 w-full max-w-full backdrop-blur-xl bg-[#EEF0FB]/90 border-b border-[#38315A]/[0.08] pt-[env(safe-area-inset-top,0px)] shadow-xs">
        <div className="mx-auto flex h-18 sm:h-20 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Brand Logo & Wordmark */}
          <LearnifyBrand
            onNavigate={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            size="md"
            showTagline={false}
          />

          {/* Navigation Links for Desktop */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-white/70 border border-[#38315A]/10 shadow-xs text-xs font-bold text-[var(--dp-color-ink-secondary)]">
            <a
              href="#loop"
              className="px-3.5 py-1.5 rounded-full hover:text-[var(--dp-color-primary-action)] hover:bg-white transition-all"
            >
              How it works
            </a>
            <a
              href="#syllabus"
              className="px-3.5 py-1.5 rounded-full hover:text-[var(--dp-color-primary-action)] hover:bg-white transition-all"
            >
              Syllabus
            </a>
            <a
              href="#interactive-demo"
              className="px-3.5 py-1.5 rounded-full hover:text-[var(--dp-color-primary-action)] hover:bg-white transition-all"
            >
              Interactive Quiz
            </a>
            <a
              href="#comparison"
              className="px-3.5 py-1.5 rounded-full hover:text-[var(--dp-color-primary-action)] hover:bg-white transition-all"
            >
              Comparison
            </a>
            <a
              href="#faq"
              className="px-3.5 py-1.5 rounded-full hover:text-[var(--dp-color-primary-action)] hover:bg-white transition-all"
            >
              FAQ
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onEnterApp}
              className="hidden sm:inline-flex text-xs font-bold text-[var(--dp-color-ink-secondary)] hover:text-[var(--dp-color-primary-action)] px-3 py-2 transition-colors cursor-pointer"
            >
              Log in
            </button>

            <button
              type="button"
              onClick={onEnterApp}
              className="clay-btn-primary inline-flex items-center justify-center min-h-[44px] h-11 px-5 sm:px-6 text-sm sm:text-base font-bold clay-focus cursor-pointer shadow-md"
            >
              <span>Start free</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>

        </div>
      </header>

      {/* 2. HERO: Large Violet Cushion + Molded Object Cluster */}
      <section className="relative w-full max-w-full px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 lg:pt-16 pb-12 sm:pb-16">
        <div className="mx-auto w-full max-w-6xl">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            
            {/* Left: Large Violet Cushion */}
            <div className="lg:col-span-7 clay-cushion-violet p-7 sm:p-11 lg:p-13 flex flex-col justify-between text-left relative overflow-hidden">
              
              {/* Subtle ambient light gradient inside cushion */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                
                {/* Modern Pill Badge */}
                <div className="inline-flex items-center gap-2 rounded-full bg-[#FFFDF7]/80 backdrop-blur-xs px-4 py-1.5 text-xs font-black text-[var(--dp-color-ink)] mb-6 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.9),inset_-2px_-2px_4px_rgba(56,49,90,0.1)] border border-[#38315A]/10">
                  <SugaryStar size={16} />
                  <span>College Exam Prep · Syllabus Aligned</span>
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                {/* Main Headline */}
                <h1 className="text-[clamp(2.75rem,6.8vw,5.25rem)] font-black tracking-tight leading-[1.02] text-[var(--dp-color-ink)]">
                  Study. <span className="bg-gradient-to-r from-indigo-700 to-violet-800 bg-clip-text text-transparent">Compete.</span> Repeat.
                </h1>

                {/* Subtitle */}
                <p className="mt-5 text-base sm:text-lg lg:text-xl text-[var(--dp-color-ink-secondary)] font-medium leading-relaxed max-w-lg">
                  Smart exam prep, made playful. Master university syllabus MCQs with instant feedback, 1v1 speed duels, and Notes-to-Quiz AI.
                </p>

                {/* Key Benefits Pill Strip */}
                <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold text-[var(--dp-color-ink)]">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFDF7]/60 border border-[#38315A]/10">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4A3FD1]" /> 100% Free for Students
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFDF7]/60 border border-[#38315A]/10">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4A3FD1]" /> Past Year Questions
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFDF7]/60 border border-[#38315A]/10">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4A3FD1]" /> Multi-tab Live Battles
                  </span>
                </div>

              </div>

              {/* Primary Action Buttons */}
              <div className="mt-8 sm:mt-10 relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <button
                  type="button"
                  onClick={onEnterApp}
                  className="clay-btn-primary w-full sm:w-auto inline-flex items-center justify-center min-h-[52px] h-13 px-8 text-base font-bold clay-focus cursor-pointer shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-transform"
                >
                  <span>Start free practice</span>
                  <ArrowRight className="ml-2.5 h-4 w-4" />
                </button>

                <a
                  href="#interactive-demo"
                  className="clay-btn-secondary w-full sm:w-auto inline-flex items-center justify-center min-h-[52px] h-13 px-6 text-sm sm:text-base font-bold text-[var(--dp-color-ink)] clay-focus cursor-pointer text-center"
                >
                  <Play className="mr-2 h-4 w-4 fill-current text-[var(--dp-color-primary-action)]" />
                  <span>Try interactive demo</span>
                </a>
              </div>

              {/* Curriculum Highlight Line */}
              <div className="mt-6 pt-5 border-t border-[#38315A]/10 flex items-center gap-2.5 text-xs text-[var(--dp-color-ink-secondary)] font-semibold">
                <SugaryBook size={20} />
                <span>Mapped to university DBMS curriculum · 40 verified MCQs across 3 comprehensive units</span>
              </div>

            </div>

            {/* Right: Molded CSS/SVG Objects Cluster */}
            <div className="lg:col-span-5 flex items-center justify-center min-h-[340px] lg:min-h-full">
              <MoldedCluster />
            </div>

          </div>

          {/* Three Small Pastel Fact Cushions Beneath Hero */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            
            {/* Fact 1: Syllabus-aware (Mint Cushion) */}
            <div className="clay-cushion-mint p-5 sm:p-6 flex items-center gap-4 transition-transform hover:-translate-y-1">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFFDF7] shadow-[inset_3px_3px_6px_rgba(255,255,255,0.9),inset_-3px_-3px_6px_rgba(56,49,90,0.1)]">
                <SugaryBook size={26} />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold uppercase tracking-wider text-[var(--dp-color-ink-secondary)]">University Coverage</span>
                <span className="text-base sm:text-lg font-black text-[var(--dp-color-ink)]">Syllabus-aware</span>
              </div>
            </div>

            {/* Fact 2: AI Quizzes (Pale Blue Cushion) */}
            <div className="clay-cushion-blue p-5 sm:p-6 flex items-center gap-4 transition-transform hover:-translate-y-1">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFFDF7] shadow-[inset_3px_3px_6px_rgba(255,255,255,0.9),inset_-3px_-3px_6px_rgba(56,49,90,0.1)]">
                <SugaryBolt size={26} />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold uppercase tracking-wider text-[var(--dp-color-ink-secondary)]">Notes-to-MCQ AI</span>
                <span className="text-base sm:text-lg font-black text-[var(--dp-color-ink)]">Instant 10 MCQs</span>
              </div>
            </div>

            {/* Fact 3: Live Battles (Butter Yellow Cushion) */}
            <div className="clay-cushion-yellow p-5 sm:p-6 flex items-center gap-4 transition-transform hover:-translate-y-1">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFFDF7] shadow-[inset_3px_3px_6px_rgba(255,255,255,0.9),inset_-3px_-3px_6px_rgba(56,49,90,0.1)]">
                <SugarySwords size={26} />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold uppercase tracking-wider text-[var(--dp-color-ink-secondary)]">Multiplayer Duel</span>
                <span className="text-base sm:text-lg font-black text-[var(--dp-color-ink)]">Live peer battles</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. SYLLABUS UNIT EXPLORER (NEW) */}
      <section id="syllabus" className="relative w-full max-w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="mx-auto w-full max-w-6xl clay-tray-cream p-7 sm:p-12 lg:p-14 text-left">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200 mb-3">
                <SugaryBook size={14} />
                <span>Standard University Engineering Syllabus</span>
              </div>
              <h2 className="text-[clamp(2rem,4.5vw,3rem)] font-black tracking-tight text-[var(--dp-color-ink)]">
                Mapped to your college syllabus.
              </h2>
              <p className="mt-2 text-base text-[var(--dp-color-ink-secondary)]">
                No random trivia. Pure concept mastery with past university exam questions.
              </p>
            </div>

            <button
              type="button"
              onClick={onEnterApp}
              className="clay-btn-secondary px-5 py-2.5 text-xs sm:text-sm font-bold text-[var(--dp-color-ink)] flex items-center gap-2 self-start md:self-auto cursor-pointer"
            >
              <span>Explore full syllabus</span>
              <ArrowRight className="w-4 h-4 text-[#4A3FD1]" />
            </button>
          </div>

          {/* Unit Selector Tabs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {syllabusUnits.map((unit, idx) => {
              const isActive = activeUnitTab === idx;
              return (
                <button
                  key={unit.num}
                  type="button"
                  onClick={() => setActiveUnitTab(idx)}
                  className={`p-4 rounded-2xl text-left transition-all duration-180 cursor-pointer ${
                    isActive
                      ? 'clay-cushion-violet border-2 border-[var(--dp-color-primary-action)] shadow-md'
                      : 'clay-cushion-cream hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                    <span className={isActive ? 'text-[var(--dp-color-primary-action)]' : 'text-slate-500'}>
                      UNIT 0{unit.num}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/70">
                      {unit.mcqCount} MCQs
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[var(--dp-color-ink)] line-clamp-2">
                    {unit.title}
                  </h4>
                </button>
              );
            })}
          </div>

          {/* Active Unit Detailed Tray */}
          <div className="clay-cushion-cream p-6 sm:p-8 rounded-3xl border border-[#38315A]/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#38315A]/10">
              <div>
                <span className="text-xs font-mono font-bold text-[var(--dp-color-primary-action)] uppercase tracking-wider block">
                  Unit #{syllabusUnits[activeUnitTab].num} Blueprint
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[var(--dp-color-ink)] mt-0.5">
                  {syllabusUnits[activeUnitTab].title}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold font-mono">
                <span className="px-3 py-1 rounded-full bg-[var(--dp-color-surface-warm)] text-amber-950">
                  {syllabusUnits[activeUnitTab].examWeight}
                </span>
                <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {syllabusUnits[activeUnitTab].mcqCount} Verified Questions
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {syllabusUnits[activeUnitTab].topics.map((t, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-[#EEF0FB]/60 border border-[#38315A]/10 flex items-start gap-3"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--dp-color-primary-action)] text-white text-xs font-mono font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                      Subtopic
                    </span>
                    <span className="text-sm font-bold text-[var(--dp-color-ink)]">
                      {t}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 4. CREAM TRAY: "One simple loop." */}
      <section id="loop" className="relative w-full max-w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="mx-auto w-full max-w-6xl clay-tray-cream p-7 sm:p-14 lg:p-16">
          
          <div className="max-w-xl text-left">
            <h2 className="text-[clamp(2rem,5vw,3.25rem)] font-black tracking-tight text-[var(--dp-color-ink)]">
              One simple loop.
            </h2>
            <p className="mt-3 text-base sm:text-lg text-[var(--dp-color-ink-secondary)] leading-relaxed font-medium">
              Master syllabus topics in a continuous game-like rhythm with real-time feedback.
            </p>
          </div>

          {/* Loop Grid: Lead item (Notes-to-Quiz) beside smaller items (Practice, Compete, Revise) */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            
            {/* Lead Item: Notes-to-Quiz */}
            <div className="md:col-span-5 clay-cushion-violet p-7 sm:p-8 flex flex-col justify-between text-left">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFFDF7] shadow-[inset_3px_3px_6px_rgba(255,255,255,0.9),inset_-3px_-3px_6px_rgba(56,49,90,0.15)]">
                    <SugaryBolt size={32} />
                  </div>
                  <span className="rounded-full bg-[#FFFDF7]/80 px-3 py-1 text-xs font-bold text-[var(--dp-color-ink)] border border-[#38315A]/10">
                    Step 1 · AI Generator
                  </span>
                </div>

                <h3 className="mt-6 text-2xl font-black text-[var(--dp-color-ink)]">
                  Notes-to-Quiz AI
                </h3>
                <p className="mt-2 text-base text-[var(--dp-color-ink-secondary)] leading-relaxed">
                  Turn lecture slides and PDFs into 10 instant exam questions with detailed explanations.
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-[#38315A]/10 flex items-center justify-between text-sm font-semibold text-[var(--dp-color-ink)]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#4A3FD1]" /> High Accuracy
                </span>
                <span className="font-mono text-xs bg-[#FFFDF7] px-2.5 py-0.5 rounded-md font-bold shadow-xs">
                  Free tier included
                </span>
              </div>
            </div>

            {/* Smaller Items Grid */}
            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Practice */}
              <div className="clay-cushion-cream p-6 flex flex-col justify-between text-left transition-transform hover:-translate-y-1">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--dp-color-surface-support)] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.8),inset_-2px_-2px_4px_rgba(56,49,90,0.1)]">
                    <SugaryBook size={24} />
                  </div>
                  <h4 className="mt-4 text-lg font-black text-[var(--dp-color-ink)]">
                    Practice
                  </h4>
                  <p className="mt-1 text-sm text-[var(--dp-color-ink-secondary)] leading-[1.55]">
                    Pick units & solve MCQs with instant answer feedback and rationales.
                  </p>
                </div>
                <span className="mt-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Step 2
                </span>
              </div>

              {/* Compete */}
              <div className="clay-cushion-cream p-6 flex flex-col justify-between text-left transition-transform hover:-translate-y-1">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--dp-color-surface-warm)] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.8),inset_-2px_-2px_4px_rgba(56,49,90,0.1)]">
                    <SugarySwords size={24} />
                  </div>
                  <h4 className="mt-4 text-lg font-black text-[var(--dp-color-ink)]">
                    Compete
                  </h4>
                  <p className="mt-1 text-sm text-[var(--dp-color-ink-secondary)] leading-[1.55]">
                    Challenge classmates or AI rivals to live 5-question speed battles.
                  </p>
                </div>
                <span className="mt-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Step 3
                </span>
              </div>

              {/* Revise */}
              <div className="clay-cushion-cream p-6 flex flex-col justify-between text-left transition-transform hover:-translate-y-1">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--dp-color-surface-cool)] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.8),inset_-2px_-2px_4px_rgba(56,49,90,0.1)]">
                    <SugaryTarget size={24} />
                  </div>
                  <h4 className="mt-4 text-lg font-black text-[var(--dp-color-ink)]">
                    Revise
                  </h4>
                  <p className="mt-1 text-sm text-[var(--dp-color-ink-secondary)] leading-[1.55]">
                    Spaced repetition queue automatically targeting weak concepts.
                  </p>
                </div>
                <span className="mt-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Step 4
                </span>
              </div>

            </div>

          </div>

          {/* Compact Shelf of Feature Rows */}
          <div className="mt-10 pt-8 border-t border-[#38315A]/[0.08] space-y-3">
            
            {/* Row 1: XP and streaks */}
            <div className="clay-cushion-cream p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--dp-color-surface-warm)] font-black text-xs text-[var(--dp-color-ink)] shadow-xs">
                  XP
                </span>
                <div>
                  <span className="text-base font-black text-[var(--dp-color-ink)] block sm:inline mr-2">
                    XP and streaks
                  </span>
                  <span className="text-sm text-[var(--dp-color-ink-secondary)]">
                    Earn +10 XP per correct question and defend daily momentum.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-sm tabular-nums font-bold">
                <span className="rounded-full bg-[var(--dp-color-surface-warm)] px-3 py-1 text-[var(--dp-color-ink)] shadow-sm">
                  +10 XP
                </span>
                <span className="rounded-full bg-[#FFFDF7] border border-[#38315A]/10 px-3 py-1 text-[var(--dp-color-ink)]">
                  7d streak 🔥
                </span>
              </div>
            </div>

            {/* Row 2: Topic mastery */}
            <div className="clay-cushion-cream p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--dp-color-surface-support)] font-black text-xs text-[var(--dp-color-ink)] shadow-xs">
                  %
                </span>
                <div>
                  <span className="text-base font-black text-[var(--dp-color-ink)] block sm:inline mr-2">
                    Topic mastery matrix
                  </span>
                  <span className="text-sm text-[var(--dp-color-ink-secondary)]">
                    Live syllabus heatmaps highlight mastered vs. weak topics.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-sm tabular-nums font-bold">
                <span className="rounded-full bg-[var(--dp-color-surface-support)] px-3 py-1 text-[var(--dp-color-ink)] shadow-sm">
                  92% accuracy
                </span>
              </div>
            </div>

            {/* Row 3: Smart revision queue */}
            <div className="clay-cushion-cream p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--dp-color-surface-cool)] font-black text-xs text-[var(--dp-color-ink)] shadow-xs">
                  14
                </span>
                <div>
                  <span className="text-base font-black text-[var(--dp-color-ink)] block sm:inline mr-2">
                    Smart revision queue
                  </span>
                  <span className="text-sm text-[var(--dp-color-ink-secondary)]">
                    Automated spaced repetition triggers reviews before memory fades.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-sm tabular-nums font-bold">
                <span className="rounded-full bg-[var(--dp-color-surface-cool)] px-3 py-1 text-[var(--dp-color-ink)] shadow-sm">
                  14 due today
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. INTERACTIVE PRODUCT PREVIEW: Playable Quiz inside Phone Mockup */}
      <section id="interactive-demo" className="relative w-full max-w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="mx-auto w-full max-w-4xl clay-tray-cream p-7 sm:p-14 text-center">
          
          <div className="max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 mb-3">
              <SugaryBolt size={14} />
              <span>Interactive Live Preview · Try It Right Here</span>
            </div>
            <h2 className="text-[clamp(2rem,5vw,3.25rem)] font-black tracking-tight text-[var(--dp-color-ink)]">
              Feels like a game.
            </h2>
            <p className="mt-3 text-base sm:text-lg text-[var(--dp-color-ink-secondary)] leading-relaxed font-medium">
              Tap an option below to test instant feedback, speed scoring, and explanation cards.
            </p>
          </div>

          {/* Interactive Phone Presentation */}
          <div className="relative mt-12 flex justify-center items-center">
            
            {/* Pale-Blue Backing Shape */}
            <div
              className="absolute w-[340px] sm:w-[440px] h-[520px] sm:h-[580px] rounded-[60px] bg-[var(--dp-color-surface-cool)] -rotate-2 shadow-[14px_18px_32px_rgba(56,49,90,0.12)]"
              aria-hidden="true"
            />

            {/* Phone Mockup Housing inside Inset Well */}
            <div className="relative z-10 w-full max-w-[min(340px,calc(100vw-36px))] sm:max-w-[360px] rounded-[48px] bg-[#FFFDF7] p-3.5 sm:p-5 shadow-[20px_28px_50px_rgba(56,49,90,0.18),inset_6px_6px_14px_rgba(255,255,255,0.98),inset_-6px_-6px_14px_rgba(180,170,210,0.2)]">
              
              {/* Phone Header Bar */}
              <div className="mb-3 flex justify-between items-center px-2">
                <span className="text-[11px] font-mono font-black uppercase tracking-wider text-[var(--dp-color-ink-secondary)]">
                  ⚡ Interactive Demo
                </span>
                <button
                  type="button"
                  onClick={handleResetDemo}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Recessed Inset Well for Quiz Screen */}
              <div className="clay-recessed-well rounded-[36px] bg-[#EEF0FB] p-4 sm:p-5 text-left space-y-4">
                
                {/* Speaker pill */}
                <div className="mx-auto h-3 w-20 rounded-full bg-[#38315A]/15" />

                {/* Question Header & XP Chip */}
                <div className="flex items-center justify-between text-xs font-mono tabular-nums text-[var(--dp-color-ink-secondary)] font-bold">
                  <span>Q 03/10 · DBMS Unit 2</span>
                  <span className="rounded-full bg-[var(--dp-color-surface-warm)] px-2.5 py-0.5 text-[var(--dp-color-ink)] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8)] font-bold">
                    {demoScore} XP
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full rounded-full bg-[#FFFDF7] overflow-hidden shadow-[inset_1px_1px_2px_rgba(56,49,90,0.15)]">
                  <div className="h-full w-3/5 rounded-full bg-[#4A3FD1] transition-all duration-300" />
                </div>

                {/* Question */}
                <p className="text-sm font-bold text-[var(--dp-color-ink)] leading-snug">
                  Which normal form eliminates partial functional dependency on candidate keys?
                </p>

                {/* Clay Option Tiles (CLICKABLE) */}
                <div className="space-y-2">
                  
                  {/* Option 0 */}
                  <button
                    type="button"
                    onClick={() => handleSelectOption(0)}
                    className={`w-full p-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all duration-180 cursor-pointer text-left ${
                      selectedOption === 0
                        ? 'bg-[var(--dp-color-surface-compare)] text-[#9F1239] border border-rose-300'
                        : 'clay-btn-secondary text-[var(--dp-color-ink)]'
                    }`}
                  >
                    <span>A. First Normal Form (1NF)</span>
                    {selectedOption === 0 && <span className="text-[10px] font-bold">Incorrect</span>}
                  </button>

                  {/* Option 1: The correct answer */}
                  <button
                    type="button"
                    onClick={() => handleSelectOption(1)}
                    className={`w-full p-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all duration-180 cursor-pointer text-left ${
                      selectedOption === 1
                        ? 'clay-cushion-mint border border-emerald-400 text-emerald-950 shadow-sm'
                        : 'clay-btn-secondary text-[var(--dp-color-ink)]'
                    }`}
                  >
                    <span>B. Second Normal Form (2NF)</span>
                    {selectedOption === 1 && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Correct!</span>
                      </span>
                    )}
                  </button>

                  {/* Option 2 */}
                  <button
                    type="button"
                    onClick={() => handleSelectOption(2)}
                    className={`w-full p-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all duration-180 cursor-pointer text-left ${
                      selectedOption === 2
                        ? 'bg-[var(--dp-color-surface-compare)] text-[#9F1239] border border-rose-300'
                        : 'clay-btn-secondary text-[var(--dp-color-ink)]'
                    }`}
                  >
                    <span>C. Third Normal Form (3NF)</span>
                    {selectedOption === 2 && <span className="text-[10px] font-bold">Incorrect</span>}
                  </button>

                </div>

                {/* Instant Explanation Card */}
                {showExplanation && (
                  <div
                    className={`p-3 rounded-2xl text-[11px] font-medium leading-relaxed border ${
                      selectedOption === 1
                        ? 'bg-emerald-50/90 text-emerald-950 border-emerald-200'
                        : 'bg-rose-50/90 text-rose-950 border-rose-200'
                    }`}
                  >
                    {selectedOption === 1 ? (
                      <div>
                        <span className="font-bold block text-emerald-800">💡 Exam Explanation:</span>
                        2NF requires 1NF and guarantees that no non-prime attribute is functionally dependent on any proper subset of candidate keys.
                      </div>
                    ) : (
                      <div>
                        <span className="font-bold block text-rose-800">Try again:</span>
                        Partial dependencies are eliminated when transitioning from 1NF to 2NF!
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom status */}
                <div className="pt-1 flex items-center justify-between text-xs font-mono tabular-nums font-bold text-[var(--dp-color-ink-secondary)]">
                  <span>Speed: 12.4s</span>
                  <span className="text-[var(--dp-color-ink)]">Streak: {demoStreak}d 🔥</span>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 6. ACADEMIC HIGHLIGHTS & ARCHITECTURE */}
      <section className="relative w-full max-w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="mx-auto w-full max-w-6xl text-left">
          
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-[clamp(1.85rem,4.5vw,2.75rem)] font-black tracking-tight text-[var(--dp-color-ink)]">
              Engineered for College Exams
            </h2>
            <p className="mt-2 text-base text-[var(--dp-color-ink-secondary)] font-medium">
              Every feature is built around the way university computer science courses are graded.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature Pillar 1 */}
            <div className="clay-cushion-cream p-7 rounded-3xl flex flex-col justify-between text-left">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[var(--dp-color-surface-cool)] flex items-center justify-center mb-4 shadow-xs">
                  <SugaryBook size={28} />
                </div>
                <h3 className="text-lg font-black text-[var(--dp-color-ink)] mb-2">
                  Syllabus-Aligned Bank
                </h3>
                <p className="text-sm font-medium text-[var(--dp-color-ink-secondary)] leading-relaxed">
                  Over 40 high-yield questions covering Relational Models, Normal Forms (1NF–BCNF), and ACID Concurrency, modeled after university semester papers.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#38315A]/10 flex items-center justify-between text-xs font-bold text-indigo-700">
                <span>3 Course Units</span>
                <span>· 100% Free</span>
              </div>
            </div>

            {/* Feature Pillar 2 */}
            <div className="clay-cushion-cream p-7 rounded-3xl flex flex-col justify-between text-left">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[var(--dp-color-surface-support)] flex items-center justify-center mb-4 shadow-xs">
                  <SugarySparkles size={28} />
                </div>
                <h3 className="text-lg font-black text-[var(--dp-color-ink)] mb-2">
                  Notes-to-Quiz AI
                </h3>
                <p className="text-sm font-medium text-[var(--dp-color-ink-secondary)] leading-relaxed">
                  Extracts text directly inside your browser with PDF.js and formulates structured multiple choice questions with explanations grounded in your exact course slides.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#38315A]/10 flex items-center justify-between text-xs font-bold text-emerald-800">
                <span>Direct PDF Upload</span>
                <span>· Instant Generation</span>
              </div>
            </div>

            {/* Feature Pillar 3 */}
            <div className="clay-cushion-cream p-7 rounded-3xl flex flex-col justify-between text-left">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[var(--dp-color-surface-warm)] flex items-center justify-center mb-4 shadow-xs">
                  <SugarySwords size={28} />
                </div>
                <h3 className="text-lg font-black text-[var(--dp-color-ink)] mb-2">
                  Spaced Review & 1v1 Battle
                </h3>
                <p className="text-sm font-medium text-[var(--dp-color-ink-secondary)] leading-relaxed">
                  Automated Leitner review queue isolates weak topics under 60% accuracy, while real-time speed battles let you duel classmates on synchronized questions.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#38315A]/10 flex items-center justify-between text-xs font-bold text-amber-900">
                <span>Spaced Repetition</span>
                <span>· Multiplayer Sync</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 7. SOFT-PINK DECISION TRAY: Comparison shelves & FAQ disclosures */}
      <section id="comparison" className="relative w-full max-w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="mx-auto w-full max-w-6xl clay-tray-pink p-7 sm:p-14 lg:p-16">
          
          <div className="max-w-xl text-left">
            <h2 className="text-[clamp(2rem,5vw,3.25rem)] font-black tracking-tight text-[var(--dp-color-ink)]">
              Clear comparisons.
            </h2>
            <p className="mt-3 text-base sm:text-lg text-[var(--dp-color-ink-secondary)] leading-relaxed font-medium">
              Honest strengths for university exam preparation.
            </p>
          </div>

          {/* Comparison Shelves */}
          <div className="mt-10 space-y-4">
            
            {/* Shelf 1: Kahoot / Quizizz */}
            <div className="clay-cushion-cream p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
              <div className="md:w-1/4">
                <span className="text-lg font-black text-[var(--dp-color-ink)]">Kahoot / Quizizz</span>
                <span className="block text-xs text-[var(--dp-color-ink-secondary)] uppercase tracking-wider font-semibold">Live party games</span>
              </div>
              <div className="md:w-1/2 text-sm text-[var(--dp-color-ink-secondary)]">
                Great for classroom buzzers & trivia; lacks college syllabus depth, spaced repetition, and notes AI.
              </div>
              <div className="md:w-1/4 flex md:justify-end">
                <span className="clay-btn-secondary px-4 py-2 text-xs font-bold text-[var(--dp-color-ink)] inline-flex items-center">
                  Good for trivia
                </span>
              </div>
            </div>

            {/* Shelf 2: Anki */}
            <div className="clay-cushion-cream p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
              <div className="md:w-1/4">
                <span className="text-lg font-black text-[var(--dp-color-ink)]">Anki</span>
                <span className="block text-xs text-[var(--dp-color-ink-secondary)] uppercase tracking-wider font-semibold">Flashcard system</span>
              </div>
              <div className="md:w-1/2 text-sm text-[var(--dp-color-ink-secondary)]">
                Powerful spaced repetition algorithm; steep setup curve, no syllabus question bank, and no multiplayer battles.
              </div>
              <div className="md:w-1/4 flex md:justify-end">
                <span className="clay-btn-secondary px-4 py-2 text-xs font-bold text-[var(--dp-color-ink)] inline-flex items-center">
                  Good for memory
                </span>
              </div>
            </div>

            {/* Shelf 3: Learnify (Featured Violet Cushion) */}
            <div className="clay-cushion-violet p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left shadow-[0_20px_40px_rgba(74,63,209,0.22)]">
              <div className="md:w-1/4">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-[var(--dp-color-ink)]">Learnify</span>
                  <span className="rounded-full bg-[#FFFDF7] px-2.5 py-0.5 text-[10px] font-black text-[var(--dp-color-primary-action)] uppercase">
                    Built for College
                  </span>
                </div>
                <span className="block text-xs text-[var(--dp-color-ink-secondary)] font-semibold mt-0.5">
                  Study · Compete · Repeat
                </span>
              </div>
              <div className="md:w-1/2 text-sm text-[var(--dp-color-ink)] font-semibold leading-relaxed">
                Syllabus-mapped MCQs, 1v1 speed battles, instant notes-to-quiz AI, and automated spaced revision queues.
              </div>
              <div className="md:w-1/4 flex md:justify-end">
                <button
                  type="button"
                  onClick={onEnterApp}
                  className="clay-btn-primary w-full md:w-auto inline-flex items-center justify-center min-h-[48px] h-12 px-6 py-2.5 text-sm sm:text-base font-bold clay-focus cursor-pointer whitespace-nowrap shadow-md"
                >
                  Start free
                </button>
              </div>
            </div>

          </div>

          {/* FAQ Disclosures */}
          <div id="faq" className="mt-14 pt-8 border-t border-[#38315A]/10">
            <h3 className="text-xl sm:text-2xl font-black text-[var(--dp-color-ink)] text-left mb-6">
              Frequently asked questions
            </h3>

            <div className="space-y-3">
              {[
                {
                  q: 'Is Learnify completely free for college students?',
                  a: 'Yes! Core syllabus questions, 1v1 live battles, spaced revision queues, and Notes-to-Quiz AI are completely free for students.',
                },
                {
                  q: 'How does Notes-to-Quiz AI generate questions?',
                  a: 'Simply upload your lecture slides or syllabus notes in PDF format. The system extracts core concepts and generates 10 exam-ready MCQs with correct answers and detailed rationales.',
                },
                {
                  q: 'Are the questions aligned with university past papers (PYQs)?',
                  a: 'Yes. Subjects like Database Management Systems (DBMS) include curated past year questions from standard engineering and BCA/MCA university curriculums.',
                },
                {
                  q: 'How do live multiplayer battles work?',
                  a: 'Click "Host a Battle", copy the 5-letter match code, and share it with classmates. You compete across 5 fast-paced questions with live leaderboard points based on speed and accuracy.',
                },
              ].map((item, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div key={item.q} className="clay-cushion-cream overflow-hidden text-left rounded-2xl">
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      aria-expanded={isOpen}
                      className="w-full p-5 sm:p-6 flex items-center justify-between text-left clay-focus cursor-pointer"
                    >
                      <span className="text-base font-bold text-[var(--dp-color-ink)] pr-4">
                        {item.q}
                      </span>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF0FB] shadow-[inset_2px_2px_4px_rgba(56,49,90,0.18),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] text-[var(--dp-color-ink)]">
                        {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-5 sm:px-6 pb-6 text-sm text-[var(--dp-color-ink-secondary)] leading-relaxed border-t border-[#38315A]/[0.06] pt-3 font-medium">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      </section>

      {/* 8. CLOSING: Violet Cushion + Footer */}
      <section className="relative w-full max-w-full px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="mx-auto w-full max-w-4xl clay-cushion-violet p-8 sm:p-14 lg:p-16 text-center relative overflow-hidden">
          
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/20 rounded-full blur-2xl pointer-events-none" />

          <div className="max-w-xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-xs font-bold text-indigo-900 border border-white mb-4 shadow-xs">
              <SugaryTrophy size={16} />
              <span>Free Student Access</span>
            </div>

            <h2 className="text-[clamp(2.25rem,6vw,3.75rem)] font-black tracking-tight text-[var(--dp-color-ink)]">
              Ready to rank up?
            </h2>
            <p className="mt-3 text-base sm:text-lg text-[var(--dp-color-ink-secondary)] leading-relaxed font-medium">
              Master your semester syllabus the smarter way. 100% free and open for university students.
            </p>
          </div>

          {/* Waitlist Form: Recessed cream well input + primary pill action */}
          <form onSubmit={handleWaitlistSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto relative z-10">
            <input
              type="email"
              required
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your student email"
              aria-label="Student email address"
              className="w-full min-h-[50px] h-13 rounded-full bg-[#FFFDF7] px-5 text-base text-[var(--dp-color-ink)] placeholder-[var(--dp-color-ink-secondary)]/60 shadow-[inset_4px_4px_8px_rgba(56,49,90,0.16),inset_-4px_-4px_8px_rgba(255,255,255,0.9)] focus:outline-none clay-focus"
            />

            <button
              type="submit"
              disabled={waitlistStatus === 'loading'}
              className="clay-btn-primary w-full sm:w-auto inline-flex items-center justify-center min-h-[50px] h-13 whitespace-nowrap px-8 text-base font-bold clay-focus cursor-pointer disabled:opacity-50 shadow-md"
            >
              <span>{waitlistStatus === 'loading' ? 'Joining...' : 'Join waitlist'}</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </form>

          {/* Success / Error Feedback */}
          {waitlistStatus === 'success' && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--dp-color-surface-support)] px-4 py-2 text-xs sm:text-sm font-bold text-[var(--dp-color-ink)] shadow-sm">
              <Check className="h-4 w-4 text-[var(--dp-color-primary-action)]" />
              <span>You are on the priority student waitlist!</span>
            </div>
          )}

          {waitlistStatus === 'error' && (
            <p className="mt-3 text-xs sm:text-sm font-bold text-rose-600">{errorMessage}</p>
          )}

        </div>

        {/* Footer on Cream Tray */}
        <footer className="mt-12 mx-auto w-full max-w-4xl clay-tray-cream px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-[var(--dp-color-ink-secondary)] font-medium pb-[max(1.5rem,env(safe-area-inset-bottom,1.5rem))]">
          <div className="flex items-center gap-2.5">
            <LearnifyLogo size={24} />
            <span className="font-black text-base text-[var(--dp-color-ink)]">Learnify</span>
            <span>·</span>
            <span>Study. Compete. Repeat.</span>
          </div>
          <div>
            <span>&copy; 2026 Learnify · University exam prep</span>
          </div>
        </footer>

      </section>

    </div>
  );
};
