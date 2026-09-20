/**
 * landscape.ts — Kerala Natural Landscape Orchestrator
 *
 * Builds a 3-layer vegetation system around the existing fairground:
 *   Layer 1 (background, cheap)   — billboard palm silhouettes + forest wall + fog
 *   Layer 2 (walkable zone)       — areca palms, bamboo, grass/fern ground cover, rocks
 *   Layer 3 (hero assets)         — loaded Poly Haven boulder/fern/tropical plant, banyan tree
 *
 * The existing coconut palms / banana plants / Nilavilakku lamps built in
 * props.ts are left as-is; this module adds the surrounding jungle so the
 * fairground reads as carved out of a Kerala backwater landscape rather than
 * sitting on an empty plane.
 */

import {
  Scene,
  MeshBuilder,
  PBRMaterial,
  StandardMaterial,
  Color3,
  Vector3,
  Mesh,
  TransformNode,
  DynamicTexture,
  Matrix,
  Quaternion,
} from '@babylonjs/core';
import { AssetLoader } from './AssetLoader';

function pbr(name: string, hex: string, roughness: number, metallic: number, scene: Scene): PBRMaterial {
  const m = new PBRMaterial(name, scene);
  m.albedoColor = Color3.FromHexString(hex);
  m.roughness = roughness;
  m.metallic = metallic;
  return m;
}

// ─────────────────────────────────────────────────────────────────────────
// Layer 1 — Background (billboard silhouettes, forest wall, fog)
// ─────────────────────────────────────────────────────────────────────────

/** Draws a simple palm-tree silhouette onto an alpha-tested DynamicTexture. */
function makePalmSilhouetteTexture(scene: Scene): DynamicTexture {
  const size = 256;
  const tex = new DynamicTexture('palmSilhouetteTex', { width: size, height: size }, scene, false);
  tex.hasAlpha = true;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, size, size);

  // Trunk
  ctx.fillStyle = 'rgba(20, 30, 15, 1)';
  ctx.beginPath();
  ctx.moveTo(size * 0.47, size);
  ctx.quadraticCurveTo(size * 0.42, size * 0.55, size * 0.5, size * 0.4);
  ctx.quadraticCurveTo(size * 0.58, size * 0.55, size * 0.53, size);
  ctx.closePath();
  ctx.fill();

  // Fronds (simple leaf blades radiating from crown)
  ctx.fillStyle = 'rgba(15, 35, 15, 1)';
  const crownX = size * 0.5;
  const crownY = size * 0.38;
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2;
    const len = size * 0.32;
    const spread = 0.5;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(
      crownX + Math.cos(angle) * len * 0.6 + Math.cos(angle + spread) * 10,
      crownY + Math.sin(angle) * len * 0.3 - len * 0.5,
      crownX + Math.cos(angle) * len,
      crownY + Math.sin(angle) * len * 0.5 - len * 0.3,
    );
    ctx.quadraticCurveTo(
      crownX + Math.cos(angle) * len * 0.6 + Math.cos(angle - spread) * 10,
      crownY + Math.sin(angle) * len * 0.3 - len * 0.4,
      crownX,
      crownY,
    );
    ctx.closePath();
    ctx.fill();
  }

  tex.update();
  return tex;
}

/** Billboard palm silhouettes scattered just beyond the perimeter wall. */
function buildBillboardSilhouettes(scene: Scene): TransformNode {
  const root = new TransformNode('bgSilhouettes', scene);
  const silhouetteTex = makePalmSilhouetteTexture(scene);

  const mat = new StandardMaterial('silhouetteMat', scene);
  mat.diffuseTexture = silhouetteTex;
  mat.diffuseTexture.hasAlpha = true;
  mat.useAlphaFromDiffuseTexture = true;
  mat.emissiveColor = new Color3(0.08, 0.14, 0.08);
  mat.specularColor = Color3.Black();
  mat.backFaceCulling = false;

  const ring: Vector3[] = [];
  const radius = 115;
  const count = 46;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const jitterR = radius + (Math.random() - 0.5) * 10;
    ring.push(new Vector3(Math.cos(angle) * jitterR, 0, Math.sin(angle) * jitterR));
  }

  ring.forEach((pos, i) => {
    const h = 9 + Math.random() * 6;
    const plane = MeshBuilder.CreatePlane(`silhouette${i}`, { width: h * 0.55, height: h }, scene);
    plane.position = new Vector3(pos.x, h / 2 - 0.3, pos.z);
    plane.rotation.y = Math.random() * Math.PI;
    plane.material = mat;
    plane.isPickable = false;
    plane.parent = root;
  });

  return root;
}

/** Simple dark low-poly "forest wall" blocking the view beyond the silhouettes. */
function buildForestWall(scene: Scene): TransformNode {
  const root = new TransformNode('forestWall', scene);
  const mat = pbr('forestWallMat', '#0F2B14', 1.0, 0, scene);
  mat.emissiveColor = new Color3(0.01, 0.03, 0.015);

  const radius = 135;
  const segments = 24;
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const w = ((2 * Math.PI * radius) / segments) * 1.15;
    const h = 22 + Math.random() * 8;
    const chunk = MeshBuilder.CreateBox(`forestWall${i}`, { width: w, height: h, depth: 14 }, scene);
    chunk.position = new Vector3(Math.cos(angle) * radius, h / 2 - 1, Math.sin(angle) * radius);
    chunk.rotation.y = -angle + Math.PI / 2;
    chunk.material = mat;
    chunk.isPickable = false;
    chunk.parent = root;
  }

  return root;
}

/** Exponential humid fog + soft blue-green tint. */
function configureFog(scene: Scene) {
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.0038;
  scene.fogColor = new Color3(0.62, 0.72, 0.66);
}

// ─────────────────────────────────────────────────────────────────────────
// Layer 2 — Walkable zone (medium detail procedural additions)
// ─────────────────────────────────────────────────────────────────────────

/** Thin, tall, ring-marked areca palm — distinct silhouette from the coconut palm. */
function buildArecaPalm(name: string, x: number, z: number, scene: Scene): TransformNode {
  const root = new TransformNode(name, scene);
  root.position = new Vector3(x, 0, z);

  const trunkMat = pbr(`${name}Trunk`, '#8C8064', 0.75, 0, scene);
  const frondMat = pbr(`${name}Frond`, '#2E7D32', 0.7, 0, scene);

  const height = 6.5 + Math.random() * 2.5;
  const trunk = MeshBuilder.CreateCylinder(`${name}Trunk`, {
    height,
    diameterTop: 0.14,
    diameterBottom: 0.22,
    tessellation: 8,
  }, scene);
  trunk.position = new Vector3(0, height / 2, 0);
  trunk.rotation.z = (Math.random() - 0.5) * 0.1;
  trunk.material = trunkMat;
  trunk.parent = root;

  // Ring marks — thin dark cylinders stacked along the trunk
  const ringMat = pbr(`${name}Ring`, '#5C5340', 0.8, 0, scene);
  const ringCount = 8;
  for (let r = 0; r < ringCount; r++) {
    const ring = MeshBuilder.CreateTorus(`${name}Ring${r}`, { diameter: 0.24, thickness: 0.02, tessellation: 8 }, scene);
    ring.position = new Vector3(0, (r + 1) * (height / (ringCount + 1)), 0);
    ring.rotation.x = Math.PI / 2;
    ring.material = ringMat;
    ring.parent = root;
  }

  const crownNode = new TransformNode(`${name}Crown`, scene);
  crownNode.position = new Vector3(0, height, 0);
  crownNode.parent = root;

  const frondCount = 8;
  for (let i = 0; i < frondCount; i++) {
    const angle = (i / frondCount) * Math.PI * 2;
    const frond = MeshBuilder.CreateBox(`${name}Frond${i}`, { width: 0.15, height: 0.04, depth: 2.2 + Math.random() * 0.5 }, scene);
    frond.position = new Vector3(Math.cos(angle) * 0.6, 0.1, Math.sin(angle) * 0.6);
    frond.rotation.y = angle;
    frond.rotation.x = 0.5;
    frond.material = frondMat;
    frond.parent = crownNode;
  }

  let t = Math.random() * 10;
  scene.onBeforeRenderObservable.add(() => {
    t += 0.02;
    crownNode.rotation.z = Math.sin(t) * 0.04;
  });

  return root;
}

/** A clump of 3–5 thin bamboo stalks with a small tuft of leaves near the top. */
function buildBambooClump(name: string, x: number, z: number, scene: Scene): TransformNode {
  const root = new TransformNode(name, scene);
  root.position = new Vector3(x, 0, z);

  const stalkMat = pbr(`${name}Stalk`, '#7CA639', 0.65, 0, scene);
  const leafMat = pbr(`${name}Leaf`, '#3E7A2E', 0.75, 0, scene);

  const stalkCount = 3 + Math.floor(Math.random() * 3);
  for (let s = 0; s < stalkCount; s++) {
    const h = 4 + Math.random() * 2.5;
    const ox = (Math.random() - 0.5) * 1.0;
    const oz = (Math.random() - 0.5) * 1.0;
    const stalk = MeshBuilder.CreateCylinder(`${name}Stalk${s}`, {
      height: h, diameter: 0.07, tessellation: 6,
    }, scene);
    stalk.position = new Vector3(ox, h / 2, oz);
    stalk.material = stalkMat;
    stalk.parent = root;

    for (let l = 0; l < 4; l++) {
      const leaf = MeshBuilder.CreatePlane(`${name}Leaf${s}_${l}`, { width: 0.35, height: 0.9 }, scene);
      leaf.position = new Vector3(ox, h - 0.4 - l * 0.35, oz);
      leaf.rotation.y = Math.random() * Math.PI * 2;
      leaf.rotation.x = -0.6;
      leaf.material = leafMat;
      leaf.parent = root;
    }
  }

  return root;
}

/** Low-poly laterite rock cluster (procedural — used for casual scatter). */
function buildLateriteRock(name: string, x: number, z: number, scene: Scene): TransformNode {
  const root = new TransformNode(name, scene);
  root.position = new Vector3(x, 0, z);
  const mat = pbr(`${name}Mat`, '#8A5A3B', 0.95, 0, scene);

  const clumpCount = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < clumpCount; i++) {
    const size = 0.5 + Math.random() * 0.7;
    const rock = MeshBuilder.CreatePolyhedron(`${name}_${i}`, { type: 1, size }, scene);
    rock.position = new Vector3((Math.random() - 0.5) * 0.8, size * 0.4, (Math.random() - 0.5) * 0.8);
    rock.rotation = new Vector3(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    rock.scaling.y *= 0.6 + Math.random() * 0.3;
    rock.material = mat;
    rock.parent = root;
  }

  return root;
}

/** Crossed-plane grass clump template (2 intersecting planes with alpha grass texture). */
function makeGrassClumpTexture(scene: Scene): DynamicTexture {
  const size = 128;
  const tex = new DynamicTexture('grassClumpTex', { width: size, height: size }, scene, false);
  tex.hasAlpha = true;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = 'rgba(60, 120, 40, 1)';
  for (let i = 0; i < 14; i++) {
    const bx = size * 0.5 + (Math.random() - 0.5) * size * 0.5;
    ctx.beginPath();
    ctx.moveTo(bx, size);
    ctx.quadraticCurveTo(bx + (Math.random() - 0.5) * 20, size * 0.4, bx + (Math.random() - 0.5) * 12, size * 0.05);
    ctx.quadraticCurveTo(bx + (Math.random() - 0.5) * 6, size * 0.4, bx + 6, size);
    ctx.closePath();
    ctx.fill();
  }
  tex.update();
  return tex;
}

function buildGrassClumpBase(scene: Scene): Mesh {
  const mat = new StandardMaterial('grassClumpMat', scene);
  mat.diffuseTexture = makeGrassClumpTexture(scene);
  mat.diffuseTexture.hasAlpha = true;
  mat.useAlphaFromDiffuseTexture = true;
  mat.backFaceCulling = false;
  mat.specularColor = Color3.Black();

  const p1 = MeshBuilder.CreatePlane('grassClumpP1', { width: 0.6, height: 0.5 }, scene);
  const p2 = MeshBuilder.CreatePlane('grassClumpP2', { width: 0.6, height: 0.5 }, scene);
  p2.rotation.y = Math.PI / 2;
  const merged = Mesh.MergeMeshes([p1, p2], true, true, undefined, false, true)!;
  merged.name = 'grassClumpBase';
  merged.material = mat;
  merged.isPickable = false;
  merged.position.y = 0.25;
  return merged;
}

// ─────────────────────────────────────────────────────────────────────────
// Layer 3 — Hero assets
// ─────────────────────────────────────────────────────────────────────────

/** Large hero banyan tree — spreading canopy with hanging aerial roots. */
function buildBanyanTree(name: string, x: number, z: number, scene: Scene): TransformNode {
  const root = new TransformNode(name, scene);
  root.position = new Vector3(x, 0, z);

  const trunkMat = pbr(`${name}Trunk`, '#5B4530', 0.92, 0, scene);
  const canopyMat = pbr(`${name}Canopy`, '#25541F', 0.8, 0, scene);
  const rootMat = pbr(`${name}Root`, '#4A3822', 0.9, 0, scene);

  // Thick, gnarled central trunk (tapered stack of cylinders)
  const trunkHeight = 6.5;
  const trunk = MeshBuilder.CreateCylinder(`${name}Trunk`, {
    height: trunkHeight, diameterTop: 1.6, diameterBottom: 2.4, tessellation: 12,
  }, scene);
  trunk.position = new Vector3(0, trunkHeight / 2, 0);
  trunk.material = trunkMat;
  trunk.parent = root;

  // Spreading canopy — cluster of overlapping flattened spheres
  const canopyNode = new TransformNode(`${name}Canopy`, scene);
  canopyNode.position = new Vector3(0, trunkHeight + 1.5, 0);
  canopyNode.parent = root;

  const canopyBlobs = 9;
  for (let i = 0; i < canopyBlobs; i++) {
    const angle = (i / canopyBlobs) * Math.PI * 2;
    const r = i === 0 ? 0 : 3.5 + Math.random() * 1.5;
    const blob = MeshBuilder.CreateSphere(`${name}CanopyBlob${i}`, {
      diameterX: 4.5 + Math.random() * 1.5,
      diameterY: 3 + Math.random() * 1,
      diameterZ: 4.5 + Math.random() * 1.5,
      segments: 7,
    }, scene);
    blob.position = new Vector3(Math.cos(angle) * r, Math.random() * 1.2, Math.sin(angle) * r);
    blob.material = canopyMat;
    blob.parent = canopyNode;
  }

  // Hanging aerial roots dropping from the canopy edge toward the ground
  const aerialRootCount = 10;
  for (let i = 0; i < aerialRootCount; i++) {
    const angle = (i / aerialRootCount) * Math.PI * 2 + Math.random() * 0.3;
    const dist = 3 + Math.random() * 3;
    const dropHeight = trunkHeight + 1.5 - (1 + Math.random() * 2);
    const rootStrand = MeshBuilder.CreateCylinder(`${name}AerialRoot${i}`, {
      height: dropHeight, diameterTop: 0.05, diameterBottom: 0.1, tessellation: 5,
    }, scene);
    rootStrand.position = new Vector3(Math.cos(angle) * dist, dropHeight / 2, Math.sin(angle) * dist);
    rootStrand.material = rootMat;
    rootStrand.parent = root;
  }

  let t = Math.random() * 10;
  scene.onBeforeRenderObservable.add(() => {
    t += 0.015;
    canopyNode.rotation.z = Math.sin(t) * 0.015;
  });

  return root;
}

// ─────────────────────────────────────────────────────────────────────────
// Main orchestrator
// ─────────────────────────────────────────────────────────────────────────

export interface LandscapeResult {
  assetLoader: AssetLoader;
}

/** shadowCast callbacks elsewhere in this codebase expect individual Mesh
 *  instances (see architecture.ts), not TransformNode roots — so we walk
 *  down to the actual child meshes before registering them as casters. */
function addTreeAsShadowCaster(root: TransformNode, addShadowCaster?: (mesh: any) => void) {
  if (!addShadowCaster) return;
  root.getChildMeshes().forEach((mesh) => addShadowCaster(mesh));
}

/** Builds the full natural landscape. Awaits hero asset downloads before scattering them. */
export async function buildLandscape(
  scene: Scene,
  addShadowCaster?: (mesh: any) => void,
): Promise<LandscapeResult> {
  // ── Layer 1: background ──────────────────────────────────────────────────
  buildBillboardSilhouettes(scene);
  buildForestWall(scene);
  configureFog(scene);

  // ── Layer 2: procedural walkable-zone vegetation (moderate density) ─────
  // Areca palms scattered near the fairground edges, distinct from the
  // existing coconut palms in props.ts.
  const arecaPositions: [number, number][] = [
    [-30, -80], [30, -80], [-95, -40], [95, -40],
    [-95, 40], [95, 40], [-30, 80], [30, 80],
    [-15, 95], [15, 95],
  ];
  arecaPositions.forEach(([x, z], i) => buildArecaPalm(`areca${i}`, x, z, scene));

  // Bamboo clumps near the water and edges
  const bambooPositions: [number, number][] = [
    [-14, 5], [14, 5], [-14, 35], [14, 35], [-70, 60], [70, 60],
  ];
  bambooPositions.forEach(([x, z], i) => buildBambooClump(`bamboo${i}`, x, z, scene));

  // Laterite rock scatter along canal edges and pathway margins
  const rockPositions: [number, number][] = [
    [-9, 10], [9, -10], [-9, 40], [9, 55], [-25, 5], [25, -5], [-60, -70], [60, 70],
  ];
  rockPositions.forEach(([x, z], i) => buildLateriteRock(`rock${i}`, x, z, scene));

  // Grass clump ground cover — thin-instanced, negligible draw-call cost
  const grassBase = buildGrassClumpBase(scene);
  const grassMatrixTransforms: Array<{ position: Vector3; rotationY: number; scale: number }> = [];
  for (let i = 0; i < 220; i++) {
    const x = (Math.random() - 0.5) * 190;
    const z = (Math.random() - 0.5) * 190;
    // Skip the central cruciform paths and canal so grass doesn't poke through them
    if (Math.abs(x) < 4 && Math.abs(z) < 82) continue;
    if (Math.abs(z) < 4 && Math.abs(x) < 82) continue;
    if (Math.abs(x) < 8 && z > -18 && z < 58) continue; // canal spans x:[-6,6], z:[-15,55]
    grassMatrixTransforms.push({
      position: new Vector3(x, 0, z),
      rotationY: Math.random() * Math.PI,
      scale: 0.7 + Math.random() * 0.6,
    });
  }
  {
    const matrices = grassMatrixTransforms.map(({ position, rotationY, scale }) =>
      Matrix.Compose(new Vector3(scale, scale, scale), Quaternion.RotationYawPitchRoll(rotationY, 0, 0), position),
    );
    const buffer = new Float32Array(matrices.length * 16);
    matrices.forEach((m, i) => buffer.set(m.asArray(), i * 16));
    grassBase.thinInstanceSetBuffer('matrix', buffer, 16, true);
  }

  // ── Layer 3: hero assets (loaded CC0 models + hero procedural banyan) ───
  const assetLoader = new AssetLoader(scene);
  await assetLoader.preload(['fern_02', 'boulder_01', 'calathea_orbifolia_01', 'anthurium_botany_01']);

  // Hero boulder near the backwater canal, with moss-toned scale variance
  const heroBoulder = assetLoader.cloneAsset('boulder_01', new Vector3(-9, 0, 25), 0.4, 1.4);
  if (heroBoulder) addTreeAsShadowCaster(heroBoulder, addShadowCaster);

  const heroBoulder2 = assetLoader.cloneAsset('boulder_01', new Vector3(8, 0, -5), 1.9, 0.8);
  if (heroBoulder2) addTreeAsShadowCaster(heroBoulder2, addShadowCaster);

  // Fern cluster near the Nalukettu / courtyard area
  const fernSpots: Vector3[] = [
    new Vector3(-11, 0, 15), new Vector3(-13, 0, 17), new Vector3(-9.5, 0, 18),
    new Vector3(10, 0, -3), new Vector3(12, 0, -6),
  ];
  fernSpots.forEach((pos, i) => assetLoader.cloneAsset('fern_02', pos, Math.random() * Math.PI, 0.8 + Math.random() * 0.4));

  // Tropical broad-leaf plants near the entrance and backwater edge
  const calatheaSpots: Vector3[] = [new Vector3(-6, 0, -78), new Vector3(6, 0, -78)];
  calatheaSpots.forEach((pos) => assetLoader.cloneAsset('calathea_orbifolia_01', pos, Math.random() * Math.PI, 1.1));

  const anthuriumSpots: Vector3[] = [new Vector3(-7, 0, 22), new Vector3(7, 0, 27)];
  anthuriumSpots.forEach((pos) => assetLoader.cloneAsset('anthurium_botany_01', pos, Math.random() * Math.PI, 1.0));

  // Scatter a modest number of thin-instanced ferns as extra ground cover
  const fernScatter: Array<{ position: Vector3; rotationY: number; scale: number }> = [];
  for (let i = 0; i < 40; i++) {
    const x = (Math.random() - 0.5) * 170;
    const z = (Math.random() - 0.5) * 170;
    if (Math.abs(x) < 5 && Math.abs(z) < 82) continue;
    if (Math.abs(z) < 5 && Math.abs(x) < 82) continue;
    fernScatter.push({ position: new Vector3(x, 0, z), rotationY: Math.random() * Math.PI, scale: 0.6 + Math.random() * 0.5 });
  }
  assetLoader.scatterThinInstances('fern_02', fernScatter);

  // Hero banyan tree — the single largest, most detailed tree in the scene.
  // Placed off to the side of the canal (canal spans x:[-6,6], z:[-15,55])
  // in open ground near the courtyard, clear of paths and other props.
  const banyan = buildBanyanTree('heroBanyan', -30, 60, scene);
  addTreeAsShadowCaster(banyan, addShadowCaster);

  return { assetLoader };
}
