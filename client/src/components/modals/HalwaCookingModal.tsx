import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { usePassportStore } from '../../store/usePassportStore';
import { useUserStore } from '../../store/useUserStore';
import { soundManager } from '../../utils/audio';
import { X, Award, Flame, RotateCw, Sparkles } from 'lucide-react';

export const HalwaCookingModal: React.FC = () => {
  const { closeModal } = useGameStore();
  const { awardStamp, addItem } = usePassportStore();
  const { addPoints } = useUserStore();

  const [stirProgress, setStirProgress] = useState(0); // 0 to 100%
  const [viscosity, setViscosity] = useState(20); // 20 (liquid) to 100 (thick halwa)
  const [heatLevel, setHeatLevel] = useState(65); // %
  const [paddleAngle, setPaddleAngle] = useState(0);
  const [addedCashews, setAddedCashews] = useState(false);
  const [addedGhee, setAddedGhee] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const handleStir = () => {
    if (isFinished) return;
    soundManager.playPop();

    setPaddleAngle((a) => (a + 45) % 360);
    setStirProgress((p) => {
      const next = p + 4.5;
      if (next >= 100 && addedCashews && addedGhee) {
        setIsFinished(true);
        awardStamp('community');
        addItem('halwaBoxes', 2);
        addPoints(250);
        soundManager.playSuccess();
        return 100;
      }
      return Math.min(100, next);
    });

    setViscosity((v) => Math.min(100, v + 3.5));
  };

  const handleAddGhee = () => {
    if (addedGhee) return;
    soundManager.playPop();
    setAddedGhee(true);
    setStirProgress((p) => Math.min(100, p + 15));
  };

  const handleAddCashews = () => {
    if (addedCashews) return;
    soundManager.playPop();
    setAddedCashews(true);
    setStirProgress((p) => Math.min(100, p + 15));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-stone-900 via-amber-950/60 to-stone-950 border-2 border-orange-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-orange-500/30 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🥘</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-amber-200 tracking-wide uppercase">
                  Live Kozhikodan Halwa Cauldron
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-mono text-xs font-bold border border-orange-500/40">
                  🍛 കൂട്ടായ്മ
                </span>
              </div>
              <p className="text-xs text-amber-400/80 font-malayalam">
                വലിയ വെങ്കല ഉരുളി · കോഴിക്കോടൻ കറുത്ത ഹൽവ
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

        {/* Bronze Uruli Cauldron Simulation */}
        <div className="relative h-56 bg-gradient-to-b from-stone-950 to-amber-950/90 rounded-2xl border border-amber-600/40 flex items-center justify-center overflow-hidden">
          {/* Glowing Firewood Embers Below Cauldron */}
          <div className="absolute bottom-2 flex items-center gap-2">
            <Flame size={22} className="text-red-500 animate-bounce" />
            <Flame size={28} className="text-orange-500 animate-pulse" />
            <Flame size={22} className="text-yellow-500 animate-bounce" />
          </div>

          {/* Giant Bronze Uruli Cauldron Ring */}
          <div className="relative w-48 h-48 rounded-full border-8 border-amber-700 bg-gradient-to-br from-amber-950 via-stone-950 to-amber-900 shadow-2xl flex items-center justify-center">
            {/* Bubbling Halwa Mass inside */}
            <div
              className="w-36 h-36 rounded-full transition-all duration-300 shadow-inner flex items-center justify-center relative overflow-hidden"
              style={{
                backgroundColor: viscosity > 70 ? '#1C120C' : '#451A03',
              }}
            >
              {/* Halwa Glossy Swirl */}
              <div
                className="w-full h-full rounded-full opacity-40 bg-gradient-to-tr from-transparent via-amber-400 to-transparent"
                style={{ transform: `rotate(${paddleAngle}deg)` }}
              />

              {/* Cashew nuts toppings visual */}
              {addedCashews && (
                <div className="absolute inset-0 flex items-center justify-around p-4 text-xs">
                  <span>🥜</span>
                  <span>🥜</span>
                  <span>🥜</span>
                </div>
              )}

              {/* Wooden Stirring Paddle (തുടുപ്പ്) */}
              <div
                className="absolute w-6 h-32 bg-amber-800 rounded-lg border border-amber-950 shadow-2xl transition-transform duration-100 origin-center"
                style={{ transform: `rotate(${paddleAngle}deg)` }}
              />
            </div>
          </div>
        </div>

        {/* Cooking Controls & Progress */}
        {!isFinished ? (
          <div className="flex flex-col gap-3">
            {/* Ingredients & Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleAddGhee}
                disabled={addedGhee}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                  addedGhee
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                    : 'bg-stone-900 border-amber-500/40 text-amber-200 hover:bg-stone-800'
                }`}
              >
                <span>🧈 Pure Desi Ghee (നെയ്യ്)</span>
                <span>{addedGhee ? '✓ Added' : '+ Add'}</span>
              </button>

              <button
                onClick={handleAddCashews}
                disabled={addedCashews}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                  addedCashews
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                    : 'bg-stone-900 border-amber-500/40 text-amber-200 hover:bg-stone-800'
                }`}
              >
                <span>🥜 Roasted Cashews (കശുവണ്ടി)</span>
                <span>{addedCashews ? '✓ Added' : '+ Add'}</span>
              </button>
            </div>

            {/* Stirring Progress Bar */}
            <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex flex-col gap-1">
              <div className="flex justify-between text-xs text-stone-300 font-bold">
                <span>Halwa Thickness & Cooking</span>
                <span className="text-amber-300 font-mono">{Math.floor(stirProgress)}%</span>
              </div>
              <div className="w-full bg-stone-900 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-600 to-orange-500 h-full rounded-full transition-all duration-75"
                  style={{ width: `${stirProgress}%` }}
                />
              </div>
            </div>

            {/* Circular Stir Paddle Button */}
            <button
              onClick={handleStir}
              className="py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-sm tracking-wider uppercase shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <RotateCw size={18} />
              <span>STIR THE BRONZE URULI / ഉരുളി ഇളക്കൂ 🥘</span>
            </button>
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center text-center gap-3 animate-fadeIn">
            <span className="text-4xl animate-bounce">🥘</span>
            <div>
              <h3 className="text-base font-black text-amber-300 uppercase">
                Authentic Kozhikodan Halwa Complete!
              </h3>
              <p className="text-xs text-stone-300">
                You stirred the giant bronze Uruli to perfection and packed 2 fresh boxes of black halwa in banana leaves!
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-amber-950/80 border border-amber-500/50 flex items-center gap-3">
              <Award size={28} className="text-amber-400 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-bold text-amber-200">🍛 കൂട്ടായ്മ (Community) Stamp Awarded!</p>
                <p className="text-[10px] text-amber-300/80">+250 Fair Points & +2 Banana-Leaf Halwa Boxes</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={() => {
                  setIsFinished(false);
                  setStirProgress(0);
                  setViscosity(20);
                  setAddedGhee(false);
                  setAddedCashews(false);
                }}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-transform active:scale-95"
              >
                Stir Another Batch
              </button>
              <button
                onClick={closeModal}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-black shadow-lg transition-transform active:scale-95"
              >
                Continue Fair Exploration 🎡
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
