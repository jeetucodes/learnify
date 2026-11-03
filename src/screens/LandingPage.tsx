import React, { useState } from 'react';
import {
  UploadCloud,
  BookOpen,
  Swords,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  Zap,
  Check,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface LandingPageProps {
  onEnterApp: () => void;
}

/* Molded Clay Objects Cluster (Upper-left lit: Trophy, Flame, Book, Lightning Bolt, Star) */
const MoldedCluster: React.FC = () => {
  return (
    <div
      className="relative w-full max-w-[480px] h-[340px] sm:h-[400px] lg:h-[440px] mx-auto flex items-center justify-center select-none"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 500 440"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full max-w-full overflow-visible drop-shadow-[0_20px_35px_rgba(56,49,90,0.14)]"
      >
        <defs>
          {/* Upper-left light gradients */}
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

          {/* Shading filters */}
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
          opacity="0.3"
          filter="url(#clay-shadow-soft)"
        />

        {/* 2. Molded Book (Mint, bottom-center) */}
        <g filter="url(#clay-shadow-soft)">
          {/* Left page */}
          <path
            d="M140 260 C180 250, 220 255, 250 270 C250 330, 250 360, 250 360 C220 345, 180 340, 140 350 Z"
            fill="url(#clay-mint)"
          />
          {/* Right page */}
          <path
            d="M360 260 C320 250, 280 255, 250 270 C250 330, 250 360, 250 360 C280 345, 320 340, 360 350 Z"
            fill="url(#clay-mint)"
          />
          {/* Book Spine / Bookmark Ribbon */}
          <path
            d="M246 270 L254 270 L254 375 L250 368 L246 375 Z"
            fill="#4A3FD1"
            opacity="0.85"
          />
          {/* Inset highlights on pages */}
          <ellipse cx="195" cy="275" rx="35" ry="6" fill="#FFFFFF" opacity="0.6" />
          <ellipse cx="305" cy="275" rx="35" ry="6" fill="#FFFFFF" opacity="0.6" />
        </g>

        {/* 3. Molded Trophy (Butter-Yellow, center) */}
        <g filter="url(#clay-shadow-soft)">
          {/* Trophy Base */}
          <rect x="210" y="250" width="80" height="20" rx="10" fill="url(#clay-yellow)" />
          <rect x="235" y="215" width="30" height="40" rx="8" fill="url(#clay-yellow)" />
          {/* Trophy Cup */}
          <path
            d="M195 125 C195 125, 195 210, 250 215 C305 210, 305 125, 305 125 Z"
            fill="url(#clay-yellow)"
          />
          {/* Trophy Rim */}
          <ellipse cx="250" cy="125" rx="55" ry="14" fill="url(#clay-yellow)" />
          <ellipse cx="250" cy="123" rx="46" ry="10" fill="#FFF9E5" opacity="0.8" />
          {/* Trophy Left Handle */}
          <path
            d="M195 135 C165 140, 160 185, 205 190"
            stroke="url(#clay-yellow)"
            strokeWidth="16"
            strokeLinecap="round"
            fill="none"
          />
          {/* Trophy Right Handle */}
          <path
            d="M305 135 C335 140, 340 185, 295 190"
            stroke="url(#clay-yellow)"
            strokeWidth="16"
            strokeLinecap="round"
            fill="none"
          />
          {/* Star insignia on cup */}
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
          {/* Inner flame core */}
          <path
            d="M155 145 C145 130, 150 110, 165 100 C170 112, 178 118, 175 130 C182 120, 188 125, 186 138 C185 155, 168 160, 155 145 Z"
            fill="url(#clay-yellow)"
          />
          {/* Specular highlight */}
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
          {/* Highlight along upper edge */}
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
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setExpandedFaq(expandedFaq === idx ? null : idx);
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
          console.warn('Supabase waitlist insert notice:', error);
        }
      }

      // Save locally as fallback / record
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

  return (
    <div className="min-h-[100svh] w-full max-w-full overflow-x-clip bg-[var(--dp-color-ground)] text-[var(--dp-color-ink)] font-clay antialiased selection:bg-[var(--dp-color-accent)] selection:text-[var(--dp-color-ink)]">
      
      {/* 1. NAVBAR */}
      <header className="sticky top-0 z-50 w-full max-w-full backdrop-blur-md bg-[#EEF0FB]/85 border-b border-[#38315A]/[0.08] pt-[env(safe-area-inset-top,0px)]">
        <div className="mx-auto flex h-18 sm:h-20 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center min-h-[48px] px-1 text-2xl font-bold tracking-tight text-[var(--dp-color-ink)] hover:text-[var(--dp-color-primary-action)] transition-colors clay-focus rounded-full"
            aria-label="Learnify home"
          >
            Learnify
          </a>

          <button
            type="button"
            onClick={onEnterApp}
            className="clay-btn-primary inline-flex items-center justify-center min-h-[48px] px-6 py-2.5 text-base font-bold clay-focus cursor-pointer"
          >
            <span>Get started</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </header>

      {/* 2. HERO: Violet Cushion (Headline + short line + button) + Molded Object Cluster + 3 Fact Cushions */}
      <section className="relative w-full max-w-full px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 lg:pt-16 pb-12 sm:pb-16">
        <div className="mx-auto w-full max-w-6xl">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            
            {/* Left: Large Violet Cushion */}
            <div className="lg:col-span-7 clay-cushion-violet p-8 sm:p-12 lg:p-14 flex flex-col justify-between text-left">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#FFFDF7]/60 px-4 py-1.5 text-xs font-bold text-[var(--dp-color-ink)] mb-6 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.8),inset_-2px_-2px_4px_rgba(56,49,90,0.1)]">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--dp-color-primary-action)]" />
                  <span>College Exam Prep</span>
                </div>

                <h1 className="text-[clamp(2.75rem,7vw,5.5rem)] font-bold tracking-tight leading-[1.02] text-[var(--dp-color-ink)]">
                  Study. Compete. Repeat.
                </h1>

                <p className="mt-5 text-lg sm:text-xl text-[var(--dp-color-ink-secondary)] font-normal leading-relaxed max-w-md">
                  Smart exam prep, made playful.
                </p>
              </div>

              <div className="mt-8 sm:mt-10">
                <button
                  type="button"
                  onClick={onEnterApp}
                  className="clay-btn-primary w-full sm:w-auto inline-flex items-center justify-center min-h-[52px] h-13 px-8 text-base font-bold clay-focus cursor-pointer"
                >
                  <span>Start free</span>
                  <ArrowRight className="ml-2.5 h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Right: Molded CSS/SVG Objects Cluster */}
            <div className="lg:col-span-5 flex items-center justify-center min-h-[300px] lg:min-h-full">
              <MoldedCluster />
            </div>

          </div>

          {/* Three Small Pastel Fact Cushions Beneath Hero */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            
            {/* Fact 1: Syllabus-aware (Mint Cushion) */}
            <div className="clay-cushion-mint p-5 sm:p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFFDF7] shadow-[inset_3px_3px_6px_rgba(255,255,255,0.9),inset_-3px_-3px_6px_rgba(56,49,90,0.1)]">
                <BookOpen className="h-6 w-6 text-[#2B2540]" />
              </div>
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-[var(--dp-color-ink-secondary)]">Coverage</span>
                <span className="text-base sm:text-lg font-bold text-[var(--dp-color-ink)]">Syllabus-aware</span>
              </div>
            </div>

            {/* Fact 2: AI Quizzes (Pale Blue Cushion) */}
            <div className="clay-cushion-blue p-5 sm:p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFFDF7] shadow-[inset_3px_3px_6px_rgba(255,255,255,0.9),inset_-3px_-3px_6px_rgba(56,49,90,0.1)]">
                <Zap className="h-6 w-6 text-[#2B2540]" />
              </div>
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-[var(--dp-color-ink-secondary)]">Notes-to-MCQ</span>
                <span className="text-base sm:text-lg font-bold text-[var(--dp-color-ink)]">AI quizzes</span>
              </div>
            </div>

            {/* Fact 3: Live Battles (Butter Yellow Cushion) */}
            <div className="clay-cushion-yellow p-5 sm:p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFFDF7] shadow-[inset_3px_3px_6px_rgba(255,255,255,0.9),inset_-3px_-3px_6px_rgba(56,49,90,0.1)]">
                <Swords className="h-6 w-6 text-[#2B2540]" />
              </div>
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-[var(--dp-color-ink-secondary)]">Multiplayer</span>
                <span className="text-base sm:text-lg font-bold text-[var(--dp-color-ink)]">Live battles</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. CREAM TRAY: "One simple loop." */}
      <section className="relative w-full max-w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-6xl clay-tray-cream p-8 sm:p-14 lg:p-16">
          
          <div className="max-w-xl text-left">
            <h2 className="text-[clamp(2rem,5vw,3.25rem)] font-bold tracking-tight text-[var(--dp-color-ink)]">
              One simple loop.
            </h2>
            <p className="mt-3 text-base sm:text-lg text-[var(--dp-color-ink-secondary)] leading-relaxed">
              Master topics in a continuous game-like rhythm.
            </p>
          </div>

          {/* Loop Grid: Lead item (Notes-to-Quiz) beside smaller items (Practice, Compete, Revise) */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            
            {/* Lead Item: Notes-to-Quiz */}
            <div className="md:col-span-5 clay-cushion-violet p-7 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFFDF7] shadow-[inset_3px_3px_6px_rgba(255,255,255,0.9),inset_-3px_-3px_6px_rgba(56,49,90,0.15)]">
                    <UploadCloud className="h-7 w-7 text-[#4A3FD1]" />
                  </div>
                  <span className="rounded-full bg-[#FFFDF7]/70 px-3 py-1 text-xs font-bold text-[var(--dp-color-ink)]">
                    Step 1 · Lead Feature
                  </span>
                </div>

                <h3 className="mt-6 text-2xl font-bold text-[var(--dp-color-ink)]">
                  Notes-to-Quiz AI
                </h3>
                <p className="mt-2 text-base text-[var(--dp-color-ink-secondary)]">
                  Turn lecture slides and PDFs into 10 instant exam questions.
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-[#38315A]/10 flex items-center justify-between text-sm font-semibold text-[var(--dp-color-ink)]">
                <span>Auto-generates MCQs</span>
                <span className="font-mono text-xs bg-[#FFFDF7] px-2 py-0.5 rounded-md">Free tier</span>
              </div>
            </div>

            {/* Smaller Items Grid */}
            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Practice */}
              <div className="clay-cushion-cream p-6 flex flex-col justify-between text-left">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--dp-color-surface-support)] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.8),inset_-2px_-2px_4px_rgba(56,49,90,0.1)]">
                    <BookOpen className="h-6 w-6 text-[#2B2540]" />
                  </div>
                  <h4 className="mt-4 text-lg font-bold text-[var(--dp-color-ink)]">
                    Practice
                  </h4>
                  <p className="mt-1 text-base text-[var(--dp-color-ink-secondary)] leading-[1.55]">
                    Pick units & solve MCQs with instant answer feedback.
                  </p>
                </div>
                <span className="mt-6 text-xs font-bold text-[var(--dp-color-ink-secondary)] uppercase tracking-wider">
                  Step 2
                </span>
              </div>

              {/* Compete */}
              <div className="clay-cushion-cream p-6 flex flex-col justify-between text-left">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--dp-color-surface-warm)] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.8),inset_-2px_-2px_4px_rgba(56,49,90,0.1)]">
                    <Swords className="h-6 w-6 text-[#2B2540]" />
                  </div>
                  <h4 className="mt-4 text-lg font-bold text-[var(--dp-color-ink)]">
                    Compete
                  </h4>
                  <p className="mt-1 text-base text-[var(--dp-color-ink-secondary)] leading-[1.55]">
                    Challenge classmates to live 5-question speed battles.
                  </p>
                </div>
                <span className="mt-6 text-xs font-bold text-[var(--dp-color-ink-secondary)] uppercase tracking-wider">
                  Step 3
                </span>
              </div>

              {/* Revise */}
              <div className="clay-cushion-cream p-6 flex flex-col justify-between text-left">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--dp-color-surface-cool)] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.8),inset_-2px_-2px_4px_rgba(56,49,90,0.1)]">
                    <RotateCcw className="h-6 w-6 text-[#2B2540]" />
                  </div>
                  <h4 className="mt-4 text-lg font-bold text-[var(--dp-color-ink)]">
                    Revise
                  </h4>
                  <p className="mt-1 text-base text-[var(--dp-color-ink-secondary)] leading-[1.55]">
                    Spaced repetition queue targeting weak concepts.
                  </p>
                </div>
                <span className="mt-6 text-xs font-bold text-[var(--dp-color-ink-secondary)] uppercase tracking-wider">
                  Step 4
                </span>
              </div>

            </div>

          </div>

          {/* Compact Shelf of Feature Rows */}
          <div className="mt-10 pt-8 border-t border-[#38315A]/[0.08] space-y-3">
            
            {/* Row 1: XP and streaks */}
            <div className="clay-cushion-cream p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--dp-color-surface-warm)] font-bold text-xs text-[var(--dp-color-ink)]">
                  XP
                </span>
                <span className="text-base font-bold text-[var(--dp-color-ink)]">
                  XP and streaks
                </span>
                <span className="text-sm text-[var(--dp-color-ink-secondary)]">
                  Earn +10 XP per correct question and defend daily momentum.
                </span>
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
            <div className="clay-cushion-cream p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--dp-color-surface-support)] font-bold text-xs text-[var(--dp-color-ink)]">
                  %
                </span>
                <span className="text-base font-bold text-[var(--dp-color-ink)]">
                  Topic mastery
                </span>
                <span className="text-sm text-[var(--dp-color-ink-secondary)]">
                  Live syllabus tracking highlights strong and weak units.
                </span>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-sm tabular-nums font-bold">
                <span className="rounded-full bg-[var(--dp-color-surface-support)] px-3 py-1 text-[var(--dp-color-ink)] shadow-sm">
                  92% mastery
                </span>
              </div>
            </div>

            {/* Row 3: Smart revision queue */}
            <div className="clay-cushion-cream p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--dp-color-surface-cool)] font-bold text-xs text-[var(--dp-color-ink)]">
                  14
                </span>
                <span className="text-base font-bold text-[var(--dp-color-ink)]">
                  Smart revision queue
                </span>
                <span className="text-sm text-[var(--dp-color-ink-secondary)]">
                  Automated Leitner queue schedules cards right before memory fades.
                </span>
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

      {/* 4. PRODUCT PREVIEW: Phone mockup in rounded inset well inside cream card with pale-blue backing shape */}
      <section className="relative w-full max-w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-4xl clay-tray-cream p-8 sm:p-14 text-center">
          
          <div className="max-w-xl mx-auto">
            <h2 className="text-[clamp(2rem,5vw,3.25rem)] font-bold tracking-tight text-[var(--dp-color-ink)]">
              Feels like a game.
            </h2>
            <p className="mt-3 text-base sm:text-lg text-[var(--dp-color-ink-secondary)] leading-relaxed">
              Instant feedback, speed battles, and real XP.
            </p>
          </div>

          {/* Sample Screen Phone Presentation */}
          <div className="relative mt-12 flex justify-center items-center">
            
            {/* Pale-Blue Backing Shape */}
            <div
              className="absolute w-[340px] sm:w-[420px] h-[460px] sm:h-[520px] rounded-[60px] bg-[var(--dp-color-surface-cool)] -rotate-2 shadow-[14px_18px_32px_rgba(56,49,90,0.12)]"
              aria-hidden="true"
            />

            {/* Phone Mockup Housing inside Inset Well */}
            <div className="relative z-10 w-full max-w-[min(300px,calc(100vw-48px))] sm:max-w-[330px] rounded-[44px] bg-[#FFFDF7] p-3 sm:p-4 shadow-[18px_24px_44px_rgba(56,49,90,0.16),inset_6px_6px_12px_rgba(255,255,255,0.95),inset_-6px_-6px_12px_rgba(180,170,210,0.18)]">
              
              {/* "Sample screen" Pill Label */}
              <div className="mb-3 flex justify-between items-center px-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--dp-color-ink-secondary)]">
                  Sample screen
                </span>
                <span className="flex h-2 w-2 rounded-full bg-[#4A3FD1]" />
              </div>

              {/* Recessed Inset Well for Quiz Screen */}
              <div className="clay-recessed-well rounded-[34px] bg-[#EEF0FB] p-4 sm:p-5 text-left space-y-4">
                
                {/* Speaker pill */}
                <div className="mx-auto h-3 w-18 rounded-full bg-[#38315A]/15" />

                {/* Question Header & XP Chip */}
                <div className="flex items-center justify-between text-xs font-mono tabular-nums text-[var(--dp-color-ink-secondary)] font-bold">
                  <span>Q 03/10</span>
                  <span className="rounded-full bg-[var(--dp-color-surface-warm)] px-2.5 py-0.5 text-[var(--dp-color-ink)] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8)]">
                    +10 XP
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full rounded-full bg-[#FFFDF7] overflow-hidden shadow-[inset_1px_1px_2px_rgba(56,49,90,0.15)]">
                  <div className="h-full w-2/5 rounded-full bg-[#4A3FD1]" />
                </div>

                {/* Question */}
                <p className="text-sm font-bold text-[var(--dp-color-ink)] leading-snug">
                  Which normal form eliminates partial functional dependency?
                </p>

                {/* Clay Option Tiles */}
                <div className="space-y-2.5">
                  
                  {/* Option A: Standard */}
                  <div className="clay-btn-secondary p-3 text-xs font-semibold text-[var(--dp-color-ink)] flex items-center justify-between">
                    <span>A. First Normal Form (1NF)</span>
                  </div>

                  {/* Option B: Correct Mint Tile */}
                  <div className="clay-cushion-mint p-3 text-xs font-bold text-[var(--dp-color-ink)] flex items-center justify-between">
                    <span>B. Second Normal Form (2NF)</span>
                    <CheckCircle2 className="h-4 w-4 text-[var(--dp-color-primary-action)]" />
                  </div>

                  {/* Option C: Soft-Pink Wrong Tile */}
                  <div className="bg-[var(--dp-color-surface-compare)] rounded-[999px] p-3 text-xs font-semibold text-[var(--dp-color-ink)] flex items-center justify-between shadow-[inset_2px_2px_4px_rgba(255,255,255,0.8),inset_-2px_-2px_4px_rgba(56,49,90,0.1)]">
                    <span>C. Third Normal Form (3NF)</span>
                  </div>

                </div>

                {/* Bottom status */}
                <div className="pt-1 flex items-center justify-between text-xs font-mono tabular-nums font-bold text-[var(--dp-color-ink-secondary)]">
                  <span>Timer: 12s</span>
                  <span className="text-[var(--dp-color-ink)]">Streak: 3d 🔥</span>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 5. SOFT-PINK DECISION TRAY: Comparison shelves & FAQ disclosures */}
      <section className="relative w-full max-w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-6xl clay-tray-pink p-8 sm:p-14 lg:p-16">
          
          <div className="max-w-xl text-left">
            <h2 className="text-[clamp(2rem,5vw,3.25rem)] font-bold tracking-tight text-[var(--dp-color-ink)]">
              Clear comparisons.
            </h2>
            <p className="mt-3 text-base sm:text-lg text-[var(--dp-color-ink-secondary)] leading-relaxed">
              Honest strengths for college exam prep.
            </p>
          </div>

          {/* Comparison Shelves */}
          <div className="mt-10 space-y-4">
            
            {/* Shelf 1: Kahoot / Quizizz */}
            <div className="clay-cushion-cream p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
              <div className="md:w-1/4">
                <span className="text-lg font-bold text-[var(--dp-color-ink)]">Kahoot / Quizizz</span>
                <span className="block text-xs text-[var(--dp-color-ink-secondary)] uppercase tracking-wider font-semibold">Live party games</span>
              </div>
              <div className="md:w-1/2 text-sm text-[var(--dp-color-ink-secondary)]">
                Great for classroom buzzers & trivia; lacks college syllabus depth, spaced repetition, and notes AI.
              </div>
              <div className="md:w-1/4 flex md:justify-end">
                <span className="clay-btn-secondary px-4 py-2 text-xs font-bold text-[var(--dp-color-ink)] inline-flex items-center">
                  Good for games
                </span>
              </div>
            </div>

            {/* Shelf 2: Anki */}
            <div className="clay-cushion-cream p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
              <div className="md:w-1/4">
                <span className="text-lg font-bold text-[var(--dp-color-ink)]">Anki</span>
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
                  <span className="text-xl font-bold text-[var(--dp-color-ink)]">Learnify</span>
                  <span className="rounded-full bg-[#FFFDF7] px-2.5 py-0.5 text-[10px] font-bold text-[var(--dp-color-primary-action)] uppercase">
                    Built for College
                  </span>
                </div>
                <span className="block text-xs text-[var(--dp-color-ink-secondary)] font-semibold mt-0.5">
                  Practice · Compete · Revise
                </span>
              </div>
              <div className="md:w-1/2 text-sm text-[var(--dp-color-ink)] font-medium">
                Syllabus-mapped MCQs, 1v1 speed battles, instant notes-to-quiz AI, and automated spaced revision queues.
              </div>
              <div className="md:w-1/4 flex md:justify-end">
                <button
                  type="button"
                  onClick={onEnterApp}
                  className="clay-btn-primary w-full md:w-auto inline-flex items-center justify-center min-h-[48px] h-12 px-6 py-2.5 text-sm sm:text-base font-bold clay-focus cursor-pointer whitespace-nowrap"
                >
                  Start free
                </button>
              </div>
            </div>

          </div>

          {/* FAQ Disclosures */}
          <div className="mt-12 pt-8 border-t border-[#38315A]/10">
            <h3 className="text-xl font-bold text-[var(--dp-color-ink)] text-left mb-6">
              Frequently asked questions
            </h3>

            <div className="space-y-3">
              {[
                {
                  q: 'Is Learnify free for college students?',
                  a: 'Yes. Core practice questions, live peer battles, and notes-to-quiz generation are completely free for students.',
                },
                {
                  q: 'How does Notes-to-Quiz AI generate questions?',
                  a: 'Upload your lecture PDF or syllabus notes. The system extracts key concepts and generates 10 accurate MCQs with answer rationales.',
                },
                {
                  q: 'Can I practice past exam questions (PYQs)?',
                  a: 'Yes. Subjects like DBMS include past year questions tagged with source and verified answer keys.',
                },
              ].map((item, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div key={item.q} className="clay-cushion-cream overflow-hidden text-left">
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
                      <div className="px-5 sm:px-6 pb-6 text-sm text-[var(--dp-color-ink-secondary)] leading-relaxed border-t border-[#38315A]/[0.06] pt-3">
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

      {/* 6. CLOSING: Violet Cushion + Footer on Cream */}
      <section className="relative w-full max-w-full px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        <div className="mx-auto w-full max-w-4xl clay-cushion-violet p-8 sm:p-14 lg:p-16 text-center">
          
          <div className="max-w-xl mx-auto">
            <h2 className="text-[clamp(2.25rem,6vw,3.75rem)] font-bold tracking-tight text-[var(--dp-color-ink)]">
              Ready to rank up?
            </h2>
            <p className="mt-3 text-base sm:text-lg text-[var(--dp-color-ink-secondary)] leading-relaxed">
              Join thousands of students prepping the smarter way.
            </p>
          </div>

          {/* Waitlist Form: Recessed cream well input + primary pill action */}
          <form onSubmit={handleWaitlistSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto">
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
              className="clay-btn-primary w-full sm:w-auto inline-flex items-center justify-center min-h-[50px] h-13 whitespace-nowrap px-8 text-base font-bold clay-focus cursor-pointer disabled:opacity-50"
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
          <div className="flex items-center gap-3">
            <span className="font-bold text-base text-[var(--dp-color-ink)]">Learnify</span>
            <span>·</span>
            <span>Practice. Compete. Revise.</span>
          </div>
          <div>
            <span>&copy; 2026 Learnify · University exam prep</span>
          </div>
        </footer>

      </section>

    </div>
  );
};
