import React, { useEffect, useRef } from 'react';
import { useUserStore } from './store/useUserStore';
import { useGameStore } from './store/useGameStore';
import { fetchMe, joinGuest } from './services/api';
import { initSocket, disconnectSocket } from './services/socket';
import { initKeralaWorld, disposeWorld } from './babylon/scene';

import { HUD } from './components/HUD';
import { ZoneBanner } from './components/ZoneBanner';
import { Joystick } from './components/Joystick';

import { RideModal } from './components/modals/RideModal';
import { ShopModal } from './components/modals/ShopModal';
import { FoodCourtModal } from './components/modals/FoodCourtModal';
import { PookkalamModal } from './components/modals/PookkalamModal';
import { GuestbookModal } from './components/modals/GuestbookModal';
import { LeaderboardModal } from './components/modals/LeaderboardModal';
import { LiveVisitorsModal } from './components/modals/LiveVisitorsModal';
import { AuthModal } from './components/modals/AuthModal';
import { ScreenshotModal } from './components/modals/ScreenshotModal';
import { PassportModal } from './components/modals/PassportModal';
import { VallamKaliModal } from './components/modals/VallamKaliModal';
import { ChendaRhythmModal } from './components/modals/ChendaRhythmModal';
import { PotteryModal } from './components/modals/PotteryModal';
import { CoirMakingModal } from './components/modals/CoirMakingModal';
import { CoconutClimbModal } from './components/modals/CoconutClimbModal';
import { HalwaCookingModal } from './components/modals/HalwaCookingModal';

export const App: React.FC = () => {
  const { user, setUser, setPoints, setInventory, equipped, isLoading, setLoading } = useUserStore();
  const { activeModal } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldStarted = useRef(false);

  // 1. Initialize user profile via HTTP-only cookie session
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const res = await fetchMe();
        if (isMounted) {
          setUser(res.user);
          setPoints(res.wallet.points);
          setInventory(res.inventory);
          setLoading(false);
        }
      } catch (err) {
        // Fallback: auto-create guest session
        try {
          const guest = await joinGuest('', '#E11D48');
          if (isMounted) {
            setUser(guest.user);
            setPoints(guest.wallet.points);
            setInventory(guest.inventory);
            setLoading(false);
          }
        } catch (e2) {
          console.error('Failed to create guest identity:', e2);
          if (isMounted) setLoading(false);
        }
      }
    }

    initAuth();
    return () => {
      isMounted = false;
    };
  }, [setUser, setPoints, setInventory, setLoading]);

  // 2. Initialize Socket.IO once user is loaded
  useEffect(() => {
    if (!user) return;
    initSocket(user.id, user.displayName, user.avatarColor, equipped);
    return () => { disconnectSocket(); };
  }, [user?.id]);

  // 3. Mount Babylon.js 3D world once auth completes
  useEffect(() => {
    if (isLoading || !canvasRef.current || worldStarted.current) return;
    worldStarted.current = true;
    initKeralaWorld(canvasRef.current);

    return () => {
      disposeWorld();
      worldStarted.current = false;
    };
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#120b08] text-amber-100 space-y-4">
        <div className="text-5xl animate-flame">🪔</div>
        <h2 className="text-xl font-bold tracking-wider text-amber-300">
          Entering Kerala Fair...
        </h2>
        <p className="text-xs text-amber-500 font-malayalam">
          കലാമേളയിലേക്ക് സ്വാഗതം
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#120b08]">
      {/* Babylon.js 3D canvas — fills entire viewport */}
      <canvas
        ref={canvasRef}
        id="babylon-canvas"
        className="w-full h-full block outline-none"
        style={{ touchAction: 'none' }}
      />

      {/* Floating HUD — pointer-events managed per component */}
      <div className="absolute inset-0 pointer-events-none">
        <HUD />
        <ZoneBanner />
        <Joystick />
      </div>

      {/* Dynamic Modals — full React, unchanged */}
      {activeModal === 'ride' && <RideModal />}
      {activeModal === 'shop' && <ShopModal />}
      {activeModal === 'foodcourt' && <FoodCourtModal />}
      {activeModal === 'pookkalam' && <PookkalamModal />}
      {activeModal === 'guestbook' && <GuestbookModal />}
      {activeModal === 'leaderboard' && <LeaderboardModal />}
      {activeModal === 'visitors' && <LiveVisitorsModal />}
      {activeModal === 'auth' && <AuthModal />}
      {activeModal === 'screenshot' && <ScreenshotModal />}
      {activeModal === 'passport' && <PassportModal />}
      {activeModal === 'vallamkali' && <VallamKaliModal />}
      {activeModal === 'chenda_rhythm' && <ChendaRhythmModal />}
      {activeModal === 'pottery' && <PotteryModal />}
      {activeModal === 'coir' && <CoirMakingModal />}
      {activeModal === 'coconut_climb' && <CoconutClimbModal />}
      {activeModal === 'halwa' && <HalwaCookingModal />}
    </div>
  );
};
