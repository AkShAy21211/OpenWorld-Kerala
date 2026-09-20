import React, { useState, useEffect } from 'react';
import { ModalWrapper } from '../common/ModalWrapper';
import { fetchLeaderboard } from '../../services/api';
import { RideScoreRecord } from 'fair-shared';
import { Trophy, Medal, Sparkles } from 'lucide-react';

export const LeaderboardModal: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<RideScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard()
      .then((res) => setLeaderboard(res.leaderboard))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ModalWrapper title="Today's Swing Leaderboard" malayalamTitle="ദൈനംദിന റാങ്ക്" icon="🏆" maxWidth="max-w-md">
      <div className="space-y-4 text-left">
        <p className="text-xs text-stone-400 text-center">
          Top swing timing scores recorded today. Ranks reset at midnight.
        </p>

        {loading ? (
          <div className="text-center py-8 text-stone-400 text-xs">Summoning records...</div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8 text-stone-400 text-xs">
            No swings recorded yet today! Head to the ride booth to claim #1.
          </div>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {leaderboard.map((item, index) => {
              const isGold = index === 0;
              const isSilver = index === 1;
              const isBronze = index === 2;

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isGold
                      ? 'bg-amber-950/60 border-amber-400 shadow-md'
                      : isSilver
                      ? 'bg-stone-900/80 border-stone-400'
                      : isBronze
                      ? 'bg-amber-950/30 border-amber-700'
                      : 'bg-stone-900/50 border-stone-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs">
                      {isGold ? (
                        <span className="text-xl">🥇</span>
                      ) : isSilver ? (
                        <span className="text-xl">🥈</span>
                      ) : isBronze ? (
                        <span className="text-xl">🥉</span>
                      ) : (
                        <span className="text-stone-400">#{index + 1}</span>
                      )}
                    </div>

                    <div>
                      <span className="font-bold text-sm text-stone-100 flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: item.avatarColor || '#E11D48' }}
                        />
                        {item.displayName}
                      </span>
                      <span className="text-[10px] text-stone-400 capitalize">
                        Accuracy: {item.timingAccuracy}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-base text-amber-300">
                      {item.score}
                    </span>
                    <span className="text-[10px] text-stone-400 block">points</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};
