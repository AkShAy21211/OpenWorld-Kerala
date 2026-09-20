import React, { useState, useEffect } from 'react';
import { ModalWrapper } from '../common/ModalWrapper';
import { fetchLiveVisitors } from '../../services/api';
import { LiveUserSummary } from 'fair-shared';
import { Users, Wifi, Clock } from 'lucide-react';

export const LiveVisitorsModal: React.FC = () => {
  const [visitors, setVisitors] = useState<LiveUserSummary[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveVisitors()
      .then((res) => {
        setVisitors(res.visitors);
        setOnlineCount(res.onlineCount);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ModalWrapper title="Fair Presence & Visitors" malayalamTitle="തത്സമയ സന്ദർശകർ" icon="👥" maxWidth="max-w-md">
      <div className="space-y-4 text-left">
        {/* Real-time stats banner */}
        <div className="p-3 bg-emerald-950/50 border border-emerald-500/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-200 font-semibold">Live in Kerala Pavilion:</span>
          </div>
          <span className="text-sm font-bold text-emerald-300">{onlineCount} visitors</span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-stone-400 text-xs">Checking visitor registry...</div>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {visitors.map((v) => (
              <div
                key={v.userId}
                className="flex items-center justify-between p-2.5 bg-stone-900/60 rounded-xl border border-stone-800"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: v.avatarColor || '#E11D48' }}
                  />
                  <div>
                    <span className="font-bold text-xs text-stone-200 block">{v.displayName}</span>
                    <span className="text-[10px] text-stone-400">
                      {v.isOnline ? 'Exploring pavilion' : 'Visited recently'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px]">
                  {v.isOnline ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                      <Wifi size={12} /> Online
                    </span>
                  ) : (
                    <span className="text-stone-500 flex items-center gap-1">
                      <Clock size={11} /> {new Date(v.lastSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};
