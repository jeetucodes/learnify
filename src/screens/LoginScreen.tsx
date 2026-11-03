import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LearnifyLogo } from '../components/LearnifyLogo';

interface LoginScreenProps {
  onSuccess: () => void;
  onBackToLanding?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess, onBackToLanding }) => {
  const { signInWithEmail, signUpWithEmail, guestLogin } = useAuth();
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

  const handleGuest = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await guestLogin();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to initialize student session.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md">
        {onBackToLanding && (
          <div className="mb-3.5 text-left">
            <button
              type="button"
              onClick={onBackToLanding}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer bg-white/70 hover:bg-white border border-slate-200 px-3.5 py-1.5 rounded-full shadow-xs"
            >
              <span>← Back to Overview</span>
            </button>
          </div>
        )}
        
        {/* Main Card */}
        <div className="bg-white border border-slate-200/80 shadow-[0_12px_40px_rgba(79,70,229,0.08)] p-7 sm:p-9 rounded-3xl space-y-6 text-center">
          
          {/* Header Brand */}
          <div className="flex flex-col items-center space-y-2">
            <LearnifyLogo size={64} glow />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Learnify
            </h1>
            <p className="text-xs font-semibold text-slate-500">
              Study · Compete · Repeat
            </p>
          </div>

          {/* Pill Tab Switcher */}
          <div className="p-1 rounded-full bg-slate-100 flex gap-1 border border-slate-200/60 shadow-inner">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-180 cursor-pointer ${
                !isSignUp
                  ? 'bg-white text-indigo-700 shadow-sm font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-180 cursor-pointer ${
                isSignUp
                  ? 'bg-white text-indigo-700 shadow-sm font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl text-xs font-bold text-rose-800 text-left">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {isSignUp && (
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5 pl-1">
                  Student Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full h-12 rounded-full bg-slate-50 border border-slate-200 pl-11 pr-5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5 pl-1">
                Student Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full h-12 rounded-full bg-slate-50 border border-slate-200 pl-11 pr-5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5 pl-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full h-12 rounded-full bg-slate-50 border border-slate-200 pl-11 pr-5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white w-full h-12 rounded-full text-base font-bold flex items-center justify-center gap-2 shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              <span>{submitting ? 'Authenticating...' : isSignUp ? 'Create Student Account' : 'Sign In to Learnify'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="w-full border-t border-slate-200" />
            <span className="bg-white px-3 text-xs font-bold text-slate-400 uppercase tracking-wider absolute">
              or
            </span>
          </div>

          {/* Instant Access Option */}
          <div>
            <button
              type="button"
              onClick={handleGuest}
              className="bg-indigo-50/80 hover:bg-indigo-100/90 border border-indigo-200 text-indigo-900 w-full h-12 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Explore as Guest Scholar (Instant Access)</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
