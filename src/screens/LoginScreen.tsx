import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginScreenProps {
  onSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, guestLogin } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error('Please enter your full student name');
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      await signInWithGoogle();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Google sign-in encountered an issue.');
    }
  };

  const handleGuest = async () => {
    setError(null);
    try {
      await guestLogin();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Guest login failed.');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-8 font-clay">
      <div className="w-full max-w-md">
        
        {/* Main Clay Card in Cream Tray */}
        <div className="clay-tray-cream p-7 sm:p-10 rounded-3xl space-y-6 text-center">
          
          {/* Header Brand Cushion */}
          <div className="clay-cushion-violet p-6 rounded-2xl space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--dp-color-ink)]">
              Learnify
            </h1>
            <p className="text-xs font-semibold text-[var(--dp-color-ink-secondary)]">
              Practice · Compete · Revise
            </p>
          </div>

          {/* Pill Tab Switcher */}
          <div className="p-1 rounded-full bg-[#EEF0FB] flex gap-1 shadow-[inset_2px_2px_4px_rgba(56,49,90,0.12)]">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-180 clay-focus cursor-pointer ${
                !isSignUp
                  ? 'clay-btn-primary shadow-xs'
                  : 'text-[var(--dp-color-ink-secondary)] hover:text-[var(--dp-color-ink)]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-180 clay-focus cursor-pointer ${
                isSignUp
                  ? 'clay-btn-primary shadow-xs'
                  : 'text-[var(--dp-color-ink-secondary)] hover:text-[var(--dp-color-ink)]'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="clay-tray-pink p-3.5 rounded-2xl text-xs font-bold text-[#9F1239] text-left">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {isSignUp && (
              <div>
                <label className="text-xs font-bold text-[var(--dp-color-ink-secondary)] block mb-1.5 pl-1">
                  Student Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[var(--dp-color-ink-secondary)] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full h-12 rounded-full bg-[#EEF0FB] pl-11 pr-5 text-sm text-[var(--dp-color-ink)] placeholder-[var(--dp-color-ink-secondary)]/50 focus:outline-none clay-focus shadow-[inset_2px_2px_4px_rgba(56,49,90,0.12)]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-[var(--dp-color-ink-secondary)] block mb-1.5 pl-1">
                Student Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[var(--dp-color-ink-secondary)] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full h-12 rounded-full bg-[#EEF0FB] pl-11 pr-5 text-sm text-[var(--dp-color-ink)] placeholder-[var(--dp-color-ink-secondary)]/50 focus:outline-none clay-focus shadow-[inset_2px_2px_4px_rgba(56,49,90,0.12)]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--dp-color-ink-secondary)] block mb-1.5 pl-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[var(--dp-color-ink-secondary)] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full h-12 rounded-full bg-[#EEF0FB] pl-11 pr-5 text-sm text-[var(--dp-color-ink)] placeholder-[var(--dp-color-ink-secondary)]/50 focus:outline-none clay-focus shadow-[inset_2px_2px_4px_rgba(56,49,90,0.12)]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="clay-btn-primary w-full h-12 text-base font-bold flex items-center justify-center gap-2 clay-focus cursor-pointer shadow-md disabled:opacity-50 mt-2"
            >
              <span>{submitting ? 'Authenticating...' : isSignUp ? 'Create Student Account' : 'Sign In to Learnify'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="w-full border-t border-[#38315A]/10" />
            <span className="bg-[#FFFDF7] px-3 text-xs font-bold text-[var(--dp-color-ink-secondary)] uppercase tracking-wider absolute">
              or
            </span>
          </div>

          {/* Google & Demo Guest Actions */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleGoogle}
              className="clay-btn-secondary w-full h-12 text-sm font-bold flex items-center justify-center gap-2.5 clay-focus cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={handleGuest}
              className="w-full py-2.5 text-xs font-bold text-[var(--dp-color-primary-action)] hover:underline clay-focus cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explore as Demo Student (Instant Access)</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
