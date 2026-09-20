import { Router, Request, Response } from 'express';
import { getSessionUser } from './auth.js';
import { dataStore } from '../store/dataStore.js';

export const pookkalamRouter = Router();

// GET /api/pookkalam - List recent community designs
pookkalamRouter.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(30, Number(req.query.limit) || 20);
    const designs = await dataStore.getPookkalams(limit);
    res.json({ designs });
  } catch (error) {
    console.error('Error fetching pookkalams:', error);
    res.status(500).json({ error: 'Failed to fetch designs' });
  }
});

// POST /api/pookkalam - Submit a new flower pattern
pookkalamRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { user } = await getSessionUser(req, res);
    const { title, colors, pattern, caption } = req.body;

    if (!Array.isArray(colors) || colors.length === 0) {
      return res.status(400).json({ success: false, message: 'Please pick flower colors.' });
    }

    const validPatterns = ['chakram', 'lotus', 'star', 'rings'];
    const selectedPattern = validPatterns.includes(pattern) ? pattern : 'chakram';

    const design = await dataStore.savePookkalam(
      user.id,
      title || 'Kerala Flower Carpet',
      colors,
      selectedPattern,
      caption
    );

    const points = await dataStore.getWalletPoints(user.id);

    res.json({
      success: true,
      design,
      wallet: { points },
      rewardNotice: 'You earned 3 Fair Points for adding a Pookkalam to the fair! 🌸',
    });
  } catch (error) {
    console.error('Error saving pookkalam:', error);
    res.status(500).json({ success: false, message: 'Failed to save design' });
  }
});
