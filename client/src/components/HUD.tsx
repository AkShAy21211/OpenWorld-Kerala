import { useUserStore } from '../store/useUserStore';
import { useGameStore } from '../store/useGameStore';
import { useMultiplayerStore } from '../store/useMultiplayerStore';
import { usePassportStore } from '../store/usePassportStore';
import { sendPlayerEmote } from '../services/socket';
import { soundManager } from '../utils/audio';
import { 
  Sparkles, 
  Users, 
  BookOpen, 
  Trophy, 
  Camera, 
  Volume2, 
  VolumeX, 
  User, 
  ShoppingBag,
  Utensils
} from 'lucide-react';
import { OSMMinimap } from './OSMMinimap';

const CAMERA_MODE_CONFIG = {
  third_person: { label: '3rd Person', icon: '🎥', hint: 'Real-world ground level' },
  first_person: { label: '1st Person', icon: '👀', hint: 'Immersive eye level' },
  aerial:       { label: 'Aerial View', icon: '🦅', hint: 'Whole fair from above' },
  diorama:      { label: 'Diorama 45°', icon: '📐', hint: 'Isometric overview' },
};

export const HUD: React.FC = () => {
  const { user, points } = useUserStore();
  const { getStampCount } = usePassportStore();
  const { 
    openModal, 
    isMuted, 
    toggleMute, 
    cameraMode, 
    cycleCameraMode, 
    playerWorldPos, 
    playerYaw,
    nearbyRidePrompt,
    activeRideState,
  } = useGameStore();
  const { presenceCount } = useMultiplayerStore();

  const handleEmote = (emote: string) => {
    sendPlayerEmote(emote);
    if (emote === 'clap') {
      soundManager.playDrum();
    } else {
      soundManager.playPop();
    }
  };

  const handleToggleRide = () => {
    window.dispatchEvent(new CustomEvent('fair-toggle-ride'));
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-3 sm:p-4 select-none">
      {/* Top Bar & Minimap Section */}
      <div className="flex flex-col gap-2 w-full">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-2 w-full">
          {/* Left: Brand & User Identity */}
          <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 bg-stone-950/80 backdrop-blur-md p-1.5 sm:p-2 pl-3 rounded-2xl border border-amber-500/30 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-xl">🪔</span>
              <div className="hidden sm:block">
                <h1 className="text-xs font-black uppercase tracking-wider text-amber-200">
                  Kerala Fair
                </h1>
                <p className="text-[10px] text-amber-400/80 font-malayalam leading-none">
                  കലാമേള
                </p>
              </div>
            </div>

            <div className="h-5 w-px bg-stone-800" />

            {/* User Profile Pill */}
            <button
              onClick={() => openModal('auth')}
              className="flex items-center gap-2 py-1 px-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 text-xs text-stone-200 transition-colors"
              title="Edit Identity"
            >
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ backgroundColor: user?.avatarColor || '#E11D48' }}
              />
              <span className="font-semibold max-w-[90px] sm:max-w-[130px] truncate">
                {user?.displayName || 'Guest'}
              </span>
            </button>
          </div>

          {/* Right: Stats & Navigation Actions */}
          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
            {/* Palm-Leaf Passport Button */}
            <button
              onClick={() => openModal('passport')}
              className="flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-xl bg-gradient-to-r from-amber-900/95 to-amber-950/95 hover:from-amber-800 border-2 border-amber-400/90 text-amber-200 text-xs sm:text-sm font-black shadow-lg transition-all active:scale-95 animate-pulse"
              title="Nammude Naadu Palm-Leaf Passport (നമ്മുടെ നാട് പാസ്പോർട്ട്)"
            >
              <span className="text-sm">📜</span>
              <span>{getStampCount()}/6</span>
              <span className="hidden md:inline font-malayalam text-[10px] text-amber-300 font-bold">പാസ്പോർട്ട്</span>
            </button>

            {/* Points Pill */}
            <button
              onClick={() => openModal('shop')}
              className="flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-xl bg-gradient-to-r from-amber-950/90 to-stone-950/90 hover:from-amber-900/90 border border-amber-500/40 text-amber-300 text-xs sm:text-sm font-bold shadow-md transition-all"
              title="Fair Points (Click to open Souvenir Shop)"
            >
              <Sparkles size={16} className="text-amber-400 shrink-0" />
              <span>{points} pts</span>
            </button>

            {/* Live Presence Badge */}
            <button
              onClick={() => openModal('visitors')}
              className="flex items-center gap-1.5 py-1.5 px-2 sm:px-2.5 rounded-xl bg-stone-950/80 hover:bg-stone-900 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shadow-md transition-all"
              title="Live Online Visitors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden xs:inline">{presenceCount}</span>
              <Users size={15} />
            </button>

            {/* Guestbook Button */}
            <button
              onClick={() => openModal('guestbook')}
              className="p-2 rounded-xl bg-stone-950/80 hover:bg-stone-900 border border-stone-700 text-stone-300 hover:text-amber-300 transition-colors shadow-md"
              title="Guestbook (സന്ദർശക ഡയറി)"
            >
              <BookOpen size={16} />
            </button>

            {/* Leaderboard Button */}
            <button
              onClick={() => openModal('leaderboard')}
              className="p-2 rounded-xl bg-stone-950/80 hover:bg-stone-900 border border-stone-700 text-stone-300 hover:text-amber-300 transition-colors shadow-md"
              title="Ride Leaderboard"
            >
              <Trophy size={16} />
            </button>

            {/* Camera View Switcher Button */}
            <button
              onClick={cycleCameraMode}
              className="flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-xl bg-stone-950/80 hover:bg-stone-900 border border-amber-500/40 text-amber-300 text-xs font-semibold shadow-md transition-all active:scale-95"
              title={`Current View: ${CAMERA_MODE_CONFIG[cameraMode].label} — Click or press [V] to switch`}
            >
              <span className="text-sm">{CAMERA_MODE_CONFIG[cameraMode].icon}</span>
              <span className="hidden sm:inline font-bold">{CAMERA_MODE_CONFIG[cameraMode].label}</span>
              <span className="text-[10px] text-amber-400/60 font-mono hidden md:inline">[V]</span>
            </button>

            {/* Screenshot Souvenir Button */}
            <button
              onClick={() => openModal('screenshot')}
              className="p-2 rounded-xl bg-stone-950/80 hover:bg-stone-900 border border-stone-700 text-stone-300 hover:text-amber-300 transition-colors shadow-md"
              title="Souvenir Photo Mode"
            >
              <Camera size={16} />
            </button>

            {/* Audio Mute Button */}
            <button
              onClick={toggleMute}
              className="p-2 rounded-xl bg-stone-950/80 hover:bg-stone-900 border border-stone-700 text-stone-300 hover:text-amber-300 transition-colors shadow-md"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>

        {/* Live OpenStreetMap Minimap Widget (Top Right) */}
        <div className="flex justify-end w-full">
          <OSMMinimap playerPos={playerWorldPos} playerYaw={playerYaw} />
        </div>
      </div>

      {/* Aerial View Banner Toast */}
      {cameraMode === 'aerial' && (
        <div className="pointer-events-auto mx-auto mt-2 py-1.5 px-4 rounded-full bg-amber-950/90 border border-amber-500/50 backdrop-blur-md shadow-2xl flex items-center gap-2 text-xs text-amber-200 animate-fadeIn">
          <span>🦅</span>
          <span className="font-semibold text-amber-300">Aerial Drone View:</span>
          <span className="text-stone-300">Viewing the whole fair grounds from above! Drag mouse to orbit 360°.</span>
          <button
            onClick={cycleCameraMode}
            className="ml-2 px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold border border-amber-500/30"
          >
            Next View [V]
          </button>
        </div>
      )}

      {/* Interactive Ride Boarding Proximity Banner */}
      {nearbyRidePrompt && !activeRideState.isRiding && (
        <div className="pointer-events-auto mx-auto mb-2 py-2 px-4 rounded-2xl bg-gradient-to-r from-amber-950/95 via-stone-950/95 to-amber-950/95 border-2 border-amber-500/80 backdrop-blur-md shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="text-2xl animate-pulse">🎡</span>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-amber-300">Board Attraction</span>
              <span className="text-[10px] text-amber-400 font-malayalam">({nearbyRidePrompt.malayalamName})</span>
            </div>
            <span className="text-sm font-black text-white">{nearbyRidePrompt.rideName}</span>
          </div>
          <button
            onClick={handleToggleRide}
            className="ml-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs shadow-lg transition-transform active:scale-95 flex items-center gap-1.5"
            title="Press [E] or Click to Ride"
          >
            <span className="bg-stone-950 text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-mono">[E]</span>
            <span>RIDE NOW</span>
          </button>
        </div>
      )}

      {/* Active Riding Status & Dismount Bar */}
      {activeRideState.isRiding && (
        <div className="pointer-events-auto mx-auto mb-2 py-2 px-5 rounded-2xl bg-gradient-to-r from-rose-950/95 via-stone-950/95 to-rose-950/95 border-2 border-rose-500/80 backdrop-blur-md shadow-2xl flex items-center gap-4 animate-fadeIn">
          <span className="text-2xl animate-spin">🎡</span>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">Currently Riding</span>
            <span className="text-sm font-black text-white">{activeRideState.rideName}</span>
          </div>
          <button
            onClick={handleToggleRide}
            className="ml-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs shadow-lg transition-transform active:scale-95 flex items-center gap-1.5"
            title="Press [E] or Click to Exit Ride"
          >
            <span className="bg-stone-950 text-rose-300 px-1.5 py-0.5 rounded text-[10px] font-mono">[E]</span>
            <span>DISMOUNT / ഇറങ്ങുക</span>
          </button>
        </div>
      )}

      {/* Bottom Bar: Emote Quick Bar & Zone Prompt */}
      <div className="flex items-end justify-between w-full">
        {/* Emote Quick Bar */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 bg-stone-950/85 backdrop-blur-md rounded-2xl border border-amber-500/30 shadow-xl">
          <button
            onClick={() => handleEmote('wave')}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-900 hover:bg-amber-950 text-lg transition-transform active:scale-90"
            title="Wave"
          >
            👋
          </button>
          <button
            onClick={() => handleEmote('clap')}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-900 hover:bg-amber-950 text-lg transition-transform active:scale-90"
            title="Chenda Clap"
          >
            👏
          </button>
          <button
            onClick={() => handleEmote('sparkle')}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-900 hover:bg-amber-950 text-lg transition-transform active:scale-90"
            title="Sparkle Cheer"
          >
            ✨
          </button>
          <button
            onClick={() => handleEmote('namaste')}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-900 hover:bg-amber-950 text-lg transition-transform active:scale-90"
            title="Namaste Greeting"
          >
            🙏
          </button>
        </div>

        {/* Quick Zone Shortcuts */}
        <div className="pointer-events-auto hidden md:flex items-center gap-2">
          <button
            onClick={() => openModal('shop')}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-stone-950/80 hover:bg-stone-900 border border-stone-700/80 text-xs font-semibold text-stone-200 transition-colors shadow-lg"
          >
            <ShoppingBag size={14} className="text-amber-400" />
            Shops
          </button>
          <button
            onClick={() => openModal('foodcourt')}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-stone-950/80 hover:bg-stone-900 border border-stone-700/80 text-xs font-semibold text-stone-200 transition-colors shadow-lg"
          >
            <Utensils size={14} className="text-emerald-400" />
            Food Court
          </button>
          <button
            onClick={() => openModal('passport')}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-950/90 to-amber-900/90 hover:from-amber-800 border border-amber-500/60 text-xs font-bold text-amber-200 transition-colors shadow-lg"
          >
            <span className="text-sm">📜</span>
            <span>നമ്മുടെ നാട് (Trail)</span>
          </button>
          <button
            onClick={() => openModal('ride')}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-stone-950/80 hover:bg-stone-900 border border-stone-700/80 text-xs font-semibold text-stone-200 transition-colors shadow-lg"
          >
            <span className="text-sm">🎡</span>
            Rides (രാട്ടിനം)
          </button>
        </div>
      </div>
    </div>
  );
};
