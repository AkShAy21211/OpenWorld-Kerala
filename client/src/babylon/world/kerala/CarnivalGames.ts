/**
 * CarnivalGames.ts — Traditional Kerala Carnival Game Booths
 * Features:
 * 1. Balloon Shooting Gallery (ബലൂൺ ഷൂട്ടിംഗ്): Air rifle gallery with a wall of 24 colorful balloons
 * 2. Ring Toss Prize Booth (വളയെറിയൽ): Stepped shelves with teddy bears, soft drink bottles, and plastic rings
 * 3. Havok physics static colliders
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

export class CarnivalGames {
  public root: TransformNode;

  constructor(scene: Scene, position: Vector3, shadowCast?: (m: Mesh) => void) {
    this.root = new TransformNode('carnivalGamesRoot', scene);
    this.root.position = position;

    // ── 1. Materials ──────────────────────────────────────────────────────────
    const woodMat = new PBRMaterial('cgWood', scene);
    woodMat.albedoColor = Color3.FromHexString('#5A3319');
    woodMat.roughness = 0.8;

    const redAwningMat = new PBRMaterial('cgRedAwning', scene);
    redAwningMat.albedoColor = Color3.FromHexString('#E11D48');

    const yellowMat = new PBRMaterial('cgYellow', scene);
    yellowMat.albedoColor = Color3.FromHexString('#FACC15');

    const balloonColors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

    // ── 2. Balloon Shooting Gallery (ബലൂൺ ഷൂട്ടിംഗ്) ──────────────────────────
    const shootingBooth = new TransformNode('balloonShootingBooth', scene);
    shootingBooth.position = new Vector3(-4.5, 0, 0);
    shootingBooth.parent = this.root;

    // Front Shooting Counter
    const shootCounter = MeshBuilder.CreateBox('shootCounter', { width: 4.5, height: 1.0, depth: 1.2 }, scene);
    shootCounter.position = new Vector3(0, 0.5, 1.6);
    shootCounter.material = woodMat;
    shootCounter.parent = shootingBooth;
    if (shadowCast) shadowCast(shootCounter);

    // Back Target Wall
    const targetWall = MeshBuilder.CreateBox('targetWall', { width: 4.5, height: 3.2, depth: 0.2 }, scene);
    targetWall.position = new Vector3(0, 1.8, -1.6);
    targetWall.material = woodMat;
    targetWall.parent = shootingBooth;
    if (shadowCast) shadowCast(targetWall);

    // Grid of 24 Colorful Inflated Balloons on the Target Wall
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        const bX = -1.8 + col * 0.72;
        const bY = 1.0 + row * 0.65;
        const bMat = new PBRMaterial(`balloonMat_${row}_${col}`, scene);
        const colHex = balloonColors[(row * 6 + col) % balloonColors.length];
        bMat.albedoColor = Color3.FromHexString(colHex);
        bMat.roughness = 0.25;

        const balloon = MeshBuilder.CreateSphere(`balloon_${row}_${col}`, {
          diameterX: 0.38,
          diameterY: 0.48,
          diameterZ: 0.38,
        }, scene);
        balloon.position = new Vector3(bX, bY, -1.45);
        balloon.material = bMat;
        balloon.parent = shootingBooth;
      }
    }

    // 2 Air Rifles resting on counter
    [-1.0, 1.0].forEach((xGun, gIdx) => {
      const rifle = MeshBuilder.CreateCylinder(`airRifle_${gIdx}`, { height: 1.1, diameter: 0.04 }, scene);
      rifle.rotation.x = Math.PI / 2;
      rifle.position = new Vector3(xGun, 1.05, 1.6);
      rifle.material = yellowMat;
      rifle.parent = shootingBooth;
    });

    // ── 3. Ring Toss Game Booth (വളയെറിയൽ) ──────────────────────────────────
    const ringBooth = new TransformNode('ringTossBooth', scene);
    ringBooth.position = new Vector3(4.5, 0, 0);
    ringBooth.parent = this.root;

    // Front Counter
    const ringCounter = MeshBuilder.CreateBox('ringCounter', { width: 4.5, height: 1.0, depth: 1.2 }, scene);
    ringCounter.position = new Vector3(0, 0.5, 1.6);
    ringCounter.material = woodMat;
    ringCounter.parent = ringBooth;
    if (shadowCast) shadowCast(ringCounter);

    // Stepped Prize Tier Shelf
    for (let tier = 0; tier < 3; tier++) {
      const shelf = MeshBuilder.CreateBox(`shelf_${tier}`, { width: 4.2, height: 0.35 * (3 - tier), depth: 0.6 }, scene);
      shelf.position = new Vector3(0, (0.35 * (3 - tier)) / 2, -1.2 + tier * 0.7);
      shelf.material = woodMat;
      shelf.parent = ringBooth;

      // Prize Bottles on shelf
      for (let b = 0; b < 4; b++) {
        const bottle = MeshBuilder.CreateCylinder(`bottle_${tier}_${b}`, { height: 0.5, diameter: 0.16 }, scene);
        bottle.position = new Vector3(-1.5 + b * 1.0, 0.35 * (3 - tier) + 0.25, -1.2 + tier * 0.7);
        bottle.material = yellowMat;
        bottle.parent = ringBooth;
      }
    }

    // Stack of Plastic Toss Rings on Counter
    const ringMat = new PBRMaterial('cgRingMat', scene);
    ringMat.albedoColor = Color3.FromHexString('#EC4899');
    for (let r = 0; r < 4; r++) {
      const ring = MeshBuilder.CreateTorus(`tossRing_${r}`, { diameter: 0.32, thickness: 0.04 }, scene);
      ring.position = new Vector3(0, 1.05 + r * 0.05, 1.6);
      ring.material = ringMat;
      ring.parent = ringBooth;
    }

    if (scene.isPhysicsEnabled()) {
      PhysicsManager.addStaticBoxCollider(shootCounter, scene, new Vector3(4.5, 1.0, 1.2));
      PhysicsManager.addStaticBoxCollider(targetWall, scene, new Vector3(4.5, 3.2, 0.2));
      PhysicsManager.addStaticBoxCollider(ringCounter, scene, new Vector3(4.5, 1.0, 1.2));
    }
  }
}
