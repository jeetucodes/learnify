import React, { useEffect, useState } from 'react';
import {
  LogOut,
  Edit3,
  Check,
  GraduationCap,
  Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserAttempts } from '../lib/storage';
import { ProgressBar } from '../components/ProgressBar';
import {
  SugaryFlame,
  SugaryBolt,
  SugaryTarget,
  SugaryShield,
  SugaryTrophy,
  SugaryCalendar,
  SugaryClock,
  SugaryCheck,
} from '../components/SugaryIcons';
import type { Attempt } from '../types/database';

interface ProfileScreenProps {
  onNavigate: (route: string) => void;
}

const PRESET_AVATARS = [
  { label: 'Shield (Default)', url: '' },
  { label: 'Scholar A', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80' },
  { label: 'Scholar B', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=160&auto=format&fit=crop&q=80' },
  { label: 'Scholar C', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&auto=format&fit=crop&q=80' },
  { label: 'Scholar D', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80' },
  { label: 'Scholar E', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=160&auto=format&fit=crop&q=80' },
  { label: 'Scholar F', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80' },
];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigate }) => {
  const { user, logout, updateProfile } = useAuth();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSpecialization, setEditSpecialization] = useState('');
  const [editCollege, setEditCollege] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditSpecialization(user.specialization || 'DBMS Specialization');
      setEditCollege(user.college || '');
      setEditBio(user.bio || '');
      setEditAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      getUserAttempts(user.id).then((att) => {
        setAttempts(att);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const handleOpenEdit = () => {
    if (user) {
      setEditName(user.name || '');
      setEditSpecialization(user.specialization || 'DBMS Specialization');
      setEditCollege(user.college || '');
      setEditBio(user.bio || '');
      setEditAvatarUrl(user.avatar_url || '');
      setIsEditing(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    setSaving(true);
    try {
      await updateProfile({
        name: editName.trim(),
        specialization: editSpecialization.trim() || 'DBMS Specialization',
        college: editCollege.trim(),
        bio: editBio.trim(),
        avatar_url: editAvatarUrl.trim(),
      });
      setIsEditing(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const totalQuestionsAnswered = attempts.length;
  const correctCount = attempts.filter((a) => a.correct).length;
  const accuracy =
    totalQuestionsAnswered > 0
      ? Math.round((correctCount / totalQuestionsAnswered) * 100)
      : 0;

  const userXp = user?.xp || 0;
  const currentLevel = Math.floor(userXp / 100) + 1;
  const xpInCurrentLevel = userXp % 100;

  const handleLogout = async () => {
    await logout();
    onNavigate('login');
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 text-[var(--dp-color-ink)]">
        <div className="w-10 h-10 rounded-full border-3 border-indigo-200 border-t-indigo-600 animate-spin mb-4"></div>
        <span className="text-sm font-bold text-slate-600">Loading student profile...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="bg-white border border-slate-200/80 shadow-xs p-8 rounded-3xl">
          <p className="text-sm font-bold text-slate-800">You are currently in guest mode</p>
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 mt-4 rounded-full text-sm font-bold cursor-pointer"
          >
            Sign In / Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 text-left">
      
      {/* Student Profile Card with 3D Sugary Shield */}
      <div className="bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/80 border border-indigo-100/90 shadow-[0_8px_24px_rgba(79,70,229,0.06)] p-6 sm:p-9 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          
          {/* Avatar frame */}
          <div className="w-20 h-20 rounded-3xl bg-white border border-indigo-200 p-1 flex items-center justify-center text-3xl font-bold text-indigo-700 shadow-xs overflow-hidden shrink-0">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              <SugaryShield size={50} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
              <span className="rounded-full bg-white border border-indigo-200 px-3 py-0.5 text-xs font-black text-indigo-700 shadow-xs">
                Level {currentLevel} Scholar
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-0.5 rounded-full shadow-xs">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                <span>{user.specialization || 'DBMS Specialization'}</span>
              </span>
              {user.college && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <span>{user.college}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 truncate">
              {user.name}
            </h1>

            {user.bio && (
              <p className="text-xs text-slate-600 mt-1 italic font-medium max-w-md">
                "{user.bio}"
              </p>
            )}

            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-500 mt-1.5">
              <SugaryCalendar size={15} />
              <span>Member since {new Date(user.last_active).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenEdit}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-800">
            <span>Next Rank: Level {currentLevel + 1}</span>
            <span className="font-mono tabular-nums text-indigo-600 font-extrabold">
              {xpInCurrentLevel} / 100 XP
            </span>
          </div>
          <ProgressBar progress={xpInCurrentLevel} heightClass="h-2.5" />
        </div>
      </div>

      {/* 4 Crisp Metric Cards with 3D Sugary Icons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Streak */}
        <div className="bg-white border border-amber-200/70 shadow-xs p-4 rounded-2xl text-left">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 block">
            Streak
          </span>
          <div className="flex items-center gap-2 mt-1.5">
            <SugaryFlame size={24} />
            <span className="text-2xl font-black font-mono tabular-nums text-slate-900">
              {user.streak}d
            </span>
          </div>
        </div>

        {/* XP */}
        <div className="bg-white border border-indigo-200/70 shadow-xs p-4 rounded-2xl text-left">
          <span className="text-[11px] font-black uppercase tracking-wider text-indigo-800 block">
            Lifetime XP
          </span>
          <div className="flex items-center gap-2 mt-1.5">
            <SugaryBolt size={24} />
            <span className="text-2xl font-black font-mono tabular-nums text-slate-900">
              {user.xp}
            </span>
          </div>
        </div>

        {/* Questions Solved */}
        <div className="bg-white border border-emerald-200/70 shadow-xs p-4 rounded-2xl text-left">
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 block">
            Solved
          </span>
          <div className="flex items-center gap-2 mt-1.5">
            <SugaryTarget size={24} />
            <span className="text-2xl font-black font-mono tabular-nums text-slate-900">
              {totalQuestionsAnswered}
            </span>
          </div>
        </div>

        {/* Accuracy */}
        <div className="bg-white border border-purple-200/70 shadow-xs p-4 rounded-2xl text-left">
          <span className="text-[11px] font-black uppercase tracking-wider text-purple-800 block">
            Accuracy
          </span>
          <div className="flex items-center gap-2 mt-1.5">
            <SugaryTrophy size={24} />
            <span className="text-2xl font-black font-mono tabular-nums text-slate-900">
              {accuracy}%
            </span>
          </div>
        </div>

      </div>

      {/* Recent Activity History */}
      <div className="bg-white border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 sm:p-8 rounded-3xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <SugaryClock size={22} />
            <h3 className="text-lg font-bold text-slate-900">
              Recent Practice History
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Last {Math.min(attempts.length, 5)} attempts
          </span>
        </div>

        {attempts.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">
            No quiz attempts recorded yet. Start practicing to see your performance log!
          </p>
        ) : (
          <div className="space-y-2.5">
            {attempts.slice(0, 5).map((att) => (
              <div
                key={att.id}
                className="bg-slate-50/70 border border-slate-200/70 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-xs ${
                      att.correct
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {att.correct ? '✓' : '✕'}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Topic: {att.topic_id}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(att.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                    att.correct
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  {att.correct ? '+10 XP' : '+0 XP'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Success Toast Notification */}
      {showSuccessToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-[0_10px_30px_rgba(5,150,105,0.3)] flex items-center gap-2.5 text-xs sm:text-sm font-bold">
          <SugaryCheck size={20} />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200/90 shadow-2xl rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 text-left my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-xs">
                  <Edit3 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Edit Student Profile
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    Customize your profile display and avatar
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              {/* Avatar Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Choose Profile Avatar
                </label>
                
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-indigo-500 p-0.5 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                    {editAvatarUrl ? (
                      <img src={editAvatarUrl} alt="Preview" className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      <SugaryShield size={38} />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-800 block">
                      Active Avatar Preview
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Pick a preset below or enter a custom image URL
                    </span>
                  </div>
                </div>

                {/* Preset Avatars Row */}
                <div className="grid grid-cols-7 gap-2">
                  {PRESET_AVATARS.map((av, idx) => {
                    const isSelected = editAvatarUrl === av.url;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditAvatarUrl(av.url)}
                        className={`h-11 rounded-xl p-0.5 border-2 flex items-center justify-center cursor-pointer transition-all ${
                          isSelected
                            ? 'border-indigo-600 scale-105 shadow-xs bg-indigo-50'
                            : 'border-slate-200 hover:border-indigo-300 bg-slate-50'
                        }`}
                        title={av.label}
                      >
                        {av.url ? (
                          <img src={av.url} alt={av.label} className="w-full h-full rounded-lg object-cover" />
                        ) : (
                          <SugaryShield size={24} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom URL optional input */}
                <div className="mt-2.5">
                  <input
                    type="url"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    placeholder="Or enter custom image URL (https://...)"
                    className="w-full h-9 rounded-full bg-slate-50 border border-slate-200 px-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Student Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="w-full h-11 rounded-full bg-slate-50 border border-slate-200 px-4 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Specialization / Major */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Specialization / Branch
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={editSpecialization}
                    onChange={(e) => setEditSpecialization(e.target.value)}
                    placeholder="e.g. Computer Science & Engineering"
                    className="w-full h-11 rounded-full bg-slate-50 border border-slate-200 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* College / University */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  College / University
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={editCollege}
                    onChange={(e) => setEditCollege(e.target.value)}
                    placeholder="e.g. State University / NIT"
                    className="w-full h-11 rounded-full bg-slate-50 border border-slate-200 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Exam Goal / Bio */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Exam Goal or Bio
                </label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="e.g. Preparing for end-sem DBMS finals. Targeting 90%+!"
                  className="w-full rounded-2xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setIsEditing(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-full text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || !editName.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
