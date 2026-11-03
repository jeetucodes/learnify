import React from 'react';
import { Home, BookOpen, PlusCircle, Swords, User } from 'lucide-react';

interface BottomNavProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentRoute, onNavigate }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'practice', label: 'Practice', icon: BookOpen },
    { id: 'create', label: 'Create', icon: PlusCircle },
    { id: 'battle', label: 'Battle', icon: Swords },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-3 left-0 right-0 z-40 px-4 md:hidden pointer-events-none pb-[env(safe-area-inset-bottom,0px)]">
      <nav className="pointer-events-auto max-w-sm mx-auto rounded-full bg-white/95 backdrop-blur-xl border border-indigo-100/90 shadow-[0_12px_30px_rgba(79,70,229,0.12)] p-1.5 flex items-center justify-around gap-1 select-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            currentRoute === tab.id || (tab.id === 'create' && currentRoute === 'upload');

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id)}
              className={`flex-1 py-2 px-1 rounded-full flex flex-col items-center justify-center transition-all duration-180 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm font-extrabold scale-105'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
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
