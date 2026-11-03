import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getProfile, saveProfile, initializeSeedData } from '../lib/storage';
import type { Profile } from '../types/database';

interface UserSession extends Profile {
  email: string;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  guestLogin: (name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUserStats: (xpEarned: number, newTotalXp: number, newStreak: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize seed data on load
  useEffect(() => {
    initializeSeedData();
  }, []);

  const loadSession = async () => {
    try {
      if (isSupabaseConfigured()) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await getProfile(session.user.id);
          setUser({
            id: session.user.id,
            email: session.user.email || 'student@learnify.app',
            name: profile?.name || session.user.user_metadata?.full_name || 'Student',
            avatar_url: profile?.avatar_url || session.user.user_metadata?.avatar_url,
            xp: profile?.xp ?? 0,
            streak: profile?.streak ?? 1,
            last_active: profile?.last_active || new Date().toISOString(),
          });
          setLoading(false);
          return;
        }
      }

      // Local guest session fallback
      const saved = localStorage.getItem('learnify_active_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        const profile = await getProfile(parsed.id);
        setUser({
          ...parsed,
          xp: profile?.xp ?? parsed.xp ?? 0,
          streak: profile?.streak ?? parsed.streak ?? 1,
        });
      }
    } catch (err) {
      console.error('Error loading session:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();

    if (isSupabaseConfigured()) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const profile = await getProfile(session.user.id);
          setUser({
            id: session.user.id,
            email: session.user.email || 'student@learnify.app',
            name: profile?.name || session.user.user_metadata?.full_name || 'Student',
            avatar_url: profile?.avatar_url || session.user.user_metadata?.avatar_url,
            xp: profile?.xp ?? 0,
            streak: profile?.streak ?? 1,
            last_active: profile?.last_active || new Date().toISOString(),
          });
        } else {
          setUser(null);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        if (data.user) {
          const profile = await getProfile(data.user.id);
          const activeUser: UserSession = {
            id: data.user.id,
            email: data.user.email || email,
            name: profile?.name || 'Student',
            avatar_url: profile?.avatar_url,
            xp: profile?.xp ?? 0,
            streak: profile?.streak ?? 1,
            last_active: profile?.last_active || new Date().toISOString(),
          };
          setUser(activeUser);
          localStorage.setItem('learnify_active_session', JSON.stringify(activeUser));
        }
      } else {
        // Local simulation
        const fakeId = 'usr_' + Math.abs(email.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(16);
        let profile = await getProfile(fakeId);
        if (!profile) {
          profile = {
            id: fakeId,
            name: email.split('@')[0],
            xp: 0,
            streak: 1,
            last_active: new Date().toISOString(),
          };
          await saveProfile(profile);
        }
        const activeUser: UserSession = {
          ...profile,
          email,
        };
        setUser(activeUser);
        localStorage.setItem('learnify_active_session', JSON.stringify(activeUser));
      }
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        if (data.user) {
          const profile: Profile = {
            id: data.user.id,
            name,
            xp: 0,
            streak: 1,
            last_active: new Date().toISOString(),
          };
          await saveProfile(profile);
          const activeUser: UserSession = {
            ...profile,
            email: data.user.email || email,
          };
          setUser(activeUser);
          localStorage.setItem('learnify_active_session', JSON.stringify(activeUser));
        }
      } else {
        const fakeId = 'usr_' + Math.abs(email.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(16);
        const profile: Profile = {
          id: fakeId,
          name: name || email.split('@')[0],
          xp: 0,
          streak: 1,
          last_active: new Date().toISOString(),
        };
        await saveProfile(profile);
        const activeUser: UserSession = {
          ...profile,
          email,
        };
        setUser(activeUser);
        localStorage.setItem('learnify_active_session', JSON.stringify(activeUser));
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } else {
      // Mock Google sign in
      const fakeId = 'usr_google_' + Math.floor(Math.random() * 10000);
      const profile: Profile = {
        id: fakeId,
        name: 'Alex Johnson',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        xp: 120,
        streak: 3,
        last_active: new Date().toISOString(),
      };
      await saveProfile(profile);
      const activeUser: UserSession = {
        ...profile,
        email: 'alex.johnson@gmail.com',
      };
      setUser(activeUser);
      localStorage.setItem('learnify_active_session', JSON.stringify(activeUser));
    }
  };

  const guestLogin = async (customName?: string) => {
    setLoading(true);
    try {
      const guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
      const name = customName || 'Learner ' + Math.floor(100 + Math.random() * 900);
      const profile: Profile = {
        id: guestId,
        name,
        xp: 40,
        streak: 2,
        last_active: new Date().toISOString(),
      };
      await saveProfile(profile);
      const activeUser: UserSession = {
        ...profile,
        email: `${guestId}@learnify.local`,
      };
      setUser(activeUser);
      localStorage.setItem('learnify_active_session', JSON.stringify(activeUser));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('learnify_active_session');
    setUser(null);
  };

  const refreshProfile = async () => {
    if (user?.id) {
      const p = await getProfile(user.id);
      if (p) {
        setUser((prev) => (prev ? { ...prev, ...p } : null));
      }
    }
  };

  const updateUserStats = (_xpEarned: number, newTotalXp: number, newStreak: number) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, xp: newTotalXp, streak: newStreak };
      localStorage.setItem('learnify_active_session', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        guestLogin,
        logout,
        refreshProfile,
        updateUserStats,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
