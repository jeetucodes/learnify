import React from 'react';

interface ClayIconProps {
  className?: string;
  size?: number;
}

/**
 * 1. 3D Puffy Star (Chubby, pillowy golden yellow 3D star directly from reference)
 */
export const SugaryStar: React.FC<ClayIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform hover:scale-105 duration-200 select-none ${className}`}
  >
    <defs>
      <linearGradient id="star-base" x1="16" y1="8" x2="48" y2="56" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFDE6A" />
        <stop offset="35%" stopColor="#FFB800" />
        <stop offset="85%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="star-highlight" x1="24" y1="12" x2="38" y2="34" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFBEB" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#FFDE6A" stopOpacity="0" />
      </linearGradient>
      <filter id="clay-shadow-star" x="-15%" y="-15%" width="130%" height="135%">
        <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#D97706" floodOpacity="0.25" />
      </filter>
    </defs>
    
    {/* 3D Star Pillow Body with Rounded Points */}
    <path
      d="M32 6C33.2 6 34.4 7 35.1 8.8L40.2 20.3C40.6 21.2 41.5 21.9 42.5 22L54.7 23.4C57 23.6 58.1 26.2 56.5 27.8L47.3 36.8C46.6 37.5 46.3 38.6 46.5 39.6L49 52.1C49.5 54.4 47.1 56.2 45 55L34.3 49C33.4 48.5 32.3 48.5 31.4 49L20.7 55C18.6 56.2 16.2 54.4 16.7 52.1L19.2 39.6C19.4 38.6 19.1 37.5 18.4 36.8L9.2 27.8C7.6 26.2 8.7 23.6 11 23.4L23.2 22C24.2 21.9 25.1 21.2 25.5 20.3L30.6 8.8C31.3 7 32.5 6 32 6Z"
      fill="url(#star-base)"
      filter="url(#clay-shadow-star)"
    />

    {/* Front Soft Inset Cushion Highlight */}
    <path
      d="M32 10L36 19.5C36.4 20.5 37.4 21.2 38.5 21.3L48.5 22.5L41 29.8C40.2 30.6 39.9 31.8 40.1 32.9L42.2 43L33.5 38.1C32.6 37.6 31.4 37.6 30.5 38.1L21.8 43L23.9 32.9C24.1 31.8 23.8 30.6 23 29.8L15.5 22.5L25.5 21.3C26.6 21.2 27.6 20.5 28 19.5L32 10Z"
      fill="url(#star-highlight)"
    />
  </svg>
);

/**
 * 2. 3D Leaning Books (Orange leaning book, Yellow upright book, Purple upright book with white page ridges)
 */
export const SugaryBook: React.FC<ClayIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform hover:scale-105 duration-200 select-none ${className}`}
  >
    <defs>
      {/* Orange Book Gradients */}
      <linearGradient id="book-orange" x1="10" y1="14" x2="30" y2="54" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFA63D" />
        <stop offset="100%" stopColor="#E66A00" />
      </linearGradient>
      {/* Yellow Book Gradients */}
      <linearGradient id="book-yellow" x1="30" y1="12" x2="44" y2="54" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFDE6A" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
      {/* Purple Book Gradients */}
      <linearGradient id="book-purple" x1="44" y1="12" x2="58" y2="54" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#A78BFA" />
        <stop offset="100%" stopColor="#6D28D9" />
      </linearGradient>
      <filter id="clay-shadow-books" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#38315A" floodOpacity="0.2" />
      </filter>
    </defs>

    {/* Book 3: Purple Book (Upright on right) */}
    <g filter="url(#clay-shadow-books)">
      {/* Cover */}
      <rect x="46" y="14" width="12" height="42" rx="3" fill="url(#book-purple)" />
      {/* White Pages Block */}
      <rect x="48" y="16" width="7" height="38" rx="1.5" fill="#FFFFFF" />
      {/* Page Texture Lines */}
      <line x1="51" y1="18" x2="51" y2="52" stroke="#E2E8F0" strokeWidth="1" />
      {/* Purple Spine Accent */}
      <rect x="55" y="14" width="3" height="42" rx="1.5" fill="#5B21B6" />
      {/* Bookmark Ribbon */}
      <path d="M49 14V22L51 20L53 22V14H49Z" fill="#8B5CF6" />
    </g>

    {/* Book 2: Yellow Book (Upright in middle) */}
    <g filter="url(#clay-shadow-books)">
      {/* Cover */}
      <rect x="34" y="12" width="13" height="44" rx="3" fill="url(#book-yellow)" />
      {/* White Pages Block */}
      <rect x="36" y="14" width="8" height="40" rx="1.5" fill="#FFFDF7" />
      {/* Page Texture Lines */}
      <line x1="40" y1="16" x2="40" y2="52" stroke="#E2E8F0" strokeWidth="1" />
      {/* Spine Accent */}
      <rect x="44" y="12" width="3" height="44" rx="1.5" fill="#D97706" />
      {/* Ribbon */}
      <path d="M37 12V23L39.5 21L42 23V12H37Z" fill="#7C3AED" />
    </g>

    {/* Book 1: Orange Book (Leaning against the yellow book, tilted at ~20deg) */}
    <g filter="url(#clay-shadow-books)" transform="rotate(-18 20 48)">
      {/* Cover */}
      <rect x="12" y="10" width="14" height="42" rx="3" fill="url(#book-orange)" />
      {/* White Pages Block */}
      <rect x="14" y="12" width="9" height="38" rx="1.5" fill="#FFFFFF" />
      {/* Spine */}
      <rect x="23" y="10" width="3" height="42" rx="1.5" fill="#C2410C" />
      {/* White Label Box on front */}
      <rect x="15" y="18" width="6" height="10" rx="1.5" fill="#FFFFFF" opacity="0.95" />
    </g>
  </svg>
);

/**
 * 3. 3D Lightbulb (Glow bulb with white screw base and radiating rays)
 */
export const SugaryLightbulb: React.FC<ClayIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform hover:scale-105 duration-200 select-none ${className}`}
  >
    <defs>
      <linearGradient id="bulb-glass" x1="20" y1="10" x2="44" y2="42" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFF59D" />
        <stop offset="40%" stopColor="#FFCA28" />
        <stop offset="85%" stopColor="#FFA000" />
        <stop offset="100%" stopColor="#F57C00" />
      </linearGradient>
      <filter id="clay-shadow-bulb" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#FFA000" floodOpacity="0.3" />
      </filter>
    </defs>

    {/* Radiating Light Beams */}
    <line x1="32" y1="4" x2="32" y2="9" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
    <line x1="16" y1="12" x2="20" y2="16" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
    <line x1="48" y1="12" x2="44" y2="16" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
    <line x1="10" y1="26" x2="15" y2="26" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
    <line x1="54" y1="26" x2="49" y2="26" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />

    {/* Glowing Bulb Sphere & Neck */}
    <path
      d="M32 14C23.2 14 16 21.2 16 30C16 35.5 19 40.5 23 43.5V47C23 48.1 23.9 49 25 49H39C40.1 49 41 48.1 41 47V43.5C45 40.5 48 35.5 48 30C48 21.2 40.8 14 32 14Z"
      fill="url(#bulb-glass)"
      filter="url(#clay-shadow-bulb)"
    />

    {/* Front Glossy Specular Arc */}
    <ellipse cx="27" cy="23" rx="4" ry="2.5" transform="rotate(-30 27 23)" fill="#FFFFFF" fillOpacity="0.8" />
    <circle cx="29" cy="18" r="1.5" fill="#FFFFFF" fillOpacity="0.9" />

    {/* White Ceramic Screw Thread Base */}
    <rect x="25" y="49" width="14" height="3" rx="1.5" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="0.8" />
    <rect x="26" y="52" width="12" height="3" rx="1.5" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="0.8" />
    <rect x="28" y="55" width="8" height="3" rx="1.5" fill="#94A3B8" />
  </svg>
);

/**
 * 4. 3D Spiral Calendar (Yellow header, orange rings, white card, purple day squares & gold check)
 */
export const SugaryCalendar: React.FC<ClayIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform hover:scale-105 duration-200 select-none ${className}`}
  >
    <defs>
      <linearGradient id="cal-header" x1="12" y1="12" x2="52" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFDE6A" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
      <filter id="clay-shadow-cal" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#38315A" floodOpacity="0.18" />
      </filter>
    </defs>

    {/* Calendar White Card Body */}
    <rect x="12" y="16" width="40" height="42" rx="7" fill="#FFFFFF" filter="url(#clay-shadow-cal)" />

    {/* Yellow Calendar Top Bar */}
    <path
      d="M12 23C12 19.1 15.1 16 19 16H45C48.9 16 52 19.1 52 23V26H12V23Z"
      fill="url(#cal-header)"
    />

    {/* Orange Spiral Binder Rings */}
    {[18, 24, 30, 36, 42, 48].map((x) => (
      <rect key={x} x={x - 1.5} y="11" width="3.2" height="9" rx="1.6" fill="#F97316" />
    ))}

    {/* Purple Grid of Day Squares */}
    {/* Row 1 */}
    <rect x="17" y="31" width="5.5" height="5.5" rx="1.5" fill="#7C3AED" />
    <rect x="25" y="31" width="5.5" height="5.5" rx="1.5" fill="#7C3AED" />
    <rect x="33" y="31" width="5.5" height="5.5" rx="1.5" fill="#7C3AED" />
    <rect x="41" y="31" width="5.5" height="5.5" rx="1.5" fill="#7C3AED" />

    {/* Row 2 */}
    <rect x="17" y="39" width="5.5" height="5.5" rx="1.5" fill="#7C3AED" />
    <rect x="25" y="39" width="5.5" height="5.5" rx="1.5" fill="#7C3AED" />
    {/* Highlighted Today / Completed Day Box */}
    <rect x="33" y="39" width="7" height="7" rx="2" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.2" />
    <path d="M35 42.5L36.5 44L39 41.5" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="41" y="39" width="5.5" height="5.5" rx="1.5" fill="#7C3AED" />

    {/* Row 3 */}
    <rect x="17" y="47" width="5.5" height="5.5" rx="1.5" fill="#7C3AED" />
    <rect x="25" y="47" width="5.5" height="5.5" rx="1.5" fill="#7C3AED" />
    <rect x="33" y="47" width="5.5" height="5.5" rx="1.5" fill="#7C3AED" />
  </svg>
);

/**
 * 5. 3D Alarm Clock (Orange clock with bells, little feet, white face and purple hands)
 */
export const SugaryClock: React.FC<ClayIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform hover:scale-105 duration-200 select-none ${className}`}
  >
    <defs>
      <linearGradient id="clock-orange" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFA63D" />
        <stop offset="100%" stopColor="#EA580C" />
      </linearGradient>
      <filter id="clay-shadow-clock" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#EA580C" floodOpacity="0.25" />
      </filter>
    </defs>

    {/* Clock Stand Feet */}
    <rect x="18" y="50" width="5" height="8" rx="2.5" transform="rotate(25 18 50)" fill="#C2410C" />
    <rect x="44" y="52" width="5" height="8" rx="2.5" transform="rotate(-25 44 52)" fill="#C2410C" />

    {/* Top Bells */}
    <ellipse cx="18" cy="17" rx="8" ry="5" transform="rotate(-30 18 17)" fill="url(#clock-orange)" />
    <ellipse cx="46" cy="17" rx="8" ry="5" transform="rotate(30 46 17)" fill="url(#clock-orange)" />
    <rect x="30" y="10" width="4" height="6" rx="2" fill="#D97706" />

    {/* Main Clock Case */}
    <circle cx="32" cy="34" r="22" fill="url(#clock-orange)" filter="url(#clay-shadow-clock)" />

    {/* Clock White Face */}
    <circle cx="32" cy="34" r="17" fill="#FFFFFF" />

    {/* Purple Hour Tick Marks */}
    <line x1="32" y1="20" x2="32" y2="22.5" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="32" y1="45.5" x2="32" y2="48" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="18" y1="34" x2="20.5" y2="34" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="43.5" y1="34" x2="46" y2="34" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" />

    {/* Purple Hands (Pointing to ~10:10) */}
    <line x1="32" y1="34" x2="32" y2="24" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="32" y1="34" x2="24" y2="40" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="32" cy="34" r="2.2" fill="#5B21B6" />
  </svg>
);

/**
 * 6. 3D Yellow Envelope with Notification "1" Badge
 */
export const SugaryEnvelope: React.FC<ClayIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform hover:scale-105 duration-200 select-none ${className}`}
  >
    <defs>
      <linearGradient id="env-gold" x1="10" y1="16" x2="54" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFDE6A" />
        <stop offset="60%" stopColor="#FFB800" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
      <filter id="clay-shadow-env" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#D97706" floodOpacity="0.25" />
      </filter>
    </defs>

    {/* Envelope Main Body */}
    <rect x="8" y="16" width="48" height="34" rx="6" fill="url(#env-gold)" filter="url(#clay-shadow-env)" />

    {/* Envelope Flap Lines */}
    <path
      d="M8 18L32 34L56 18"
      stroke="#D97706"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 48L24 32"
      stroke="#D97706"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M56 48L40 32"
      stroke="#D97706"
      strokeWidth="2"
      strokeLinecap="round"
    />

    {/* Notification Badge "1" (Orange Pill Badge) */}
    <circle cx="50" cy="16" r="9" fill="#F97316" stroke="#FFFFFF" strokeWidth="2" />
    <text x="50" y="20" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="900" fontFamily="sans-serif">
      1
    </text>
  </svg>
);

/**
 * 7. 3D Pillowed Speech Bubble with Heart (Marshmallow white bubble + golden orange heart)
 */
export const SugaryBubbleHeart: React.FC<ClayIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform hover:scale-105 duration-200 select-none ${className}`}
  >
    <defs>
      <filter id="clay-shadow-bubble" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#38315A" floodOpacity="0.14" />
      </filter>
    </defs>

    {/* Pillowed White Speech Bubble with Tail */}
    <path
      d="M10 20C10 13.4 15.4 8 22 8H42C48.6 8 54 13.4 54 20V36C54 42.6 48.6 48 42 48H36L32 54L28 48H22C15.4 48 10 42.6 10 36V20Z"
      fill="#FFFFFF"
      filter="url(#clay-shadow-bubble)"
    />

    {/* 3D Orange Heart in Center */}
    <path
      d="M32 38L24.5 30.5C22.5 28.5 22.5 25.3 24.5 23.3C26.5 21.3 29.7 21.3 31.7 23.3L32 23.6L32.3 23.3C34.3 21.3 37.5 21.3 39.5 23.3C41.5 25.3 41.5 28.5 39.5 30.5L32 38Z"
      fill="#F97316"
    />
  </svg>
);

/**
 * 8. 3D Pillowed Speech Bubble with 3 Purple Dots (Chat / Community / Multiplayer Duel)
 */
export const SugaryBubbleDots: React.FC<ClayIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform hover:scale-105 duration-200 select-none ${className}`}
  >
    <defs>
      <filter id="clay-shadow-bubble-dots" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#38315A" floodOpacity="0.14" />
      </filter>
    </defs>

    {/* Pillowed White Speech Bubble with Tail */}
    <path
      d="M10 20C10 13.4 15.4 8 22 8H42C48.6 8 54 13.4 54 20V36C54 42.6 48.6 48 42 48H36L32 54L28 48H22C15.4 48 10 42.6 10 36V20Z"
      fill="#FFFFFF"
      filter="url(#clay-shadow-bubble-dots)"
    />

    {/* 3 Chunky Purple Dots */}
    <circle cx="23" cy="28" r="4.2" fill="#7C3AED" />
    <circle cx="32" cy="28" r="4.2" fill="#7C3AED" />
    <circle cx="41" cy="28" r="4.2" fill="#7C3AED" />
  </svg>
);

/**
 * 9. 3D Pillowed Speech Bubble with Purple Lines (Question / Notes Document / Exam Rationale)
 */
export const SugaryBubbleLines: React.FC<ClayIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform hover:scale-105 duration-200 select-none ${className}`}
  >
    <defs>
      <filter id="clay-shadow-bubble-lines" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#38315A" floodOpacity="0.14" />
      </filter>
    </defs>

    {/* Pillowed White Speech Bubble with Tail */}
    <path
      d="M10 20C10 13.4 15.4 8 22 8H42C48.6 8 54 13.4 54 20V36C54 42.6 48.6 48 42 48H36L32 54L28 48H22C15.4 48 10 42.6 10 36V20Z"
      fill="#FFFFFF"
      filter="url(#clay-shadow-bubble-lines)"
    />

    {/* 3 Horizontal Purple Lines */}
    <line x1="20" y1="22" x2="44" y2="22" stroke="#7C3AED" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="20" y1="28" x2="44" y2="28" stroke="#7C3AED" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="20" y1="34" x2="38" y2="34" stroke="#7C3AED" strokeWidth="3.5" strokeLinecap="round" />
  </svg>
);

/**
 * 10. 3D Pillowed Bubble with Golden Play Arrow (Play Quiz, Practice Action)
 */
export const SugaryBubblePlay: React.FC<ClayIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform hover:scale-105 duration-200 select-none ${className}`}
  >
    <defs>
      <filter id="clay-shadow-bubble-play" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#38315A" floodOpacity="0.14" />
      </filter>
    </defs>

    {/* Pillowed White Speech Bubble with Tail */}
    <path
      d="M10 20C10 13.4 15.4 8 22 8H42C48.6 8 54 13.4 54 20V36C54 42.6 48.6 48 42 48H36L32 54L28 48H22C15.4 48 10 42.6 10 36V20Z"
      fill="#FFFFFF"
      filter="url(#clay-shadow-bubble-play)"
    />

    {/* Golden Yellow 3D Play Triangle */}
    <path
      d="M27 21C27 19.8 28.3 19.1 29.3 19.7L41.3 26.7C42.2 27.3 42.2 28.7 41.3 29.3L29.3 36.3C28.3 36.9 27 36.2 27 35V21Z"
      fill="#F59E0B"
    />
  </svg>
);

/**
 * 11. 3D Flame (Chubby honey-yellow & orange flame matching the star aesthetic)
 */
export const SugaryFlame: React.FC<ClayIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform hover:scale-105 duration-200 select-none ${className}`}
  >
    <defs>
      <linearGradient id="clay-flame-outer" x1="16" y1="8" x2="48" y2="56" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFA63D" />
        <stop offset="50%" stopColor="#FF7A00" />
        <stop offset="100%" stopColor="#EA580C" />
      </linearGradient>
      <linearGradient id="clay-flame-core" x1="24" y1="24" x2="40" y2="52" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFF59D" />
        <stop offset="100%" stopColor="#FFB800" />
      </linearGradient>
      <filter id="clay-shadow-flame" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#EA580C" floodOpacity="0.28" />
      </filter>
    </defs>

    {/* Chubby Outer Flame */}
    <path
      d="M32 6C30 15 20 20 20 32C20 44 26 56 38 58C49 60 56 48 54 36C52 24 44 20 42 14C41 18 38 21 35 22C35 14 36 8 32 6Z"
      fill="url(#clay-flame-outer)"
      filter="url(#clay-shadow-flame)"
    />

    {/* Glowing Yellow Core */}
    <path
      d="M32 24C30 29 25 32 25 38C25 45 29 49 35 49C41 49 44 44 44 38C44 33 39 30 38 27C37 29 35 31 33 31C33 28 34 26 32 24Z"
      fill="url(#clay-flame-core)"
    />

    {/* Soft Curved Highlight */}
    <ellipse cx="25" cy="30" rx="3" ry="6" transform="rotate(-15 25 30)" fill="#FFFFFF" fillOpacity="0.65" />
  </svg>
);

/**
 * 12. 3D Trophy (Honey-gold clay cup with star crest matching the palette)
 */
export const SugaryTrophy: React.FC<ClayIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform hover:scale-105 duration-200 select-none ${className}`}
  >
    <defs>
      <linearGradient id="trophy-gold" x1="16" y1="10" x2="48" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFDE6A" />
        <stop offset="40%" stopColor="#FFB800" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <filter id="clay-shadow-trophy" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#D97706" floodOpacity="0.25" />
      </filter>
    </defs>

    {/* Handles */}
    <path
      d="M18 16C11 16 9 26 13 32C16 36 21 38 24 38"
      stroke="#F59E0B"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <path
      d="M46 16C53 16 55 26 51 32C48 36 43 38 40 38"
      stroke="#F59E0B"
      strokeWidth="4"
      strokeLinecap="round"
    />

    {/* Trophy Cup Body */}
    <path
      d="M18 12C18 28 24 38 32 38C40 38 46 28 46 12H18Z"
      fill="url(#trophy-gold)"
      filter="url(#clay-shadow-trophy)"
    />

    {/* Top Rim */}
    <ellipse cx="32" cy="12" rx="14" ry="3.5" fill="#FFFBEB" />

    {/* Stem */}
    <rect x="29" y="38" width="6" height="8" rx="2" fill="#D97706" />

    {/* Pedestal Base */}
    <rect x="22" y="46" width="20" height="4" rx="2" fill="#F59E0B" />
    <rect x="18" y="50" width="28" height="8" rx="3" fill="#B45309" />

    {/* Center Embossed Star */}
    <path
      d="M32 20L33.3 23.5H37L34 25.7L35.2 29L32 27L28.8 29L30 25.7L27 23.5H30.7L32 20Z"
      fill="#FFFFFF"
      fillOpacity="0.9"
    />
  </svg>
);

/**
 * 13. 3D Lightning Bolt (Electric purple-violet jelly bolt matching the palette)
 */
export const SugaryBolt: React.FC<ClayIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform hover:scale-105 duration-200 select-none ${className}`}
  >
    <defs>
      <linearGradient id="clay-bolt" x1="20" y1="6" x2="44" y2="58" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#C4B5FD" />
        <stop offset="40%" stopColor="#8B5CF6" />
        <stop offset="85%" stopColor="#6D28D9" />
        <stop offset="100%" stopColor="#4C1D95" />
      </linearGradient>
      <filter id="clay-shadow-bolt" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#6D28D9" floodOpacity="0.3" />
      </filter>
    </defs>

    {/* 3D Bolt Body */}
    <path
      d="M36 4L16 34H32L26 60L48 26H32L36 4Z"
      fill="url(#clay-bolt)"
      filter="url(#clay-shadow-bolt)"
    />

    {/* Facet Light Inset */}
    <path
      d="M36 6L20 33H30L26 52L44 27H32L36 6Z"
      fill="#A78BFA"
      fillOpacity="0.4"
    />
    <ellipse cx="30" cy="18" rx="2" ry="5" transform="rotate(-15 30 18)" fill="#FFFFFF" fillOpacity="0.65" />
  </svg>
);

/**
 * 14. 3D Accuracy Target (Yellow and purple concentric rings)
 */
export const SugaryTarget: React.FC<ClayIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform hover:scale-105 duration-200 select-none ${className}`}
  >
    <defs>
      <linearGradient id="target-gold" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFDE6A" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
      <filter id="clay-shadow-target" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#38315A" floodOpacity="0.18" />
      </filter>
    </defs>

    {/* Outer Purple Ring */}
    <circle cx="32" cy="32" r="26" fill="#7C3AED" filter="url(#clay-shadow-target)" />

    {/* Middle White Ring */}
    <circle cx="32" cy="32" r="18" fill="#FFFFFF" />

    {/* Inner Gold Bullseye */}
    <circle cx="32" cy="32" r="10" fill="url(#target-gold)" />

    {/* Center White Bead */}
    <circle cx="32" cy="32" r="3.5" fill="#FFFFFF" />
  </svg>
);

/**
 * 15. 3D Check Medallion (Correct Answer / Mastered Topic)
 */
export const SugaryCheck: React.FC<ClayIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform hover:scale-105 duration-200 select-none ${className}`}
  >
    <defs>
      <linearGradient id="check-emerald" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <filter id="clay-shadow-check" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#059669" floodOpacity="0.25" />
      </filter>
    </defs>

    {/* Green Medallion */}
    <circle cx="32" cy="32" r="26" fill="url(#check-emerald)" filter="url(#clay-shadow-check)" />

    {/* 3D White Checkmark */}
    <path
      d="M20 32L28 40L44 22"
      stroke="#FFFFFF"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * 16. 3D Alert Capsule (Weak Topic / Incorrect Answer)
 */
export const SugaryAlert: React.FC<ClayIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform hover:scale-105 duration-200 select-none ${className}`}
  >
    <defs>
      <linearGradient id="alert-orange" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="100%" stopColor="#E11D48" />
      </linearGradient>
      <filter id="clay-shadow-alert" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#E11D48" floodOpacity="0.25" />
      </filter>
    </defs>

    {/* Orange-Red Disc */}
    <circle cx="32" cy="32" r="26" fill="url(#alert-orange)" filter="url(#clay-shadow-alert)" />

    {/* 3D Exclamation Bar & Dot */}
    <rect x="29" y="18" width="6" height="18" rx="3" fill="#FFFFFF" />
    <circle cx="32" cy="44" r="3.5" fill="#FFFFFF" />
  </svg>
);

/**
 * 17. 3D Swords (Multiplayer Speed Battle in purple & orange)
 */
export const SugarySwords: React.FC<ClayIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform hover:scale-105 duration-200 select-none ${className}`}
  >
    <defs>
      <linearGradient id="blade-orange" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFDE6A" />
        <stop offset="60%" stopColor="#FF9500" />
        <stop offset="100%" stopColor="#EA580C" />
      </linearGradient>
      <linearGradient id="blade-purple" x1="52" y1="12" x2="12" y2="52" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#C4B5FD" />
        <stop offset="60%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#6D28D9" />
      </linearGradient>
      <filter id="clay-shadow-swords" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#38315A" floodOpacity="0.2" />
      </filter>
    </defs>

    {/* Sword 1: Orange Blade */}
    <g filter="url(#clay-shadow-swords)">
      <path d="M14 10L18 10L50 42L46 46L14 14V10Z" fill="url(#blade-orange)" />
      <rect x="42" y="42" width="12" height="4" rx="2" transform="rotate(45 42 42)" fill="#7C3AED" />
      <circle cx="50" cy="50" r="3" fill="#6D28D9" />
    </g>

    {/* Sword 2: Purple Blade */}
    <g filter="url(#clay-shadow-swords)">
      <path d="M50 10L46 10L14 42L18 46L50 14V10Z" fill="url(#blade-purple)" />
      <rect x="18" y="42" width="12" height="4" rx="2" transform="rotate(-45 18 42)" fill="#F59E0B" />
      <circle cx="14" cy="50" r="3" fill="#D97706" />
    </g>

    {/* Center Starburst */}
    <circle cx="32" cy="32" r="3" fill="#FFFFFF" />
  </svg>
);

/**
 * 18. 3D Sparkles (AI Notes-to-Quiz Starburst in Purple & Gold)
 */
export const SugarySparkles: React.FC<ClayIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform hover:scale-105 duration-200 select-none ${className}`}
  >
    <defs>
      <linearGradient id="clay-sparkle" x1="16" y1="8" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFDE6A" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
      <filter id="clay-shadow-sparkle" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#7C3AED" floodOpacity="0.25" />
      </filter>
    </defs>

    {/* Primary 4-Point Star */}
    <path
      d="M32 6C33 18 38 23 50 24C38 25 33 30 32 42C31 30 26 25 14 24C26 23 31 18 32 6Z"
      fill="url(#clay-sparkle)"
      filter="url(#clay-shadow-sparkle)"
    />

    {/* Mini Gold Star */}
    <path
      d="M48 38C48.5 43 50 44.5 55 45C50 45.5 48.5 47 48 52C47.5 47 46 45.5 41 45C46 44.5 47.5 43 48 38Z"
      fill="#FFB800"
    />

    {/* Mini Purple Star */}
    <path
      d="M16 42C16.5 46 18 47.5 22 48C18 48.5 16.5 50 16 54C15.5 50 14 48.5 10 48C14 47.5 15.5 46 16 42Z"
      fill="#8B5CF6"
    />

    <circle cx="32" cy="24" r="2.5" fill="#FFFFFF" />
  </svg>
);

/**
 * 19. 3D Brain / Smart Revision Loop
 */
export const SugaryBrain: React.FC<ClayIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform hover:scale-105 duration-200 select-none ${className}`}
  >
    <defs>
      <linearGradient id="brain-clay" x1="14" y1="12" x2="50" y2="52" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#C4B5FD" />
        <stop offset="50%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#6D28D9" />
      </linearGradient>
      <filter id="clay-shadow-brain" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#6D28D9" floodOpacity="0.25" />
      </filter>
    </defs>

    {/* Brain Body */}
    <path
      d="M24 16C18 16 14 21 14 28C14 34 17 38 21 40C19 44 21 50 27 50C30 50 31 48 32 46C33 48 34 50 37 50C43 50 45 44 43 40C47 38 50 34 50 28C50 21 46 16 40 16C37 16 34 18 32 21C30 18 27 16 24 16Z"
      fill="url(#brain-clay)"
      filter="url(#clay-shadow-brain)"
    />

    {/* Grooves */}
    <path
      d="M24 24C28 24 30 28 32 32M40 24C36 24 34 28 32 32M32 32V44"
      stroke="#EDE9FE"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * 20. 3D Student Shield / Badge
 */
export const SugaryShield: React.FC<ClayIconProps> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform hover:scale-105 duration-200 select-none ${className}`}
  >
    <defs>
      <linearGradient id="shield-clay" x1="16" y1="8" x2="48" y2="56" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#A78BFA" />
        <stop offset="60%" stopColor="#7C3AED" />
        <stop offset="100%" stopColor="#5B21B6" />
      </linearGradient>
      <filter id="clay-shadow-shield" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#7C3AED" floodOpacity="0.25" />
      </filter>
    </defs>

    {/* Shield */}
    <path
      d="M32 6L14 14V30C14 44 22 53 32 58C42 53 50 44 50 30V14L32 6Z"
      fill="url(#shield-clay)"
      filter="url(#clay-shadow-shield)"
    />

    {/* Golden Inset Star */}
    <path
      d="M32 21L33.8 26.5H39.5L35 29.8L36.8 35.2L32 31.8L27.2 35.2L29 29.8L24.5 26.5H30.2L32 21Z"
      fill="#FFDE6A"
    />
  </svg>
);
