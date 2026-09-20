import { create } from 'zustand';
import { UserProfile, InventoryRecord, EquippedCosmetics } from 'fair-shared';

interface UserState {
  user: UserProfile | null;
  points: number;
  inventory: InventoryRecord[];
  equipped: EquippedCosmetics;
  isLoading: boolean;
  
  setUser: (user: UserProfile | null) => void;
  setPoints: (points: number) => void;
  addPoints: (points: number) => void;
  setInventory: (inventory: InventoryRecord[]) => void;
  equipItem: (type: 'outfit' | 'instrument' | 'headwear', itemId: string) => void;
  unequipItem: (type: 'outfit' | 'instrument' | 'headwear') => void;
  setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  points: 0,
  inventory: [],
  equipped: {
    outfit: undefined,
    instrument: undefined,
    headwear: undefined,
  },
  isLoading: true,

  setUser: (user) => set({ user }),
  setPoints: (points) => set({ points }),
  addPoints: (amount) => set((state) => ({ points: state.points + amount })),
  setInventory: (inventory) => set({ inventory }),
  
  equipItem: (type, itemId) =>
    set((state) => ({
      equipped: {
        ...state.equipped,
        [type]: itemId,
      },
    })),

  unequipItem: (type) =>
    set((state) => ({
      equipped: {
        ...state.equipped,
        [type]: undefined,
      },
    })),

  setLoading: (loading) => set({ isLoading: loading }),
}));
