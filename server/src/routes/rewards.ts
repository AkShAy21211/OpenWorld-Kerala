import { Router, Request, Response } from 'express';
import { getSessionUser } from './auth.js';
import { dataStore } from '../store/dataStore.js';

export const rewardsRouter = Router();

// GET /api/rewards/today - Status of today's daily food card
rewardsRouter.get('/today', async (req: Request, res: Response) => {
  try {
    const { user } = await getSessionUser(req, res);
    const status = await dataStore.getDailyRewardStatus(user.id);
    res.json(status);
  } catch (error) {
    console.error('Error fetching reward status:', error);
    res.status(500).json({ error: 'Failed to fetch reward status' });
  }
});

// POST /api/rewards/daily - Claim today's daily food card
rewardsRouter.post('/daily', async (req: Request, res: Response) => {
  try {
    const { user } = await getSessionUser(req, res);
    const result = await dataStore.claimDailyReward(user.id);
    const updatedPoints = await dataStore.getWalletPoints(user.id);

    res.json({
      ...result,
      wallet: { points: updatedPoints },
    });
  } catch (error) {
    console.error('Error claiming daily reward:', error);
    res.status(500).json({ success: false, message: 'Failed to claim daily reward' });
  }
});
