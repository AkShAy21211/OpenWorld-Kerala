# 🪔 Kerala Fair — One Fair Building (2D Social Game MVP)

A persistent, compact 2D Kerala-themed social game MVP built with **Phaser 3**, **React**, **Node.js**, **Socket.IO**, and **Prisma**.

> **Core Philosophy**: A cozy, dense Kerala-themed pavilion that is delightful even when nobody else is online, yet comes alive with shared presence, avatars, and live traces when other visitors enter.

---

## 🏛️ The 4 Fair Zones & Features

The entire game takes place inside a single atmospheric Kerala Nalukettu festival pavilion:

1. **Entrance & Photo Corner (Top-Left Zone)**:
   - **Pookkalam Flower Carpet**: Interactive mandala builder (marigold, thumba, lotus, tulsi petals) with real-time SVG rendering. Community submissions gallery.
   - **Festival Guestbook**: Public parchment ledger supporting Malayalam & English messages (`+2 pts` reward).
   - **Souvenir Postcard**: Instant photographic souvenir download with custom Kerala Fair ornate border, visitor name, and date stamp.
2. **Kerala Souvenir Shops (Top-Right Zone)**:
   - 3 purchasable cosmetic items:
     - **Kasavu Mundu & Neriyathu** (20 pts)
     - **Chenda Melam Drum** (35 pts)
     - **Marigold & Thumba Flower Crown** (25 pts)
   - Live 2D character avatar preview, equip/unequip toggles.
3. **Kerala Food Court (Bottom-Left Zone)**:
   - **Daily Food Card**: Collect one authentic Kerala delicacy card every calendar day (Onam Sadya, Palada Pradhaman, Puttu & Kadala, Upperi, Sulaimani Chai) with cultural lore and `+10 pts` reward.
4. **Festival Ride Pavilion (Bottom-Right Zone)**:
   - **Swing Timing Minigame (ഊഞ്ഞാൽ)**: 5-second oscillating pendulum bar. Tap or press Spacebar in the highlighted green target to score a Perfect swing (`10 pts`), Good (`5 pts`), or Miss (`1 pt`).
   - **Attempt Limits**: 3 scored attempts per calendar day, followed by unlimited unranked practice.
   - **Daily Leaderboard**: Ranks today's highest swing scores.
5. **Real-time Shared Presence**:
   - Live multiplayer with Socket.IO room `fair-main` (capped at 30 visitors).
   - Smooth movement interpolation (12–15Hz), name tags, and equipped cosmetics on all avatars.
   - Live Emote Quick Bar: Wave 👋, Chenda Clap 👏, Sparkle ✨, Namaste 🙏.
   - Real-time online visitor counter and presence drawer.

---

## 🚀 Quick Start (Zero Setup Required)

Both the server and client dev servers are configured and ready:

```bash
# 1. Install all dependencies across root, shared, server, and client:
npm run install:all

# 2. Build the shared TypeScript library:
npm --prefix shared run build

# 3. Launch both backend and frontend concurrently:
npm run dev
```

- **Frontend Game**: [http://localhost:5173](http://localhost:5173)
- **Backend API & WebSockets**: [http://localhost:4000](http://localhost:4000)

---

## 🐘 Cloud Database Setup: Supabase or Neon (Both 0 Fee)

The app works with any standard PostgreSQL database. You can choose either **Supabase** or **Neon**:

### Option 1: Supabase (Recommended for Visual Table Browser & Auth)
1. Sign up for free at [supabase.com](https://supabase.com) (no credit card required).
2. Click **New Project** and name it `kerala-fair`.
3. Go to **Project Settings** -> **Database** -> **Connection string** -> **URI**:
   - Choose **Transaction** mode (port `6543`) -> Copy to `DATABASE_URL`
   - Choose **Session** mode (port `5432`) -> Copy to `DIRECT_URL`
4. Paste both into `server/.env`:
   ```env
   DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
   ```
5. Run schema sync:
   ```bash
   npm --prefix server run prisma:generate
   npm --prefix server run prisma:push
   ```
   *Bonus*: You can now view and edit all `User`, `Wallet`, `Item`, `RideScore`, `Guestbook`, and `Pookkalam` records directly inside the beautiful Supabase **Table Editor** web GUI!

### Option 2: Neon Serverless PostgreSQL
1. Sign up at [neon.tech](https://neon.tech).
2. Copy the pooled connection string and paste into both `DATABASE_URL` and `DIRECT_URL` in `server/.env`.
3. Run `npm --prefix server run prisma:push`.


---

## 🎮 Controls

- **Desktop Keyboard**: `W`, `A`, `S`, `D` or `Arrow Keys` to walk.
- **Mouse / Touch**: Click or tap anywhere on the stone courtyard to walk there (indicated by a golden pulse ripple).
- **Proximity Interaction**: Walk close to any stall and press `E` or click the floating prompt to open the modal.
- **Mobile Devices**: Touch and drag the on-screen virtual analog joystick in the bottom-right corner.
- **Minigame**: Tap the green button or press `Spacebar` to swing.
- **Emotes**: Click any emote in the bottom-left quick bar (👋, 👏, ✨, 🙏).
