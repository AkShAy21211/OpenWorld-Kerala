import { Router, Request, Response } from 'express';
import { getSessionUser } from './auth.js';
import { dataStore } from '../store/dataStore.js';

export const guestbookRouter = Router();

// Basic list of offensive keywords to filter
const BLOCKED_WORDS = ['spam', 'abuse', 'hate', 'badword'];

function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some(w => lower.includes(w));
}

// GET /api/guestbook - List recent guestbook entries
guestbookRouter.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(50, Number(req.query.limit) || 25);
    const entries = await dataStore.getGuestbookEntries(limit);
    res.json({ entries });
  } catch (error) {
    console.error('Error fetching guestbook:', error);
    res.status(500).json({ error: 'Failed to fetch guestbook' });
  }
});

// POST /api/guestbook - Submit a new greeting
guestbookRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { user } = await getSessionUser(req, res);
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    if (message.length > 140) {
      return res.status(400).json({ success: false, message: 'Message exceeds 140 characters limit.' });
    }

    if (containsProfanity(message)) {
      return res.status(400).json({ success: false, message: 'Message contains prohibited words.' });
    }

    const entry = await dataStore.addGuestbookEntry(user.id, message);
    const points = await dataStore.getWalletPoints(user.id);

    res.json({
      success: true,
      entry,
      wallet: { points },
      rewardNotice: 'You earned 2 Fair Points for signing the festival guestbook! 🪔',
    });
  } catch (error) {
    console.error('Error adding guestbook entry:', error);
    res.status(500).json({ success: false, message: 'Failed to post message' });
  }
});
