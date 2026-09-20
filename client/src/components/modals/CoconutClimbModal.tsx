import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { usePassportStore } from '../../store/usePassportStore';
import { useUserStore } from '../../store/useUserStore';
import { soundManager } from '../../utils/audio';
import { X, Award, Sparkles, Wind, ChevronUp } from 'lucide-react';

export const CoconutClimbModal: React.FC = () => {
  const { closeModal } = useGameStore();
  const { awardStamp, addItem } = usePassportStore();
  const { addPoints } = useUserStore();

  const [climbHeight, setClimbHeight] = useState(0); // 0 to 12 meters
  const [balance, setBalance] = useState(50); // 0 (left) to 100 (right)
  const [windForce, setWindForce] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [stepPhase, setStepPhase] = useState<'push_legs' | 'pull_rope'>('push_legs');
  const [climbTime, setClimbTime] = useState(0);

  const loopRef = useRef<number>(0);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup' || key === ' ') {
        handleClimbStep();
      }
      if (key === 'a' || key === 'arrowleft') {
        handleLean('left');
      }
      if (key === 'd' || key === 'arrowright') {
        handleLean('right');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stepPhase, isFinished]);

  // Wind and balance simulation loop
  useEffect(() => {
    if (isFinished) return;

    const updateLoop = () => {
      setClimbTime((t) => t + 0.016);

      // Oscillating wind gusts
      const wind = Math.sin(Date.now() * 0.002) * 0.4;
      setWindForce(wind);

      setBalance((b) => {
        const next = b + wind;
        // If balance goes out of bounds (>90 or <10), slip slightly
        if (next < 15 || next > 85) {
          setClimbHeight((h) => Math.max(0, h - 0.02));
        }
        return Math.max(10, Math.min(90, next));
      });

      loopRef.current = requestAnimationFrame(updateLoop);
    };

    loopRef.current = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(loopRef.current);
  }, [isFinished]);

  const handleClimbStep = () => {
    if (isFinished) return;
    soundManager.playPop();

    if (stepPhase === 'push_legs') {
      setStepPhase('pull_rope');
      setClimbHeight((h) => {
        const next = h + 0.85;
        if (next >= 12.0) {
          setIsFinished(true);
          awardStamp('play');
          addItem('goldenCoconuts', 3);
          addPoints(250);
          soundManager.playSuccess();
          return 12.0;
        }
        return next;
      });
    } else {
      setStepPhase('push_legs');
      setClimbHeight((h) => {
        const next = h + 0.75;
        if (next >= 12.0) {
          setIsFinished(true);
          awardStamp('play');
          addItem('goldenCoconuts', 3);
          addPoints(250);
          soundManager.playSuccess();
          return 12.0;
        }
        return next;
      });
    }
  };

  const handleLean = (dir: 'left' | 'right') => {
    soundManager.playPop();
    setBalance((b) => (dir === 'left' ? Math.max(10, b - 12) : Math.min(90, b + 12)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-stone-900 via-emerald-950/60 to-stone-950 border-2 border-emerald-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌴</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-emerald-200 tracking-wide uppercase">
                  Coconut Climbing Sprint
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/40">
                  🌴 കളി ചലഞ്ച്
                </span>
              </div>
              <p className="text-xs text-emerald-400/80 font-malayalam">
                തളിപ്പറമ്പ് തെങ്ങുകയറ്റം · ഇളനീർ പറിക്കൂ
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

        {/* Vertical Palm Tree Simulation Stage */}
        <div className="relative h-56 bg-stone-950/90 rounded-2xl border border-emerald-500/30 flex items-center justify-center overflow-hidden">
          {/* Palm Fronds at the Top */}
          <div className="absolute top-1 text-4xl animate-pulse">🌴 🥥 🥥 🌴</div>

          {/* Vertical Palm Trunk */}
          <div className="w-8 h-full bg-gradient-to-r from-amber-900 via-amber-800 to-stone-900 rounded-md border-x border-amber-950 relative">
            {/* Climber Avatar Icon */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-emerald-500 border-2 border-white shadow-2xl flex items-center justify-center text-lg font-black transition-all duration-100"
              style={{
                bottom: `${(climbHeight / 12.0) * 78 + 5}%`,
                transform: `translateX(calc(-50% + ${(balance - 50) * 0.4}px))`,
              }}
            >
              🧗
            </div>
          </div>

          {/* Wind Gust Indicator */}
          <div className="absolute top-3 right-4 px-2.5 py-1 rounded-xl bg-stone-900 border border-stone-700 flex items-center gap-1 text-xs text-sky-300 font-mono">
            <Wind size={14} />
            <span>Wind: {windForce > 0 ? `+${(windForce * 10).toFixed(0)}` : (windForce * 10).toFixed(0)}</span>
          </div>

          {/* Height Marker */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 text-xs text-emerald-300 font-bold font-mono">
            <span>12m [Crown]</span>
            <span className="text-stone-500">8m</span>
            <span className="text-stone-500">4m</span>
            <span>0m [Ground]</span>
          </div>
        </div>

        {/* Meters & Controls */}
        {!isFinished ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Height Progress */}
              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex flex-col gap-1">
                <div className="flex justify-between text-xs text-stone-300 font-bold">
                  <span>Height Reached</span>
                  <span className="text-emerald-300 font-mono">{climbHeight.toFixed(1)}m / 12m</span>
                </div>
                <div className="w-full bg-stone-900 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-75"
                    style={{ width: `${(climbHeight / 12.0) * 100}%` }}
                  />
                </div>
              </div>

              {/* Balance Meter */}
              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex flex-col gap-1">
                <div className="flex justify-between text-xs text-stone-300 font-bold">
                  <span>Trunk Balance</span>
                  <span
                    className={`font-mono ${
                      balance >= 35 && balance <= 65 ? 'text-emerald-400' : 'text-red-400 font-bold'
                    }`}
                  >
                    {balance >= 35 && balance <= 65 ? 'Centered' : 'Leaning!'}
                  </span>
                </div>
                <div className="w-full bg-stone-900 h-2.5 rounded-full overflow-hidden relative">
                  <div
                    className="bg-gradient-to-r from-red-500 via-emerald-400 to-red-500 h-full rounded-full transition-all duration-75"
                    style={{ width: `${balance}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Interactive Climb & Lean Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleLean('left')}
                className="py-3.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-black text-xs uppercase shadow-md transition-transform active:scale-95"
              >
                ⬅️ LEAN LEFT [A]
              </button>

              <button
                onClick={handleClimbStep}
                className="py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-stone-950 font-black text-xs uppercase shadow-xl transition-transform active:scale-90 flex flex-col items-center gap-0.5"
              >
                <div className="flex items-center gap-1">
                  <ChevronUp size={16} />
                  <span>{stepPhase === 'push_legs' ? 'PUSH LEGS (തളപ്പ്)' : 'PULL ROPE (കയർ)'}</span>
                </div>
                <span className="text-[9px] font-mono opacity-80">[W] / [Space]</span>
              </button>

              <button
                onClick={() => handleLean('right')}
                className="py-3.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-black text-xs uppercase shadow-md transition-transform active:scale-95"
              >
                LEAN RIGHT ➡️ [D]
              </button>
            </div>
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center text-center gap-3 animate-fadeIn">
            <span className="text-4xl animate-bounce">🥥</span>
            <div>
              <h3 className="text-base font-black text-emerald-300 uppercase">
                Crown Reached! Golden Coconuts Harvested!
              </h3>
              <p className="text-xs text-stone-300">
                You sprinted up the 12-meter palm in <strong>{climbTime.toFixed(1)}s</strong> and plucked 3 King Coconuts!
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 flex items-center gap-3">
              <Award size={28} className="text-emerald-400 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-bold text-emerald-200">🌴 കളി (Play) Stamp Awarded!</p>
                <p className="text-[10px] text-emerald-300/80">+250 Fair Points & +3 Golden Elaneer Coconuts</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={() => {
                  setIsFinished(false);
                  setClimbHeight(0);
                  setBalance(50);
                  setClimbTime(0);
                }}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-transform active:scale-95"
              >
                Climb Again
              </button>
              <button
                onClick={closeModal}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-stone-950 text-xs font-black shadow-lg transition-transform active:scale-95"
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
