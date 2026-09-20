export type FairZone = 'entrance' | 'shops' | 'foodcourt' | 'rides' | 'courtyard';

export type Direction = 'up' | 'down' | 'left' | 'right' | 'idle';

export interface EquippedCosmetics {
  outfit?: string;     // e.g. 'mundu-kasavu'
  instrument?: string; // e.g. 'chenda-drum'
  headwear?: string;   // e.g. 'pookkalam-crown'
}

export interface PlayerState {
  userId: string;
  displayName: string;
  avatarColor: string;
  avatarId: string;
  x: number;
  y: number;
  z: number;        // 3D world position
  rotY: number;     // Y-axis rotation in radians
  direction: Direction;
  anim: string;
  animState: 'idle' | 'walk';
  equipped: EquippedCosmetics;
  currentEmote?: {
    emote: string;
    expiresAt: number;
  };
  currentZone?: FairZone;
}

export interface PlayerMovementPayload {
  userId: string;
  x: number;
  y: number;
  z: number;
  rotY: number;
  direction: Direction;
  anim: string;
  animState: 'idle' | 'walk';
}

export interface PlayerEmotePayload {
  userId: string;
  emote: string; // 'wave' | 'clap' | 'sparkle' | 'namaste'
}

export interface UserProfile {
  id: string;
  sessionId: string;
  displayName: string;
  avatarColor: string;
  avatarId: string;
  isGuest: boolean;
  email?: string;
  createdAt: string;
  lastSeenAt: string;
}

export interface CosmeticItem {
  id: string;
  name: string;
  malayalamName: string;
  type: 'outfit' | 'instrument' | 'headwear';
  price: number;
  description: string;
  previewColor: string;
  active: boolean;
}

export interface InventoryRecord {
  id: string;
  userId: string;
  itemId: string;
  item?: CosmeticItem;
  acquiredAt: string;
}

export interface DailyFoodCard {
  id: string;
  name: string;
  malayalamName: string;
  category: 'sadya' | 'snack' | 'sweet' | 'drink';
  description: string;
  funFact: string;
  points: number;
  color: string;
}

export interface DailyRewardStatus {
  hasClaimedToday: boolean;
  claimedReward?: {
    rewardDate: string;
    foodCard: DailyFoodCard;
    points: number;
  };
}

export interface RideScoreRecord {
  id: string;
  userId: string;
  displayName: string;
  avatarColor: string;
  score: number;
  timingAccuracy: 'perfect' | 'good' | 'miss';
  attemptType: 'scored' | 'practice';
  pointsAwarded: number;
  createdAt: string;
}

export interface RideStatusResponse {
  todayScoredAttempts: number;
  maxScoredAttempts: number;
  canEarnPoints: boolean;
  highScoreToday: number;
}

export interface GuestbookEntryRecord {
  id: string;
  userId: string;
  displayName: string;
  avatarColor: string;
  message: string;
  createdAt: string;
}

export interface PookkalamDesignRecord {
  id: string;
  userId: string;
  displayName: string;
  avatarColor: string;
  title: string;
  colors: string[]; // e.g. ['#F59E0B', '#EF4444', '#10B981', '#FFFFFF']
  pattern: 'chakram' | 'lotus' | 'star' | 'rings';
  caption?: string;
  createdAt: string;
}

export interface LiveUserSummary {
  userId: string;
  displayName: string;
  avatarColor: string;
  lastSeenAt: string;
  currentZone?: FairZone;
  isOnline: boolean;
}
