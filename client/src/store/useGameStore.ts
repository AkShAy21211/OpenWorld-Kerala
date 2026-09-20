import { create } from 'zustand';
import { FairZone } from 'fair-shared';
import { soundManager } from '../utils/audio';

export type ModalType = 
  | 'ride' 
  | 'shop' 
  | 'foodcourt' 
  | 'guestbook' 
  | 'pookkalam' 
  | 'leaderboard' 
  | 'visitors' 
  | 'screenshot'
  | 'auth'
  | 'passport'
  | 'vallamkali'
  | 'chenda_rhythm'
  | 'pottery'
  | 'coir'
  | 'coconut_climb'
  | 'halwa'
  | null;

export type CameraViewMode = 'third_person' | 'first_person' | 'aerial' | 'diorama';

export interface RidePrompt {
  rideId: string;
  rideName: string;
  malayalamName: string;
}

export interface ActiveRideState {
  isRiding: boolean;
  rideId: string | null;
  rideName: string | null;
}

interface GameState {
  activeModal: ModalType;
  activeZone: FairZone | null;
  isMuted: boolean;
  screenshotRequested: boolean;
  virtualJoystickVector: { x: number; y: number } | null;
  joystickVec: { x: number; y: number };  // alias used by LocalPlayer
  cameraMode: CameraViewMode;
  playerWorldPos: { x: number; z: number };   // live 3D world position for minimap
  playerYaw: number;                           // radians, heading for minimap compass
  nearbyRidePrompt: RidePrompt | null;
  activeRideState: ActiveRideState;

  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  setActiveZone: (zone: FairZone | null) => void;
  setCurrentZone: (zone: FairZone | undefined) => void; // used by Babylon LocalPlayer
  toggleMute: () => void;
  requestScreenshot: (requested: boolean) => void;
  setJoystickVector: (vector: { x: number; y: number } | null) => void;
  setCameraMode: (mode: CameraViewMode) => void;
  cycleCameraMode: () => void;
  setPlayerWorldPos: (pos: { x: number; z: number }) => void;
  setPlayerYaw: (yaw: number) => void;
  setNearbyRidePrompt: (prompt: RidePrompt | null) => void;
  setActiveRideState: (state: ActiveRideState) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  activeModal: null,
  activeZone: null,
  isMuted: false,
  screenshotRequested: false,
  virtualJoystickVector: null,
  joystickVec: { x: 0, y: 0 },
  cameraMode: 'third_person',
  playerWorldPos: { x: 0, z: -60 },
  playerYaw: 0,
  nearbyRidePrompt: null,
  activeRideState: { isRiding: false, rideId: null, rideName: null },

  openModal: (modal) => {
    soundManager.playPop();
    set({ activeModal: modal });
  },

  closeModal: () => {
    soundManager.playPop();
    set({ activeModal: null });
  },

  setActiveZone: (zone) => set({ activeZone: zone }),
  setCurrentZone: (zone) => set({ activeZone: zone ?? null }),

  toggleMute: () => {
    const current = get().isMuted;
    const next = !current;
    soundManager.setMuted(next);
    set({ isMuted: next });
  },

  requestScreenshot: (requested) => set({ screenshotRequested: requested }),

  setJoystickVector: (vector) => set({
    virtualJoystickVector: vector,
    joystickVec: vector ?? { x: 0, y: 0 },
  }),

  setCameraMode: (mode) => {
    soundManager.playPop();
    set({ cameraMode: mode });
  },

  cycleCameraMode: () => {
    const modes: CameraViewMode[] = ['third_person', 'first_person', 'aerial', 'diorama'];
    const current = get().cameraMode;
    const nextIdx = (modes.indexOf(current) + 1) % modes.length;
    const next = modes[nextIdx];
    soundManager.playPop();
    set({ cameraMode: next });
  },

  setPlayerWorldPos: (pos) => set({ playerWorldPos: pos }),
  setPlayerYaw: (yaw) => set({ playerYaw: yaw }),
  setNearbyRidePrompt: (prompt) => set({ nearbyRidePrompt: prompt }),
  setActiveRideState: (state) => set({ activeRideState: state }),
}));

