import { create } from 'zustand';
import { soundManager } from '../utils/audio';

export type PassportStampType = 
  | 'water'       // ജലം — Vallam Kali Snake Boat Race
  | 'rhythm'      // താളം — Chenda Melam Rhythm Challenge
  | 'earth'       // മണ്ണ് — Pottery Wheel & Nilavilakku Shaping
  | 'craft'       // കൈത്തൊഴിൽ — Coir Rope Workshop
  | 'play'        // കളി — Taliparamba Coconut Climbing Sprint
  | 'community';  // കൂട്ടായ്മ — Live Kozhikodan Halwa Uruli Stirring

export interface StampInfo {
  id: PassportStampType;
  title: string;
  malayalam: string;
  icon: string;
  description: string;
  activityName: string;
  completed: boolean;
}

export interface PassportState {
  stamps: Record<PassportStampType, boolean>;
  inventory: {
    coirRopes: number;
    clayLamps: number;
    halwaBoxes: number;
    goldenCoconuts: number;
    handloomFabric: number;
  };
  placedLampsCount: number;
  isFinaleUnlocked: boolean;
  isFinaleActive: boolean;

  // Actions
  awardStamp: (stamp: PassportStampType) => void;
  addItem: (item: keyof PassportState['inventory'], count?: number) => void;
  placeLamp: () => boolean;
  triggerFinale: () => void;
  getStampCount: () => number;
  resetPassport: () => void;
}

const STORAGE_KEY = 'kerala_fair_passport_v1';

const loadSavedState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not load passport state', e);
  }
  return null;
};

const initialStamps: Record<PassportStampType, boolean> = {
  water: false,
  rhythm: false,
  earth: false,
  craft: false,
  play: false,
  community: false,
};

const initialInventory = {
  coirRopes: 0,
  clayLamps: 0,
  halwaBoxes: 0,
  goldenCoconuts: 0,
  handloomFabric: 0,
};

export const STAMP_DETAILS: Record<PassportStampType, { title: string; malayalam: string; icon: string; description: string; activityName: string }> = {
  water: {
    title: 'Water / Boat Race',
    malayalam: 'ജലം (വള്ളംകളി)',
    icon: '🚣',
    description: 'Mastered rhythm rowing and synchronized stroke power in the Chundan Vallam race.',
    activityName: 'Vallam Kali Snake Boat Challenge',
  },
  rhythm: {
    title: 'Rhythm / Melam',
    malayalam: 'താളം (ചെണ്ടമേളം)',
    icon: '🥁',
    description: 'Maintained the Tha-Kita-Thom tempo alongside the traditional temple ensemble.',
    activityName: 'Chenda Melam Rhythm Challenge',
  },
  earth: {
    title: 'Earth / Pottery',
    malayalam: 'മണ്ണ് (മൺപാത്ര നിർമ്മാണം)',
    icon: '🏺',
    description: 'Sculpted a sacred Nilavilakku brass/clay lamp and fired it in the wood kiln.',
    activityName: 'Pottery Wheel & Lamp Studio',
  },
  craft: {
    title: 'Craft / Coir',
    malayalam: 'കൈത്തൊഴിൽ (കയർ നിർമ്മാണം)',
    icon: '🥥',
    description: 'Spun coconut husk fibers into high-tensile golden coir ropes on the spinning ratt.',
    activityName: 'Coir Rope Making Workshop',
  },
  play: {
    title: 'Play / Traditional Games',
    malayalam: 'കളി (തെങ്ങുകയറ്റം)',
    icon: '🌴',
    description: 'Mastered the coir loop harness and sprinted up the coconut palm to harvest Elaneer.',
    activityName: 'Taliparamba Coconut Climbing Sprint',
  },
  community: {
    title: 'Community / Culinary',
    malayalam: 'കൂട്ടായ്മ (കോഴിക്കോടൻ ഹൽവ)',
    icon: '🥘',
    description: 'Operated the giant bronze Uruli, stirring jaggery and ghee into fragrant Kozhikodan Halwa.',
    activityName: 'Live Halwa Uruli Stirring Station',
  },
};

export const usePassportStore = create<PassportState>((set, get) => {
  const saved = loadSavedState();

  const state: PassportState = {
    stamps: saved?.stamps ?? initialStamps,
    inventory: saved?.inventory ?? initialInventory,
    placedLampsCount: saved?.placedLampsCount ?? 0,
    isFinaleUnlocked: saved?.isFinaleUnlocked ?? false,
    isFinaleActive: false,

    awardStamp: (stamp: PassportStampType) => {
      const currentStamps = get().stamps;
      if (currentStamps[stamp]) return; // Already awarded

      soundManager.playSuccess();
      const nextStamps = { ...currentStamps, [stamp]: true };
      const completedCount = Object.values(nextStamps).filter(Boolean).length;
      const isFinaleUnlocked = completedCount >= 6;

      const nextState = {
        stamps: nextStamps,
        isFinaleUnlocked,
      };

      set(nextState);
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            stamps: nextStamps,
            inventory: get().inventory,
            placedLampsCount: get().placedLampsCount,
            isFinaleUnlocked,
          })
        );
      } catch (e) {
        console.warn('Could not save passport', e);
      }
    },

    addItem: (item, count = 1) => {
      const currentInv = get().inventory;
      const nextInv = { ...currentInv, [item]: (currentInv[item] || 0) + count };
      set({ inventory: nextInv });
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            stamps: get().stamps,
            inventory: nextInv,
            placedLampsCount: get().placedLampsCount,
            isFinaleUnlocked: get().isFinaleUnlocked,
          })
        );
      } catch (e) {}
    },

    placeLamp: () => {
      const current = get();
      if (current.inventory.clayLamps <= 0) return false;
      const nextLamps = current.inventory.clayLamps - 1;
      const nextPlaced = current.placedLampsCount + 1;
      soundManager.playPop();
      set({
        inventory: { ...current.inventory, clayLamps: nextLamps },
        placedLampsCount: nextPlaced,
      });
      return true;
    },

    triggerFinale: () => {
      soundManager.playSuccess();
      set({ isFinaleActive: true });
    },

    getStampCount: () => {
      return Object.values(get().stamps).filter(Boolean).length;
    },

    resetPassport: () => {
      set({
        stamps: initialStamps,
        inventory: initialInventory,
        placedLampsCount: 0,
        isFinaleUnlocked: false,
        isFinaleActive: false,
      });
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
    },
  };

  return state;
});
