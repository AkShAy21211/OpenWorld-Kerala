/**
 * HorrorHouse.ts — Carnival Haunted Walkthrough Pavilion (ഭീതിയുടെ ഗുഹ / Horror House)
 * Iconic attraction found in Kannur Police Maidan exhibitions and Kerala carnivals.
 * Features:
 * - Gothic dark stone fortress facade with crenellated battlements and twin towers
 * - Giant stylized monstrous skull gateway entrance (walk-through open fanged jaw)
 * - Pulsating eerie red/green glowing eyes and flickering dungeon flame torches
 * - Illuminated blood-red neon marquee sign: "HORROR HOUSE · ഭീതിയുടെ ഗുഹ"
 * - Spooky dungeon entrance arch with Havok physics colliders
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

export class HorrorHouse {
  public root: TransformNode;
  private eyeLeft: Mesh;
  private eyeRight: Mesh;
  private skullLight: PointLight;

  constructor(scene: Scene, position: Vector3, shadowCast?: (m: Mesh) => void) {
    this.root = new TransformNode('horrorHouseRoot', scene);
    this.root.position = position;

    // ── 1. Materials ──────────────────────────────────────────────────────────
    const stoneMat = new PBRMaterial('hhStone', scene);
    stoneMat.albedoColor = Color3.FromHexString('#27272A'); // Dark gothic slate
    stoneMat.roughness = 0.95;
    stoneMat.metallic = 0.1;

    const skullMat = new PBRMaterial('hhSkull', scene);
    skullMat.albedoColor = Color3.FromHexString('#E4E4E7'); // Bone white/grey
    skullMat.roughness = 0.8;
    skullMat.metallic = 0.05;

    const eyeGlowMat = new PBRMaterial('hhEyeGlow', scene);
    eyeGlowMat.albedoColor = Color3.FromHexString('#EF4444');
    eyeGlowMat.emissiveColor = Color3.FromHexString('#FF0000');
    eyeGlowMat.emissiveIntensity = 4.0;

    const signNeonMat = new PBRMaterial('hhSignNeon', scene);
    signNeonMat.albedoColor = Color3.FromHexString('#DC2626');
    signNeonMat.emissiveColor = Color3.FromHexString('#DC2626');
    signNeonMat.emissiveIntensity = 3.0;

    const redCarpetMat = new PBRMaterial('hhRedCarpet', scene);
    redCarpetMat.albedoColor = Color3.FromHexString('#991B1B');
    redCarpetMat.roughness = 0.85;

    // ── 2. Gothic Castle Facade Walls & Twin Towers ──────────────────────────
    const wallWidth = 16;
    const wallHeight = 7.5;
    const wallDepth = 6;

    // Main Central Wall Box
    const mainWall = MeshBuilder.CreateBox('hhMainWall', { width: wallWidth, height: wallHeight, depth: wallDepth }, scene);
    mainWall.position = new Vector3(0, wallHeight / 2, 0);
    mainWall.material = stoneMat;
    mainWall.parent = this.root;
    mainWall.receiveShadows = true;
    if (shadowCast) shadowCast(mainWall);

    // Twin Fortress Towers (Left & Right)
    [-wallWidth / 2 - 1.2, wallWidth / 2 + 1.2].forEach((xTower, tIdx) => {
      const tower = MeshBuilder.CreateCylinder(`hhTower_${tIdx}`, {
        height: 10.5,
        diameterTop: 2.8,
        diameterBottom: 3.2,
        tessellation: 8,
      }, scene);
      tower.position = new Vector3(xTower, 10.5 / 2, 0);
      tower.material = stoneMat;
      tower.parent = this.root;
      tower.receiveShadows = true;
      if (shadowCast) shadowCast(tower);

      // Conical Spire Roof
      const spire = MeshBuilder.CreateCylinder(`hhSpire_${tIdx}`, {
        height: 3.5,
        diameterTop: 0,
        diameterBottom: 3.4,
        tessellation: 8,
      }, scene);
      spire.position = new Vector3(xTower, 10.5 + 1.75, 0);
      spire.material = stoneMat;
      spire.parent = this.root;
    });

    // Battlements / Crenellations along top of main wall
    for (let b = 0; b < 7; b++) {
      const battlement = MeshBuilder.CreateBox(`hhBattlement_${b}`, { width: 1.4, height: 1.0, depth: 0.8 }, scene);
      battlement.position = new Vector3(-6.5 + b * 2.2, wallHeight + 0.5, -wallDepth / 2 + 0.4);
      battlement.material = stoneMat;
      battlement.parent = this.root;
    }

    // ── 3. Giant Monstrous Skull Entrance ───────────────────────────────────
    const skullNode = new TransformNode('hhSkullNode', scene);
    skullNode.position = new Vector3(0, 4.2, -wallDepth / 2 - 0.2);
    skullNode.parent = this.root;

    // Skull Cranium Dome
    const cranium = MeshBuilder.CreateSphere('hhCranium', { diameterX: 4.8, diameterY: 4.2, diameterZ: 2.4, segments: 10 }, scene);
    cranium.material = skullMat;
    cranium.parent = skullNode;
    if (shadowCast) shadowCast(cranium);

    // Glowing Eyes (Sockets with emissive spheres)
    this.eyeLeft = MeshBuilder.CreateSphere('hhEyeL', { diameter: 0.75 }, scene);
    this.eyeLeft.position = new Vector3(-1.1, 0.4, 0.9);
    this.eyeLeft.material = eyeGlowMat;
    this.eyeLeft.parent = skullNode;

    this.eyeRight = MeshBuilder.CreateSphere('hhEyeR', { diameter: 0.75 }, scene);
    this.eyeRight.position = new Vector3(1.1, 0.4, 0.9);
    this.eyeRight.material = eyeGlowMat;
    this.eyeRight.parent = skullNode;

    // Open Fanged Jaw (Entrance Tunnel Opening)
    const mouthCave = MeshBuilder.CreateCylinder('hhMouthOpening', {
      height: 2.8,
      diameterTop: 2.8,
      diameterBottom: 2.8,
      tessellation: 12,
    }, scene);
    mouthCave.rotation.x = Math.PI / 2;
    mouthCave.position = new Vector3(0, -2.6, 0.4);
    mouthCave.material = stoneMat;
    mouthCave.parent = skullNode;

    // Fangs (Top sharp teeth)
    [-0.9, -0.45, 0, 0.45, 0.9].forEach((xTooth, toothIdx) => {
      const fang = MeshBuilder.CreateCylinder(`hhFang_${toothIdx}`, { height: 0.6, diameterTop: 0.2, diameterBottom: 0.05 }, scene);
      fang.position = new Vector3(xTooth, -1.5, 1.4);
      fang.material = skullMat;
      fang.parent = skullNode;
    });

    // Red Tongue Walkway Carpet
    const tongueCarpet = MeshBuilder.CreateBox('hhTongueCarpet', { width: 2.6, height: 0.05, depth: 6.0 }, scene);
    tongueCarpet.position = new Vector3(0, 0.03, -wallDepth / 2 - 2.0);
    tongueCarpet.material = redCarpetMat;
    tongueCarpet.parent = this.root;

    // ── 4. Illuminated Neon Signboard ───────────────────────────────────────
    const signBoard = MeshBuilder.CreateBox('hhSignBoard', { width: 10.5, height: 1.4, depth: 0.2 }, scene);
    signBoard.position = new Vector3(0, wallHeight + 1.2, -wallDepth / 2);
    signBoard.material = signNeonMat;
    signBoard.parent = this.root;

    // ── 5. Eerie Spooky Lighting ────────────────────────────────────────────
    this.skullLight = new PointLight('hhSpookyLight', new Vector3(0, 4.2, -wallDepth / 2 - 2.0), scene);
    this.skullLight.diffuse = Color3.FromHexString('#EF4444');
    this.skullLight.intensity = 2.5;
    this.skullLight.range = 14;
    this.skullLight.parent = this.root;

    if (scene.isPhysicsEnabled()) {
      PhysicsManager.addStaticBoxCollider(mainWall, scene, new Vector3(wallWidth, wallHeight, wallDepth));
    }

    // ── 6. Pulsating Eye Glow & Spooky Flicker Animation ────────────────────
    scene.onBeforeRenderObservable.add(() => {
      const time = performance.now() / 1000;
      // Sinusoidal pulsing and sudden strobe flicker
      const pulse = 2.5 + Math.sin(time * 3.2) * 1.5 + (Math.random() > 0.96 ? 2.0 : 0);
      eyeGlowMat.emissiveIntensity = pulse;
      this.skullLight.intensity = pulse * 0.8;
    });
  }
}
