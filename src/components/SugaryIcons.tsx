import React from 'react';

interface SugaryIconProps {
  className?: string;
  size?: number;
}

/**
 * 3D Sugary Flame (Candy fire with glossy reflection and radiant amber/orange gradients)
 */
export const SugaryFlame: React.FC<SugaryIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block drop-shadow-md transition-transform hover:scale-105 duration-200 ${className}`}
  >
    <defs>
      <linearGradient id="flame-outer" x1="16" y1="6" x2="48" y2="58" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FF6B4A" />
        <stop offset="45%" stopColor="#FF385C" />
        <stop offset="100%" stopColor="#D91656" />
      </linearGradient>
      <linearGradient id="flame-mid" x1="22" y1="18" x2="42" y2="56" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFA62B" />
        <stop offset="60%" stopColor="#FF7733" />
        <stop offset="100%" stopColor="#E63946" />
      </linearGradient>
      <linearGradient id="flame-core" x1="28" y1="28" x2="36" y2="54" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFF275" />
        <stop offset="80%" stopColor="#FFBE0B" />
        <stop offset="100%" stopColor="#FB8500" />
      </linearGradient>
      <filter id="flame-glow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#FF385C" floodOpacity="0.35" />
      </filter>
    </defs>
    
    {/* Outer Sugary Shell */}
    <path
      d="M32 4C29 14 20 20 20 32C20 44 26 56 38 58C49 60 56 48 54 36C52 24 44 20 42 14C41 18 38 21 35 22C35 14 36 8 32 4Z"
      fill="url(#flame-outer)"
      filter="url(#flame-glow)"
    />
    
    {/* Middle Juicy Layer */}
    <path
      d="M30 18C28 24 23 28 23 37C23 46 28 52 36 53C44 54 48 46 47 38C46 30 40 26 38 22C37 25 35 27 33 28C33 23 34 20 30 18Z"
      fill="url(#flame-mid)"
    />
    
    {/* Inner Glowing Honey Core */}
    <path
      d="M32 30C30 35 27 38 27 43C27 48 30 51 34 51C38 51 41 47 41 42C41 38 37 35 36 32C35 34 34 35 33 35C33 33 34 31 32 30Z"
      fill="url(#flame-core)"
    />
    
    {/* 3D Gloss Highlight Arc */}
    <path
      d="M27 22C24 28 23 36 24 42C24 42 22 36 24 30C26 24 29 20 27 22Z"
      fill="#FFFFFF"
      fillOpacity="0.6"
    />
    <ellipse cx="26" cy="34" rx="2.5" ry="5" transform="rotate(-15 26 34)" fill="#FFFFFF" fillOpacity="0.75" />
    <circle cx="28" cy="25" r="1.5" fill="#FFFFFF" fillOpacity="0.85" />
  </svg>
);

/**
 * 3D Sugary Trophy (Glossy candy honey-gold cup with candy handles & star)
 */
export const SugaryTrophy: React.FC<SugaryIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block drop-shadow-md transition-transform hover:scale-105 duration-200 ${className}`}
  >
    <defs>
      <linearGradient id="trophy-gold" x1="16" y1="8" x2="48" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="30%" stopColor="#FBBF24" />
        <stop offset="70%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="trophy-rim" x1="16" y1="8" x2="48" y2="16" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFBEB" />
        <stop offset="50%" stopColor="#FDE68A" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
      <linearGradient id="trophy-base" x1="20" y1="46" x2="44" y2="58" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#B45309" />
        <stop offset="60%" stopColor="#78350F" />
        <stop offset="100%" stopColor="#451A03" />
      </linearGradient>
      <filter id="trophy-glow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#F59E0B" floodOpacity="0.3" />
      </filter>
    </defs>

    {/* Handles */}
    <path
      d="M18 16C10 16 8 26 12 32C15 37 20 38 23 38"
      stroke="#F59E0B"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <path
      d="M46 16C54 16 56 26 52 32C49 37 44 38 41 38"
      stroke="#F59E0B"
      strokeWidth="4"
      strokeLinecap="round"
    />

    {/* Trophy Cup Body */}
    <path
      d="M18 12C18 28 24 38 32 38C40 38 46 28 46 12H18Z"
      fill="url(#trophy-gold)"
      filter="url(#trophy-glow)"
    />

    {/* Cup Top Lip / Bevel */}
    <ellipse cx="32" cy="12" rx="14" ry="4" fill="url(#trophy-rim)" />
    
    {/* Stem */}
    <path d="M30 38H34V46H30V38Z" fill="#D97706" />
    
    {/* Base Stand */}
    <rect x="22" y="46" width="20" height="4" rx="2" fill="#F59E0B" />
    <rect x="18" y="50" width="28" height="8" rx="3" fill="url(#trophy-base)" />
    
    {/* Embossed Sugary Star */}
    <path
      d="M32 20L33.5 24H38L34.5 26.5L36 30.5L32 28L28 30.5L29.5 26.5L26 24H30.5L32 20Z"
      fill="#FFFBEB"
      fillOpacity="0.9"
    />

    {/* Glossy Specular Highlights */}
    <ellipse cx="23" cy="22" rx="2" ry="6" transform="rotate(-15 23 22)" fill="#FFFFFF" fillOpacity="0.75" />
    <circle cx="25" cy="15" r="1.2" fill="#FFFFFF" fillOpacity="0.9" />
    <ellipse cx="32" cy="12" rx="10" ry="1.5" fill="#FFFFFF" fillOpacity="0.6" />
  </svg>
);

/**
 * 3D Sugary Bolt (Electric indigo-violet candy lightning bolt)
 */
export const SugaryBolt: React.FC<SugaryIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block drop-shadow-md transition-transform hover:scale-105 duration-200 ${className}`}
  >
    <defs>
      <linearGradient id="bolt-body" x1="20" y1="4" x2="44" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#A5B4FC" />
        <stop offset="30%" stopColor="#818CF8" />
        <stop offset="70%" stopColor="#4F46E5" />
        <stop offset="100%" stopColor="#3730A3" />
      </linearGradient>
      <filter id="bolt-glow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#6366F1" floodOpacity="0.4" />
      </filter>
    </defs>
    
    {/* 3D Bolt Base */}
    <path
      d="M36 4L16 34H32L26 60L48 26H32L36 4Z"
      fill="url(#bolt-body)"
      filter="url(#bolt-glow)"
    />

    {/* Beveled Facet Layer */}
    <path
      d="M36 4L22 34H32L27 54L44 26H32L36 4Z"
      fill="#6366F1"
      fillOpacity="0.4"
    />

    {/* Glossy Candy Specular Highlight */}
    <path
      d="M34 8L20 32H28L25 44L28 32H34L34 8Z"
      fill="#FFFFFF"
      fillOpacity="0.65"
    />
    <circle cx="34" cy="10" r="1.5" fill="#FFFFFF" fillOpacity="0.9" />
  </svg>
);

/**
 * 3D Sugary Target (Strawberry candy concentric bullseye with metallic glint)
 */
export const SugaryTarget: React.FC<SugaryIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block drop-shadow-md transition-transform hover:scale-105 duration-200 ${className}`}
  >
    <defs>
      <radialGradient id="target-outer" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FDA4AF" />
        <stop offset="40%" stopColor="#F43F5E" />
        <stop offset="85%" stopColor="#E11D48" />
        <stop offset="100%" stopColor="#9F1239" />
      </radialGradient>
      <radialGradient id="target-inner" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FFE4E6" />
        <stop offset="70%" stopColor="#FECDD3" />
        <stop offset="100%" stopColor="#FDA4AF" />
      </radialGradient>
      <radialGradient id="target-core" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="60%" stopColor="#E11D48" />
        <stop offset="100%" stopColor="#881337" />
      </radialGradient>
      <filter id="target-glow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#E11D48" floodOpacity="0.3" />
      </filter>
    </defs>
    
    {/* Outer Ring */}
    <circle cx="32" cy="32" r="26" fill="url(#target-outer)" filter="url(#target-glow)" />
    
    {/* Middle Ring */}
    <circle cx="32" cy="32" r="18" fill="url(#target-inner)" />
    
    {/* Inner Bullseye */}
    <circle cx="32" cy="32" r="10" fill="url(#target-core)" />
    
    {/* Center Honey Bead */}
    <circle cx="32" cy="32" r="4" fill="#FFF1F2" />

    {/* Glossy Curved Sheen */}
    <ellipse cx="23" cy="20" rx="5" ry="3" transform="rotate(-30 23 20)" fill="#FFFFFF" fillOpacity="0.75" />
    <path
      d="M16 24C19 16 26 11 34 10"
      stroke="#FFFFFF"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeOpacity="0.6"
    />
  </svg>
);

/**
 * 3D Sugary Book (Sky-blue candy cover with cream pages and golden bookmark ribbon)
 */
export const SugaryBook: React.FC<SugaryIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block drop-shadow-md transition-transform hover:scale-105 duration-200 ${className}`}
  >
    <defs>
      <linearGradient id="book-cover" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#7DD3FC" />
        <stop offset="40%" stopColor="#38BDF8" />
        <stop offset="80%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#0369A1" />
      </linearGradient>
      <linearGradient id="book-pages" x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#F1F5F9" />
      </linearGradient>
      <filter id="book-glow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0284C7" floodOpacity="0.3" />
      </filter>
    </defs>
    
    {/* Book Cover Backing */}
    <rect x="10" y="10" width="44" height="46" rx="6" fill="url(#book-cover)" filter="url(#book-glow)" />
    
    {/* Pages Block */}
    <rect x="15" y="14" width="37" height="38" rx="4" fill="url(#book-pages)" />
    
    {/* Page Lines */}
    <line x1="22" y1="22" x2="44" y2="22" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="22" y1="28" x2="40" y2="28" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="22" y1="34" x2="42" y2="34" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
    
    {/* Golden Bookmark Ribbon */}
    <path
      d="M34 10V32L39 28L44 32V10H34Z"
      fill="#F59E0B"
    />
    
    {/* Book Spine Edge Bevel */}
    <rect x="10" y="10" width="6" height="46" rx="3" fill="#0284C7" />
    <line x1="13" y1="13" x2="13" y2="53" stroke="#BAE6FD" strokeWidth="1.5" strokeOpacity="0.8" />
    
    {/* Glossy Cover Highlight */}
    <ellipse cx="22" cy="18" rx="4" ry="2" fill="#FFFFFF" fillOpacity="0.75" />
  </svg>
);

/**
 * 3D Sugary Swords (Multiplayer duel crossed ruby & sapphire blades)
 */
export const SugarySwords: React.FC<SugaryIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block drop-shadow-md transition-transform hover:scale-105 duration-200 ${className}`}
  >
    <defs>
      <linearGradient id="blade-ruby" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDA4AF" />
        <stop offset="50%" stopColor="#E11D48" />
        <stop offset="100%" stopColor="#9F1239" />
      </linearGradient>
      <linearGradient id="blade-sapphire" x1="52" y1="12" x2="12" y2="52" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#93C5FD" />
        <stop offset="50%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#1E3A8A" />
      </linearGradient>
      <filter id="swords-glow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#4F46E5" floodOpacity="0.3" />
      </filter>
    </defs>
    
    {/* Sword 1: Ruby Blade (diagonal \) */}
    <g filter="url(#swords-glow)">
      <path d="M14 10L18 10L50 42L46 46L14 14V10Z" fill="url(#blade-ruby)" />
      <path d="M14 10L18 14L46 42" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.7" />
      {/* Guard & Hilt */}
      <rect x="42" y="42" width="12" height="4" rx="2" transform="rotate(45 42 42)" fill="#F59E0B" />
      <circle cx="50" cy="50" r="3" fill="#D97706" />
    </g>

    {/* Sword 2: Sapphire Blade (diagonal /) */}
    <g filter="url(#swords-glow)">
      <path d="M50 10L46 10L14 42L18 46L50 14V10Z" fill="url(#blade-sapphire)" />
      <path d="M50 10L46 14L18 42" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.7" />
      {/* Guard & Hilt */}
      <rect x="18" y="42" width="12" height="4" rx="2" transform="rotate(-45 18 42)" fill="#F59E0B" />
      <circle cx="14" cy="50" r="3" fill="#D97706" />
    </g>

    {/* Center Clash Starburst */}
    <path
      d="M32 26L34 30L38 32L34 34L32 38L30 34L26 32L30 30L32 26Z"
      fill="#FFFBEB"
      fillOpacity="0.95"
    />
    <circle cx="32" cy="32" r="2" fill="#FFFFFF" />
  </svg>
);

/**
 * 3D Sugary Sparkles / Wand (AI Notes generator magenta-violet sugar star)
 */
export const SugarySparkles: React.FC<SugaryIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block drop-shadow-md transition-transform hover:scale-105 duration-200 ${className}`}
  >
    <defs>
      <linearGradient id="sparkle-grad" x1="16" y1="8" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F472B6" />
        <stop offset="35%" stopColor="#EC4899" />
        <stop offset="70%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
      <filter id="sparkle-glow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#EC4899" floodOpacity="0.4" />
      </filter>
    </defs>

    {/* Big Primary 4-Point Star */}
    <path
      d="M32 6C33 18 38 23 50 24C38 25 33 30 32 42C31 30 26 25 14 24C26 23 31 18 32 6Z"
      fill="url(#sparkle-grad)"
      filter="url(#sparkle-glow)"
    />

    {/* Inner White Gloss Core */}
    <path
      d="M32 14C32.5 20 35 22.5 41 24C35 25.5 32.5 28 32 34C31.5 28 29 25.5 23 24C29 22.5 31.5 20 32 14Z"
      fill="#FFFFFF"
      fillOpacity="0.8"
    />

    {/* Satellite Mini Star 1 */}
    <path
      d="M48 38C48.5 43 50 44.5 55 45C50 45.5 48.5 47 48 52C47.5 47 46 45.5 41 45C46 44.5 47.5 43 48 38Z"
      fill="#F472B6"
    />

    {/* Satellite Mini Star 2 */}
    <path
      d="M16 42C16.5 46 18 47.5 22 48C18 48.5 16.5 50 16 54C15.5 50 14 48.5 10 48C14 47.5 15.5 46 16 42Z"
      fill="#A855F7"
    />

    <circle cx="32" cy="24" r="2.5" fill="#FFFFFF" />
  </svg>
);

/**
 * 3D Sugary Brain / Loop (Smart spaced revision emerald candy spiral)
 */
export const SugaryBrain: React.FC<SugaryIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block drop-shadow-md transition-transform hover:scale-105 duration-200 ${className}`}
  >
    <defs>
      <linearGradient id="brain-grad" x1="14" y1="12" x2="50" y2="52" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#6EE7B7" />
        <stop offset="40%" stopColor="#10B981" />
        <stop offset="80%" stopColor="#059669" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      <filter id="brain-glow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#10B981" floodOpacity="0.35" />
      </filter>
    </defs>

    {/* Brain / Loop Body */}
    <path
      d="M24 16C18 16 14 21 14 28C14 34 17 38 21 40C19 44 21 50 27 50C30 50 31 48 32 46C33 48 34 50 37 50C43 50 45 44 43 40C47 38 50 34 50 28C50 21 46 16 40 16C37 16 34 18 32 21C30 18 27 16 24 16Z"
      fill="url(#brain-grad)"
      filter="url(#brain-glow)"
    />

    {/* Brain Gyri and Sulci (Curved 3D grooves) */}
    <path
      d="M24 24C28 24 30 28 32 32M40 24C36 24 34 28 32 32M32 32V44"
      stroke="#A7F3D0"
      strokeWidth="3.5"
      strokeLinecap="round"
    />

    {/* Specular Highlights */}
    <ellipse cx="22" cy="20" rx="3" ry="1.5" fill="#FFFFFF" fillOpacity="0.75" />
    <ellipse cx="42" cy="20" rx="3" ry="1.5" fill="#FFFFFF" fillOpacity="0.75" />
  </svg>
);

/**
 * 3D Sugary Check (Mastered emerald candy medallion)
 */
export const SugaryCheck: React.FC<SugaryIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block drop-shadow-md transition-transform hover:scale-105 duration-200 ${className}`}
  >
    <defs>
      <radialGradient id="check-disc" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#A7F3D0" />
        <stop offset="35%" stopColor="#34D399" />
        <stop offset="75%" stopColor="#059669" />
        <stop offset="100%" stopColor="#065F46" />
      </radialGradient>
      <filter id="check-glow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#059669" floodOpacity="0.35" />
      </filter>
    </defs>

    {/* Medallion */}
    <circle cx="32" cy="32" r="26" fill="url(#check-disc)" filter="url(#check-glow)" />

    {/* 3D Check Mark */}
    <path
      d="M20 32L28 40L44 22"
      stroke="#FFFFFF"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Specular Arc */}
    <ellipse cx="24" cy="18" rx="7" ry="3" transform="rotate(-25 24 18)" fill="#FFFFFF" fillOpacity="0.7" />
  </svg>
);

/**
 * 3D Sugary Alert (Weak topic candy capsule)
 */
export const SugaryAlert: React.FC<SugaryIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block drop-shadow-md transition-transform hover:scale-105 duration-200 ${className}`}
  >
    <defs>
      <radialGradient id="alert-disc" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FDA4AF" />
        <stop offset="40%" stopColor="#F43F5E" />
        <stop offset="80%" stopColor="#E11D48" />
        <stop offset="100%" stopColor="#9F1239" />
      </radialGradient>
      <filter id="alert-glow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#E11D48" floodOpacity="0.35" />
      </filter>
    </defs>

    {/* Capsule Disc */}
    <circle cx="32" cy="32" r="26" fill="url(#alert-disc)" filter="url(#alert-glow)" />

    {/* Exclamation Bar & Dot */}
    <rect x="29" y="18" width="6" height="18" rx="3" fill="#FFFFFF" />
    <circle cx="32" cy="44" r="3.5" fill="#FFFFFF" />

    {/* Specular Highlight */}
    <ellipse cx="24" cy="18" rx="6" ry="3" transform="rotate(-25 24 18)" fill="#FFFFFF" fillOpacity="0.7" />
  </svg>
);

/**
 * 3D Sugary Shield (Student dossier & defense badge)
 */
export const SugaryShield: React.FC<SugaryIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block drop-shadow-md transition-transform hover:scale-105 duration-200 ${className}`}
  >
    <defs>
      <linearGradient id="shield-grad" x1="16" y1="8" x2="48" y2="56" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#C4B5FD" />
        <stop offset="40%" stopColor="#8B5CF6" />
        <stop offset="80%" stopColor="#6D28D9" />
        <stop offset="100%" stopColor="#4C1D95" />
      </linearGradient>
      <filter id="shield-glow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#8B5CF6" floodOpacity="0.3" />
      </filter>
    </defs>

    {/* Shield Body */}
    <path
      d="M32 6L14 14V30C14 44 22 53 32 58C42 53 50 44 50 30V14L32 6Z"
      fill="url(#shield-grad)"
      filter="url(#shield-glow)"
    />

    {/* Inner Beveled Inset */}
    <path
      d="M32 12L19 18V29C19 39 25 47 32 51C39 47 45 39 45 29V18L32 12Z"
      fill="#7C3AED"
      fillOpacity="0.5"
    />

    {/* Center Golden Star */}
    <path
      d="M32 23L34 28H39L35 31L36.5 36L32 33L27.5 36L29 31L25 28H30L32 23Z"
      fill="#FDE68A"
    />

    {/* Glossy Reflection Rim */}
    <path
      d="M20 18L32 12V48"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeOpacity="0.4"
    />
  </svg>
);
