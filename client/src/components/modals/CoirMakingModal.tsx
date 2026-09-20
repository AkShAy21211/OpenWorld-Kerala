import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { usePassportStore } from '../../store/usePassportStore';
import { useUserStore } from '../../store/useUserStore';
import { soundManager } from '../../utils/audio';
import { X, Award, RotateCw, Sparkles } from 'lucide-react';

export const CoirMakingModal: React.FC = () => {
  const { closeModal } = useGameStore();
  const { awardStamp, addItem } = usePassportStore();
  const { addPoints } = useUserStore();

  const [isSpinning, setIsSpinning] = useState(false);
  const [ropeLength, setRopeLength] = useState(0); // 0 to 100 meters
  const [tension, setTension] = useState(50); // 0 to 100%
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const animRef = useRef<number>(0);

  useEffect(() => {
    if (isFinished) return;

    const loop = () => {
      if (isSpinning) {
        setWheelRotation((prev) => (prev + 12) % 360);
        setTension((prev) => Math.min(100, prev + 0.45));
        setRopeLength((prev) => {
          const next = prev + 0.35;
          if (next >= 100) {
            setIsFinished(true);
            setIsSpinning(false);
            awardStamp('craft');
            addItem('coirRopes', 1);
            addPoints(250);
            soundManager.playSuccess();
            return 100;
          }
          return next;
        });
      } else {
        setTension((prev) => Math.max(10, prev - 0.6));
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [isSpinning, isFinished]);

  const handlePointerDown = () => {
    soundManager.playPop();
    setIsSpinning(true);
  };

  const handlePointerUp = () => {
    setIsSpinning(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-stone-900 via-amber-950/60 to-stone-950 border-2 border-amber-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🥥</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-amber-200 tracking-wide uppercase">
                  Coir-Making Workshop
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/40">
                  🥥 കൈത്തൊഴിൽ
                </span>
              </div>
              <p className="text-xs text-amber-400/80 font-malayalam">
                കയർ റാട്ട് · സ്വർണ്ണ നാരുകൾ
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

        {/* Studio Animation Stage */}
        <div className="relative h-48 bg-stone-950/90 rounded-2xl border border-amber-500/30 flex items-center justify-between px-6 sm:px-12 overflow-hidden">
          {/* Spinning Ratt Flywheel */}
          <div className="flex flex-col items-center gap-1 z-10">
            <div
              className="w-24 h-24 rounded-full border-4 border-stone-600 bg-stone-800 shadow-xl flex items-center justify-center relative"
              style={{ transform: `rotate(${wheelRotation}deg)` }}
            >
              <div className="w-full h-1 bg-amber-600 absolute" />
              <div className="h-full w-1 bg-amber-600 absolute" />
              <div className="w-6 h-6 rounded-full bg-stone-950 border-2 border-amber-400" />
            </div>
            <span className="text-[10px] font-bold text-amber-300">കയർ റാട്ട് (Ratt)</span>
          </div>

          {/* Twisting Golden Coir Rope Strands */}
          <div className="flex-1 mx-4 h-6 relative flex flex-col justify-center gap-1">
            <div
              className="h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-600 rounded-full shadow-md"
              style={{
                transform: `scaleY(${tension > 75 ? 1.5 : tension < 30 ? 0.7 : 1})`,
                opacity: 0.9,
              }}
            />
            <div
              className="h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-700 rounded-full shadow-md"
              style={{
                transform: `scaleY(${tension > 75 ? 1.5 : tension < 30 ? 0.7 : 1})`,
                opacity: 0.9,
              }}
            />
          </div>

          {/* Raw Husk Trough Box */}
          <div className="flex flex-col items-center gap-1 z-10">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-amber-900 to-stone-900 border-2 border-amber-600 flex items-center justify-center p-2 shadow-xl">
              <span className="text-3xl">🥥</span>
            </div>
            <span className="text-[10px] font-bold text-amber-300">ചകിരി (Husk)</span>
          </div>
        </div>

        {/* Meters */}
        {!isFinished ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex flex-col gap-1">
                <div className="flex justify-between text-xs text-stone-300 font-bold">
                  <span>Rope Spun</span>
                  <span className="text-amber-300 font-mono">{Math.floor(ropeLength)}m / 100m</span>
                </div>
                <div className="w-full bg-stone-900 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-75"
                    style={{ width: `${ropeLength}%` }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex flex-col gap-1">
                <div className="flex justify-between text-xs text-stone-300 font-bold">
                  <span>Strand Tension</span>
                  <span
                    className={`font-mono ${
                      tension >= 40 && tension <= 75
                        ? 'text-emerald-400'
                        : tension > 75
                        ? 'text-red-400 font-black animate-pulse'
                        : 'text-amber-400'
                    }`}
                  >
                    {Math.floor(tension)}%
                  </span>
                </div>
                <div className="w-full bg-stone-900 h-2.5 rounded-full overflow-hidden relative">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-emerald-400 to-red-500 h-full rounded-full transition-all duration-75"
                    style={{ width: `${tension}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Spin Control Button */}
            <button
              onMouseDown={handlePointerDown}
              onMouseUp={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchEnd={handlePointerUp}
              className={`py-4 rounded-2xl font-black text-sm tracking-wider uppercase shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-2 ${
                isSpinning
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 scale-[0.98]'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950'
              }`}
            >
              <RotateCw size={18} className={isSpinning ? 'animate-spin' : ''} />
              <span>HOLD TO SPIN RATT WHEEL / റാട്ട് കറക്കൂ 🥥</span>
            </button>
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center text-center gap-3 animate-fadeIn">
            <span className="text-4xl animate-bounce">🧵</span>
            <div>
              <h3 className="text-base font-black text-amber-300 uppercase">
                Golden Coir Rope Spool Complete!
              </h3>
              <p className="text-xs text-stone-300">
                You spun 100 meters of high-tensile golden Kerala coir rope and added it to your Craft Bag!
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-amber-950/80 border border-amber-500/50 flex items-center gap-3">
              <Award size={28} className="text-amber-400 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-bold text-amber-200">🥥 കൈത്തൊഴിൽ (Craft) Stamp Awarded!</p>
                <p className="text-[10px] text-amber-300/80">+250 Fair Points & +1 Golden Coir Rope Spool</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={() => {
                  setIsFinished(false);
                  setRopeLength(0);
                  setTension(50);
                }}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-transform active:scale-95"
              >
                Spin More Rope
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
