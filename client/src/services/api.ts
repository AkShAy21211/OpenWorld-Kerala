import { 
  UserProfile, 
  CosmeticItem, 
  InventoryRecord, 
  DailyRewardStatus, 
  DailyFoodCard, 
  RideStatusResponse, 
  RideScoreRecord, 
  GuestbookEntryRecord, 
  PookkalamDesignRecord, 
  LiveUserSummary 
} from 'fair-shared';

const API_BASE = '/api';

export async function fetchMe(): Promise<{ user: UserProfile; sessionId: string; wallet: { points: number }; inventory: InventoryRecord[] }> {
  const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch session profile');
  return res.json();
}

export async function joinGuest(displayName: string, avatarColor: string): Promise<{ user: UserProfile; sessionId: string; wallet: { points: number }; inventory: InventoryRecord[] }> {
  const res = await fetch(`${API_BASE}/auth/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName, avatarColor }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to join as guest');
  return res.json();
}

export async function updateProfile(displayName: string): Promise<{ user: UserProfile }> {
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

export async function fetchShopCatalog(): Promise<{ items: CosmeticItem[] }> {
  const res = await fetch(`${API_BASE}/shop/items`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch shop items');
  return res.json();
}

export async function buyItem(itemId: string): Promise<{ success: boolean; message: string; remainingPoints?: number; item?: CosmeticItem }> {
  const res = await fetch(`${API_BASE}/shop/buy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId }),
    credentials: 'include',
  });
  return res.json();
}

export async function fetchDailyRewardStatus(): Promise<DailyRewardStatus> {
  const res = await fetch(`${API_BASE}/rewards/today`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch reward status');
  return res.json();
}

export async function claimDailyFoodCard(): Promise<{ success: boolean; pointsAwarded: number; foodCard: DailyFoodCard; message: string; wallet: { points: number } }> {
  const res = await fetch(`${API_BASE}/rewards/daily`, {
    method: 'POST',
    credentials: 'include',
  });
  return res.json();
}

export async function fetchRideStatus(): Promise<RideStatusResponse> {
  const res = await fetch(`${API_BASE}/ride/status`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch ride status');
  return res.json();
}

export async function submitRideScore(score: number, accuracy: 'perfect' | 'good' | 'miss'): Promise<{ success: boolean; record: RideScoreRecord; status: RideStatusResponse; wallet: { points: number } }> {
  const res = await fetch(`${API_BASE}/ride/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score, accuracy }),
    credentials: 'include',
  });
  return res.json();
}

export async function fetchLeaderboard(): Promise<{ leaderboard: RideScoreRecord[] }> {
  const res = await fetch(`${API_BASE}/ride/leaderboard`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}

export async function fetchGuestbook(): Promise<{ entries: GuestbookEntryRecord[] }> {
  const res = await fetch(`${API_BASE}/guestbook`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch guestbook');
  return res.json();
}

export async function postGuestbookMessage(message: string): Promise<{ success: boolean; entry: GuestbookEntryRecord; wallet: { points: number }; rewardNotice?: string; message?: string }> {
  const res = await fetch(`${API_BASE}/guestbook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
    credentials: 'include',
  });
  return res.json();
}

export async function fetchPookkalams(): Promise<{ designs: PookkalamDesignRecord[] }> {
  const res = await fetch(`${API_BASE}/pookkalam`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch pookkalams');
  return res.json();
}

export async function savePookkalamDesign(
  title: string, 
  colors: string[], 
  pattern: 'chakram' | 'lotus' | 'star' | 'rings', 
  caption?: string
): Promise<{ success: boolean; design: PookkalamDesignRecord; wallet: { points: number }; rewardNotice?: string }> {
  const res = await fetch(`${API_BASE}/pookkalam`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, colors, pattern, caption }),
    credentials: 'include',
  });
  return res.json();
}

export async function fetchLiveVisitors(): Promise<{ onlineCount: number; visitors: LiveUserSummary[] }> {
  const res = await fetch(`${API_BASE}/users/live`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch live visitors');
  return res.json();
}
