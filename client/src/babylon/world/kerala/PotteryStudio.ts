/**
 * PotteryStudio.ts — Traditional Kerala Pottery & Nilavilakku Shaping Studio (മൺപാത്ര നിർമ്മാണം)
 * Features:
 * - Heavy stone/terracotta foot-powered potter's wheel (കുലാല ചക്രം) on iron pivot
 * - Revolving wet clay mass being sculpted into Nilavilakku oil lamps and Urulis
 * - Water basin urn for clay wetting and shaping wooden rib tools
 * - Multi-tier wooden drying shelf displaying freshly thrown terracotta pots
 * - Traditional brick kiln (ചൂള) with glowing embers
 * - Continuous wheel rotation and shaping animation
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

export class PotteryStudio {
  public root: TransformNode;
  private wheelHead: TransformNode;
  private wetClayMesh: Mesh;

  constructor(scene: Scene, position: Vector3, shadowCast?: (m: Mesh) => void) {
    this.root = new TransformNode('potteryStudioRoot', scene);
    this.root.position = position;

    // ── 1. Materials ──────────────────────────────────────────────────────────
    const woodMat = new PBRMaterial('potteryWoodMat', scene);
    woodMat.albedoColor = Color3.FromHexString('#5D4037');
    woodMat.roughness = 0.85;

    const stoneMat = new PBRMaterial('potteryStoneMat', scene);
    stoneMat.albedoColor = Color3.FromHexString('#4B5563'); // Heavy stone flywheel
    stoneMat.roughness = 0.9;

    const wetClayMat = new PBRMaterial('wetClayMat', scene);
    wetClayMat.albedoColor = Color3.FromHexString('#8D5B4C'); // Wet red alluvial clay
    wetClayMat.roughness = 0.35; // Wet sheen
    wetClayMat.metallic = 0.05;

    const terracottaMat = new PBRMaterial('terracottaMat', scene);
    terracottaMat.albedoColor = Color3.FromHexString('#C85A32'); // Fired terracotta
    terracottaMat.roughness = 0.75;

    const brickMat = new PBRMaterial('kilnBrickMat', scene);
    brickMat.albedoColor = Color3.FromHexString('#7F1D1D'); // Heat-baked red bricks
    brickMat.roughness = 0.9;

    const emberMat = new PBRMaterial('kilnEmberMat', scene);
    emberMat.albedoColor = Color3.FromHexString('#F97316');
    emberMat.emissiveColor = Color3.FromHexString('#EF4444');
    emberMat.emissiveIntensity = 2.5;

    // ── 2. Studio Platform & Thatched Canopy ────────────────────────────────
    const platform = MeshBuilder.CreateBox('potteryPlatform', { width: 7.0, height: 0.35, depth: 6.0 }, scene);
    platform.position = new Vector3(0, 0.17, 0);
    platform.material = woodMat;
    platform.receiveShadows = true;
    platform.parent = this.root;

    if (scene.isPhysicsEnabled()) {
      PhysicsManager.addStaticBoxCollider(platform, scene, new Vector3(7.0, 0.35, 6.0));
    }

    // ── 3. Foot-Powered Potter's Wheel (കുലാല ചക്രം) ──────────────────────────
    const wheelStand = MeshBuilder.CreateCylinder('potteryWheelStand', { height: 0.45, diameter: 0.5 }, scene);
    wheelStand.position = new Vector3(-1.2, 0.55, 0);
    wheelStand.material = stoneMat;
    wheelStand.parent = this.root;

    this.wheelHead = new TransformNode('potteryWheelRotatingHead', scene);
    this.wheelHead.position = new Vector3(-1.2, 0.8, 0);
    this.wheelHead.parent = this.root;

    // Heavy disc flywheel
    const wheelDisc = MeshBuilder.CreateCylinder('potteryWheelDisc', { height: 0.12, diameter: 1.5, tessellation: 24 }, scene);
    wheelDisc.material = stoneMat;
    wheelDisc.parent = this.wheelHead;
    if (shadowCast) shadowCast(wheelDisc);

    // Wet Clay Lump / Shaped Nilavilakku on wheel
    this.wetClayMesh = MeshBuilder.CreateCylinder('revolvingClayLump', {
      height: 0.65,
      diameterTop: 0.4,
      diameterBottom: 0.7,
      tessellation: 16,
    }, scene);
    this.wetClayMesh.position = new Vector3(0, 0.35, 0);
    this.wetClayMesh.material = wetClayMat;
    this.wetClayMesh.parent = this.wheelHead;
    if (shadowCast) shadowCast(this.wetClayMesh);

    // Clay Water Basin (തൊട്ടി)
    const waterBasin = MeshBuilder.CreateCylinder('clayWaterBasin', { height: 0.45, diameter: 0.65, tessellation: 12 }, scene);
    waterBasin.position = new Vector3(-0.2, 0.55, -0.9);
    waterBasin.material = terracottaMat;
    waterBasin.parent = this.root;

    // ── 4. Multi-tier Drying Shelf with Terracotta Pots ──────────────────────
    const shelfNode = new TransformNode('potteryDryingShelf', scene);
    shelfNode.position = new Vector3(-2.2, 0.35, 1.8);
    shelfNode.parent = this.root;

    // 3 Wooden Planks
    [0.4, 0.9, 1.4].forEach((yTier, tIdx) => {
      const plank = MeshBuilder.CreateBox(`shelfPlank_${tIdx}`, { width: 1.8, height: 0.06, depth: 0.6 }, scene);
      plank.position = new Vector3(0, yTier, 0);
      plank.material = woodMat;
      plank.parent = shelfNode;

      // Display pots & Nilavilakku on each shelf
      [-0.5, 0, 0.5].forEach((xPot, pIdx) => {
        const pot = MeshBuilder.CreateSphere(`shelfPot_${tIdx}_${pIdx}`, { diameter: 0.3 }, scene);
        pot.position = new Vector3(xPot, yTier + 0.18, 0);
        pot.material = terracottaMat;
        pot.parent = shelfNode;
      });
    });

    // ── 5. Wood-Fired Brick Kiln (ചൂള) with Glowing Embers ───────────────────
    const kilnNode = new TransformNode('brickKiln', scene);
    kilnNode.position = new Vector3(2.0, 0.35, 0.5);
    kilnNode.parent = this.root;

    // Dome shaped brick kiln chamber
    const kilnDome = MeshBuilder.CreateSphere('kilnDome', { diameter: 2.2, slice: 0.6 }, scene);
    kilnDome.position = new Vector3(0, 0.9, 0);
    kilnDome.material = brickMat;
    kilnDome.parent = kilnNode;
    if (shadowCast) shadowCast(kilnDome);

    // Chimney pipe
    const chimney = MeshBuilder.CreateCylinder('kilnChimney', { height: 1.6, diameter: 0.4 }, scene);
    chimney.position = new Vector3(0, 2.2, 0);
    chimney.material = brickMat;
    chimney.parent = kilnNode;

    // Kiln fire opening with glowing heat
    const fireOpening = MeshBuilder.CreateBox('kilnFireOpening', { width: 0.8, height: 0.7, depth: 0.3 }, scene);
    fireOpening.position = new Vector3(0, 0.4, -0.95);
    fireOpening.material = emberMat;
    fireOpening.parent = kilnNode;

    const fireLight = new PointLight('kilnFireLight', new Vector3(0, 0.5, -1.1), scene);
    fireLight.diffuse = Color3.FromHexString('#FF6600');
    fireLight.intensity = 0.8;
    fireLight.range = 7;
    fireLight.parent = kilnNode;

    // Signpost
    const signBoard = MeshBuilder.CreatePlane('potterySignBoard', { width: 2.8, height: 0.9 }, scene);
    signBoard.position = new Vector3(0, 2.6, -3.1);
    const signMat = new PBRMaterial('potterySignMat', scene);
    signMat.albedoColor = Color3.FromHexString('#B45309');
    signBoard.material = signMat;
    signBoard.parent = this.root;

    // ── 6. Continuous Wheel Spinning Animation Loop ──────────────────────────
    scene.onBeforeRenderObservable.add(() => {
      const dt = scene.getEngine().getDeltaTime() / 1000;
      this.wheelHead.rotation.y += 2.5 * dt;
    });
  }
}
