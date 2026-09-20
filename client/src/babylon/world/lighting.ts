/**
 * lighting.ts — Kerala Festival Evening Atmosphere
 * Creates ambient, directional (sunset sun), oil-lamp point lights, and GlowLayer.
 */

import {
  Scene,
  HemisphericLight,
  DirectionalLight,
  PointLight,
  Vector3,
  Color3,
  ShadowGenerator,
  GlowLayer,
  Animation,
  CubeTexture,
  Texture,
  MeshBuilder,
  StandardMaterial,
  DynamicTexture,
} from '@babylonjs/core';
import { KeralaSky } from './atmosphere/KeralaSky';

export interface LightingRig {
  shadowGenerator: ShadowGenerator;
  glowLayer: GlowLayer;
  addShadowCaster: (mesh: { getChildMeshes?: () => any[]; [k: string]: any }) => void;
}

export function setupLighting(scene: Scene): LightingRig {
  // ── 1. Ambient hemisphere (bright blue sky & grass bounce) ──────────────
  const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
  hemi.intensity = 0.75;
  hemi.diffuse = new Color3(0.55, 0.82, 1.0);   // vibrant sky blue top
  hemi.groundColor = new Color3(0.22, 0.35, 0.18); // fresh green grass bounce

  // ── 2. Directional daylight sun ──────────────────────────────────────────
  const sun = new DirectionalLight('sun', new Vector3(-1.0, -2.2, -1.0), scene);
  sun.intensity = 1.6;
  sun.diffuse = new Color3(1.0, 0.98, 0.92);    // bright clear sunlight
  sun.specular = new Color3(1.0, 1.0, 0.95);
  sun.position = new Vector3(60, 90, 60);

  // ── 3. Shadow generator ──────────────────────────────────────────────────
  const shadowGen = new ShadowGenerator(2048, sun);
  shadowGen.usePercentageCloserFiltering = true;
  shadowGen.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
  shadowGen.bias = 0.001;
  shadowGen.normalBias = 0.02;

  // ── 4. Oil lamp point lights (Nilavilakku) ───────────────────────────────
  const lampPositions: Vector3[] = [
    new Vector3(0, 3.5, 0),          // central courtyard
    new Vector3(-48, 2.5, -28),      // pookkalam corner
    new Vector3(48, 2.5, -28),       // shops pavilion
    new Vector3(-48, 2.5, 38),       // food court
    new Vector3(48, 2.5, 38),        // ride pavilion
    new Vector3(0, 3, -85),          // entrance arch
    new Vector3(-25, 2, 0),          // path lamp
    new Vector3(25, 2, 0),           // path lamp
  ];

  const lampLights: PointLight[] = lampPositions.map((pos, i) => {
    const lamp = new PointLight(`oilLamp_${i}`, pos, scene);
    lamp.diffuse = new Color3(1.0, 0.65, 0.2);
    lamp.specular = new Color3(1.0, 0.8, 0.35);
    lamp.intensity = i === 0 ? 3.5 : 2.2;
    lamp.range = i === 0 ? 18 : 12;
    return lamp;
  });

  // Flicker animation for all oil lamps
  scene.onBeforeRenderObservable.add(() => {
    lampLights.forEach((lamp, i) => {
      const base = i === 0 ? 3.5 : 2.2;
      // Slightly randomised but smooth flicker
      const time = performance.now() / 1000 + i * 0.7;
      const flicker = Math.sin(time * 4.3 + i) * 0.18 + Math.sin(time * 7.1 + i) * 0.09;
      lamp.intensity = base + flicker;
    });
  });

  // ── 5. Glow layer for emissive lamp flames ────────────────────────────────
  const glowLayer = new GlowLayer('fairGlow', scene, { mainTextureFixedSize: 256 });
  glowLayer.intensity = 0.8;

  // ── 6. Realistic Kerala Atmospheric Sky & Fireworks (SkyMaterial) ───────
  const keralaSky = new KeralaSky(scene);

  // Utility: add a mesh (and all its children) as shadow casters
  function addShadowCaster(mesh: any) {
    shadowGen.addShadowCaster(mesh, true);
  }

  return { shadowGenerator: shadowGen, glowLayer, addShadowCaster };
}
