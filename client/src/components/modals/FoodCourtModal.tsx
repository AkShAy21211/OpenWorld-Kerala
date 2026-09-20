import React, { useState, useEffect } from 'react';
import { ModalWrapper } from '../common/ModalWrapper';
import { useUserStore } from '../../store/useUserStore';
import { fetchDailyRewardStatus, claimDailyFoodCard } from '../../services/api';
import { soundManager } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { DailyFoodCard } from 'fair-shared';
import { Utensils, Sparkles, CheckCircle2, Clock, Info } from 'lucide-react';

export const FoodCourtModal: React.FC = () => {
  const { addPoints } = useUserStore();
  const [claimedToday, setClaimedToday] = useState(false);
  const [foodCard, setFoodCard] = useState<DailyFoodCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchDailyRewardStatus()
      .then((res) => {
        setClaimedToday(res.hasClaimedToday);
        if (res.claimedReward) {
          setFoodCard(res.claimedReward.foodCard);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleClaim = async () => {
    setClaiming(true);
    setMessage(null);
    try {
      const res = await claimDailyFoodCard();
      if (res.success) {
        soundManager.playSuccess();
        confetti({
          particleCount: 45,
          spread: 55,
          origin: { y: 0.65 },
          colors: ['#10B981', '#F59E0B', '#EF4444'],
        });
        setClaimedToday(true);
        setFoodCard(res.foodCard);
        addPoints(res.pointsAwarded);
        setMessage(res.message);
      } else {
        setClaimedToday(true);
        if (res.foodCard) setFoodCard(res.foodCard);
        setMessage(res.message);
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to claim daily reward.');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <ModalWrapper title="Kerala Food Court" malayalamTitle="ഭക്ഷണശാല" icon="🍛" maxWidth="max-w-lg">
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8 text-stone-400">Loading culinary pavilion...</div>
        ) : (
          <>
            {/* Daily Food Card Banner */}
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-950/60 border border-amber-500/30 rounded-full text-xs font-semibold text-amber-300 mb-3">
                <Sparkles size={14} />
                Daily Kerala Delicacy Routine
              </div>
              <h3 className="text-lg font-bold text-stone-100">
                Taste the Flavors of God's Own Country
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                Collect one authentic Kerala food card every day and earn +10 Fair Points!
              </p>
            </div>

            {/* Delicacy Card Display */}
            {foodCard ? (
              <div className="relative p-5 rounded-2xl bg-gradient-to-br from-stone-900 to-amber-950/50 border border-amber-500/40 shadow-xl overflow-hidden">
                <div className="flex items-start gap-4">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner shrink-0 border border-amber-400/30"
                    style={{ backgroundColor: foodCard.color + '25' }}
                  >
                    {foodCard.category === 'sadya' ? '🍃' : foodCard.category === 'sweet' ? '🥣' : foodCard.category === 'drink' ? '🫖' : '🍌'}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                        {foodCard.category}
                      </span>
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                        +{foodCard.points} pts
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-stone-100 mt-1">{foodCard.name}</h4>
                    <p className="text-xs font-malayalam text-amber-300/80 mb-2">{foodCard.malayalamName}</p>
                    <p className="text-xs text-stone-300 leading-relaxed">{foodCard.description}</p>
                  </div>
                </div>

                {/* Cultural Fun Fact */}
                <div className="mt-4 p-3 bg-stone-950/70 rounded-xl border border-stone-800 flex items-start gap-2.5 text-xs text-amber-200/90">
                  <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300">Kerala Culinary Lore: </span>
                    {foodCard.funFact}
                  </div>
                </div>
              </div>
            ) : (
              /* Mystery Leaf Cover */
              <div className="p-8 rounded-2xl bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-800 text-center space-y-3">
                <div className="text-5xl animate-bounce">🍃</div>
                <div className="text-stone-200 font-bold">Today's Delicacy is Under the Plantain Leaf!</div>
                <p className="text-xs text-stone-400 max-w-xs mx-auto">
                  Click below to reveal today's traditional dish, discover its heritage, and claim your daily points.
                </p>
              </div>
            )}

            {message && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-center text-xs text-emerald-200">
                {message}
              </div>
            )}

            {/* Action or Status */}
            <div>
              {claimedToday ? (
                <div className="w-full py-3.5 px-4 bg-stone-900/80 border border-emerald-500/30 rounded-xl text-center flex items-center justify-center gap-2 text-emerald-300 text-sm font-semibold">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  Collected Today's Dish! Return tomorrow for a new specialty.
                </div>
              ) : (
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="w-full py-3.5 px-6 kerala-btn rounded-xl font-bold text-base flex items-center justify-center gap-2"
                >
                  <Utensils size={18} />
                  {claiming ? 'Revealing Delicacy...' : 'Reveal Today\'s Dish (+10 pts)'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </ModalWrapper>
  );
};
