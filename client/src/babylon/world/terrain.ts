/**
 * terrain.ts — Kerala Fair Grounds (ground, pathways, perimeter)
 * All geometry is procedural — no external assets needed.
 *
 * Atmospheric fog is configured once, centrally, in landscape.ts
 * (buildLandscape → configureFog) alongside the rest of the natural
 * landscape's atmosphere, rather than duplicated here.
 */

import {
  Scene,
  MeshBuilder,
  PBRMaterial,
  Color3,
  Vector3,
  DynamicTexture,
  Mesh,
  VertexBuffer,
  VertexData,
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

/** Simple deterministic value-noise, used only for subtle terrain undulation. */
function valueNoise2D(x: number, y: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const a = valueNoise2D(ix, iy);
  const b = valueNoise2D(ix + 1, iy);
  const c = valueNoise2D(ix, iy + 1);
  const d = valueNoise2D(ix + 1, iy + 1);
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
}

/**
 * Rich Kerala ground texture: wet dark soil base, blended grass patches,
 * and scattered fallen-leaf litter — replaces the flat single-tone grass
 * texture with something that reads as a lived-in maidan.
 */
function makeKeralaGroundTexture(scene: Scene): DynamicTexture {
  const size = 1024;
  const tex = new DynamicTexture('keralaGroundTex', { width: size, height: size }, scene, false);
  const ctx = tex.getContext();

  // Base: wet dark soil
  ctx.fillStyle = '#3A2A18';
  ctx.fillRect(0, 0, size, size);

  // Organic grass-patch blobs blended over the soil
  for (let i = 0; i < 90; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const r = 40 + Math.random() * 140;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    const g = Math.floor(70 + Math.random() * 60);
    grad.addColorStop(0, `rgba(${20 + Math.floor(Math.random() * 20)}, ${g}, ${18 + Math.floor(Math.random() * 15)}, 0.9)`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fine grass-blade speckle on top
  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const g = Math.floor(90 + Math.random() * 70);
    ctx.fillStyle = `rgb(${25 + Math.floor(Math.random() * 30)}, ${g}, ${20 + Math.floor(Math.random() * 15)})`;
    ctx.fillRect(x, y, 2, 3 + Math.random() * 3);
  }

  // Fallen leaf litter (small brown/orange ellipses)
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const leafColors = ['#8B5A2B', '#A0642F', '#6B4423', '#B5732E'];
    ctx.fillStyle = leafColors[Math.floor(Math.random() * leafColors.length)];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.random() * Math.PI * 2);
    ctx.beginPath();
    ctx.ellipse(0, 0, 5 + Math.random() * 4, 2.5 + Math.random() * 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  tex.update();
  tex.uScale = 24;
  tex.vScale = 24;
  return tex;
}

/** Wet laterite path texture with clay-like colour variation. */
function makeLateriteTexture(scene: Scene): DynamicTexture {
  const size = 512;
  const tex = new DynamicTexture('lateriteTex', { width: size, height: size }, scene, false);
  const ctx = tex.getContext();

  ctx.fillStyle = '#7A3D10';
  ctx.fillRect(0, 0, size, size);

  // Wet sheen streaks
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * size;
    const grad = ctx.createLinearGradient(0, y, size, y);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.5, 'rgba(200,180,160,0.08)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, size, 3 + Math.random() * 6);
  }

  for (let i = 0; i < 1400; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const shade = Math.floor(110 + Math.random() * 70);
    ctx.fillStyle = `rgb(${shade}, ${Math.floor(shade * 0.42)}, ${Math.floor(shade * 0.1)})`;
    ctx.fillRect(x, y, 3 + Math.random() * 6, 3 + Math.random() * 6);
  }

  tex.update();
  tex.uScale = 8;
  tex.vScale = 8;
  return tex;
}

/** Applies subtle, deterministic height noise to a ground mesh (kept small so
 *  it stays visually "subtle" and doesn't cause the flat path/canal meshes,
 *  or the physics box collider, to visibly clip through the terrain). */
function applyTerrainUndulation(ground: Mesh, amplitude = 0.14, scale = 0.045) {
  const positions = ground.getVerticesData(VertexBuffer.PositionKind);
  if (!positions) return;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 2];
    // Flatten near the centre cross (paths) and canal strip so they still sit flush.
    const nearPathNS = Math.abs(x) < 5;
    const nearPathEW = Math.abs(z) < 5;
    // Canal spans x:[-6,6], z:[-15,55] (see buildTerrain's `canal` mesh below).
    const nearCanal = Math.abs(x) < 8 && z > -18 && z < 58;
    if (nearPathNS || nearPathEW || nearCanal) continue;

    const n = smoothNoise(x * scale, z * scale) + 0.5 * smoothNoise(x * scale * 2.3, z * scale * 2.3);
    positions[i + 1] = (n - 0.75) * amplitude;
  }

  ground.updateVerticesData(VertexBuffer.PositionKind, positions);

  const indices = ground.getIndices();
  const normals = ground.getVerticesData(VertexBuffer.NormalKind);
  if (indices && normals) {
    VertexData.ComputeNormals(positions, indices, normals);
    ground.updateVerticesData(VertexBuffer.NormalKind, normals);
  }
}

export function buildTerrain(scene: Scene) {
  // ── Main grass maidan (200×200) ──────────────────────────────────────────
  const ground = MeshBuilder.CreateGround('maidan', {
    width: 200,
    height: 200,
    subdivisions: 60,
    updatable: true,
  }, scene);
  ground.receiveShadows = true;
  ground.checkCollisions = true;

  const grassMat = new PBRMaterial('grassMat', scene);
  grassMat.albedoTexture = makeKeralaGroundTexture(scene);
  grassMat.roughness = 0.92;
  grassMat.metallic = 0;
  ground.material = grassMat;

  applyTerrainUndulation(ground);

  // ── Physics Colliders (Havok Physics V2) ──────────────────────────────────
  // Note: the collider stays a flat box (see PhysicsManager) — undulation
  // amplitude above is kept small (±0.14) specifically so it never reads as
  // clipping against that flat collision surface.
  if (scene.isPhysicsEnabled()) {
    PhysicsManager.addStaticGroundCollider(ground, scene, 200, 200);
  }

  // ── Central cruciform pathways (terracotta laterite) ─────────────────────
  const lateriteMat = new PBRMaterial('lateriteMat', scene);
  lateriteMat.albedoTexture = makeLateriteTexture(scene);
  lateriteMat.roughness = 0.35;
  lateriteMat.metallic = 0;
  // Slight specular clarity to read as "wet clay" per the plan.
  lateriteMat.clearCoat.isEnabled = true;
  lateriteMat.clearCoat.intensity = 0.25;
  lateriteMat.clearCoat.roughness = 0.3;

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

  // Canal bank stones — mossy stone material (greener, rougher than the
  // plain perimeter stone) with a scatter of small floating leaves.
  const bankMat = makePBR('bankMat', '#5E5A3E', 0.85, scene);
  bankMat.albedoColor = Color3.FromHexString('#5E5A3E');
  [new Vector3(-6.5, 0.1, 20), new Vector3(6.5, 0.1, 20)].forEach((pos, i) => {
    const bank = MeshBuilder.CreateBox(`canalBank${i}`, { width: 1, height: 0.2, depth: 70 }, scene);
    bank.position = pos;
    bank.material = bankMat;
  });

  // Floating leaf particles drifting on the canal surface
  const leafMat = makePBR('canalLeafMat', '#7A4A20', 0.7, scene);
  const leafRoot = MeshBuilder.CreateDisc('canalLeafTemplate', { radius: 0.15, tessellation: 6 }, scene);
  leafRoot.material = leafMat;
  leafRoot.rotation.x = Math.PI / 2;
  leafRoot.isVisible = false;

  const leaves: Mesh[] = [];
  for (let i = 0; i < 18; i++) {
    const leaf = leafRoot.clone(`canalLeaf${i}`);
    leaf.isVisible = true;
    leaf.position = new Vector3((Math.random() - 0.5) * 9, 0.05, 20 + (Math.random() - 0.5) * 65);
    leaf.rotation.y = Math.random() * Math.PI * 2;
    leaves.push(leaf);
  }

  let leafT = 0;
  scene.onBeforeRenderObservable.add(() => {
    leafT += 0.003;
    leaves.forEach((leaf, i) => {
      leaf.position.x += Math.sin(leafT + i) * 0.002;
      leaf.rotation.z = Math.sin(leafT * 2 + i) * 0.1;
    });
  });

  return { ground, pathNS, pathEW, canal };
}
