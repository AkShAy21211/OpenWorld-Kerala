import { Router, Request, Response } from 'express';
import { getSessionUser } from './auth.js';
import { dataStore } from '../store/dataStore.js';

export const rideRouter = Router();

// GET /api/ride/status - Today's attempt count & eligibility
rideRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const { user } = await getSessionUser(req, res);
    const status = await dataStore.getRideStatus(user.id);
    res.json(status);
  } catch (error) {
    console.error('Error fetching ride status:', error);
    res.status(500).json({ error: 'Failed to fetch ride status' });
  }
});

// POST /api/ride/submit - Submit timing score
rideRouter.post('/submit', async (req: Request, res: Response) => {
  try {
    const { user } = await getSessionUser(req, res);
    const { score, accuracy } = req.body;

    // Validate score bounds
    const numericScore = Number(score) || 0;
    const clampedScore = Math.max(0, Math.min(100, numericScore));
    
    let validAccuracy: 'perfect' | 'good' | 'miss' = 'miss';
    if (accuracy === 'perfect' || accuracy === 'good' || accuracy === 'miss') {
      validAccuracy = accuracy;
    } else {
      if (clampedScore >= 90) validAccuracy = 'perfect';
      else if (clampedScore >= 60) validAccuracy = 'good';
      else validAccuracy = 'miss';
    }

    const record = await dataStore.submitRideScore(user.id, clampedScore, validAccuracy);
    const status = await dataStore.getRideStatus(user.id);
    const points = await dataStore.getWalletPoints(user.id);

    res.json({
      success: true,
      record,
      status,
      wallet: { points },
    });
  } catch (error) {
    console.error('Error submitting ride score:', error);
    res.status(500).json({ success: false, message: 'Failed to record ride score' });
  }
});

// GET /api/ride/leaderboard - Top 15 scores of today
rideRouter.get('/leaderboard', async (_req: Request, res: Response) => {
  try {
    const leaderboard = await dataStore.getDailyLeaderboard();
    res.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});
