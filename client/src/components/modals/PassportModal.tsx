import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { usePassportStore, STAMP_DETAILS, PassportStampType } from '../../store/usePassportStore';
import { useUserStore } from '../../store/useUserStore';
import { Sparkles, CheckCircle2, Lock, Flame, Trophy, Award, X } from 'lucide-react';
import { soundManager } from '../../utils/audio';

export const PassportModal: React.FC = () => {
  const { closeModal, openModal } = useGameStore();
  const { 
    stamps, 
    inventory, 
    placedLampsCount, 
    isFinaleUnlocked, 
    isFinaleActive, 
    triggerFinale, 
    placeLamp,
    awardStamp,
  } = usePassportStore();
  const { addPoints } = useUserStore();

  const stampKeys = Object.keys(STAMP_DETAILS) as PassportStampType[];
  const completedCount = stampKeys.filter((k) => stamps[k]).length;

  const handlePlaceLamp = () => {
    if (placeLamp()) {
      addPoints(50);
      soundManager.playSuccess();
    }
  };

  const handleStartActivity = (stampId: PassportStampType) => {
    soundManager.playPop();
    switch (stampId) {
      case 'water':
        openModal('vallamkali');
        break;
      case 'rhythm':
        openModal('chenda_rhythm');
        break;
      case 'earth':
        openModal('pottery');
        break;
      case 'craft':
        openModal('coir');
        break;
      case 'play':
        openModal('coconut_climb');
        break;
      case 'community':
        openModal('halwa');
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-stone-900 via-amber-950/40 to-stone-950 border-2 border-amber-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Palm Leaf Texture Header Accent */}
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📜</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-amber-200 tracking-wide uppercase">
                  Nammude Naadu Passport
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/40">
                  {completedCount}/6 STAMPS
                </span>
              </div>
              <p className="text-xs text-amber-400/80 font-malayalam">
                നമ്മുടെ നാട് സാംസ്കാരിക പാസ്പോർട്ട്
              </p>
            </div>
          </div>

          <button
            onClick={closeModal}
            className="p-1.5 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="my-4">
          <div className="w-full bg-stone-950 rounded-full h-3 p-0.5 border border-amber-500/30">
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500 shadow-md"
              style={{ width: `${(completedCount / 6) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-stone-400 mt-1.5 text-center">
            {completedCount === 6
              ? '🎉 All 6 Malayalam Cultural Stamps Collected! Grand Finale Unlocked!'
              : `Complete ${6 - completedCount} more hands-on activities to unlock the Grand Night Boat Race & Fireworks!`}
          </p>
        </div>

        {/* 6 Malayalam Stamp Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-1 my-1">
          {stampKeys.map((key) => {
            const info = STAMP_DETAILS[key];
            const isDone = stamps[key];

            return (
              <div
                key={key}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                  isDone
                    ? 'bg-gradient-to-r from-amber-950/70 to-stone-900/90 border-amber-500/70 shadow-lg'
                    : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-1.5 rounded-xl bg-stone-900 border border-amber-500/30">
                      {info.icon}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-amber-200">{info.title}</h4>
                      <p className="text-[10px] text-amber-400/90 font-malayalam">{info.malayalam}</p>
                    </div>
                  </div>

                  {isDone ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                      <CheckCircle2 size={13} />
                      Done
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-stone-500 text-xs font-bold bg-stone-900 px-2 py-0.5 rounded-full border border-stone-800">
                      <Lock size={12} />
                      Pending
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-stone-300 leading-snug">{info.description}</p>

                <div className="flex items-center justify-between pt-1 border-t border-stone-800/60">
                  <span className="text-[10px] text-amber-300/70 font-semibold">{info.activityName}</span>
                  <button
                    onClick={() => handleStartActivity(key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-transform active:scale-95 ${
                      isDone
                        ? 'bg-stone-800 hover:bg-stone-700 text-amber-200 border border-stone-700'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-md'
                    }`}
                  >
                    {isDone ? 'Play Again' : 'Enter Challenge'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Craft Inventory & Physical World Consequences */}
        <div className="mt-3 pt-3 border-t border-amber-500/30 flex flex-wrap items-center justify-between gap-3">
          {/* Inventory Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-stone-400 font-bold">Craft Bag:</span>
            <span className="px-2 py-1 rounded-xl bg-stone-900 border border-stone-700 text-xs text-amber-300 flex items-center gap-1">
              🥥 Coir: <strong>{inventory.coirRopes}</strong>
            </span>
            <span className="px-2 py-1 rounded-xl bg-stone-900 border border-stone-700 text-xs text-orange-300 flex items-center gap-1">
              🏺 Lamps: <strong>{inventory.clayLamps}</strong>
            </span>
            <span className="px-2 py-1 rounded-xl bg-stone-900 border border-stone-700 text-xs text-amber-200 flex items-center gap-1">
              🥘 Halwa: <strong>{inventory.halwaBoxes}</strong>
            </span>
          </div>

          {/* Place Lamp in Pavilion Action */}
          {inventory.clayLamps > 0 && (
            <button
              onClick={handlePlaceLamp}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-md transition-transform active:scale-95 flex items-center gap-1.5"
            >
              <Flame size={14} className="text-amber-300" />
              <span>Light Pavilion Lamp (+50 pts)</span>
            </button>
          )}
        </div>

        {/* Grand Finale Unlock Banner */}
        {completedCount === 6 && (
          <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-yellow-500/20 via-amber-500/30 to-yellow-500/20 border-2 border-yellow-400 shadow-xl flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎆</span>
              <div>
                <h3 className="text-xs font-black text-yellow-300 uppercase">Grand Night Finale Unlocked!</h3>
                <p className="text-[10px] text-amber-100">Uthrittathi Boat Race & Midnight Kerala Fireworks</p>
              </div>
            </div>
            <button
              onClick={() => {
                triggerFinale();
                closeModal();
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-stone-950 font-black text-xs shadow-lg transition-transform active:scale-95"
            >
              START CELEBRATION 🎆
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
