import { PrismaClient } from '@prisma/client';
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
import { IDataStore } from './dataStore.js';
import { SEED_FOOD_CARDS } from '../data/constants.js';

export class PrismaDataStore implements IDataStore {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  private getTodayString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  async getUserBySessionId(sessionId: string): Promise<UserProfile | null> {
    const user = await this.prisma.user.findUnique({
      where: { sessionId },
    });
    if (!user) return null;
    return {
      id: user.id,
      sessionId: user.sessionId,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
      avatarId: user.avatarId,
      isGuest: user.isGuest,
      email: user.email ?? undefined,
      createdAt: user.createdAt.toISOString(),
      lastSeenAt: user.lastSeenAt.toISOString(),
    };
  }

  async createGuestUser(sessionId: string, displayName?: string, avatarColor?: string): Promise<UserProfile> {
    const existing = await this.getUserBySessionId(sessionId);
    if (existing) {
      if (displayName || avatarColor) {
        const updated = await this.prisma.user.update({
          where: { sessionId },
          data: {
            displayName: displayName || existing.displayName,
            avatarColor: avatarColor || existing.avatarColor,
            lastSeenAt: new Date(),
          },
        });
        return {
          id: updated.id,
          sessionId: updated.sessionId,
          displayName: updated.displayName,
          avatarColor: updated.avatarColor,
          avatarId: updated.avatarId,
          isGuest: updated.isGuest,
          email: updated.email ?? undefined,
          createdAt: updated.createdAt.toISOString(),
          lastSeenAt: updated.lastSeenAt.toISOString(),
        };
      }
      return existing;
    }

    const guestNumber = Math.floor(1000 + Math.random() * 9000);
    const finalName = displayName || `Malayali #${guestNumber}`;
    const finalColor = avatarColor || '#E11D48';

    const user = await this.prisma.user.create({
      data: {
        sessionId,
        displayName: finalName,
        avatarColor: finalColor,
        avatarId: 'visitor_default',
        isGuest: true,
        wallet: {
          create: {
            points: 20, // 20 welcome points
          },
        },
      },
    });

    return {
      id: user.id,
      sessionId: user.sessionId,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
      avatarId: user.avatarId,
      isGuest: user.isGuest,
      createdAt: user.createdAt.toISOString(),
      lastSeenAt: user.lastSeenAt.toISOString(),
    };
  }

  async updateUserDisplayName(userId: string, displayName: string): Promise<UserProfile | null> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { displayName: displayName.trim().slice(0, 24) },
    });
    return {
      id: updated.id,
      sessionId: updated.sessionId,
      displayName: updated.displayName,
      avatarColor: updated.avatarColor,
      avatarId: updated.avatarId,
      isGuest: updated.isGuest,
      email: updated.email ?? undefined,
      createdAt: updated.createdAt.toISOString(),
      lastSeenAt: updated.lastSeenAt.toISOString(),
    };
  }

  async touchUserPresence(userId: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastSeenAt: new Date() },
      });
    } catch {
      // Ignore if user doesn't exist yet
    }
  }

  async getWalletPoints(userId: string): Promise<number> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });
    return wallet?.points ?? 0;
  }

  async addWalletPoints(userId: string, amount: number): Promise<number> {
    const wallet = await this.prisma.wallet.upsert({
      where: { userId },
      update: { points: { increment: amount } },
      create: { userId, points: 20 + amount },
    });
    return wallet.points;
  }

  async deductWalletPoints(userId: string, amount: number): Promise<boolean> {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.points < amount) return false;

    await this.prisma.wallet.update({
      where: { userId },
      data: { points: { decrement: amount } },
    });
    return true;
  }

  async getCosmeticItems(): Promise<CosmeticItem[]> {
    const items = await this.prisma.item.findMany({
      where: { active: true },
    });
    return items.map((i) => ({
      id: i.id,
      name: i.name,
      malayalamName: i.malayalamName,
      type: i.type as 'outfit' | 'instrument' | 'headwear',
      price: i.price,
      description: i.description,
      previewColor: i.previewColor,
      active: i.active,
    }));
  }

  async getUserInventory(userId: string): Promise<InventoryRecord[]> {
    const records = await this.prisma.inventory.findMany({
      where: { userId },
      include: { item: true },
    });
    return records.map((r) => ({
      id: r.id,
      userId: r.userId,
      itemId: r.itemId,
      item: {
        id: r.item.id,
        name: r.item.name,
        malayalamName: r.item.malayalamName,
        type: r.item.type as 'outfit' | 'instrument' | 'headwear',
        price: r.item.price,
        description: r.item.description,
        previewColor: r.item.previewColor,
        active: r.item.active,
      },
      acquiredAt: r.acquiredAt.toISOString(),
    }));
  }

  async purchaseItem(userId: string, itemId: string): Promise<{ success: boolean; message: string; remainingPoints?: number; item?: CosmeticItem }> {
    const item = await this.prisma.item.findUnique({ where: { id: itemId } });
    if (!item || !item.active) {
      return { success: false, message: 'Item is currently unavailable.' };
    }

    const existing = await this.prisma.inventory.findUnique({
      where: { userId_itemId: { userId, itemId } },
    });
    if (existing) {
      return { success: false, message: 'You already own this item!' };
    }

    const deducted = await this.deductWalletPoints(userId, item.price);
    if (!deducted) {
      const current = await this.getWalletPoints(userId);
      return {
        success: false,
        message: `Not enough points! You have ${current} pts, but this item costs ${item.price} pts.`,
      };
    }

    await this.prisma.inventory.create({
      data: {
        userId,
        itemId,
      },
    });

    const remaining = await this.getWalletPoints(userId);
    return {
      success: true,
      message: `Successfully purchased ${item.name}!`,
      remainingPoints: remaining,
      item: {
        id: item.id,
        name: item.name,
        malayalamName: item.malayalamName,
        type: item.type as 'outfit' | 'instrument' | 'headwear',
        price: item.price,
        description: item.description,
        previewColor: item.previewColor,
        active: item.active,
      },
    };
  }

  async getDailyRewardStatus(userId: string): Promise<DailyRewardStatus> {
    const today = this.getTodayString();
    const existing = await this.prisma.dailyReward.findUnique({
      where: { userId_rewardDate: { userId, rewardDate: today } },
    });
    if (!existing) {
      return { hasClaimedToday: false };
    }

    const card = SEED_FOOD_CARDS.find((c) => c.id === existing.foodCardId) || SEED_FOOD_CARDS[0];
    return {
      hasClaimedToday: true,
      claimedReward: {
        rewardDate: existing.rewardDate,
        foodCard: card,
        points: existing.points,
      },
    };
  }

  async claimDailyReward(userId: string): Promise<{ success: boolean; pointsAwarded: number; foodCard: DailyFoodCard; message: string }> {
    const today = this.getTodayString();
    const existing = await this.prisma.dailyReward.findUnique({
      where: { userId_rewardDate: { userId, rewardDate: today } },
    });
    if (existing) {
      const card = SEED_FOOD_CARDS.find((c) => c.id === existing.foodCardId) || SEED_FOOD_CARDS[0];
      return {
        success: false,
        pointsAwarded: 0,
        foodCard: card,
        message: "You have already collected today's Kerala Food Card! Return tomorrow for a new dish.",
      };
    }

    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const cardIndex = dayOfYear % SEED_FOOD_CARDS.length;
    const foodCard = SEED_FOOD_CARDS[cardIndex];

    await this.prisma.dailyReward.create({
      data: {
        userId,
        rewardDate: today,
        foodCardId: foodCard.id,
        points: foodCard.points,
      },
    });

    await this.addWalletPoints(userId, foodCard.points);

    return {
      success: true,
      pointsAwarded: foodCard.points,
      foodCard,
      message: `You revealed ${foodCard.name} (${foodCard.malayalamName}) and earned ${foodCard.points} Fair Points!`,
    };
  }

  async getRideStatus(userId: string): Promise<RideStatusResponse> {
    const today = this.getTodayString();
    const todayStart = new Date(today);

    const todayAttempts = await this.prisma.rideScore.count({
      where: {
        userId,
        attemptType: 'scored',
        createdAt: { gte: todayStart },
      },
    });

    const allTodayScores = await this.prisma.rideScore.findMany({
      where: {
        userId,
        createdAt: { gte: todayStart },
      },
      select: { score: true },
    });

    const highScoreToday = allTodayScores.length > 0 ? Math.max(...allTodayScores.map((s) => s.score)) : 0;
    const maxScored = 3;

    return {
      todayScoredAttempts: todayAttempts,
      maxScoredAttempts: maxScored,
      canEarnPoints: todayAttempts < maxScored,
      highScoreToday,
    };
  }

  async submitRideScore(userId: string, score: number, accuracy: 'perfect' | 'good' | 'miss'): Promise<RideScoreRecord> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const displayName = user?.displayName || 'Fair Visitor';
    const avatarColor = user?.avatarColor || '#E11D48';

    const status = await this.getRideStatus(userId);
    const isScored = status.canEarnPoints;

    let points = 0;
    if (isScored) {
      if (accuracy === 'perfect') points = 10;
      else if (accuracy === 'good') points = 5;
      else points = 1;

      await this.addWalletPoints(userId, points);
    }

    const created = await this.prisma.rideScore.create({
      data: {
        userId,
        score,
        timingAccuracy: accuracy,
        attemptType: isScored ? 'scored' : 'practice',
        pointsAwarded: points,
      },
    });

    return {
      id: created.id,
      userId: created.userId,
      displayName,
      avatarColor,
      score: created.score,
      timingAccuracy: accuracy,
      attemptType: isScored ? 'scored' : 'practice',
      pointsAwarded: points,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async getDailyLeaderboard(): Promise<RideScoreRecord[]> {
    const today = this.getTodayString();
    const todayStart = new Date(today);

    const scores = await this.prisma.rideScore.findMany({
      where: { createdAt: { gte: todayStart } },
      include: { user: true },
      orderBy: { score: 'desc' },
    });

    // Highest score per distinct user
    const seen = new Set<string>();
    const leaderboard: RideScoreRecord[] = [];

    for (const s of scores) {
      if (!seen.has(s.userId)) {
        seen.add(s.userId);
        leaderboard.push({
          id: s.id,
          userId: s.userId,
          displayName: s.user.displayName,
          avatarColor: s.user.avatarColor,
          score: s.score,
          timingAccuracy: s.timingAccuracy as 'perfect' | 'good' | 'miss',
          attemptType: s.attemptType as 'scored' | 'practice',
          pointsAwarded: s.pointsAwarded,
          createdAt: s.createdAt.toISOString(),
        });
      }
    }

    return leaderboard.slice(0, 15);
  }

  async getGuestbookEntries(limit = 25): Promise<GuestbookEntryRecord[]> {
    const entries = await this.prisma.guestbookEntry.findMany({
      where: { approved: true },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return entries.map((e) => ({
      id: e.id,
      userId: e.userId,
      displayName: e.user.displayName,
      avatarColor: e.user.avatarColor,
      message: e.message,
      createdAt: e.createdAt.toISOString(),
    }));
  }

  async addGuestbookEntry(userId: string, rawMessage: string): Promise<GuestbookEntryRecord> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const displayName = user?.displayName || 'Friendly Visitor';
    const avatarColor = user?.avatarColor || '#E11D48';

    const message = rawMessage.trim().slice(0, 140);
    const created = await this.prisma.guestbookEntry.create({
      data: {
        userId,
        message,
        approved: true,
      },
    });

    await this.addWalletPoints(userId, 2);

    return {
      id: created.id,
      userId,
      displayName,
      avatarColor,
      message,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async getPookkalams(limit = 20): Promise<PookkalamDesignRecord[]> {
    const designs = await this.prisma.pookkalam.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return designs.map((p) => {
      let colors: string[] = [];
      try {
        colors = JSON.parse(p.colors);
      } catch {
        colors = ['#F59E0B', '#EF4444', '#10B981', '#FDFBF7'];
      }

      return {
        id: p.id,
        userId: p.userId,
        displayName: p.user.displayName,
        avatarColor: p.user.avatarColor,
        title: p.title,
        colors,
        pattern: p.pattern as 'chakram' | 'lotus' | 'star' | 'rings',
        caption: p.caption ?? undefined,
        createdAt: p.createdAt.toISOString(),
      };
    });
  }

  async savePookkalam(
    userId: string,
    title: string,
    colors: string[],
    pattern: 'chakram' | 'lotus' | 'star' | 'rings',
    caption?: string
  ): Promise<PookkalamDesignRecord> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const displayName = user?.displayName || 'Fair Artisan';
    const avatarColor = user?.avatarColor || '#E11D48';

    const created = await this.prisma.pookkalam.create({
      data: {
        userId,
        title: title.trim().slice(0, 32) || 'Kerala Flower Carpet',
        colors: JSON.stringify(colors.slice(0, 4)),
        pattern,
        caption: caption ? caption.trim().slice(0, 100) : null,
      },
    });

    await this.addWalletPoints(userId, 3);

    return {
      id: created.id,
      userId,
      displayName,
      avatarColor,
      title: created.title,
      colors: colors.slice(0, 4),
      pattern,
      caption: created.caption ?? undefined,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async getLiveVisitors(onlineUserIds: Set<string>): Promise<LiveUserSummary[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { lastSeenAt: 'desc' },
      take: 30,
    });

    const summaries: LiveUserSummary[] = users.map((u) => ({
      userId: u.id,
      displayName: u.displayName,
      avatarColor: u.avatarColor,
      lastSeenAt: u.lastSeenAt.toISOString(),
      isOnline: onlineUserIds.has(u.id),
    }));

    return summaries.sort((a, b) => {
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime();
    });
  }
}
