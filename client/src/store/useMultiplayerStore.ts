import { create } from 'zustand';
import { PlayerState } from 'fair-shared';

interface MultiplayerState {
  remotePlayers: Record<string, PlayerState>;
  presenceCount: number;
  activeEmotes: Record<string, { emote: string; expiresAt: number }>;

  setAllPlayers: (players: Record<string, PlayerState>) => void;
  upsertPlayer: (player: PlayerState) => void;
  removePlayer: (userId: string) => void;
  setPresenceCount: (count: number) => void;
  setPlayerEmote: (userId: string, emote: string, expiresAt: number) => void;
  cleanupExpiredEmotes: () => void;
}

export const useMultiplayerStore = create<MultiplayerState>((set) => ({
  remotePlayers: {},
  presenceCount: 1,
  activeEmotes: {},

  setAllPlayers: (players) => set({ remotePlayers: players }),

  upsertPlayer: (player) =>
    set((state) => ({
      remotePlayers: {
        ...state.remotePlayers,
        [player.userId]: {
          ...state.remotePlayers[player.userId],
          ...player,
        },
      },
    })),

  removePlayer: (userId) =>
    set((state) => {
      const next = { ...state.remotePlayers };
      delete next[userId];
      return { remotePlayers: next };
    }),

  setPresenceCount: (count) => set({ presenceCount: count }),

  setPlayerEmote: (userId, emote, expiresAt) =>
    set((state) => ({
      activeEmotes: {
        ...state.activeEmotes,
        [userId]: { emote, expiresAt },
      },
    })),

  cleanupExpiredEmotes: () =>
    set((state) => {
      const now = Date.now();
      let changed = false;
      const next = { ...state.activeEmotes };
      for (const [uid, item] of Object.entries(next)) {
        if (item.expiresAt < now) {
          delete next[uid];
          changed = true;
        }
      }
      return changed ? { activeEmotes: next } : state;
    }),
}));
