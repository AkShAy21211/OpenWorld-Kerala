import { 
  UserProfile, 
  CosmeticItem, 
  InventoryRecord, 
  DailyRewardStatus, 
  DailyFoodCard, 
  RideScoreRecord, 
  RideStatusResponse, 
  GuestbookEntryRecord, 
  PookkalamDesignRecord, 
  LiveUserSummary 
} from 'fair-shared';
import { SEED_COSMETIC_ITEMS, SEED_FOOD_CARDS } from '../data/constants.js';
import { v4 as uuidv4 } from 'uuid';

export interface IDataStore {
  // User & Auth
  getUserBySessionId(sessionId: string): Promise<UserProfile | null>;
  createGuestUser(sessionId: string, displayName?: string, avatarColor?: string): Promise<UserProfile>;
  updateUserDisplayName(userId: string, displayName: string): Promise<UserProfile | null>;
  touchUserPresence(userId: string): Promise<void>;
  
  // Wallet
  getWalletPoints(userId: string): Promise<number>;
  addWalletPoints(userId: string, amount: number): Promise<number>;
  deductWalletPoints(userId: string, amount: number): Promise<boolean>;

  // Shop & Inventory
  getCosmeticItems(): Promise<CosmeticItem[]>;
  getUserInventory(userId: string): Promise<InventoryRecord[]>;
  purchaseItem(userId: string, itemId: string): Promise<{ success: boolean; message: string; remainingPoints?: number; item?: CosmeticItem }>;

  // Daily Rewards
  getDailyRewardStatus(userId: string): Promise<DailyRewardStatus>;
  claimDailyReward(userId: string): Promise<{ success: boolean; pointsAwarded: number; foodCard: DailyFoodCard; message: string }>;

  // Rides & Timing Game
  getRideStatus(userId: string): Promise<RideStatusResponse>;
  submitRideScore(userId: string, score: number, accuracy: 'perfect' | 'good' | 'miss'): Promise<RideScoreRecord>;
  getDailyLeaderboard(): Promise<RideScoreRecord[]>;

  // Guestbook
  getGuestbookEntries(limit?: number): Promise<GuestbookEntryRecord[]>;
  addGuestbookEntry(userId: string, message: string): Promise<GuestbookEntryRecord>;

  // Pookkalam
  getPookkalams(limit?: number): Promise<PookkalamDesignRecord[]>;
  savePookkalam(userId: string, title: string, colors: string[], pattern: 'chakram' | 'lotus' | 'star' | 'rings', caption?: string): Promise<PookkalamDesignRecord>;

  // Live Users & Analytics
  getLiveVisitors(onlineUserIds: Set<string>): Promise<LiveUserSummary[]>;
}

class InMemoryDataStore implements IDataStore {
  private users: Map<string, UserProfile> = new Map(); // id -> UserProfile
  private sessionIndex: Map<string, string> = new Map(); // sessionId -> userId
  private wallets: Map<string, number> = new Map(); // userId -> points
  private items: Map<string, CosmeticItem> = new Map(); // itemId -> CosmeticItem
  private inventory: InventoryRecord[] = [];
  private dailyRewards: { userId: string; rewardDate: string; foodCardId: string; points: number }[] = [];
  private rideScores: RideScoreRecord[] = [];
  private guestbook: GuestbookEntryRecord[] = [];
  private pookkalams: PookkalamDesignRecord[] = [];

  constructor() {
    // Seed initial shop catalog
    for (const item of SEED_COSMETIC_ITEMS) {
      this.items.set(item.id, item);
    }

    // Seed welcoming community guestbook messages
    const welcomeDate = new Date().toISOString();
    this.guestbook.push(
      {
        id: uuidv4(),
        userId: 'system-visitor-1',
        displayName: 'Aromal from Thrissur',
        avatarColor: '#F59E0B',
        message: 'ഹലോ കൂട്ടുകാരെ! എന്ത് മനോഹരമായ ഉത്സവാന്തരീക്ഷം! (What a beautiful festive vibe!) 🎉',
        createdAt: welcomeDate,
      },
      {
        id: uuidv4(),
        userId: 'system-visitor-2',
        displayName: 'Devika',
        avatarColor: '#10B981',
        message: 'The swing ride timing is super fun! Managed a perfect 10 on my 2nd attempt! 🎪',
        createdAt: welcomeDate,
      },
      {
        id: uuidv4(),
        userId: 'system-visitor-3',
        displayName: 'Vishnu Nair',
        avatarColor: '#3B82F6',
        message: 'Happy Onam and festival greetings from Kochi! Loved the Kasavu mundu item! 🪔',
        createdAt: welcomeDate,
      }
    );

    // Seed welcoming community pookkalams
    this.pookkalams.push(
      {
        id: uuidv4(),
        userId: 'system-visitor-1',
        displayName: 'Ananya',
        avatarColor: '#EC4899',
        title: 'Thumba & Chethi Mandala',
        colors: ['#F59E0B', '#EF4444', '#10B981', '#FDFBF7'],
        pattern: 'chakram',
        caption: 'Traditional yellow marigold and sacred white thumba floral ring',
        createdAt: welcomeDate,
      },
      {
        id: uuidv4(),
        userId: 'system-visitor-2',
        displayName: 'Kiran',
        avatarColor: '#8B5CF6',
        title: 'Royal Lotus Design',
        colors: ['#EC4899', '#8B5CF6', '#F59E0B', '#10B981'],
        pattern: 'lotus',
        caption: 'Vibrant blooming lotus pattern celebrating Onam',
        createdAt: welcomeDate,
      }
    );
  }

  private getTodayString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  async getUserBySessionId(sessionId: string): Promise<UserProfile | null> {
    const userId = this.sessionIndex.get(sessionId);
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  async createGuestUser(sessionId: string, displayName?: string, avatarColor?: string): Promise<UserProfile> {
    const existing = await this.getUserBySessionId(sessionId);
    if (existing) {
      if (displayName) existing.displayName = displayName;
      if (avatarColor) existing.avatarColor = avatarColor;
      existing.lastSeenAt = new Date().toISOString();
      return existing;
    }

    const userId = uuidv4();
    const guestNumber = Math.floor(1000 + Math.random() * 9000);
    const user: UserProfile = {
      id: userId,
      sessionId,
      displayName: displayName || `Malayali #${guestNumber}`,
      avatarColor: avatarColor || '#E11D48',
      avatarId: 'visitor_default',
      isGuest: true,
      createdAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    };

    this.users.set(userId, user);
    this.sessionIndex.set(sessionId, userId);
    this.wallets.set(userId, 20); // 20 welcome points for fresh visitors

    return user;
  }

  async updateUserDisplayName(userId: string, displayName: string): Promise<UserProfile | null> {
    const user = this.users.get(userId);
    if (!user) return null;
    user.displayName = displayName.trim().slice(0, 24);
    return user;
  }

  async touchUserPresence(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.lastSeenAt = new Date().toISOString();
    }
  }

  async getWalletPoints(userId: string): Promise<number> {
    return this.wallets.get(userId) ?? 0;
  }

  async addWalletPoints(userId: string, amount: number): Promise<number> {
    const current = await this.getWalletPoints(userId);
    const updated = current + amount;
    this.wallets.set(userId, updated);
    return updated;
  }

  async deductWalletPoints(userId: string, amount: number): Promise<boolean> {
    const current = await this.getWalletPoints(userId);
    if (current < amount) return false;
    this.wallets.set(userId, current - amount);
    return true;
  }

  async getCosmeticItems(): Promise<CosmeticItem[]> {
    return Array.from(this.items.values()).filter(i => i.active);
  }

  async getUserInventory(userId: string): Promise<InventoryRecord[]> {
    return this.inventory
      .filter(inv => inv.userId === userId)
      .map(inv => ({
        ...inv,
        item: this.items.get(inv.itemId),
      }));
  }

  async purchaseItem(userId: string, itemId: string): Promise<{ success: boolean; message: string; remainingPoints?: number; item?: CosmeticItem }> {
    const item = this.items.get(itemId);
    if (!item || !item.active) {
      return { success: false, message: 'Item is currently unavailable.' };
    }

    const hasItem = this.inventory.some(inv => inv.userId === userId && inv.itemId === itemId);
    if (hasItem) {
      return { success: false, message: 'You already own this item!' };
    }

    const deducted = await this.deductWalletPoints(userId, item.price);
    if (!deducted) {
      const currentPoints = await this.getWalletPoints(userId);
      return { 
        success: false, 
        message: `Not enough points! You have ${currentPoints} pts, but this item costs ${item.price} pts. Play rides or claim daily food to earn more!` 
      };
    }

    const record: InventoryRecord = {
      id: uuidv4(),
      userId,
      itemId,
      item,
      acquiredAt: new Date().toISOString(),
    };
    this.inventory.push(record);

    const remaining = await this.getWalletPoints(userId);
    return {
      success: true,
      message: `Successfully purchased ${item.name}!`,
      remainingPoints: remaining,
      item,
    };
  }

  async getDailyRewardStatus(userId: string): Promise<DailyRewardStatus> {
    const today = this.getTodayString();
    const existing = this.dailyRewards.find(r => r.userId === userId && r.rewardDate === today);
    if (!existing) {
      return { hasClaimedToday: false };
    }

    const card = SEED_FOOD_CARDS.find(c => c.id === existing.foodCardId) || SEED_FOOD_CARDS[0];
    return {
      hasClaimedToday: true,
      claimedReward: {
        rewardDate: existing.rewardDate,
        foodCard: card,
        points: existing.points,
      }
    };
  }

  async claimDailyReward(userId: string): Promise<{ success: boolean; pointsAwarded: number; foodCard: DailyFoodCard; message: string }> {
    const today = this.getTodayString();
    const existing = this.dailyRewards.find(r => r.userId === userId && r.rewardDate === today);
    if (existing) {
      const card = SEED_FOOD_CARDS.find(c => c.id === existing.foodCardId) || SEED_FOOD_CARDS[0];
      return {
        success: false,
        pointsAwarded: 0,
        foodCard: card,
        message: 'You have already collected today\'s Kerala Food Card! Return tomorrow for a new dish.',
      };
    }

    // Pick food card based on day-of-year so all visitors explore the same dish today
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const cardIndex = dayOfYear % SEED_FOOD_CARDS.length;
    const foodCard = SEED_FOOD_CARDS[cardIndex];

    const points = foodCard.points;
    this.dailyRewards.push({
      userId,
      rewardDate: today,
      foodCardId: foodCard.id,
      points,
    });

    await this.addWalletPoints(userId, points);

    return {
      success: true,
      pointsAwarded: points,
      foodCard,
      message: `You revealed ${foodCard.name} (${foodCard.malayalamName}) and earned ${points} Fair Points!`,
    };
  }

  async getRideStatus(userId: string): Promise<RideStatusResponse> {
    const today = this.getTodayString();
    const todayAttempts = this.rideScores.filter(s => 
      s.userId === userId && 
      s.attemptType === 'scored' && 
      s.createdAt.startsWith(today)
    );

    const todayAllUserScores = this.rideScores.filter(s => s.userId === userId && s.createdAt.startsWith(today));
    const highScoreToday = todayAllUserScores.length > 0 ? Math.max(...todayAllUserScores.map(s => s.score)) : 0;

    const maxScored = 3;
    const canEarn = todayAttempts.length < maxScored;

    return {
      todayScoredAttempts: todayAttempts.length,
      maxScoredAttempts: maxScored,
      canEarnPoints: canEarn,
      highScoreToday,
    };
  }

  async submitRideScore(userId: string, score: number, accuracy: 'perfect' | 'good' | 'miss'): Promise<RideScoreRecord> {
    const user = this.users.get(userId);
    const displayName = user ? user.displayName : 'Fair Visitor';
    const avatarColor = user ? user.avatarColor : '#E11D48';

    const status = await this.getRideStatus(userId);
    const isScored = status.canEarnPoints;

    let points = 0;
    if (isScored) {
      if (accuracy === 'perfect') points = 10;
      else if (accuracy === 'good') points = 5;
      else points = 1;

      await this.addWalletPoints(userId, points);
    }

    const record: RideScoreRecord = {
      id: uuidv4(),
      userId,
      displayName,
      avatarColor,
      score,
      timingAccuracy: accuracy,
      attemptType: isScored ? 'scored' : 'practice',
      pointsAwarded: points,
      createdAt: new Date().toISOString(),
    };

    this.rideScores.push(record);
    return record;
  }

  async getDailyLeaderboard(): Promise<RideScoreRecord[]> {
    const today = this.getTodayString();
    // Get highest score per user today
    const userBestMap = new Map<string, RideScoreRecord>();

    for (const record of this.rideScores) {
      if (record.createdAt.startsWith(today)) {
        const prev = userBestMap.get(record.userId);
        if (!prev || record.score > prev.score) {
          userBestMap.set(record.userId, record);
        }
      }
    }

    return Array.from(userBestMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);
  }

  async getGuestbookEntries(limit = 25): Promise<GuestbookEntryRecord[]> {
    return [...this.guestbook]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async addGuestbookEntry(userId: string, rawMessage: string): Promise<GuestbookEntryRecord> {
    const user = this.users.get(userId);
    const displayName = user ? user.displayName : 'Friendly Visitor';
    const avatarColor = user ? user.avatarColor : '#E11D48';

    const message = rawMessage.trim().slice(0, 140);
    const entry: GuestbookEntryRecord = {
      id: uuidv4(),
      userId,
      displayName,
      avatarColor,
      message,
      createdAt: new Date().toISOString(),
    };

    this.guestbook.unshift(entry);
    // Award 2 points for first guestbook contribution
    await this.addWalletPoints(userId, 2);

    return entry;
  }

  async getPookkalams(limit = 20): Promise<PookkalamDesignRecord[]> {
    return [...this.pookkalams]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async savePookkalam(
    userId: string, 
    title: string, 
    colors: string[], 
    pattern: 'chakram' | 'lotus' | 'star' | 'rings', 
    caption?: string
  ): Promise<PookkalamDesignRecord> {
    const user = this.users.get(userId);
    const displayName = user ? user.displayName : 'Fair Artisan';
    const avatarColor = user ? user.avatarColor : '#E11D48';

    const record: PookkalamDesignRecord = {
      id: uuidv4(),
      userId,
      displayName,
      avatarColor,
      title: title.trim().slice(0, 32) || 'Kerala Floral Carpet',
      colors: colors.slice(0, 4),
      pattern,
      caption: caption ? caption.trim().slice(0, 100) : undefined,
      createdAt: new Date().toISOString(),
    };

    this.pookkalams.unshift(record);
    // Award 3 points for creating a floral carpet
    await this.addWalletPoints(userId, 3);

    return record;
  }

  async getLiveVisitors(onlineUserIds: Set<string>): Promise<LiveUserSummary[]> {
    const summaries: LiveUserSummary[] = [];
    for (const [userId, user] of this.users.entries()) {
      summaries.push({
        userId,
        displayName: user.displayName,
        avatarColor: user.avatarColor,
        lastSeenAt: user.lastSeenAt,
        isOnline: onlineUserIds.has(userId),
      });
    }

    // Sort: online users first, then by lastSeenAt descending
    return summaries.sort((a, b) => {
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime();
    }).slice(0, 30);
  }
}
import { PrismaDataStore } from './prismaStore.js';

export const dataStore: IDataStore = process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0
  ? new PrismaDataStore()
  : new InMemoryDataStore();
