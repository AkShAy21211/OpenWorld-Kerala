import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ModalWrapper } from '../common/ModalWrapper';
import { useUserStore } from '../../store/useUserStore';
import { useGameStore } from '../../store/useGameStore';
import { fetchRideStatus, submitRideScore } from '../../services/api';
import { soundManager } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Trophy, Flame, Sparkles, RefreshCw } from 'lucide-react';
import { RideStatusResponse } from 'fair-shared';

export const RideModal: React.FC = () => {
  const { addPoints } = useUserStore();
  const { openModal } = useGameStore();

  const [rideStatus, setRideStatus] = useState<RideStatusResponse | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [markerPos, setMarkerPos] = useState(50); // 0 to 100
  const [result, setResult] = useState<{
    score: number;
    accuracy: 'perfect' | 'good' | 'miss';
    pointsAwarded: number;
    attemptType: 'scored' | 'practice';
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationMs = 5000; // 5-second attempt window

  const loadStatus = useCallback(async () => {
    try {
      const status = await fetchRideStatus();
      setRideStatus(status);
    } catch (err) {
      console.error('Failed to load ride status:', err);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Marker animation loop
  const updateSwing = useCallback((timestamp: number) => {
    if (!startTimeRef.current) startTimeRef.current = timestamp;
    const elapsed = timestamp - startTimeRef.current;

    // Oscillating pendulum frequency (approx 1.2 Hz)
    const cycle = (Math.sin(elapsed * 0.005) + 1) / 2; // 0 to 1
    const pos = Math.round(cycle * 100);
    setMarkerPos(pos);

    if (elapsed < durationMs) {
      animRef.current = requestAnimationFrame(updateSwing);
    } else {
      // Time expired: auto-trigger at current position
      handleTap(pos);
    }
  }, [durationMs]);

  const startRide = () => {
    setResult(null);
    setIsPlaying(true);
    startTimeRef.current = 0;
    soundManager.playPop();
    animRef.current = requestAnimationFrame(updateSwing);
  };

  const handleTap = async (posToUse?: number) => {
    if (!isPlaying) return;
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    setIsPlaying(false);

    const pos = posToUse ?? markerPos;
    // Target center is 50. Distance from center:
    const diff = Math.abs(pos - 50);

    let accuracy: 'perfect' | 'good' | 'miss' = 'miss';
    let rawScore = 0;

    if (diff <= 7) {
      accuracy = 'perfect';
      rawScore = 100 - Math.round(diff * 1.5);
      soundManager.playSuccess();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#EF4444', '#10B981', '#FDFBF7'],
      });
    } else if (diff <= 22) {
      accuracy = 'good';
      rawScore = 80 - Math.round((diff - 7) * 2);
      soundManager.playBell();
    } else {
      accuracy = 'miss';
      rawScore = Math.max(10, 50 - Math.round((diff - 22) * 1.5));
      soundManager.playPop();
    }

    setIsSubmitting(true);
    try {
      const res = await submitRideScore(rawScore, accuracy);
      if (res.success) {
        setResult({
          score: res.record.score,
          accuracy: res.record.timingAccuracy,
          pointsAwarded: res.record.pointsAwarded,
          attemptType: res.record.attemptType,
        });
        if (res.record.pointsAwarded > 0) {
          addPoints(res.record.pointsAwarded);
        }
        setRideStatus(res.status);
      }
    } catch (err) {
      console.error('Failed to submit score:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Listen to Spacebar to tap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) {
          handleTap();
        } else if (!isSubmitting) {
          startRide();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, isSubmitting]);

  return (
    <ModalWrapper title="Festival Swing Ride" malayalamTitle="ഊഞ്ഞാൽ" icon="🎪">
      <div className="space-y-6 text-center">
        {/* Ride Header Info */}
        <div className="flex items-center justify-between bg-stone-900/60 p-3 rounded-xl border border-amber-500/20 text-sm">
          <div className="flex items-center gap-2 text-stone-300">
            <Flame className="text-orange-400" size={18} />
            <span>Daily Scored Attempts:</span>
            <span className="font-bold text-amber-300">
              {rideStatus?.todayScoredAttempts ?? 0} / {rideStatus?.maxScoredAttempts ?? 3}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400">Today's Best:</span>
            <span className="font-bold text-emerald-400">{rideStatus?.highScoreToday ?? 0}</span>
            <button
              onClick={() => openModal('leaderboard')}
              className="ml-2 text-xs flex items-center gap-1 text-amber-400 hover:text-amber-300 bg-amber-950/60 px-2 py-1 rounded border border-amber-500/30"
            >
              <Trophy size={14} /> Rank
            </button>
          </div>
        </div>

        {/* Instructions */}
        <p className="text-stone-300 text-sm">
          Tap or press <strong className="text-amber-400">Spacebar</strong> when the festive swing swings directly into the golden green center zone!
        </p>

        {/* The Swing Timing Bar */}
        <div className="relative w-full h-14 bg-stone-950 rounded-xl border-2 border-amber-600/50 overflow-hidden shadow-inner flex items-center">
          {/* Miss Zones (0-28% & 72-100%) */}
          <div className="absolute inset-0 flex">
            <div className="w-[28%] h-full bg-stone-800/40 border-r border-stone-700/50 flex items-center justify-center text-[10px] text-stone-500">Miss (1pt)</div>
            {/* Good Zone Left (28-43%) */}
            <div className="w-[15%] h-full bg-yellow-500/20 border-r border-yellow-500/40 flex items-center justify-center text-[10px] text-yellow-300 font-semibold">Good (5pts)</div>
            {/* Perfect Zone Center (43-57%) */}
            <div className="w-[14%] h-full bg-emerald-500/30 border-r border-yellow-500/40 flex items-center justify-center text-[11px] text-emerald-300 font-bold shadow-lg">
              ✨ 10pts
            </div>
            {/* Good Zone Right (57-72%) */}
            <div className="w-[15%] h-full bg-yellow-500/20 border-r border-stone-700/50 flex items-center justify-center text-[10px] text-yellow-300 font-semibold">Good (5pts)</div>
            {/* Miss Zone Right (72-100%) */}
            <div className="w-[28%] h-full bg-stone-800/40 flex items-center justify-center text-[10px] text-stone-500">Miss (1pt)</div>
          </div>

          {/* Animated Swing Marker */}
          <div
            className="absolute top-0 bottom-0 w-4 bg-amber-400 border-2 border-white rounded shadow-lg transition-transform duration-75 flex items-center justify-center -ml-2 z-10"
            style={{ left: `${markerPos}%` }}
          >
            <div className="w-1 h-6 bg-red-600 rounded-full" />
          </div>
        </div>

        {/* Result Announcement */}
        {result && (
          <div className={`p-4 rounded-xl border animate-scale-up ${
            result.accuracy === 'perfect' ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200' :
            result.accuracy === 'good' ? 'bg-amber-950/60 border-amber-500/60 text-amber-200' :
            'bg-stone-900/60 border-stone-600 text-stone-300'
          }`}>
            <div className="text-2xl font-bold flex items-center justify-center gap-2">
              {result.accuracy === 'perfect' && '🎉 PERFECT SWING!'}
              {result.accuracy === 'good' && '👏 GOOD TIMING!'}
              {result.accuracy === 'miss' && '🌾 A BIT OFF!'}
            </div>
            <div className="text-sm mt-1">
              Score: <span className="font-bold text-white">{result.score}</span> / 100
              {result.attemptType === 'scored' ? (
                <span className="ml-3 text-amber-400 font-semibold">
                  +{result.pointsAwarded} Fair Points!
                </span>
              ) : (
                <span className="ml-3 text-stone-400 italic">
                  (Practice attempt - scored limit reached)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div>
          {!isPlaying ? (
            <button
              onClick={startRide}
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 kerala-btn rounded-xl font-bold text-lg flex items-center justify-center gap-2"
            >
              {result ? <RefreshCw size={20} /> : <Sparkles size={20} />}
              {result ? 'Swing Again' : 'Start 5-Second Swing!'}
            </button>
          ) : (
            <button
              onClick={() => handleTap()}
              className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl font-extrabold text-xl tracking-wider shadow-xl transform active:scale-95 transition-all"
            >
              🎯 TAP NOW! (or Spacebar)
            </button>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
};
