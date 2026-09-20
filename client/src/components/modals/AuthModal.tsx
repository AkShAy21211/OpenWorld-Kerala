import React, { useState } from 'react';
import { ModalWrapper } from '../common/ModalWrapper';
import { useUserStore } from '../../store/useUserStore';
import { useGameStore } from '../../store/useGameStore';
import { joinGuest, updateProfile } from '../../services/api';
import { sendPlayerUpdate } from '../../services/socket';
import { soundManager } from '../../utils/audio';
import { User, Sparkles, LogIn, Check } from 'lucide-react';

const AVATAR_COLORS = [
  '#E11D48', // Crimson Red
  '#D97706', // Warm Amber
  '#059669', // Emerald Green
  '#2563EB', // Royal Blue
  '#7C3AED', // Purple
  '#DB2777', // Pink
];

export const AuthModal: React.FC = () => {
  const { user, setUser, equipped } = useUserStore();
  const { closeModal } = useGameStore();

  const [name, setName] = useState(user?.displayName || '');
  const [selectedColor, setSelectedColor] = useState(user?.avatarColor || '#E11D48');
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setNotice(null);
    soundManager.playPop();

    try {
      if (user) {
        const res = await updateProfile(name.trim());
        setUser(res.user);
        sendPlayerUpdate(equipped, res.user.displayName);
        closeModal();
      } else {
        const res = await joinGuest(name.trim(), selectedColor);
        setUser(res.user);
        sendPlayerUpdate(equipped, res.user.displayName);
        closeModal();
      }
    } catch (err) {
      console.error(err);
      setNotice('Failed to update identity.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoogleMock = async () => {
    soundManager.playPop();
    setIsSaving(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'Google Malayali',
          email: 'user@gmail.com',
        }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        closeModal();
      }
    } catch (err) {
      console.error(err);
      setNotice('Google sign-in unavailable in dev.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalWrapper title="Festival Identity" malayalamTitle="സന്ദർശക വിവരങ്ങൾ" icon="🪔" maxWidth="max-w-md">
      <div className="space-y-5 text-left">
        <p className="text-xs text-stone-300">
          Personalize your festival identity. Your session is securely stored via cookie without relying on local storage.
        </p>

        {notice && (
          <div className="p-2.5 bg-amber-950/60 border border-amber-500/40 rounded-lg text-xs text-amber-200 text-center">
            {notice}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name Input */}
          <div>
            <label className="text-xs font-semibold text-stone-300 block mb-1">
              Your Name / Handle:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              placeholder="e.g. Aromal, Devika, Unni..."
              className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          {/* Avatar Color Picker */}
          <div>
            <label className="text-xs font-semibold text-stone-300 block mb-1.5">
              Avatar Color:
            </label>
            <div className="flex gap-2.5">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    soundManager.playPop();
                    setSelectedColor(color);
                  }}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    selectedColor === color
                      ? 'scale-110 border-white shadow-md'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Submit Guest Button */}
          <button
            type="submit"
            disabled={isSaving || !name.trim()}
            className="w-full py-2.5 px-4 kerala-btn rounded-xl font-bold text-sm flex items-center justify-center gap-2"
          >
            <Check size={16} />
            {user ? 'Save Profile' : 'Enter Fair as Guest'}
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-stone-800" />
          <span className="flex-shrink mx-3 text-[11px] text-stone-500">OR</span>
          <div className="flex-grow border-t border-stone-800" />
        </div>

        {/* Google Login Ready */}
        <button
          onClick={handleGoogleMock}
          disabled={isSaving}
          className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 rounded-xl font-medium text-xs flex items-center justify-center gap-2.5 transition-colors"
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
          Continue with Google
        </button>
      </div>
    </ModalWrapper>
  );
};
