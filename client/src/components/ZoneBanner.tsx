import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { Sparkles } from 'lucide-react';

const ZONE_LABELS = {
  entrance: { title: 'Entrance & Photo Corner', malayalam: 'പൂക്കളം & സന്ദർശക ഡയറി', modal: 'pookkalam' as const, icon: '🌸' },
  shops: { title: 'Kerala Souvenir Shops', malayalam: 'കരകൗശല വിപണി', modal: 'shop' as const, icon: '🛍️' },
  foodcourt: { title: 'Kerala Food Court', malayalam: 'ഭക്ഷണശാല', modal: 'foodcourt' as const, icon: '🍛' },
  rides: { title: 'Festival Swing Ride', malayalam: 'ഊഞ്ഞാൽ മത്സരം', modal: 'ride' as const, icon: '🎪' },
  courtyard: { title: 'Central Courtyard', malayalam: 'മുറ്റം', modal: null, icon: '🪔' },
};

export const ZoneBanner: React.FC = () => {
  const { activeZone, activeModal, openModal } = useGameStore();

  if (!activeZone || activeModal !== null || activeZone === 'courtyard') {
    return null;
  }

  const zoneInfo = ZONE_LABELS[activeZone];
  if (!zoneInfo || !zoneInfo.modal) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto animate-bounce-subtle">
      <button
        onClick={() => openModal(zoneInfo.modal)}
        className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 border-2 border-amber-400/80 shadow-2xl hover:scale-105 transition-all text-left"
      >
        <div className="text-2xl">{zoneInfo.icon}</div>
        <div>
          <div className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
            <span>{zoneInfo.title}</span>
            <span className="text-[10px] text-amber-400 font-malayalam opacity-80">({zoneInfo.malayalam})</span>
          </div>
          <div className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1 mt-0.5">
            <span className="bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40 text-[10px]">Press E</span>
            <span>or Tap to Interact</span>
          </div>
        </div>
      </button>
    </div>
  );
};
