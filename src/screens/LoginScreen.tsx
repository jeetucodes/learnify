import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SugaryBook, SugarySparkles } from '../components/SugaryIcons';

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
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md">
        
        {/* Main Card */}
        <div className="bg-white border border-slate-200/80 shadow-[0_12px_40px_rgba(79,70,229,0.08)] p-7 sm:p-9 rounded-3xl space-y-6 text-center">
          
          {/* Header Brand */}
          <div className="flex flex-col items-center space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-xs">
              <SugaryBook size={38} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Learnify
            </h1>
            <p className="text-xs font-semibold text-slate-500">
              Practice · Compete · Revise
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

          {/* Google & Demo Guest Actions */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleGoogle}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 w-full h-12 rounded-full text-sm font-bold flex items-center justify-center gap-2.5 shadow-xs cursor-pointer transition-all"
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
              className="w-full py-2.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <SugarySparkles size={16} />
              <span>Explore as Demo Student (Instant Access)</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
