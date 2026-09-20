import { PlayerState, PlayerMovementPayload, PlayerEmotePayload, FairZone } from './types.js';

export const SOCKET_EVENTS = {
  // Client -> Server
  JOIN_FAIR: 'fair:join',
  LEAVE_FAIR: 'fair:leave',
  PLAYER_MOVE: 'player:move',
  PLAYER_EMOTE: 'player:emote',
  PLAYER_UPDATE: 'player:update',
  ZONE_CHANGE: 'player:zone_change',

  // Server -> Client
  ROOM_STATE: 'fair:room_state',
  PLAYER_JOINED: 'player:joined',
  PLAYER_LEFT: 'player:left',
  PLAYER_MOVED: 'player:moved',
  PLAYER_EMOTED: 'player:emoted',
  PLAYER_UPDATED: 'player:updated',
  PRESENCE_COUNT: 'fair:presence',
} as const;

export interface JoinFairPayload {
  userId: string;
  displayName: string;
  avatarColor: string;
  avatarId: string;
  equipped: {
    outfit?: string;
    instrument?: string;
    headwear?: string;
  };
  initialX?: number;
  initialY?: number;
  initialZ?: number;
}

export interface RoomStatePayload {
  players: Record<string, PlayerState>;
  presenceCount: number;
}

export interface ZoneChangePayload {
  userId: string;
  zone: FairZone;
}
