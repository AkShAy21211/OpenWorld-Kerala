import { Server, Socket } from 'socket.io';
import { 
  SOCKET_EVENTS, 
  PlayerState, 
  JoinFairPayload, 
  PlayerMovementPayload, 
  PlayerEmotePayload, 
  ZoneChangePayload 
} from 'fair-shared';
import { dataStore } from '../store/dataStore.js';

const FAIR_ROOM = 'fair-main';
const activePlayers = new Map<string, PlayerState>(); // socketId -> PlayerState
const socketToUser = new Map<string, string>(); // socketId -> userId
const userToSocket = new Map<string, string>(); // userId -> socketId

export function getOnlineUserIds(): Set<string> {
  return new Set(userToSocket.keys());
}

export function setupFairRoom(io: Server) {
  io.on('connection', (socket: Socket) => {
    // console.log(`[Socket] Connected: ${socket.id}`);

    // Join Fair Room
    socket.on(SOCKET_EVENTS.JOIN_FAIR, async (payload: JoinFairPayload) => {
      // If user had a prior socket (e.g. page refresh), clean it up
      const oldSocketId = userToSocket.get(payload.userId);
      if (oldSocketId && oldSocketId !== socket.id) {
        activePlayers.delete(oldSocketId);
        socketToUser.delete(oldSocketId);
      }

      await socket.join(FAIR_ROOM);

      const playerState: PlayerState = {
        userId: payload.userId,
        displayName: payload.displayName || 'Visitor',
        avatarColor: payload.avatarColor || '#E11D48',
        avatarId: payload.avatarId || 'visitor_default',
        x: payload.initialX ?? 0,
        y: payload.initialY ?? 0,
        z: payload.initialZ ?? -60,
        rotY: 0,
        direction: 'down',
        anim: 'idle',
        animState: 'idle',
        equipped: payload.equipped || {},
      };

      activePlayers.set(socket.id, playerState);
      socketToUser.set(socket.id, payload.userId);
      userToSocket.set(payload.userId, socket.id);

      await dataStore.touchUserPresence(payload.userId);

      // Build dictionary of all current players
      const allPlayers: Record<string, PlayerState> = {};
      activePlayers.forEach((state) => {
        allPlayers[state.userId] = state;
      });

      // Send initial room snapshot to joining user
      socket.emit(SOCKET_EVENTS.ROOM_STATE, {
        players: allPlayers,
        presenceCount: activePlayers.size,
      });

      // Notify others in room
      socket.to(FAIR_ROOM).emit(SOCKET_EVENTS.PLAYER_JOINED, playerState);

      // Broadcast new presence count
      io.to(FAIR_ROOM).emit(SOCKET_EVENTS.PRESENCE_COUNT, { count: activePlayers.size });
    });

    // Player Movement (Throttled by client @ 12-15Hz)
    socket.on(SOCKET_EVENTS.PLAYER_MOVE, (movement: PlayerMovementPayload) => {
      const player = activePlayers.get(socket.id);
      if (!player) return;

      player.x = movement.x;
      player.y = movement.y;
      player.z = movement.z;
      player.rotY = movement.rotY;
      player.direction = movement.direction;
      player.anim = movement.anim;
      player.animState = movement.animState;

      socket.to(FAIR_ROOM).emit(SOCKET_EVENTS.PLAYER_MOVED, {
        userId: player.userId,
        x: player.x,
        y: player.y,
        z: player.z,
        rotY: player.rotY,
        direction: player.direction,
        anim: player.anim,
        animState: player.animState,
      });
    });

    // Player Emote
    socket.on(SOCKET_EVENTS.PLAYER_EMOTE, (payload: PlayerEmotePayload) => {
      const player = activePlayers.get(socket.id);
      if (!player) return;

      const expiresAt = Date.now() + 3500;
      player.currentEmote = {
        emote: payload.emote,
        expiresAt,
      };

      io.to(FAIR_ROOM).emit(SOCKET_EVENTS.PLAYER_EMOTED, {
        userId: player.userId,
        emote: payload.emote,
        expiresAt,
      });
    });

    // Player Equips or Name Updates
    socket.on(SOCKET_EVENTS.PLAYER_UPDATE, (payload: Partial<PlayerState>) => {
      const player = activePlayers.get(socket.id);
      if (!player) return;

      if (payload.displayName) player.displayName = payload.displayName;
      if (payload.avatarColor) player.avatarColor = payload.avatarColor;
      if (payload.equipped) player.equipped = payload.equipped;

      io.to(FAIR_ROOM).emit(SOCKET_EVENTS.PLAYER_UPDATED, player);
    });

    // Zone Change
    socket.on(SOCKET_EVENTS.ZONE_CHANGE, (payload: ZoneChangePayload) => {
      const player = activePlayers.get(socket.id);
      if (!player) return;
      player.currentZone = payload.zone;
    });

    // Disconnect
    socket.on('disconnect', () => {
      const player = activePlayers.get(socket.id);
      if (player) {
        const userId = player.userId;
        activePlayers.delete(socket.id);
        socketToUser.delete(socket.id);
        if (userToSocket.get(userId) === socket.id) {
          userToSocket.delete(userId);
        }

        io.to(FAIR_ROOM).emit(SOCKET_EVENTS.PLAYER_LEFT, { userId });
        io.to(FAIR_ROOM).emit(SOCKET_EVENTS.PRESENCE_COUNT, { count: activePlayers.size });
      }
    });
  });
}
