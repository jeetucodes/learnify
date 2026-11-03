import React from 'react';
import { Flame, Zap, User, BookOpen, Sparkles, Swords, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onNavigate: (route: string) => void;
  currentRoute: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentRoute }) => {
  const { user } = useAuth();

  const navItems = [
    { id: 'home', label: 'Dashboard', icon: null },
    { id: 'practice', label: 'Practice', icon: BookOpen },
    { id: 'upload', label: 'Notes AI', icon: Sparkles },
    { id: 'revision', label: 'Revision', icon: RotateCcw },
    { id: 'battle', label: 'Battle', icon: Swords },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#FFFDF7]/90 border-b border-[#38315A]/[0.08] shadow-[0_4px_16px_rgba(56,49,90,0.06)] px-4 sm:px-6 py-2.5 select-none pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        
        {/* Brand & Tagline */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group clay-focus rounded-full p-1"
        >
          {/* Logo Badge */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--dp-color-accent)] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.8),inset_-2px_-2px_4px_rgba(56,49,90,0.12)]">
            <span className="font-extrabold text-sm text-[var(--dp-color-ink)]">LF</span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-[var(--dp-color-ink)] group-hover:text-[var(--dp-color-primary-action)] transition-colors">
                Learnify
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--dp-color-surface-support)] text-[var(--dp-color-ink)] shadow-xs">
                Prep
              </span>
            </div>
            <span className="text-[11px] text-[var(--dp-color-ink-secondary)] font-medium block leading-none mt-0.5 hidden sm:block">
              Practice · Compete · Revise
            </span>
          </div>
        </div>

        {/* Desktop Bank of Raised Clay Pill Navigation */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-[#EEF0FB] shadow-[inset_2px_2px_5px_rgba(56,49,90,0.12),inset_-2px_-2px_5px_rgba(255,255,255,0.9)]">
          {navItems.map((item) => {
            const isActive = currentRoute === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`px-4 py-2 text-sm font-bold flex items-center gap-2 rounded-full transition-all duration-180 cursor-pointer clay-focus ${
                  isActive
                    ? 'clay-btn-primary shadow-[0_4px_12px_rgba(74,63,209,0.35)]'
                    : 'text-[var(--dp-color-ink)] hover:bg-[#FFFDF7] hover:shadow-xs'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Status / Telemetry (Streak, XP & Profile) */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <div className="flex items-center gap-2">
              
              {/* Streak Pill (Butter-Yellow) */}
              <div
                className="clay-cushion-yellow px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold text-[var(--dp-color-ink)] cursor-default"
                title={`${user.streak} Day Continuous Streak`}
              >
                <Flame className="w-4 h-4 text-[#D97706] fill-[#D97706]" />
                <span className="font-mono tabular-nums">{user.streak}d</span>
              </div>

              {/* XP Pill (Cream Cushion) */}
              <div
                className="clay-cushion-cream px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold text-[var(--dp-color-ink)] cursor-default hidden sm:flex"
                title={`${user.xp} Total Experience`}
              >
                <Zap className="w-4 h-4 text-[var(--dp-color-primary-action)]" />
                <span className="font-mono tabular-nums font-bold">{user.xp}</span>
                <span className="text-[10px] text-[var(--dp-color-ink-secondary)]">XP</span>
              </div>

              {/* Profile Avatar Clay Button */}
              <button
                type="button"
                onClick={() => onNavigate('profile')}
                className={`clay-btn-secondary px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold clay-focus cursor-pointer ${
                  currentRoute === 'profile' ? 'ring-2 ring-[var(--dp-color-primary-action)]' : ''
                }`}
                title="Student Profile"
              >
                <div className="w-6 h-6 rounded-full bg-[var(--dp-color-primary-action)] text-[#FFFDF7] flex items-center justify-center text-xs font-bold overflow-hidden shadow-xs">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="hidden sm:inline max-w-[80px] truncate text-[var(--dp-color-ink)]">
                  {user.name.split(' ')[0]}
                </span>
              </button>

            </div>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="clay-btn-primary px-5 py-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 clay-focus cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
