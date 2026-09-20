import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { usePassportStore } from '../../store/usePassportStore';
import { useUserStore } from '../../store/useUserStore';
import { soundManager } from '../../utils/audio';
import { X, Award, Sparkles, Flame } from 'lucide-react';

interface BeatNode {
  id: number;
  bol: 'THA' | 'KITA' | 'THOM' | 'TAKADIMI';
  malayalam: string;
  targetTime: number; // in seconds
  hit: boolean;
  missed: boolean;
}

const BOLS = [
  { key: 'THA', malayalam: 'താ', color: 'from-amber-500 to-red-600', keyHint: '1 / Q' },
  { key: 'KITA', malayalam: 'കിട', color: 'from-blue-500 to-indigo-600', keyHint: '2 / W' },
  { key: 'THOM', malayalam: 'തോം', color: 'from-emerald-500 to-teal-600', keyHint: '3 / E' },
  { key: 'TAKADIMI', malayalam: 'തകധിമി', color: 'from-purple-500 to-pink-600', keyHint: '4 / R' },
] as const;

export const ChendaRhythmModal: React.FC = () => {
  const { closeModal } = useGameStore();
  const { awardStamp } = usePassportStore();
  const { addPoints } = useUserStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [tempo, setTempo] = useState<'Pathikaalam' | 'Irandam' | 'Mukkalam'>('Pathikaalam');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeBeats, setActiveBeats] = useState<BeatNode[]>([]);

  const beatCounter = useRef(0);
  const gameTime = useRef(0);
  const lastSpawn = useRef(0);
  const animFrame = useRef(0);

  const handleStrike = (bol: 'THA' | 'KITA' | 'THOM' | 'TAKADIMI') => {
    soundManager.playDrum();

    const now = gameTime.current;
    // Find closest beat
    const targetBeat = activeBeats.find(
      (b) => !b.hit && !b.missed && Math.abs(b.targetTime - now) <= 0.45 && b.bol === bol
    );

    if (targetBeat) {
      const diff = Math.abs(targetBeat.targetTime - now);
      const isPerfect = diff < 0.18;

      targetBeat.hit = true;
      const pts = isPerfect ? 20 : 10;
      setScore((prev) => prev + pts);
      setCombo((prev) => {
        const next = prev + 1;
        setMaxCombo((m) => Math.max(m, next));
        if (next >= 20 && !isFinished) {
          setIsFinished(true);
          awardStamp('rhythm');
          addPoints(250);
          soundManager.playSuccess();
        }
        return next;
      });

      setFeedback(isPerfect ? '🔥 THAALAM PERFECT! (താളം അടിപൊളി)' : '✨ GOOD HIT! (നല്ല അടി)');
    } else {
      setCombo(0);
      setFeedback('⚠️ OFF BEAT (താളം തെറ്റി)');
    }

    setTimeout(() => setFeedback(null), 500);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === '1' || key === 'q') handleStrike('THA');
      if (key === '2' || key === 'w') handleStrike('KITA');
      if (key === '3' || key === 'e') handleStrike('THOM');
      if (key === '4' || key === 'r') handleStrike('TAKADIMI');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeBeats, isPlaying]);

  // Rhythm beat scheduler and motion loop
  useEffect(() => {
    if (!isPlaying || isFinished) return;

    const interval = tempo === 'Pathikaalam' ? 1.0 : tempo === 'Irandam' ? 0.7 : 0.45;

    const loop = (t: number) => {
      gameTime.current += 0.016;
      const now = gameTime.current;

      // Spawn next rhythmic beat
      if (now - lastSpawn.current >= interval) {
        lastSpawn.current = now;
        const randomBol = BOLS[Math.floor(Math.random() * BOLS.length)];
        const newBeat: BeatNode = {
          id: beatCounter.current++,
          bol: randomBol.key,
          malayalam: randomBol.malayalam,
          targetTime: now + 2.0, // Arrives in 2 seconds
          hit: false,
          missed: false,
        };
        setActiveBeats((prev) => [...prev.slice(-12), newBeat]);
      }

      // Mark missed beats
      setActiveBeats((prev) =>
        prev.map((b) => {
          if (!b.hit && !b.missed && b.targetTime < now - 0.25) {
            return { ...b, missed: true };
          }
          return b;
        })
      );

      animFrame.current = requestAnimationFrame(loop);
    };

    animFrame.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrame.current);
  }, [isPlaying, isFinished, tempo]);

  const startChallenge = () => {
    soundManager.playSuccess();
    setIsPlaying(true);
    setIsFinished(false);
    setScore(0);
    setCombo(0);
    setActiveBeats([]);
    gameTime.current = 0;
    lastSpawn.current = 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-stone-900 via-amber-950/60 to-stone-950 border-2 border-amber-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🥁</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-amber-200 tracking-wide uppercase">
                  Chenda Melam Rhythm Challenge
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/40">
                  🥁 താളം ചലഞ്ച്
                </span>
              </div>
              <p className="text-xs text-amber-400/80 font-malayalam">
                പഞ്ചവാദ്യം · താളം പിടിക്കൂ
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

        {/* Start / Instructions */}
        {!isPlaying && !isFinished && (
          <div className="py-6 flex flex-col items-center text-center gap-4">
            <div className="p-4 rounded-3xl bg-amber-950/70 border border-amber-500/40 max-w-md">
              <span className="text-4xl mb-2 inline-block">🪘</span>
              <h3 className="text-sm font-bold text-amber-200 mb-1">Traditional Kerala Rhythm Bols:</h3>
              <p className="text-xs text-stone-300 mb-3">
                Hit the corresponding drum keys when the rhythm bols reach the central strike ring.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-stone-900 border border-amber-500/30 font-bold text-amber-300">
                  🔴 THA (താ) — [1] / [Q]
                </div>
                <div className="p-2 rounded-xl bg-stone-900 border border-blue-500/30 font-bold text-blue-300">
                  🔵 KITA (കിട) — [2] / [W]
                </div>
                <div className="p-2 rounded-xl bg-stone-900 border border-emerald-500/30 font-bold text-emerald-300">
                  🟢 THOM (തോം) — [3] / [E]
                </div>
                <div className="p-2 rounded-xl bg-stone-900 border border-purple-500/30 font-bold text-purple-300">
                  🟣 TAKADIMI (തകധിമി) — [4] / [R]
                </div>
              </div>
            </div>

            <button
              onClick={startChallenge}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-sm tracking-wider uppercase shadow-xl transition-transform active:scale-95"
            >
              START MELAM / മേളം തുടങ്ങൂ 🥁
            </button>
          </div>
        )}

        {/* Live Rhythm Wheel Game */}
        {isPlaying && !isFinished && (
          <div className="flex flex-col gap-3">
            {/* Score & Combo Bar */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-400 uppercase">Streak:</span>
                <span className="text-xl font-black text-amber-300 font-mono flex items-center gap-1">
                  <Flame size={18} className="text-orange-500 animate-pulse" />
                  {combo} / 20
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-400 uppercase">Score:</span>
                <span className="text-xl font-black text-emerald-300 font-mono">{score} pts</span>
              </div>
            </div>

            {/* Rhythm Runway Track */}
            <div className="h-32 bg-stone-950/90 rounded-2xl border-2 border-amber-500/40 relative overflow-hidden flex items-center px-4">
              {/* Target Hit Ring */}
              <div className="absolute left-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-4 border-amber-400 bg-amber-500/20 shadow-lg flex items-center justify-center z-10 animate-pulse">
                <span className="text-[10px] font-black text-amber-200">HIT</span>
              </div>

              {/* Incoming Rhythm Beats */}
              {activeBeats.map((beat) => {
                const now = gameTime.current;
                const timeLeft = beat.targetTime - now;
                // Move from right (100%) to left hit zone (32px ~ 6%)
                const progress = Math.max(0, Math.min(100, (timeLeft / 2.0) * 100));

                if (beat.hit || (beat.missed && timeLeft < -0.4)) return null;

                return (
                  <div
                    key={beat.id}
                    className={`absolute top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl text-xs font-black text-white shadow-xl transition-all border ${
                      beat.bol === 'THA'
                        ? 'bg-gradient-to-r from-red-600 to-amber-600 border-red-400'
                        : beat.bol === 'KITA'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-400'
                        : beat.bol === 'THOM'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400'
                    }`}
                    style={{ left: `calc(${progress}% + 32px)` }}
                  >
                    <span>{beat.bol}</span>
                    <span className="text-[10px] ml-1 opacity-80 font-malayalam">{beat.malayalam}</span>
                  </div>
                );
              })}
            </div>

            {/* Feedback Toast */}
            <div className="h-5 flex items-center justify-center">
              {feedback && <span className="text-xs font-black text-amber-300 animate-bounce">{feedback}</span>}
            </div>

            {/* Interactive Drum Strike Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
              {BOLS.map((b) => (
                <button
                  key={b.key}
                  onClick={() => handleStrike(b.key as any)}
                  className={`py-3.5 px-2 rounded-2xl font-black text-xs tracking-wider uppercase shadow-lg transition-transform active:scale-90 flex flex-col items-center gap-0.5 bg-gradient-to-b ${b.color} text-white border border-white/20`}
                >
                  <span className="text-sm">{b.key}</span>
                  <span className="text-[10px] font-malayalam opacity-90">({b.malayalam})</span>
                  <span className="text-[9px] font-mono opacity-70">[{b.keyHint}]</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Victory Screen */}
        {isFinished && (
          <div className="py-6 flex flex-col items-center text-center gap-4 animate-fadeIn">
            <span className="text-5xl animate-bounce">🥁</span>
            <div>
              <h3 className="text-lg font-black text-amber-300 uppercase tracking-wide">
                Melam Master Rhythm Achieved!
              </h3>
              <p className="text-xs text-stone-300">
                You maintained a 20-beat combo and scored <strong>{score} points</strong>!
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-amber-950/80 border border-amber-500/50 flex items-center gap-3">
              <Award size={28} className="text-amber-400 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-bold text-amber-200">🥁 താളം (Rhythm) Stamp Awarded!</p>
                <p className="text-[10px] text-amber-300/80">+250 Fair Points added to your profile</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={startChallenge}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-transform active:scale-95"
              >
                Play Again
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
