import React from 'react';

interface LearnifyLogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

/**
 * Learnify Signature 3D Sugary Emblem
 * Features:
 * - Upper-left illuminated Indigo-to-Violet squircle cushion
 * - Mint & Sky-blue academic book pages (forming a stylized "L")
 * - 3D Golden energy lightning bolt / spark
 * - Specular micro-sparkles
 */
export const LearnifyLogo: React.FC<LearnifyLogoProps> = ({
  size = 40,
  className = '',
  glow = false,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {glow && (
        <div
          className="absolute inset-0 rounded-2xl bg-indigo-500/25 blur-lg transform scale-110 pointer-events-none"
          aria-hidden="true"
        />
      )}

      <svg
        width={size}
        height={size}
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_8px_16px_rgba(74,63,209,0.22)] transition-transform duration-200 hover:scale-105"
      >
        <defs>
          {/* Background Squircle Gradient */}
          <linearGradient id="learnify-bg-dyn" x1="16" y1="12" x2="112" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="45%" stopColor="#4A3FD1" />
            <stop offset="100%" stopColor="#312682" />
          </linearGradient>

          {/* Upper-Left Inset Highlight */}
          <linearGradient id="learnify-rim-dyn" x1="20" y1="16" x2="80" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Lightning Bolt / Energy Spark */}
          <linearGradient id="bolt-grad-dyn" x1="56" y1="20" x2="84" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF7D1" />
            <stop offset="25%" stopColor="#FFDE6A" />
            <stop offset="65%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Book Wings */}
          <linearGradient id="book-wing-l" x1="24" y1="65" x2="64" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E0FBF0" />
            <stop offset="50%" stopColor="#A7F3D0" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>

          <linearGradient id="book-wing-r" x1="64" y1="65" x2="104" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="50%" stopColor="#BAE6FD" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          {/* Drop Shadows */}
          <filter id="badge-shadow-dyn" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#1E1656" floodOpacity="0.35" />
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1E1656" floodOpacity="0.2" />
          </filter>

          <filter id="element-shadow-dyn" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#1E1656" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* 1. 3D Rounded Squircle Cushion Base */}
        <rect
          x="10"
          y="10"
          width="108"
          height="108"
          rx="32"
          fill="url(#learnify-bg-dyn)"
          filter="url(#badge-shadow-dyn)"
        />

        {/* Inset Highlight Ring */}
        <rect
          x="11.5"
          y="11.5"
          width="105"
          height="105"
          rx="30.5"
          stroke="url(#learnify-rim-dyn)"
          strokeWidth="3"
          fill="none"
        />

        {/* 2. Academic Open Book Foundation */}
        <g filter="url(#element-shadow-dyn)">
          <path
            d="M26 84 C42 80, 56 82, 64 88 C64 96, 64 100, 64 100 C56 94, 42 92, 26 96 Z"
            fill="url(#book-wing-l)"
          />
          <path
            d="M102 84 C86 80, 72 82, 64 88 C64 96, 64 100, 64 100 C72 94, 86 92, 102 96 Z"
            fill="url(#book-wing-r)"
          />
          <path
            d="M62 88 L66 88 L66 102 L64 100 L62 102 Z"
            fill="#FFFFFF"
            opacity="0.95"
          />
        </g>

        {/* 3. 3D Golden Lightning Energy Spark */}
        <g filter="url(#element-shadow-dyn)">
          <path
            d="M71 21 L39 63 L61 65 L47 101 L89 53 L66 50 Z"
            fill="url(#bolt-grad-dyn)"
            stroke="#FFFBEB"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d="M69 25 L45 59 L59 61 L54 75"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.9"
          />
        </g>

        {/* 4. Specular Puffy Sparkles */}
        <path
          d="M96 28 C96 28, 98 34, 104 35 C98 36, 96 42, 96 42 C96 42, 94 36, 88 35 C94 34, 96 28, 96 28 Z"
          fill="#FFDE6A"
          filter="url(#element-shadow-dyn)"
        />
        <circle cx="96" cy="35" r="1.5" fill="#FFFFFF" />
        <circle cx="28" cy="40" r="3.5" fill="#A7F3D0" opacity="0.8" />
        <circle cx="27" cy="39" r="1.2" fill="#FFFFFF" />
      </svg>
    </div>
  );
};

interface LearnifyBrandProps {
  onNavigate?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

/**
 * Learnify Brand Wordmark + 3D Logo Component
 */
export const LearnifyBrand: React.FC<LearnifyBrandProps> = ({
  onNavigate,
  size = 'md',
  showTagline = true,
  className = '',
}) => {
  const iconSize = size === 'sm' ? 32 : size === 'lg' ? 48 : 40;
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';
  const badgeSize = size === 'sm' ? 'text-[9px] px-1.5 py-0.2' : 'text-[10px] px-2 py-0.5';

  return (
    <div
      onClick={onNavigate}
      className={`inline-flex items-center gap-2.5 select-none ${
        onNavigate ? 'cursor-pointer group' : ''
      } ${className}`}
    >
      <LearnifyLogo size={iconSize} glow={size === 'lg'} />

      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5">
          <span
            className={`${textSize} font-black tracking-tight text-[var(--dp-color-ink)] group-hover:text-[var(--dp-color-primary-action)] transition-colors leading-none`}
          >
            Learnify
          </span>
          <span
            className={`${badgeSize} font-extrabold uppercase tracking-wider rounded-full bg-gradient-to-r from-amber-100 to-amber-200/90 text-amber-900 border border-amber-300/80 shadow-xs leading-none`}
          >
            PREP
          </span>
        </div>

        {showTagline && (
          <span className="text-[11px] text-[var(--dp-color-ink-secondary)] font-semibold mt-1 leading-none hidden sm:block">
            Study · Compete · Repeat
          </span>
        )}
      </div>
    </div>
  );
};
