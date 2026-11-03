import React from 'react';
import { Home, BookOpen, Sparkles, Swords, User } from 'lucide-react';

interface BottomNavProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentRoute, onNavigate }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'practice', label: 'Practice', icon: BookOpen },
    { id: 'upload', label: 'Notes AI', icon: Sparkles },
    { id: 'battle', label: 'Battle', icon: Swords },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-3 left-0 right-0 z-40 px-4 md:hidden pointer-events-none pb-[env(safe-area-inset-bottom,0px)]">
      <nav className="pointer-events-auto max-w-sm mx-auto rounded-full bg-[#FFFDF7]/95 backdrop-blur-md border border-[#38315A]/10 shadow-[0_12px_32px_rgba(56,49,90,0.18),inset_2px_2px_4px_rgba(255,255,255,0.9),inset_-2px_-2px_4px_rgba(180,170,210,0.15)] p-1.5 flex items-center justify-around gap-1 select-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentRoute === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id)}
              className={`flex-1 py-2 px-1 rounded-full flex flex-col items-center justify-center transition-all duration-180 cursor-pointer clay-focus ${
                isActive
                  ? 'bg-[var(--dp-color-primary-action)] text-[#FFFDF7] shadow-[0_4px_12px_rgba(74,63,209,0.35)] scale-105'
                  : 'text-[var(--dp-color-ink-secondary)] hover:text-[var(--dp-color-ink)] hover:bg-[#EEF0FB]/60'
              }`}
            >
              <Icon className="w-4 h-4 stroke-[2.2]" />
              <span className="text-[10px] font-bold mt-0.5 tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
