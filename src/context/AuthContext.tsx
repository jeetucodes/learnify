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
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
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
            college: profile?.college,
            specialization: profile?.specialization || 'DBMS Specialization',
            bio: profile?.bio,
            last_active: profile?.last_active || new Date().toISOString(),
          });
          setLoading(false);
          return;
        }
      }

      // Local guest session fallback only if Supabase is NOT configured
      if (!isSupabaseConfigured()) {
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
            college: profile?.college,
            specialization: profile?.specialization || 'DBMS Specialization',
            bio: profile?.bio,
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
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured. Please check environment variables.');
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
      if (error) throw error;

      if (data.user) {
        const profile = await getProfile(data.user.id);
        const activeUser: UserSession = {
          id: data.user.id,
          email: data.user.email || email,
          name: profile?.name || data.user.user_metadata?.full_name || email.split('@')[0],
          avatar_url: profile?.avatar_url,
          xp: profile?.xp ?? 0,
          streak: profile?.streak ?? 1,
          college: profile?.college,
          specialization: profile?.specialization || 'DBMS Specialization',
          bio: profile?.bio,
          last_active: profile?.last_active || new Date().toISOString(),
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
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured. Please check environment variables.');
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: { data: { full_name: name.trim() } },
      });
      if (error) throw error;

      if (data.user) {
        const profile: Profile = {
          id: data.user.id,
          name: name.trim(),
          xp: 0,
          streak: 1,
          last_active: new Date().toISOString(),
        };
        try {
          await saveProfile(profile);
        } catch (e) {
          console.warn('Profile sync:', e);
        }

        const activeUser: UserSession = {
          ...profile,
          email: data.user.email || email,
        };
        setUser(activeUser);
        localStorage.setItem('learnify_active_session', JSON.stringify(activeUser));
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured for OAuth authentication.');
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const guestLogin = async (customName?: string) => {
    setLoading(true);
    try {
      const guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
      const name = customName || 'Learner ' + Math.floor(100 + Math.random() * 900);
      const profile: Profile = {
        id: guestId,
        name,
        xp: 0,
        streak: 1,
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

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    const updatedProfile: Profile = {
      id: user.id,
      name: updates.name?.trim() || user.name,
      avatar_url: updates.avatar_url !== undefined ? updates.avatar_url : user.avatar_url,
      xp: user.xp,
      streak: user.streak,
      college: updates.college !== undefined ? updates.college : user.college,
      specialization: updates.specialization !== undefined ? updates.specialization : user.specialization,
      bio: updates.bio !== undefined ? updates.bio : user.bio,
      last_active: new Date().toISOString(),
    };

    await saveProfile(updatedProfile);

    const updatedUser: UserSession = {
      ...user,
      ...updatedProfile,
    };
    setUser(updatedUser);
    localStorage.setItem('learnify_active_session', JSON.stringify(updatedUser));
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
        updateProfile,
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
