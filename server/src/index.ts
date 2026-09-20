import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';

import { authRouter } from './routes/auth.js';
import { shopRouter } from './routes/shop.js';
import { rewardsRouter } from './routes/rewards.js';
import { rideRouter } from './routes/ride.js';
import { guestbookRouter } from './routes/guestbook.js';
import { pookkalamRouter } from './routes/pookkalam.js';
import { usersRouter } from './routes/users.js';
import { setupFairRoom } from './socket/fairRoom.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Socket.IO configuration with CORS
const io = new Server(server, {
  cors: {
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

// Middleware
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), game: 'Kerala Fair 2D' });
});

// REST Routes
app.use('/api/auth', authRouter);
app.use('/api/shop', shopRouter);
app.use('/api/rewards', rewardsRouter);
app.use('/api/ride', rideRouter);
app.use('/api/guestbook', guestbookRouter);
app.use('/api/pookkalam', pookkalamRouter);
app.use('/api/users', usersRouter);

// Realtime Fair Room
setupFairRoom(io);

server.listen(PORT, () => {
  console.log(`🪔 Kerala Fair Server running on http://localhost:${PORT}`);
  console.log(`🎪 Ready for visitors!`);
});
