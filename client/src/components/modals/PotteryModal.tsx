import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { usePassportStore } from '../../store/usePassportStore';
import { useUserStore } from '../../store/useUserStore';
import { soundManager } from '../../utils/audio';
import { X, Flame, Sparkles, Award } from 'lucide-react';

export type PotteryItemType = 'nilavilakku' | 'uruli' | 'kindi' | 'claypot';

export const PotteryModal: React.FC = () => {
  const { closeModal } = useGameStore();
  const { awardStamp, addItem } = usePassportStore();
  const { addPoints } = useUserStore();

  const [selectedItem, setSelectedItem] = useState<PotteryItemType>('nilavilakku');
  const [wheelSpeed, setWheelSpeed] = useState(60);
  const [fingerHeight, setFingerHeight] = useState(50);
  const [handPressure, setHandPressure] = useState(40);
  const [isFiring, setIsFiring] = useState(false);
  const [isFired, setIsFired] = useState(false);

  // Compute live clay profile deformation curve
  const baseWidth = selectedItem === 'uruli' ? 140 : selectedItem === 'kindi' ? 70 : 90;
  const topWidth = selectedItem === 'nilavilakku' ? 60 : selectedItem === 'uruli' ? 160 : 40;
  const dynamicMidWidth = baseWidth + (handPressure - 50) * 0.8;
  const dynamicHeight = 120 + (fingerHeight - 50) * 0.9;

  const handleFireKiln = () => {
    soundManager.playSuccess();
    setIsFiring(true);
    setTimeout(() => {
      setIsFiring(false);
      setIsFired(true);
      awardStamp('earth');
      addItem('clayLamps', 1);
      addPoints(250);
    }, 1200);
  };

  const handleReset = () => {
    setIsFired(false);
    setIsFiring(false);
    setWheelSpeed(60);
    setFingerHeight(50);
    setHandPressure(40);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-stone-900 via-amber-950/60 to-stone-950 border-2 border-amber-600/60 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-600/30 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏺</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-amber-200 tracking-wide uppercase">
                  Pottery Wheel & Lamp Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-600/20 text-amber-300 font-mono text-xs font-bold border border-amber-600/40">
                  🏺 മണ്ണ് ചലഞ്ച്
                </span>
              </div>
              <p className="text-xs text-amber-400/80 font-malayalam">
                കുലാല ചക്രം · നിലവിളക്കും മൺപാത്രങ്ങളും
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

        {/* Item Selection Tabs */}
        {!isFired && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'nilavilakku', label: 'Nilavilakku', icon: '🪔', mal: 'നിലവിളക്ക്' },
              { id: 'uruli', label: 'Uruli', icon: '🥘', mal: 'ഉരുളി' },
              { id: 'kindi', label: 'Kindi', icon: '🫖', mal: 'കിണ്ടി' },
              { id: 'claypot', label: 'Clay Pot', icon: '🏺', mal: 'മൺകലം' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  soundManager.playPop();
                  setSelectedItem(item.id as any);
                }}
                className={`p-2 rounded-xl flex flex-col items-center gap-0.5 border text-xs font-bold transition-all ${
                  selectedItem === item.id
                    ? 'bg-amber-600/30 border-amber-400 text-amber-200 shadow-md scale-105'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
                <span className="text-[9px] font-malayalam opacity-80 leading-none">{item.mal}</span>
              </button>
            ))}
          </div>
        )}

        {/* Interactive Potter's Wheel Canvas / SVG Studio */}
        <div className="relative h-48 sm:h-56 bg-gradient-to-b from-stone-950 to-stone-900 rounded-2xl border border-amber-600/30 flex items-center justify-center overflow-hidden">
          {/* Firing Kiln Flames Effect */}
          {isFiring && (
            <div className="absolute inset-0 bg-gradient-to-t from-orange-600/60 via-red-600/40 to-transparent flex items-center justify-center animate-pulse z-20">
              <span className="text-4xl animate-bounce">🔥 BAKING IN KILN... 🔥</span>
            </div>
          )}

          {/* Rotating Potter's Wheel Base */}
          <div
            className="absolute bottom-4 w-48 h-6 bg-stone-700 rounded-full border-2 border-stone-500 shadow-2xl animate-spin"
            style={{ animationDuration: `${Math.max(0.4, 2.5 - wheelSpeed * 0.03)}s` }}
          />

          {/* Sculpted Vessel SVG Profile */}
          <svg
            width="220"
            height="180"
            viewBox="0 0 220 180"
            className="z-10 drop-shadow-2xl transition-all duration-150"
          >
            <defs>
              <linearGradient id="clayGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={isFired ? '#C85A32' : '#8D5B4C'} />
                <stop offset="50%" stopColor={isFired ? '#F59E0B' : '#B87A68'} />
                <stop offset="100%" stopColor={isFired ? '#9A3412' : '#6E4236'} />
              </linearGradient>
            </defs>

            {/* Profile Path */}
            <path
              d={`M ${110 - baseWidth / 2} 150 
                  Q ${110 - dynamicMidWidth / 2} ${150 - dynamicHeight / 2} ${110 - topWidth / 2} ${150 - dynamicHeight}
                  L ${110 + topWidth / 2} ${150 - dynamicHeight}
                  Q ${110 + dynamicMidWidth / 2} ${150 - dynamicHeight / 2} ${110 + baseWidth / 2} 150
                  Z`}
              fill="url(#clayGradient)"
              stroke={isFired ? '#FFD700' : '#4A2A20'}
              strokeWidth="2"
            />

            {/* Top Rim */}
            <ellipse
              cx="110"
              cy={150 - dynamicHeight}
              rx={topWidth / 2}
              ry="6"
              fill={isFired ? '#F59E0B' : '#A36856'}
              stroke={isFired ? '#FFD700' : '#4A2A20'}
              strokeWidth="1.5"
            />
          </svg>
        </div>

        {/* Sliders & Shaping Controls */}
        {!isFired ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-stone-300 font-bold">
                  <span>Wheel Speed</span>
                  <span className="text-amber-300 font-mono">{wheelSpeed}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={wheelSpeed}
                  onChange={(e) => setWheelSpeed(Number(e.target.value))}
                  className="accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-stone-300 font-bold">
                  <span>Finger Height</span>
                  <span className="text-amber-300 font-mono">{fingerHeight}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={fingerHeight}
                  onChange={(e) => setFingerHeight(Number(e.target.value))}
                  className="accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-stone-300 font-bold">
                  <span>Wall Pressure</span>
                  <span className="text-amber-300 font-mono">{handPressure}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={handPressure}
                  onChange={(e) => setHandPressure(Number(e.target.value))}
                  className="accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={handleFireKiln}
              disabled={isFiring}
              className="py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-sm tracking-wider uppercase shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Flame size={18} />
              <span>Fire in Kiln / ചൂളയിൽ ചുട്ടെടുക്കൂ 🏺</span>
            </button>
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center text-center gap-3 animate-fadeIn">
            <span className="text-4xl animate-bounce">🪔</span>
            <div>
              <h3 className="text-base font-black text-amber-300 uppercase">
                Terracotta Nilavilakku Crafted!
              </h3>
              <p className="text-xs text-stone-300">
                Your lamp has been fired and added to your Craft Bag. You can now place it in the Nalukettu pavilion!
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-amber-950/80 border border-amber-500/50 flex items-center gap-3">
              <Award size={28} className="text-amber-400 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-bold text-amber-200">🏺 മണ്ണ് (Earth) Stamp Awarded!</p>
                <p className="text-[10px] text-amber-300/80">+250 Fair Points & +1 Sacred Nilavilakku Lamp</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-transform active:scale-95"
              >
                Sculpt Another Vessel
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
