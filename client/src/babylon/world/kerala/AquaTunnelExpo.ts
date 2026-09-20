/**
 * AquaTunnelExpo.ts — 360° Underwater Acrylic Marine Tunnel Expo (അക്വാ എക്സ്പോ / അണ്ടർവാട്ടർ ടണൽ)
 * Signature exhibition pavilion at Kannur Police Maidan Trade Fairs.
 * Features:
 * - 16-meter long curved transparent acrylic glass walk-through tunnel
 * - Steel arched structural framing ribs along the tunnel
 * - Glowing oceanic cyan-blue interior lighting with animated water caustic shimmer
 * - Swimming fish and marine life silhouettes floating overhead inside the glass dome
 * - Entrance portal with illuminated "AQUA EXPO · അണ്ടർവാട്ടർ ടണൽ" signboard
 * - Havok physics colliders on the base floor and outer structure
 */

import {
  Scene,
  TransformNode,
  MeshBuilder,
  PBRMaterial,
  Color3,
  Vector3,
  Mesh,
  PointLight,
} from '@babylonjs/core';
import { PhysicsManager } from '../../physics/PhysicsManager';

export class AquaTunnelExpo {
  public root: TransformNode;
  private fishSilhouettes: TransformNode[] = [];
  private aquaLight: PointLight;

  constructor(scene: Scene, position: Vector3, shadowCast?: (m: Mesh) => void) {
    this.root = new TransformNode('aquaTunnelExpoRoot', scene);
    this.root.position = position;

    // ── 1. Materials ──────────────────────────────────────────────────────────
    // Transparent Oceanic Acrylic Glass
    const acrylicMat = new PBRMaterial('aquaAcrylicMat', scene);
    acrylicMat.albedoColor = Color3.FromHexString('#0284C7');
    acrylicMat.alpha = 0.55;
    acrylicMat.roughness = 0.05;
    acrylicMat.metallic = 0.3;
    acrylicMat.emissiveColor = Color3.FromHexString('#0369A1');
    acrylicMat.emissiveIntensity = 0.8;

    // Steel Framing Hoops
    const steelMat = new PBRMaterial('aquaSteelMat', scene);
    steelMat.albedoColor = Color3.FromHexString('#0F172A'); // Deep Navy Blue
    steelMat.roughness = 0.4;
    steelMat.metallic = 0.8;

    // Floor Walkway
    const floorMat = new PBRMaterial('aquaFloorMat', scene);
    floorMat.albedoColor = Color3.FromHexString('#1E293B');
    floorMat.roughness = 0.7;

    const signMat = new PBRMaterial('aquaSignMat', scene);
    signMat.albedoColor = Color3.FromHexString('#06B6D4');
    signMat.emissiveColor = Color3.FromHexString('#06B6D4');
    signMat.emissiveIntensity = 2.8;

    const fishMat = new PBRMaterial('aquaFishMat', scene);
    fishMat.albedoColor = Color3.FromHexString('#F97316'); // Bright Orange Clownfish/Fish
    fishMat.emissiveColor = Color3.FromHexString('#EA580C');
    fishMat.emissiveIntensity = 1.5;

    // ── 2. Walkway Floor & Base Structure ────────────────────────────────────
    const tunnelLength = 16;
    const tunnelWidth = 6.5;
    const tunnelHeight = 3.8;

    const floor = MeshBuilder.CreateBox('aquaFloor', {
      width: tunnelWidth,
      height: 0.4,
      depth: tunnelLength,
    }, scene);
    floor.position = new Vector3(0, 0.2, 0);
    floor.material = floorMat;
    floor.parent = this.root;
    floor.receiveShadows = true;

    // ── 3. Arched Acrylic Glass Dome Tunnel ──────────────────────────────────
    const tunnelDome = MeshBuilder.CreateCylinder('aquaDome', {
      height: tunnelLength,
      diameter: tunnelWidth,
      tessellation: 24,
      arc: 0.5, // Semi-cylinder arch
    }, scene);
    tunnelDome.rotation.x = Math.PI / 2;
    tunnelDome.rotation.y = Math.PI;
    tunnelDome.position = new Vector3(0, 0.4, 0);
    tunnelDome.material = acrylicMat;
    tunnelDome.parent = this.root;

    // Arched Steel Structural Ribs (Every 2 meters along length)
    const numRibs = 8;
    for (let r = 0; r < numRibs; r++) {
      const zRib = -tunnelLength / 2 + (r / (numRibs - 1)) * tunnelLength;
      const rib = MeshBuilder.CreateTorus(`aquaRib_${r}`, {
        diameter: tunnelWidth + 0.1,
        thickness: 0.16,
        tessellation: 24,
      }, scene);
      rib.rotation.x = Math.PI / 2;
      rib.position = new Vector3(0, 0.4, zRib);
      rib.material = steelMat;
      rib.parent = this.root;
      if (shadowCast) shadowCast(rib);
    }

    // ── 4. Entrance Portal & Marquee Signboard ───────────────────────────────
    const entranceArch = MeshBuilder.CreateBox('aquaEntrancePortal', {
      width: tunnelWidth + 1.2,
      height: 4.8,
      depth: 0.8,
    }, scene);
    entranceArch.position = new Vector3(0, 2.4, -tunnelLength / 2);
    entranceArch.material = steelMat;
    entranceArch.parent = this.root;
    if (shadowCast) shadowCast(entranceArch);

    const signBoard = MeshBuilder.CreateBox('aquaSignBoard', { width: 6.5, height: 1.2, depth: 0.15 }, scene);
    signBoard.position = new Vector3(0, 4.4, -tunnelLength / 2 - 0.45);
    signBoard.material = signMat;
    signBoard.parent = this.root;

    // ── 5. Swimming Fish & Marine Life Silhouettes ───────────────────────────
    const numFish = 10;
    for (let f = 0; f < numFish; f++) {
      const fishNode = new TransformNode(`aquaFish_${f}`, scene);
      const angle = (f / numFish) * Math.PI * 0.8 + 0.3; // Placed across the glass arch
      const radius = tunnelWidth / 2 - 0.4;
      const zPos = -tunnelLength / 2 + 2 + Math.random() * (tunnelLength - 4);

      fishNode.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius + 0.4,
        zPos
      );
      fishNode.parent = this.root;

      // Fish Body (elongated sphere)
      const fishBody = MeshBuilder.CreateSphere(`fishBody_${f}`, { diameterX: 0.35, diameterY: 0.2, diameterZ: 0.65 }, scene);
      fishBody.material = fishMat;
      fishBody.parent = fishNode;

      // Fish Tail
      const fishTail = MeshBuilder.CreateCylinder(`fishTail_${f}`, { height: 0.3, diameterTop: 0.35, diameterBottom: 0.05 }, scene);
      fishTail.rotation.x = Math.PI / 2;
      fishTail.position = new Vector3(0, 0, -0.42);
      fishTail.material = fishMat;
      fishTail.parent = fishNode;

      this.fishSilhouettes.push(fishNode);
    }

    // ── 6. Glowing Deep-Ocean Aqua Lighting ─────────────────────────────────
    this.aquaLight = new PointLight('aquaInteriorLight', new Vector3(0, 2.8, 0), scene);
    this.aquaLight.diffuse = Color3.FromHexString('#06B6D4');
    this.aquaLight.intensity = 2.2;
    this.aquaLight.range = 15;
    this.aquaLight.parent = this.root;

    if (scene.isPhysicsEnabled()) {
      PhysicsManager.addStaticBoxCollider(floor, scene, new Vector3(tunnelWidth, 0.4, tunnelLength));
      PhysicsManager.addStaticBoxCollider(entranceArch, scene, new Vector3(tunnelWidth + 1.2, 4.8, 0.8));
    }

    // ── 7. Swimming Animation & Water Caustic Pulse ──────────────────────────
    let time = 0;
    scene.onBeforeRenderObservable.add(() => {
      const dt = scene.getEngine().getDeltaTime() / 1000;
      time += dt;

      // Fish gentle swimming propulsion
      this.fishSilhouettes.forEach((fish, i) => {
        fish.position.z += Math.sin(time * 1.5 + i) * 0.015;
        fish.rotation.y = Math.sin(time * 2.5 + i) * 0.15;
      });

      // Atmospheric aquatic light caustic shimmer
      this.aquaLight.intensity = 2.0 + Math.sin(time * 3.0) * 0.4;
    });
  }
}
