/**
 * scene.ts — Kerala Fair 3D World Orchestrator
 * Creates engine, builds world, spawns players, bridges Zustand ↔ Babylon
 */

import { DefaultRenderingPipeline, Color3, Color4 } from '@babylonjs/core';
import { createEngine, createScene, getScene, disposeEngine } from './engine';
import { setupLighting } from './world/lighting';
import { buildTerrain } from './world/terrain';
import { buildArchitecture } from './world/architecture';
import { buildProps } from './world/props';
import { LocalPlayer } from './player/LocalPlayer';
import { RemotePlayer } from './player/RemotePlayer';
import { useUserStore } from '../store/useUserStore';
import { useMultiplayerStore } from '../store/useMultiplayerStore';
import { PlayerState } from 'fair-shared';

import { PhysicsManager } from './physics/PhysicsManager';

let _localPlayer: LocalPlayer | null = null;
const _remotePlayers = new Map<string, RemotePlayer>();

export async function initKeralaWorld(canvas: HTMLCanvasElement) {
  const engine = createEngine(canvas);
  const scene = createScene(engine);

  // ── Initialize Havok Physics V2 ──────────────────────────────────────────
  try {
    await PhysicsManager.initPhysics(scene);
  } catch (err) {
    console.warn('[Physics] Havok initialization failed, running kinematic fallback:', err);
  }

  // ── Build world layers ───────────────────────────────────────────────────
  const lightRig = setupLighting(scene);
  buildTerrain(scene);
  buildArchitecture(scene, (m) => lightRig.addShadowCaster(m));
  buildProps(scene);

  // ── Post-processing pipeline ─────────────────────────────────────────────
  const pipeline = new DefaultRenderingPipeline('keralaPipeline', true, scene);
  pipeline.bloomEnabled = true;
  pipeline.bloomThreshold = 0.65;
  pipeline.bloomWeight = 0.35;
  pipeline.bloomScale = 0.5;
  pipeline.imageProcessingEnabled = true;
  pipeline.imageProcessing.exposure = 1.15;
  pipeline.imageProcessing.contrast = 1.08;
  pipeline.imageProcessing.vignetteEnabled = true;
  pipeline.imageProcessing.vignetteWeight = 1.2;
  // Soft subtle natural vignette
  pipeline.imageProcessing.vignetteColor = new Color4(0.02, 0.05, 0.1, 0.8);
  pipeline.fxaaEnabled = true;

  // ── Spawn local player ───────────────────────────────────────────────────
  const { user, equipped } = useUserStore.getState();
  if (user) {
    _localPlayer = new LocalPlayer(scene, user.avatarColor, equipped);
  }

  // ── Subscribe to Zustand: remote players ────────────────────────────────
  useMultiplayerStore.subscribe((state) => {
    const currentIds = new Set(Object.keys(state.remotePlayers));

    // Add or update remote players
    for (const [id, playerState] of Object.entries(state.remotePlayers)) {
      if (!_remotePlayers.has(id)) {
        const rp = new RemotePlayer(scene, playerState as PlayerState);
        _remotePlayers.set(id, rp);
      } else {
        _remotePlayers.get(id)!.updateFromServer(playerState as Partial<PlayerState>);
      }
    }

    // Remove disconnected players
    for (const [id, rp] of _remotePlayers) {
      if (!currentIds.has(id)) {
        rp.dispose();
        _remotePlayers.delete(id);
      }
    }

    // Emotes
    const emotes = (state as any).activeEmotes as Record<string, string | { emote: string; expiresAt: number }> | undefined;
    if (emotes) {
      for (const [id, emoteData] of Object.entries(emotes)) {
        const rp = _remotePlayers.get(id);
        const emoteName = typeof emoteData === 'string' ? emoteData : emoteData?.emote;
        if (rp && emoteName) rp.showEmote(emoteName);
      }
    }
  });

  // ── Subscribe to Zustand: user cosmetics changes ─────────────────────────
  useUserStore.subscribe((state) => {
    if (_localPlayer && state.user) {
      _localPlayer.applyCosmetics(state.equipped);
    }
  });

  // ── Render loop ──────────────────────────────────────────────────────────
  engine.runRenderLoop(() => scene.render());
  window.addEventListener('resize', () => engine.resize());

  return { engine, scene };
}

/** Called from ScreenshotModal to capture current 3D frame */
export function captureScreenshot(): string | null {
  const scene = getScene();
  if (!scene) return null;
  const canvas = scene.getEngine().getRenderingCanvas();
  return canvas?.toDataURL('image/png') ?? null;
}

export function disposeWorld() {
  _localPlayer?.dispose();
  _localPlayer = null;
  for (const rp of _remotePlayers.values()) rp.dispose();
  _remotePlayers.clear();
  disposeEngine();
}
