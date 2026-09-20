/**
 * SelfieZone.ts — Miracle Garden Floral Heart Arch Tunnel & "I ❤️ KANNUR" Selfie Point
 * Signature photo-op attraction at Kannur Police Maidan Trade Fair & Carnivals.
 * Features:
 * - 5 giant illuminated heart-shaped floral arches creating a walk-through romantic tunnel
 * - Rich pink and red floral garland clusters with glowing fairy lights
 * - Giant 3D illuminated "I ❤️ KANNUR" photo monument with glowing red heart
 * - Havok physics colliders on the base structure
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

export class SelfieZone {
  public root: TransformNode;

  constructor(scene: Scene, position: Vector3, shadowCast?: (m: Mesh) => void) {
    this.root = new TransformNode('selfieZoneRoot', scene);
    this.root.position = position;

    // ── 1. Materials ──────────────────────────────────────────────────────────
    const roseRedMat = new PBRMaterial('szRoseRed', scene);
    roseRedMat.albedoColor = Color3.FromHexString('#E11D48');
    roseRedMat.roughness = 0.5;

    const rosePinkMat = new PBRMaterial('szRosePink', scene);
    rosePinkMat.albedoColor = Color3.FromHexString('#F472B6');
    rosePinkMat.roughness = 0.5;

    const leafGreenMat = new PBRMaterial('szLeafGreen', scene);
    leafGreenMat.albedoColor = Color3.FromHexString('#15803D');

    const fairyLightMat = new PBRMaterial('szFairyLight', scene);
    fairyLightMat.albedoColor = Color3.FromHexString('#FEF08A');
    fairyLightMat.emissiveColor = Color3.FromHexString('#FDE047');
    fairyLightMat.emissiveIntensity = 3.0;

    const whiteLetterMat = new PBRMaterial('szWhiteLetter', scene);
    whiteLetterMat.albedoColor = Color3.FromHexString('#FFFFFF');
    whiteLetterMat.roughness = 0.3;

    const redHeartMat = new PBRMaterial('szRedHeart', scene);
    redHeartMat.albedoColor = Color3.FromHexString('#DC2626');
    redHeartMat.emissiveColor = Color3.FromHexString('#EF4444');
    redHeartMat.emissiveIntensity = 1.8;

    // ── 2. Walkway Path ──────────────────────────────────────────────────────
    const path = MeshBuilder.CreateBox('szPath', { width: 4.5, height: 0.1, depth: 16 }, scene);
    path.position = new Vector3(0, 0.05, 0);
    path.material = leafGreenMat;
    path.parent = this.root;
    path.receiveShadows = true;

    // ── 3. Five Illuminated Heart Arches (Walk-Through Tunnel) ──────────────
    const numArches = 5;
    for (let a = 0; a < numArches; a++) {
      const zArch = -6 + a * 3.0;
      const archRoot = new TransformNode(`heartArch_${a}`, scene);
      archRoot.position = new Vector3(0, 0, zArch);
      archRoot.parent = this.root;

      // Left lobe of heart
      const leftLobe = MeshBuilder.CreateTorus(`heartLobeL_${a}`, {
        diameter: 3.2,
        thickness: 0.45,
        tessellation: 20,
      }, scene);
      leftLobe.position = new Vector3(-1.1, 2.8, 0);
      leftLobe.rotation.z = -Math.PI / 6;
      leftLobe.material = a % 2 === 0 ? roseRedMat : rosePinkMat;
      leftLobe.parent = archRoot;
      if (shadowCast) shadowCast(leftLobe);

      // Right lobe of heart
      const rightLobe = MeshBuilder.CreateTorus(`heartLobeR_${a}`, {
        diameter: 3.2,
        thickness: 0.45,
        tessellation: 20,
      }, scene);
      rightLobe.position = new Vector3(1.1, 2.8, 0);
      rightLobe.rotation.z = Math.PI / 6;
      rightLobe.material = a % 2 === 0 ? roseRedMat : rosePinkMat;
      rightLobe.parent = archRoot;
      if (shadowCast) shadowCast(rightLobe);

      // Fairy Lights along the arch (6 glowing bulbs per arch)
      for (let l = 0; l < 6; l++) {
        const lAngle = (l / 6) * Math.PI * 2;
        const bulb = MeshBuilder.CreateSphere(`bulb_${a}_${l}`, { diameter: 0.16 }, scene);
        bulb.position = new Vector3(Math.cos(lAngle) * 2.2, 2.8 + Math.sin(lAngle) * 1.4, 0.25);
        bulb.material = fairyLightMat;
        bulb.parent = archRoot;
      }
    }

    // ── 4. Giant 3D "I ❤️ KANNUR" Photo Display Monument ────────────────────
    const signRoot = new TransformNode('iLoveKannurSign', scene);
    signRoot.position = new Vector3(0, 0, 9.5);
    signRoot.parent = this.root;

    // "I" Pillar
    const letterI = MeshBuilder.CreateBox('letterI', { width: 0.8, height: 2.4, depth: 0.6 }, scene);
    letterI.position = new Vector3(-3.5, 1.2, 0);
    letterI.material = whiteLetterMat;
    letterI.parent = signRoot;
    if (shadowCast) shadowCast(letterI);

    // Giant "❤️" Heart
    const heartNode = new TransformNode('giantHeart', scene);
    heartNode.position = new Vector3(-1.8, 1.3, 0);
    heartNode.parent = signRoot;

    const hLobeL = MeshBuilder.CreateSphere('hLobeL', { diameter: 1.4 }, scene);
    hLobeL.position = new Vector3(-0.45, 0.45, 0);
    hLobeL.material = redHeartMat;
    hLobeL.parent = heartNode;

    const hLobeR = MeshBuilder.CreateSphere('hLobeR', { diameter: 1.4 }, scene);
    hLobeR.position = new Vector3(0.45, 0.45, 0);
    hLobeR.material = redHeartMat;
    hLobeR.parent = heartNode;

    const hCone = MeshBuilder.CreateCylinder('hCone', { height: 1.5, diameterTop: 1.8, diameterBottom: 0 }, scene);
    hCone.position = new Vector3(0, -0.3, 0);
    hCone.rotation.x = Math.PI;
    hCone.material = redHeartMat;
    hCone.parent = heartNode;
    if (shadowCast) shadowCast(hCone);

    // "KANNUR" Display Block
    const kannurBlock = MeshBuilder.CreateBox('kannurBlock', { width: 5.5, height: 2.2, depth: 0.6 }, scene);
    kannurBlock.position = new Vector3(2.5, 1.1, 0);
    kannurBlock.material = whiteLetterMat;
    kannurBlock.parent = signRoot;
    if (shadowCast) shadowCast(kannurBlock);

    // Warm Romantic Fairy Light
    const light = new PointLight('szLight', new Vector3(0, 3.5, 0), scene);
    light.diffuse = Color3.FromHexString('#FDE047');
    light.intensity = 1.8;
    light.range = 12;
    light.parent = this.root;

    if (scene.isPhysicsEnabled()) {
      PhysicsManager.addStaticBoxCollider(path, scene, new Vector3(4.5, 0.1, 16));
      PhysicsManager.addStaticBoxCollider(kannurBlock, scene, new Vector3(5.5, 2.2, 0.6));
    }
  }
}
