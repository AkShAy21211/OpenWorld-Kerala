import { Router, Request, Response } from 'express';
import { dataStore } from '../store/dataStore.js';
import { getOnlineUserIds } from '../socket/fairRoom.js';

export const usersRouter = Router();

// GET /api/users/live - Live and recent visitors
usersRouter.get('/live', async (_req: Request, res: Response) => {
  try {
    const onlineIds = getOnlineUserIds();
    const visitors = await dataStore.getLiveVisitors(onlineIds);
    res.json({
      onlineCount: onlineIds.size,
      visitors,
    });
  } catch (error) {
    console.error('Error fetching live visitors:', error);
    res.status(500).json({ error: 'Failed to fetch live visitors' });
  }
});
