import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dataStore } from '../store/dataStore.js';

export const authRouter = Router();

const SESSION_COOKIE_NAME = 'fair_session_id';

// Middleware to extract or initialize session
export async function getSessionUser(req: Request, res: Response) {
  let sessionId = req.cookies?.[SESSION_COOKIE_NAME];
  if (!sessionId) {
    sessionId = uuidv4();
    res.cookie(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }

  let user = await dataStore.getUserBySessionId(sessionId);
  if (!user) {
    user = await dataStore.createGuestUser(sessionId);
  } else {
    await dataStore.touchUserPresence(user.id);
  }

  return { user, sessionId };
}

// GET /api/auth/me - Retrieve current session user + wallet + inventory
authRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const { user, sessionId } = await getSessionUser(req, res);
    const points = await dataStore.getWalletPoints(user.id);
    const inventory = await dataStore.getUserInventory(user.id);

    res.json({
      user,
      sessionId,
      wallet: { points },
      inventory,
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    res.status(500).json({ error: 'Failed to retrieve user profile' });
  }
});

// POST /api/auth/guest - Join or customize guest identity
authRouter.post('/guest', async (req: Request, res: Response) => {
  try {
    const { displayName, avatarColor } = req.body;
    let sessionId = req.cookies?.[SESSION_COOKIE_NAME];
    
    if (!sessionId) {
      sessionId = uuidv4();
      res.cookie(SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }

    const user = await dataStore.createGuestUser(sessionId, displayName, avatarColor);
    const points = await dataStore.getWalletPoints(user.id);
    const inventory = await dataStore.getUserInventory(user.id);

    res.json({
      success: true,
      user,
      sessionId,
      wallet: { points },
      inventory,
    });
  } catch (error) {
    console.error('Error in /api/auth/guest:', error);
    res.status(500).json({ error: 'Failed to set guest profile' });
  }
});

// POST /api/auth/profile - Update display name or avatar color
authRouter.post('/profile', async (req: Request, res: Response) => {
  try {
    const { user } = await getSessionUser(req, res);
    const { displayName } = req.body;
    
    if (displayName && typeof displayName === 'string') {
      const updated = await dataStore.updateUserDisplayName(user.id, displayName);
      return res.json({ success: true, user: updated });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error in /api/auth/profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/auth/google - Google Sign-In ready endpoint
authRouter.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential, email, name, picture } = req.body;
    const { user } = await getSessionUser(req, res);

    if (name) {
      await dataStore.updateUserDisplayName(user.id, name);
    }
    user.isGuest = false;
    user.email = email || 'google_user@fair.kerala';

    const points = await dataStore.getWalletPoints(user.id);
    const inventory = await dataStore.getUserInventory(user.id);

    res.json({
      success: true,
      message: 'Signed in with Google profile',
      user,
      wallet: { points },
      inventory,
    });
  } catch (error) {
    console.error('Error in /api/auth/google:', error);
    res.status(500).json({ error: 'Google sign-in error' });
  }
});
