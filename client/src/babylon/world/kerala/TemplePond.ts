/**
 * TemplePond.ts — Traditional Kerala Temple Pond (അമ്പലക്കുളം / Ambalakkulam)
 * Features:
 * - 4-tiered carved laterite stone steps (പടവുകൾ) leading down to the water
 * - Carved stone corner lamp pillars (വിളക്കുമാടം)
 * - Central stone holy island with mini-mandapam and brass oil lamp
 * - Floating lotus pads (താമരയില) and blossoming pink lotus flowers (താമര)
 * - Reflective water surface with wave ripple animation
 * - Havok physics colliders on steps and walkways
 */

import {
  Scene,
  TransformNode,
  MeshBuilder,
  PBRMaterial,
  Color3,
  Color4,
  Vector3,
  Mesh,
  StandardMaterial,
  DynamicTexture,
} from '@babylonjs/core';
import { PhysicsManager } from '../../physics/PhysicsManager';

export class TemplePond {
  public root: TransformNode;

  constructor(scene: Scene, position: Vector3, shadowCast?: (m: Mesh) => void) {
    this.root = new TransformNode('templePondRoot', scene);
    this.root.position = position;

    // ── 1. Materials ──────────────────────────────────────────────────────────
    // Laterite stone (വെട്ടുകല്ല്)
    const lateriteMat = new PBRMaterial('pondLaterite', scene);
    lateriteMat.albedoColor = Color3.FromHexString('#7A3818');
    lateriteMat.roughness = 0.88;
    lateriteMat.metallic = 0.0;

    // Granite coping stone (കരിങ്കല്ല്)
    const graniteMat = new PBRMaterial('pondGranite', scene);
    graniteMat.albedoColor = Color3.FromHexString('#4A4644');
    graniteMat.roughness = 0.75;
    graniteMat.metallic = 0.1;

    // Water Material (reflection & deep emerald-blue)
    const waterMat = new PBRMaterial('pondWaterMat', scene);
    waterMat.albedoColor = new Color3(0.04, 0.28, 0.38);
    waterMat.roughness = 0.05;
    waterMat.metallic = 0.25;
    waterMat.alpha = 0.88;

    // Lotus leaf & flower materials
    const lotusLeafMat = new PBRMaterial('lotusLeafMat', scene);
    lotusLeafMat.albedoColor = Color3.FromHexString('#2E7D32');
    lotusLeafMat.roughness = 0.6;
    lotusLeafMat.metallic = 0.0;

    const lotusFlowerMat = new PBRMaterial('lotusFlowerMat', scene);
    lotusFlowerMat.albedoColor = Color3.FromHexString('#F472B6'); // Lotus pink
    lotusFlowerMat.roughness = 0.5;
    lotusFlowerMat.metallic = 0.0;

    const goldMat = new PBRMaterial('pondGoldMat', scene);
    goldMat.albedoColor = Color3.FromHexString('#FFD700');
    goldMat.roughness = 0.3;
    goldMat.metallic = 0.85;

    // ── 2. Stepped Stone Ghats (4 tiers of steps on all 4 sides) ─────────────
    const pondWidth = 22; // X
    const pondDepth = 16; // Z
    const numSteps = 4;
    const stepHeight = 0.35;
    const stepRun = 0.7;

    for (let step = 0; step < numSteps; step++) {
      const curW = pondWidth - step * stepRun * 2;
      const curD = pondDepth - step * stepRun * 2;
      const yPos = -step * stepHeight;

      // North step
      const stepN = MeshBuilder.CreateBox(`pondStepN_${step}`, { width: curW, height: stepHeight, depth: stepRun }, scene);
      stepN.position = new Vector3(0, yPos - stepHeight / 2, curD / 2 - stepRun / 2);
      stepN.material = step === 0 ? graniteMat : lateriteMat;
      stepN.parent = this.root;
      stepN.receiveShadows = true;

      // South step
      const stepS = MeshBuilder.CreateBox(`pondStepS_${step}`, { width: curW, height: stepHeight, depth: stepRun }, scene);
      stepS.position = new Vector3(0, yPos - stepHeight / 2, -curD / 2 + stepRun / 2);
      stepS.material = step === 0 ? graniteMat : lateriteMat;
      stepS.parent = this.root;
      stepS.receiveShadows = true;

      // East step
      const stepE = MeshBuilder.CreateBox(`pondStepE_${step}`, { width: stepRun, height: stepHeight, depth: curD - stepRun * 2 }, scene);
      stepE.position = new Vector3(curW / 2 - stepRun / 2, yPos - stepHeight / 2, 0);
      stepE.material = step === 0 ? graniteMat : lateriteMat;
      stepE.parent = this.root;
      stepE.receiveShadows = true;

      // West step
      const stepW = MeshBuilder.CreateBox(`pondStepW_${step}`, { width: stepRun, height: stepHeight, depth: curD - stepRun * 2 }, scene);
      stepW.position = new Vector3(-curW / 2 + stepRun / 2, yPos - stepHeight / 2, 0);
      stepW.material = step === 0 ? graniteMat : lateriteMat;
      stepW.parent = this.root;
      stepW.receiveShadows = true;

      if (scene.isPhysicsEnabled() && step === 0) {
        PhysicsManager.addStaticBoxCollider(stepN, scene);
        PhysicsManager.addStaticBoxCollider(stepS, scene);
        PhysicsManager.addStaticBoxCollider(stepE, scene);
        PhysicsManager.addStaticBoxCollider(stepW, scene);
      }
    }

    // ── 3. Water Surface ─────────────────────────────────────────────────────
    const waterW = pondWidth - numSteps * stepRun * 2 + 0.2;
    const waterD = pondDepth - numSteps * stepRun * 2 + 0.2;
    const water = MeshBuilder.CreateGround('pondWater', { width: waterW, height: waterD, subdivisions: 8 }, scene);
    water.position = new Vector3(0, -numSteps * stepHeight + 0.15, 0);
    water.material = waterMat;
    water.parent = this.root;

    // ── 4. Corner Carved Lamp Pillars (4 corners) ────────────────────────────
    const cornerOffsets = [
      [-pondWidth / 2, -pondDepth / 2],
      [pondWidth / 2, -pondDepth / 2],
      [-pondWidth / 2, pondDepth / 2],
      [pondWidth / 2, pondDepth / 2],
    ];

    cornerOffsets.forEach(([cx, cz], i) => {
      // Pillar base
      const pillar = MeshBuilder.CreateCylinder(`pondCornerPillar_${i}`, {
        height: 2.2,
        diameterTop: 0.5,
        diameterBottom: 0.7,
        tessellation: 8,
      }, scene);
      pillar.position = new Vector3(cx, 1.1, cz);
      pillar.material = graniteMat;
      pillar.parent = this.root;
      pillar.receiveShadows = true;
      if (shadowCast) shadowCast(pillar);

      // Brass lamp cap
      const lampCap = MeshBuilder.CreateSphere(`pondLampCap_${i}`, { diameter: 0.45, segments: 6 }, scene);
      lampCap.position = new Vector3(cx, 2.3, cz);
      const capMat = new PBRMaterial(`pondCapMat_${i}`, scene);
      capMat.albedoColor = Color3.FromHexString('#FFD700');
      capMat.emissiveColor = Color3.FromHexString('#FF9900');
      capMat.emissiveIntensity = 1.2;
      lampCap.material = capMat;
      lampCap.parent = this.root;

      if (scene.isPhysicsEnabled()) {
        PhysicsManager.addStaticBoxCollider(pillar, scene, new Vector3(0.8, 2.2, 0.8));
      }
    });

    // ── 5. Central Holy Island & Mandapam ────────────────────────────────────
    const island = MeshBuilder.CreateCylinder('pondIsland', { height: 1.2, diameter: 3.5, tessellation: 12 }, scene);
    island.position = new Vector3(0, -numSteps * stepHeight + 0.6, 0);
    island.material = graniteMat;
    island.parent = this.root;
    island.receiveShadows = true;
    if (shadowCast) shadowCast(island);

    // Mini Mandapam pillars (4 granite pillars)
    const mandapamPillars = [
      [-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8],
    ];
    mandapamPillars.forEach(([px, pz], pi) => {
      const p = MeshBuilder.CreateCylinder(`pondMandapamPillar_${pi}`, { height: 1.8, diameter: 0.18 }, scene);
      p.position = new Vector3(px, -numSteps * stepHeight + 1.2 + 0.9, pz);
      p.material = graniteMat;
      p.parent = this.root;
      if (shadowCast) shadowCast(p);
    });

    // Mandapam pyramid roof
    const mandapamRoof = MeshBuilder.CreateCylinder('pondMandapamRoof', {
      height: 1.0,
      diameterTop: 0,
      diameterBottom: 2.4,
      tessellation: 4,
    }, scene);
    mandapamRoof.position = new Vector3(0, -numSteps * stepHeight + 1.2 + 1.8 + 0.5, 0);
    mandapamRoof.rotation.y = Math.PI / 4;
    mandapamRoof.material = lateriteMat;
    mandapamRoof.parent = this.root;
    if (shadowCast) shadowCast(mandapamRoof);

    // Center Gold Nilavilakku in the Mandapam
    const centerLamp = MeshBuilder.CreateCylinder('pondCenterLamp', { height: 1.1, diameterTop: 0.4, diameterBottom: 0.3 }, scene);
    centerLamp.position = new Vector3(0, -numSteps * stepHeight + 1.2 + 0.55, 0);
    centerLamp.material = goldMat;
    centerLamp.parent = this.root;

    // ── 6. Floating Lotus Pads & Flowers ─────────────────────────────────────
    const lotusSpots = [
      [-3.5, -2.5], [-2.8, 2.2], [3.2, -1.8], [2.6, 2.5],
      [-4.2, 0.5], [4.0, 0.8], [1.2, -3.5], [-1.5, 3.2],
    ];

    lotusSpots.forEach(([lx, lz], li) => {
      // Round pad
      const pad = MeshBuilder.CreateDisc(`lotusPad_${li}`, { radius: 0.55 + Math.random() * 0.25, tessellation: 12 }, scene);
      pad.rotation.x = Math.PI / 2;
      pad.position = new Vector3(lx, -numSteps * stepHeight + 0.17, lz);
      pad.material = lotusLeafMat;
      pad.parent = this.root;

      // Lotus blossom (cone petals)
      if (li % 2 === 0) {
        const flower = MeshBuilder.CreateCylinder(`lotusFlower_${li}`, {
          height: 0.35,
          diameterTop: 0.4,
          diameterBottom: 0.05,
          tessellation: 8,
        }, scene);
        flower.position = new Vector3(lx, -numSteps * stepHeight + 0.3, lz);
        flower.material = lotusFlowerMat;
        flower.parent = this.root;
      }
    });

    // ── 7. Water Gentle Ripple Animation ─────────────────────────────────────
    let time = 0;
    scene.onBeforeRenderObservable.add(() => {
      const dt = scene.getEngine().getDeltaTime() / 1000;
      time += dt;
      water.position.y = -numSteps * stepHeight + 0.15 + Math.sin(time * 1.8) * 0.02;
    });
  }
}
