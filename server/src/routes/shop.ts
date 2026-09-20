import { Router, Request, Response } from 'express';
import { getSessionUser } from './auth.js';
import { dataStore } from '../store/dataStore.js';

export const shopRouter = Router();

// GET /api/shop/items - List purchasable cosmetic items
shopRouter.get('/items', async (_req: Request, res: Response) => {
  try {
    const items = await dataStore.getCosmeticItems();
    res.json({ items });
  } catch (error) {
    console.error('Error fetching shop items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// GET /api/shop/inventory - Get user's acquired cosmetics
shopRouter.get('/inventory', async (req: Request, res: Response) => {
  try {
    const { user } = await getSessionUser(req, res);
    const inventory = await dataStore.getUserInventory(user.id);
    const points = await dataStore.getWalletPoints(user.id);
    res.json({ inventory, points });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// POST /api/shop/buy - Authoritative purchase endpoint
shopRouter.post('/buy', async (req: Request, res: Response) => {
  try {
    const { user } = await getSessionUser(req, res);
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ success: false, message: 'Item ID is required.' });
    }

    const result = await dataStore.purchaseItem(user.id, itemId);
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error in purchase:', error);
    res.status(500).json({ success: false, message: 'Purchase transaction failed.' });
  }
});
