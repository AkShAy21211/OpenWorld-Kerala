/**
 * terrain.ts — Kerala Fair Grounds (ground, pathways, perimeter)
 * All geometry is procedural — no external assets needed.
 */

import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  PBRMaterial,
  Color3,
  Vector3,
  Texture,
  DynamicTexture,
  Mesh,
} from '@babylonjs/core';
import { PhysicsManager } from '../physics/PhysicsManager';

// ── Utility: create a PBR material with given albedo colour ─────────────────
function makePBR(name: string, hex: string, roughness: number, scene: Scene): PBRMaterial {
  const mat = new PBRMaterial(name, scene);
  mat.albedoColor = Color3.FromHexString(hex);
  mat.roughness = roughness;
  mat.metallic = 0;
  return mat;
}

/** Procedural grass texture using DynamicTexture */
function makeGrassTexture(scene: Scene): DynamicTexture {
  const size = 512;
  const tex = new DynamicTexture('grassTex', { width: size, height: size }, scene, false);
  const ctx = tex.getContext();

  // Base green
  ctx.fillStyle = '#3B6E2A';
  ctx.fillRect(0, 0, size, size);

  // Random blade variation
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const g = Math.floor(80 + Math.random() * 60);
    ctx.fillStyle = `rgb(${20 + Math.floor(Math.random() * 30)}, ${g}, 20)`;
    ctx.fillRect(x, y, 2, 4);
  }

  tex.update();
  tex.uScale = 20;
  tex.vScale = 20;
  return tex;
}

/** Procedural laterite/terracotta path texture */
function makeLateriteTexture(scene: Scene): DynamicTexture {
  const size = 256;
  const tex = new DynamicTexture('lateriteTex', { width: size, height: size }, scene, false);
  const ctx = tex.getContext();

  ctx.fillStyle = '#8B4513';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 800; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const shade = Math.floor(120 + Math.random() * 60);
    ctx.fillStyle = `rgb(${shade}, ${Math.floor(shade * 0.45)}, ${Math.floor(shade * 0.12)})`;
    ctx.fillRect(x, y, 3 + Math.random() * 6, 3 + Math.random() * 6);
  }

  tex.update();
  tex.uScale = 8;
  tex.vScale = 8;
  return tex;
}

export function buildTerrain(scene: Scene) {
  // ── Main grass maidan (200×200) ──────────────────────────────────────────
  const ground = MeshBuilder.CreateGround('maidan', {
    width: 200,
    height: 200,
    subdivisions: 4,
  }, scene);
  ground.receiveShadows = true;
  ground.checkCollisions = true;

  const grassMat = new PBRMaterial('grassMat', scene);
  grassMat.albedoTexture = makeGrassTexture(scene);
  grassMat.roughness = 0.92;
  grassMat.metallic = 0;
  ground.material = grassMat;

  // ── Physics Colliders (Havok Physics V2) ──────────────────────────────────
  if (scene.isPhysicsEnabled()) {
    PhysicsManager.addStaticGroundCollider(ground, scene, 200, 200);
  }

  // ── Central cruciform pathways (terracotta laterite) ─────────────────────
  const lateriteMat = new PBRMaterial('lateriteMat', scene);
  lateriteMat.albedoTexture = makeLateriteTexture(scene);
  lateriteMat.roughness = 0.88;
  lateriteMat.metallic = 0;

  // North–South path
  const pathNS = MeshBuilder.CreateGround('pathNS', { width: 6, height: 160 }, scene);
  pathNS.position = new Vector3(0, 0.01, 0);
  pathNS.material = lateriteMat;
  pathNS.receiveShadows = true;

  // East–West path
  const pathEW = MeshBuilder.CreateGround('pathEW', { width: 160, height: 6 }, scene);
  pathEW.position = new Vector3(0, 0.01, 0);
  pathEW.material = lateriteMat;
  pathEW.receiveShadows = true;

  // ── Perimeter low stone wall (4 sides) ──────────────────────────────────
  const stoneMat = makePBR('stoneMat', '#7A6B55', 0.95, scene);
  const wallH = 1.2, wallT = 0.6;
  const wallLength = 200;

  const wallDefs = [
    { name: 'wallN', pos: new Vector3(0, wallH / 2, -100), size: { width: wallLength, height: wallH, depth: wallT } },
    { name: 'wallS', pos: new Vector3(0, wallH / 2, 100),  size: { width: wallLength, height: wallH, depth: wallT } },
    { name: 'wallW', pos: new Vector3(-100, wallH / 2, 0), size: { width: wallT, height: wallH, depth: wallLength } },
    { name: 'wallE', pos: new Vector3(100, wallH / 2, 0),  size: { width: wallT, height: wallH, depth: wallLength } },
  ];

  wallDefs.forEach(({ name, pos, size }) => {
    const wall = MeshBuilder.CreateBox(name, size, scene);
    wall.position = pos;
    wall.material = stoneMat;
    wall.receiveShadows = true;
    wall.checkCollisions = true;
    if (scene.isPhysicsEnabled()) {
      PhysicsManager.addStaticBoxCollider(wall, scene, new Vector3(size.width, size.height, size.depth));
    }
  });

  // ── Backwater canal strip ────────────────────────────────────────────────
  const waterMat = new PBRMaterial('waterMat', scene);
  waterMat.albedoColor = new Color3(0.05, 0.38, 0.52);
  waterMat.roughness = 0.05;
  waterMat.metallic = 0.15;
  waterMat.alpha = 0.85;

  const canal = MeshBuilder.CreateGround('canal', { width: 12, height: 70, subdivisions: 2 }, scene);
  canal.position = new Vector3(0, 0.02, 20);
  canal.material = waterMat;

  // Canal bank stones
  const bankMat = makePBR('bankMat', '#6B5A44', 0.9, scene);
  [new Vector3(-6.5, 0.1, 20), new Vector3(6.5, 0.1, 20)].forEach((pos, i) => {
    const bank = MeshBuilder.CreateBox(`canalBank${i}`, { width: 1, height: 0.2, depth: 70 }, scene);
    bank.position = pos;
    bank.material = bankMat;
  });

  return { ground, pathNS, pathEW, canal };
}
