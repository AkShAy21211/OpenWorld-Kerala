import { io, Socket } from 'socket.io-client';
import { 
  SOCKET_EVENTS, 
  PlayerState, 
  PlayerMovementPayload, 
  PlayerEmotePayload, 
  RoomStatePayload, 
  FairZone 
} from 'fair-shared';
import { useMultiplayerStore } from '../store/useMultiplayerStore';
import { soundManager } from '../utils/audio';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function initSocket(userId: string, displayName: string, avatarColor: string, equipped: { outfit?: string; instrument?: string; headwear?: string }): Socket {
  if (socket && socket.connected) {
    return socket;
  }

  // Connect to backend (relative path uses Vite proxy or window.location)
  socket = io(window.location.origin, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    // console.log('[Socket] Connected to Fair Server:', socket?.id);\n
    socket?.emit(SOCKET_EVENTS.JOIN_FAIR, {
      userId,
      displayName,
      avatarColor,
      avatarId: 'visitor_default',
      equipped,
      initialX: 0,
      initialY: 0,
      initialZ: -60,
    });
  });

  // Initial room snapshot
  socket.on(SOCKET_EVENTS.ROOM_STATE, (payload: RoomStatePayload) => {
    // Exclude self from remote players
    const others: Record<string, PlayerState> = {};
    for (const [id, p] of Object.entries(payload.players)) {
      if (id !== userId) {
        others[id] = p;
      }
    }
    useMultiplayerStore.getState().setAllPlayers(others);
    useMultiplayerStore.getState().setPresenceCount(payload.presenceCount);
  });

  // Another player joined
  socket.on(SOCKET_EVENTS.PLAYER_JOINED, (player: PlayerState) => {
    if (player.userId !== userId) {
      useMultiplayerStore.getState().upsertPlayer(player);
    }
  });

  // Player moved
  socket.on(SOCKET_EVENTS.PLAYER_MOVED, (movement: PlayerMovementPayload) => {
    if (movement.userId !== userId) {
      useMultiplayerStore.getState().upsertPlayer(movement as PlayerState);
    }
  });

  // Player emote
  socket.on(SOCKET_EVENTS.PLAYER_EMOTED, (payload: { userId: string; emote: string; expiresAt: number }) => {
    useMultiplayerStore.getState().setPlayerEmote(payload.userId, payload.emote, payload.expiresAt);
    if (payload.emote === 'clap') {
      soundManager.playDrum();
    } else {
      soundManager.playPop();
    }
  });

  // Player updated
  socket.on(SOCKET_EVENTS.PLAYER_UPDATED, (player: PlayerState) => {
    if (player.userId !== userId) {
      useMultiplayerStore.getState().upsertPlayer(player);
    }
  });

  // Player left
  socket.on(SOCKET_EVENTS.PLAYER_LEFT, (payload: { userId: string }) => {
    useMultiplayerStore.getState().removePlayer(payload.userId);
  });

  // Presence count
  socket.on(SOCKET_EVENTS.PRESENCE_COUNT, (payload: { count: number }) => {
    useMultiplayerStore.getState().setPresenceCount(payload.count);
  });

  return socket;
}

// Throttled movement emission — accepts 3D payload
let lastMoveTime = 0;
export function sendPlayerMovement(payload: {
  x: number; y: number; z: number; rotY: number;
  direction: 'up' | 'down' | 'left' | 'right' | 'idle';
  anim: string;
  animState: 'idle' | 'walk';
}) {
  const now = performance.now();
  if (now - lastMoveTime < 65) return; // ~15 updates per second
  lastMoveTime = now;

  if (socket && socket.connected) {
    socket.emit(SOCKET_EVENTS.PLAYER_MOVE, payload);
  }
}

export function sendPlayerEmote(emote: string) {
  if (socket && socket.connected) {
    socket.emit(SOCKET_EVENTS.PLAYER_EMOTE, { emote });
  }
}

export function sendZoneChange(zone: FairZone) {
  if (socket && socket.connected) {
    socket.emit(SOCKET_EVENTS.ZONE_CHANGE, { zone });
  }
}

export function sendPlayerUpdate(equipped: { outfit?: string; instrument?: string; headwear?: string }, displayName?: string) {
  if (socket && socket.connected) {
    socket.emit(SOCKET_EVENTS.PLAYER_UPDATE, { equipped, displayName });
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
