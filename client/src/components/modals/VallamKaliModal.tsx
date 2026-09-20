import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { usePassportStore } from '../../store/usePassportStore';
import { useUserStore } from '../../store/useUserStore';
import { soundManager } from '../../utils/audio';
import { X, Trophy, Sparkles, Volume2, Award } from 'lucide-react';

export const VallamKaliModal: React.FC = () => {
  const { closeModal } = useGameStore();
  const { awardStamp } = usePassportStore();
  const { addPoints } = useUserStore();

  const [gameState, setGameState] = useState<'ready' | 'racing' | 'finished'>('ready');
  const [distance, setDistance] = useState(0); // 0 to 500 meters
  const [speed, setSpeed] = useState(0); // km/h
  const [syncMeter, setSyncMeter] = useState(80); // 0 to 100%
  const [expectedSide, setExpectedSide] = useState<'left' | 'right'>('left');
  const [beatMarker, setBeatMarker] = useState(0); // 0 to 100%
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);
  const [raceTime, setRaceTime] = useState(0);

  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  // Stroke handling
  const handleStroke = (side: 'left' | 'right') => {
    if (gameState !== 'racing') return;

    const isCorrectSide = side === expectedSide;
    const isPerfectTiming = beatMarker >= 40 && beatMarker <= 60;
    const isGoodTiming = beatMarker >= 25 && beatMarker <= 75;

    soundManager.playPop();

    if (isCorrectSide && (isPerfectTiming || isGoodTiming)) {
      const boost = isPerfectTiming ? 4.5 : 2.5;
      setSpeed((prev) => Math.min(32, prev + boost));
      setSyncMeter((prev) => Math.min(100, prev + 6));
      setStreak((prev) => prev + 1);
      setExpectedSide(side === 'left' ? 'right' : 'left');

      if (isPerfectTiming) {
        soundManager.playDrum();
        setFeedback({ text: '🔥 PERFECT STROKE! (അടി പൊളി)', color: 'text-amber-400' });
      } else {
        setFeedback({ text: '✨ GOOD STROKE! (നല്ല താളം)', color: 'text-emerald-400' });
      }
    } else {
      // Missed rhythm
      setSpeed((prev) => Math.max(4, prev - 3));
      setSyncMeter((prev) => Math.max(20, prev - 12));
      setStreak(0);
      setFeedback({ text: '⚠️ MISSED BEAT! (താളം തെറ്റി)', color: 'text-rose-400' });
    }

    setTimeout(() => setFeedback(null), 600);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'a' || key === 'arrowleft') handleStroke('left');
      if (key === 'd' || key === 'arrowright') handleStroke('right');
      if (key === ' ' || key === 'space') handleStroke(expectedSide);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, expectedSide, beatMarker]);

  // Race physics and rhythm cycle loop
  useEffect(() => {
    if (gameState !== 'racing') return;

    const updateLoop = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      // Update rhythm marker oscillation
      setBeatMarker((prev) => (prev + dt * 140) % 100);

      // Advance boat position based on speed
      setDistance((prevDist) => {
        const nextDist = prevDist + speed * dt * 2.2;
        if (nextDist >= 500) {
          // Race finished!
          setGameState('finished');
          awardStamp('water');
          addPoints(250);
          soundManager.playSuccess();
          return 500;
        }
        return nextDist;
      });

      // Natural water friction drag
      setSpeed((prev) => Math.max(5, prev - dt * 2.0));
      setRaceTime((prev) => prev + dt);

      requestRef.current = requestAnimationFrame(updateLoop);
    };

    lastTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState, speed]);

  const startRace = () => {
    soundManager.playSuccess();
    setGameState('racing');
    setDistance(0);
    setSpeed(12);
    setSyncMeter(85);
    setStreak(0);
    setRaceTime(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-stone-900 via-sky-950/60 to-stone-950 border-2 border-sky-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sky-500/30 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚣</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-sky-200 tracking-wide uppercase">
                  Vallam Kali Snake Boat Race
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono text-xs font-bold border border-sky-500/40">
                  💧 ജലം ചലഞ്ച്
                </span>
              </div>
              <p className="text-xs text-sky-400/80 font-malayalam">
                ചുണ്ടൻ വള്ളം കളി · താളത്തിൽ തുഴയൂ
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

        {/* Ready State Screen */}
        {gameState === 'ready' && (
          <div className="py-6 flex flex-col items-center text-center gap-4">
            <div className="p-4 rounded-3xl bg-sky-950/80 border border-sky-500/40 max-w-md">
              <span className="text-4xl mb-2 inline-block">🏁</span>
              <h3 className="text-sm font-bold text-sky-200 mb-1">How to Row the Chundan Vallam:</h3>
              <ul className="text-xs text-stone-300 space-y-1.5 text-left list-disc list-inside">
                <li>Alternate strokes: Press <strong>[A]</strong> for Left oar and <strong>[D]</strong> for Right oar.</li>
                <li>Time your stroke when the marker hits the green <strong>[BEAT ZONE]</strong>.</li>
                <li>Keep the team rhythm sync above 80% to surge past 30 km/h!</li>
                <li>Reach the 500m finish line to earn the <strong>💧 ജലം</strong> Passport Stamp!</li>
              </ul>
            </div>

            <button
              onClick={startRace}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-sm tracking-wider uppercase shadow-xl transition-transform active:scale-95"
            >
              START RACE / വള്ളംകളി തുടങ്ങൂ 🏁
            </button>
          </div>
        )}

        {/* Racing State Screen */}
        {gameState === 'racing' && (
          <div className="flex flex-col gap-4">
            {/* Race Stats Bar */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-stone-950/80 border border-sky-500/30 flex flex-col items-center">
                <span className="text-[10px] text-stone-400 uppercase font-bold">Distance</span>
                <span className="text-base font-black text-sky-300 font-mono">
                  {Math.floor(distance)}m / 500m
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-950/80 border border-sky-500/30 flex flex-col items-center">
                <span className="text-[10px] text-stone-400 uppercase font-bold">Speed</span>
                <span className="text-base font-black text-amber-300 font-mono">
                  {speed.toFixed(1)} km/h
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-950/80 border border-sky-500/30 flex flex-col items-center">
                <span className="text-[10px] text-stone-400 uppercase font-bold">Team Sync</span>
                <span className="text-base font-black text-emerald-300 font-mono">
                  {Math.floor(syncMeter)}%
                </span>
              </div>
            </div>

            {/* Course Progress Bar */}
            <div className="w-full bg-stone-950 rounded-full h-3 p-0.5 border border-sky-500/40 relative">
              <div
                className="bg-gradient-to-r from-sky-500 to-blue-400 h-full rounded-full transition-all duration-100"
                style={{ width: `${(distance / 500) * 100}%` }}
              />
              <span className="absolute right-2 top-0 -translate-y-1/2 text-xs">🏁</span>
            </div>

            {/* Rhythm Beat Target Bar */}
            <div className="p-4 rounded-2xl bg-stone-950/90 border-2 border-sky-500/50 flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-sky-200">
                Hit When Marker Reaches Green Zone (അടുത്ത തുഴ: {expectedSide === 'left' ? 'LEFT [A]' : 'RIGHT [D]'})
              </span>

              {/* Beat Tracker Bar */}
              <div className="w-full h-8 bg-stone-900 rounded-xl relative overflow-hidden border border-stone-700 flex items-center">
                {/* Target Perfect Zone in Center */}
                <div className="absolute left-[38%] right-[38%] top-0 bottom-0 bg-emerald-500/30 border-x-2 border-emerald-400 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-emerald-300 tracking-wider">BEAT</span>
                </div>

                {/* Oscillating Marker */}
                <div
                  className="absolute top-0 bottom-0 w-3 bg-amber-400 rounded-full shadow-lg transition-all duration-75 -translate-x-1/2"
                  style={{ left: `${beatMarker}%` }}
                />
              </div>

              {/* Feedback Toast */}
              {feedback && (
                <span className={`text-xs font-black animate-bounce ${feedback.color}`}>
                  {feedback.text}
                </span>
              )}
            </div>

            {/* Interactive Rowing Paddle Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-1">
              <button
                onClick={() => handleStroke('left')}
                className={`py-4 rounded-2xl font-black text-sm tracking-wider uppercase shadow-lg transition-transform active:scale-90 flex flex-col items-center gap-1 ${
                  expectedSide === 'left'
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-2 border-sky-300 animate-pulse'
                    : 'bg-stone-800 text-stone-400 border border-stone-700'
                }`}
              >
                <span>⬅️ ROW LEFT</span>
                <span className="text-[10px] font-mono opacity-80">[A] / [Left]</span>
              </button>

              <button
                onClick={() => handleStroke('right')}
                className={`py-4 rounded-2xl font-black text-sm tracking-wider uppercase shadow-lg transition-transform active:scale-90 flex flex-col items-center gap-1 ${
                  expectedSide === 'right'
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-2 border-sky-300 animate-pulse'
                    : 'bg-stone-800 text-stone-400 border border-stone-700'
                }`}
              >
                <span>ROW RIGHT ➡️</span>
                <span className="text-[10px] font-mono opacity-80">[D] / [Right]</span>
              </button>
            </div>
          </div>
        )}

        {/* Finished State Screen */}
        {gameState === 'finished' && (
          <div className="py-6 flex flex-col items-center text-center gap-4 animate-fadeIn">
            <span className="text-5xl animate-bounce">🏆</span>
            <div>
              <h3 className="text-lg font-black text-amber-300 uppercase tracking-wide">
                Vallam Kali Victory!
              </h3>
              <p className="text-xs text-stone-300">
                You crossed the 500m finish line in <strong>{raceTime.toFixed(1)}s</strong>!
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-amber-950/80 border border-amber-500/50 flex items-center gap-3">
              <Award size={28} className="text-amber-400 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-bold text-amber-200">💧 ജലം (Water) Stamp Awarded!</p>
                <p className="text-[10px] text-amber-300/80">+250 Fair Points added to your profile</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={startRace}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-transform active:scale-95"
              >
                Race Again
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
