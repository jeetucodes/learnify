import React from 'react';
import { User, BookOpen, Sparkles, Swords, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SugaryFlame, SugaryBolt, SugaryBook } from './SugaryIcons';

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
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/85 border-b border-indigo-100/60 shadow-[0_2px_12px_rgba(79,70,229,0.04)] px-4 sm:px-6 py-2.5 select-none pt-[env(safe-area-inset-top,0px)] transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        
        {/* Brand & Tagline */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 cursor-pointer group rounded-full p-1 transition-transform hover:scale-[1.02]"
        >
          {/* 3D Sugary Brand Icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/80 border border-indigo-200/60 shadow-xs">
            <SugaryBook size={26} />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-[var(--dp-color-ink)] group-hover:text-[var(--dp-color-primary-action)] transition-colors">
                Learnify
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-xs">
                Prep
              </span>
            </div>
            <span className="text-[11px] text-[var(--dp-color-ink-secondary)] font-medium block leading-none mt-0.5 hidden sm:block">
              Practice · Compete · Revise
            </span>
          </div>
        </div>

        {/* Desktop Bank of Modern Clean Navigation Pills */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-slate-100/90 border border-slate-200/60 shadow-inner">
          {navItems.map((item) => {
            const isActive = currentRoute === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 rounded-full transition-all duration-180 cursor-pointer ${
                  isActive
                    ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100/80 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Status / Telemetry (Streak, XP & Profile) */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              
              {/* 3D Sugary Streak Pill */}
              <div
                className="bg-amber-50/90 border border-amber-200/80 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold text-amber-900 shadow-xs cursor-default"
                title={`${user.streak} Day Continuous Streak`}
              >
                <SugaryFlame size={18} />
                <span className="font-mono tabular-nums font-extrabold">{user.streak}d</span>
              </div>

              {/* 3D Sugary XP Pill */}
              <div
                className="bg-indigo-50/90 border border-indigo-200/80 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold text-indigo-900 shadow-xs cursor-default hidden sm:flex"
                title={`${user.xp} Total Experience`}
              >
                <SugaryBolt size={18} />
                <span className="font-mono tabular-nums font-extrabold">{user.xp}</span>
                <span className="text-[10px] text-indigo-600 font-semibold">XP</span>
              </div>

              {/* Profile Avatar Button */}
              <button
                type="button"
                onClick={() => onNavigate('profile')}
                className={`bg-white border border-slate-200/80 hover:border-indigo-300 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  currentRoute === 'profile' ? 'ring-2 ring-indigo-500 border-transparent' : ''
                }`}
                title="Student Profile"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center text-xs font-bold overflow-hidden shadow-xs">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="hidden sm:inline max-w-[80px] truncate text-slate-800 font-bold">
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
