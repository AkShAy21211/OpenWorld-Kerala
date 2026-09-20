/**
 * architecture.ts — Kerala Fair Buildings (procedurally generated)
 * Structures: Main Entrance Arch, Central Nalukettu Pavilion,
 * Kasavu Shops Row, Food Court Pavilion, Ride Arena, Pookkalam Stage
 */

import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  PBRMaterial,
  Color3,
  Vector3,
  Mesh,
  TransformNode,
  VertexData,
  DynamicTexture,
  Texture,
} from '@babylonjs/core';
import { FerrisWheel } from './rides/FerrisWheel';
import { Carousel } from './rides/Carousel';
import { ColumbusRide } from './rides/ColumbusRide';
import { ToraToraRide } from './rides/ToraToraRide';
import { FestivalElephant, Thattukada } from './rides/KeralaAttractions';
import { TemplePond } from './kerala/TemplePond';
import { Kettuvallam } from './kerala/Kettuvallam';
import { KathakaliStage } from './kerala/KathakaliStage';
import { ChendaMelam } from './kerala/ChendaMelam';
import { HorrorHouse } from './kerala/HorrorHouse';
import { AquaTunnelExpo } from './kerala/AquaTunnelExpo';
import { TradeFairStalls } from './kerala/TradeFairStalls';
import { CarnivalGames } from './kerala/CarnivalGames';
import { SelfieZone } from './kerala/SelfieZone';
import { ChundanVallam } from './kerala/ChundanVallam';
import { PlayableChenda } from './kerala/PlayableChenda';
import { CoconutClimbingRig } from './kerala/CoconutClimbingRig';
import { CoirWorkshop } from './kerala/CoirWorkshop';
import { PotteryStudio } from './kerala/PotteryStudio';
import { RideManager } from '../player/RideManager';

// ── Material helpers ────────────────────────────────────────────────────────
function pbr(name: string, hex: string, roughness: number, metallic: number, scene: Scene) {
  const m = new PBRMaterial(name, scene);
  m.albedoColor = Color3.FromHexString(hex);
  m.roughness = roughness;
  m.metallic = metallic;
  return m;
}

/** Build a thatched hip-roof from 4 triangular panels */
function buildHipRoof(
  name: string,
  width: number,
  depth: number,
  height: number,
  scene: Scene,
  mat: PBRMaterial,
): Mesh {
  const root = new TransformNode(name + '_root', scene);

  // 4 panels (front, back, left, right)
  const panels = [
    { id: 'front', pts: [[-width / 2, 0, -depth / 2], [width / 2, 0, -depth / 2], [0, height, 0]] },
    { id: 'back',  pts: [[-width / 2, 0,  depth / 2], [width / 2, 0,  depth / 2], [0, height, 0]] },
    { id: 'left',  pts: [[-width / 2, 0, -depth / 2], [-width / 2, 0, depth / 2], [0, height, 0]] },
    { id: 'right', pts: [[ width / 2, 0, -depth / 2], [ width / 2, 0, depth / 2], [0, height, 0]] },
  ];

  panels.forEach(({ id, pts }) => {
    const positions = pts.flat();
    const indices = [0, 1, 2];
    const normals: number[] = [];
    VertexData.ComputeNormals(positions, indices, normals);
    const vd = new VertexData();
    vd.positions = positions;
    vd.indices = indices;
    vd.normals = normals;
    const mesh = new Mesh(`${name}_${id}`, scene);
    vd.applyToMesh(mesh, false);
    mesh.material = mat;
    mesh.receiveShadows = true;
    mesh.parent = root;
  });

  return root as unknown as Mesh; // return root node
}

// ── 1. Entrance Arch ────────────────────────────────────────────────────────
function buildEntranceArch(scene: Scene, shadowCast: (m: Mesh) => void) {
  const stone = pbr('archStone', '#7A6B55', 0.9, 0, scene);
  const wood  = pbr('archWood',  '#5C3826', 0.85, 0, scene);
  const kasavu = pbr('kasavuBand', '#DAA520', 0.5, 0.1, scene);

  const root = new TransformNode('entranceArch', scene);
  root.position = new Vector3(0, 0, -88);

  // Two pillars
  [-4, 4].forEach((xOff, i) => {
    const pillar = MeshBuilder.CreateCylinder(`archPillar${i}`, {
      height: 7, diameterTop: 0.8, diameterBottom: 1.1, tessellation: 10,
    }, scene);
    pillar.position = new Vector3(xOff, 3.5, 0);
    pillar.material = stone;
    pillar.parent = root;
    pillar.receiveShadows = true;
    shadowCast(pillar);
  });

  // Horizontal beam on top
  const beam = MeshBuilder.CreateBox('archBeam', { width: 10, height: 1.2, depth: 0.9 }, scene);
  beam.position = new Vector3(0, 7.6, 0);
  beam.material = wood;
  beam.parent = root;
  beam.receiveShadows = true;
  shadowCast(beam);

  // Kasavu gold banner strip
  const banner = MeshBuilder.CreateBox('archBanner', { width: 9.5, height: 0.35, depth: 0.1 }, scene);
  banner.position = new Vector3(0, 7.0, 0.5);
  banner.material = kasavu;
  banner.parent = root;

  // Roof peak
  const peak = MeshBuilder.CreateCylinder('archPeak', {
    height: 1.5, diameterTop: 0, diameterBottom: 1.4, tessellation: 8,
  }, scene);
  peak.position = new Vector3(0, 8.5, 0);
  peak.material = stone;
  peak.parent = root;
  shadowCast(peak);

  return root;
}

// ── 2. Nalukettu Central Pavilion ──────────────────────────────────────────
function buildNalukettu(scene: Scene, shadowCast: (m: Mesh) => void) {
  const wood   = pbr('nkWood',  '#5C3826', 0.85, 0, scene);
  const tile   = pbr('nkTile',  '#6B3A2A', 0.88, 0, scene); // mangalore tile dark red
  const floor  = pbr('nkFloor', '#C4A97A', 0.8,  0, scene); // polished laterite floor

  const root = new TransformNode('nalukettu', scene);
  root.position = new Vector3(0, 0, -15);

  // Floor slab (12×12)
  const floorSlab = MeshBuilder.CreateBox('nkFloorSlab', { width: 12, height: 0.3, depth: 12 }, scene);
  floorSlab.position = new Vector3(0, 0.15, 0);
  floorSlab.material = floor;
  floorSlab.parent = root;
  floorSlab.receiveShadows = true;

  // 4 octagonal carved pillars
  [[-4.5, -4.5], [4.5, -4.5], [-4.5, 4.5], [4.5, 4.5]].forEach(([x, z], i) => {
    const pillar = MeshBuilder.CreateCylinder(`nkPillar${i}`, {
      height: 5, diameterTop: 0.6, diameterBottom: 0.75, tessellation: 8,
    }, scene);
    pillar.position = new Vector3(x, 2.5, z);
    pillar.material = wood;
    pillar.parent = root;
    pillar.receiveShadows = true;
    shadowCast(pillar);

    // Capital (decorative top ring)
    const capital = MeshBuilder.CreateCylinder(`nkCapital${i}`, {
      height: 0.3, diameterTop: 1.0, diameterBottom: 0.65, tessellation: 8,
    }, scene);
    capital.position = new Vector3(x, 5.15, z);
    capital.material = wood;
    capital.parent = root;
    shadowCast(capital);
  });

  // Roof beams (cross)
  [
    { w: 11, h: 0.35, d: 0.5, pos: [0, 5.2, 0] },
    { w: 0.5, h: 0.35, d: 11, pos: [0, 5.2, 0] },
  ].forEach(({ w, h, d, pos }, i) => {
    const beam = MeshBuilder.CreateBox(`nkBeam${i}`, { width: w, height: h, depth: d }, scene);
    beam.position = new Vector3(pos[0], pos[1], pos[2]);
    beam.material = wood;
    beam.parent = root;
    shadowCast(beam);
  });

  // Hip roof (tiled)
  const thatch = pbr('nkThatch', '#8B6040', 0.92, 0, scene);
  const roofNode = buildHipRoof('nkRoof', 13, 13, 3.5, scene, tile);
  (roofNode as any as TransformNode).position = new Vector3(0, 5.35, 0);
  (roofNode as any as TransformNode).parent = root;

  // Kasavu border on pavilion sides
  const kasavuStrip = pbr('nkKasavu', '#FFD700', 0.5, 0.1, scene);
  ['N', 'S', 'E', 'W'].forEach((dir, i) => {
    const angle = i * Math.PI / 2;
    const strip = MeshBuilder.CreateBox(`nkStrip${dir}`, { width: 12, height: 0.1, depth: 0.05 }, scene);
    strip.rotation.y = angle;
    strip.position = new Vector3(
      Math.sin(angle) * 6, 5.1, Math.cos(angle) * 6,
    );
    strip.material = kasavuStrip;
    strip.parent = root;
  });

  return root;
}

// ── 3. Zone Pavilion helper (thatched kiosk) ───────────────────────────────
function buildZonePavilion(
  name: string,
  cx: number, cz: number,
  color: string,
  bannerText: string,
  scene: Scene,
  shadowCast: (m: Mesh) => void,
) {
  const wood   = pbr(`${name}Wood`,   '#5C3826', 0.85, 0, scene);
  const thatch = pbr(`${name}Thatch`, '#9B7A4A', 0.92, 0, scene);
  const accent = pbr(`${name}Accent`, color, 0.6, 0, scene);

  const root = new TransformNode(name, scene);
  root.position = new Vector3(cx, 0, cz);

  // Platform
  const platform = MeshBuilder.CreateBox(`${name}Platform`, { width: 14, height: 0.4, depth: 10 }, scene);
  platform.position = new Vector3(0, 0.2, 0);
  platform.material = pbr(`${name}Floor`, '#C4956A', 0.85, 0, scene);
  platform.receiveShadows = true;
  platform.parent = root;

  // 6 pillars
  [[-5.5, -4], [0, -4], [5.5, -4], [-5.5, 4], [0, 4], [5.5, 4]].forEach(([x, z], i) => {
    const pillar = MeshBuilder.CreateCylinder(`${name}Pillar${i}`, {
      height: 4, diameterTop: 0.35, diameterBottom: 0.45, tessellation: 8,
    }, scene);
    pillar.position = new Vector3(x, 2.4, z);
    pillar.material = wood;
    pillar.parent = root;
    pillar.receiveShadows = true;
    shadowCast(pillar);
  });

  // Thatch hip roof
  const roofNode = buildHipRoof(`${name}Roof`, 15, 11, 3, scene, thatch);
  (roofNode as any as TransformNode).position = new Vector3(0, 4.4, 0);
  (roofNode as any as TransformNode).parent = root;

  // Accent colour banner at front
  const banner = MeshBuilder.CreatePlane(`${name}Banner`, { width: 10, height: 0.9 }, scene);
  banner.position = new Vector3(0, 3.8, -5.05);
  banner.material = accent;
  banner.parent = root;

  // Colour-coded flag pole
  const pole = MeshBuilder.CreateCylinder(`${name}Pole`, {
    height: 6, diameter: 0.1, tessellation: 6,
  }, scene);
  pole.position = new Vector3(0, 3, -7);
  pole.material = wood;
  pole.parent = root;

  const flag = MeshBuilder.CreateBox(`${name}Flag`, { width: 1.5, height: 0.8, depth: 0.02 }, scene);
  flag.position = new Vector3(0.75, 6.4, -7);
  flag.material = accent;
  flag.parent = root;

  return root;
}

// ── 4. Ride Arena ───────────────────────────────────────────────────────────
function buildRideArena(scene: Scene, shadowCast: (m: Mesh) => void) {
  const wood   = pbr('rideWood',  '#5C3826', 0.85, 0, scene);
  const accent = pbr('rideAccent','#E11D48', 0.6, 0, scene);
  const metal  = pbr('rideMetal', '#B0A080', 0.5, 0.7, scene);

  const root = new TransformNode('rideArena', scene);
  root.position = new Vector3(50, 0, 40);

  // Base platform
  const platform = MeshBuilder.CreateBox('ridePlatform', { width: 16, height: 0.5, depth: 16 }, scene);
  platform.position = new Vector3(0, 0.25, 0);
  platform.material = pbr('rideFloor', '#8B4513', 0.88, 0, scene);
  platform.receiveShadows = true;
  platform.parent = root;

  // Hexagonal arch ring (6 arches)
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const archPillar = MeshBuilder.CreateCylinder(`rideArch${i}`, {
      height: 5.5, diameterTop: 0.3, diameterBottom: 0.5, tessellation: 8,
    }, scene);
    archPillar.position = new Vector3(Math.cos(angle) * 7, 2.75, Math.sin(angle) * 7);
    archPillar.material = wood;
    archPillar.parent = root;
    shadowCast(archPillar);
  }

  // Central swing frame (metallic A-frame)
  const crossBar = MeshBuilder.CreateCylinder('rideCrossBar', {
    height: 14, diameter: 0.25, tessellation: 8,
  }, scene);
  crossBar.rotation.z = Math.PI / 2;
  crossBar.position = new Vector3(0, 6, 0);
  crossBar.material = metal;
  crossBar.parent = root;
  shadowCast(crossBar);

  // Swing seat (box)
  const seat = MeshBuilder.CreateBox('rideSeat', { width: 2, height: 0.3, depth: 0.8 }, scene);
  seat.position = new Vector3(0, 3, 0);
  seat.material = accent;
  seat.parent = root;

  // Swing chain ropes (cylinders)
  [-0.8, 0.8].forEach((xOff, i) => {
    const rope = MeshBuilder.CreateCylinder(`rideRope${i}`, {
      height: 3.1, diameter: 0.08, tessellation: 6,
    }, scene);
    rope.position = new Vector3(xOff, 4.55, 0);
    rope.material = pbr(`rideRopeMat${i}`, '#8B7355', 0.9, 0, scene);
    rope.parent = root;
  });

  return root;
}

// ── Main export ─────────────────────────────────────────────────────────────
export function buildArchitecture(scene: Scene, shadowCast: (m: Mesh) => void) {
  const entranceArch = buildEntranceArch(scene, shadowCast);
  const nalukettu    = buildNalukettu(scene, shadowCast);

  // 4 zone pavilions
  const shopsPavilion   = buildZonePavilion('shops',    50, -30, '#FFD700', 'Shops',     scene, shadowCast);
  const foodPavilion    = buildZonePavilion('food',    -50,  40, '#22C55E', 'Food',      scene, shadowCast);
  const pookkalamStage  = buildZonePavilion('pookkalam',-50,-30, '#EC4899', 'Pookkalam', scene, shadowCast);
  const rideArena       = buildRideArena(scene, shadowCast);

  // ── Rides & Cultural Attractions ──────────────────────────────────────────
  const ferrisWheel      = new FerrisWheel(scene, new Vector3(55, 0, 45), shadowCast);
  const carousel         = new Carousel(scene, new Vector3(35, 0, 60), shadowCast);
  const columbusRide     = new ColumbusRide(scene, new Vector3(72, 0, 50), shadowCast);
  const toraToraRide     = new ToraToraRide(scene, new Vector3(70, 0, 18), shadowCast);
  const festivalElephant = new FestivalElephant(scene, new Vector3(-22, 0, -15), shadowCast);
  const thattukada       = new Thattukada(scene, new Vector3(-42, 0, 42), shadowCast);

  // ── Authentic Kerala Heritage & Expo Pavilions ────────────────────────────
  const templePond       = new TemplePond(scene, new Vector3(0, 0, 55), shadowCast);
  const kettuvallam      = new Kettuvallam(scene, new Vector3(14, 0, 55), shadowCast);
  const kathakaliStage   = new KathakaliStage(scene, new Vector3(-55, 0, -60), shadowCast);
  const chendaMelam      = new ChendaMelam(scene, new Vector3(25, 0, -60), shadowCast);
  const horrorHouse      = new HorrorHouse(scene, new Vector3(-70, 0, 55), shadowCast);
  const aquaTunnelExpo   = new AquaTunnelExpo(scene, new Vector3(-28, 0, 55), shadowCast);
  const tradeFairStalls  = new TradeFairStalls(scene, new Vector3(50, 0, -25), shadowCast);
  const carnivalGames    = new CarnivalGames(scene, new Vector3(48, 0, 0), shadowCast);
  const selfieZone       = new SelfieZone(scene, new Vector3(-55, 0, 0), shadowCast);

  // ── Hands-on Kerala Craft, Sports & Experience Trail Workstations ────────
  const chundanVallam      = new ChundanVallam(scene, new Vector3(18, 0, 75), shadowCast);
  const playableChenda     = new PlayableChenda(scene, new Vector3(25, 0, -52), shadowCast);
  const coconutClimbingRig = new CoconutClimbingRig(scene, new Vector3(-25, 0, 20), shadowCast);
  const coirWorkshop       = new CoirWorkshop(scene, new Vector3(32, 0, -45), shadowCast);
  const potteryStudio      = new PotteryStudio(scene, new Vector3(-35, 0, -45), shadowCast);

  // ── Register Interactive Ridable Attractions with RideManager ────────────
  RideManager.registerRide({
    id: 'ferris_wheel',
    name: 'Giant Ferris Wheel',
    malayalamName: 'ഭീമൻ രാട്ടിനം',
    worldCenter: new Vector3(55, 0, 45),
    boardingRadius: 12,
    exitPosition: new Vector3(55, 1.2, 36),
    cameraConfig: { radius: 24, beta: 1.35, fov: 0.95 },
    getSeats: () => ferrisWheel.getSeats(),
  });

  RideManager.registerRide({
    id: 'columbus',
    name: 'Columbus Pirate Ship',
    malayalamName: 'കൊളംബസ് ബോട്ട്',
    worldCenter: new Vector3(72, 0, 50),
    boardingRadius: 11,
    exitPosition: new Vector3(72, 1.5, 38),
    cameraConfig: { radius: 18, beta: 1.30, fov: 0.90 },
    getSeats: () => columbusRide.getSeats(),
  });

  RideManager.registerRide({
    id: 'carousel',
    name: 'Merry-Go-Round',
    malayalamName: 'ചുഴലിക്കുതിര',
    worldCenter: new Vector3(35, 0, 60),
    boardingRadius: 7.5,
    exitPosition: new Vector3(35, 0.5, 54),
    cameraConfig: { radius: 10, beta: 1.35, fov: 0.85 },
    getSeats: () => carousel.getSeats(),
  });

  RideManager.registerRide({
    id: 'tora_tora',
    name: 'Tora Tora Thrill Ride',
    malayalamName: 'ടോറ ടോറ',
    worldCenter: new Vector3(70, 0, 18),
    boardingRadius: 11,
    exitPosition: new Vector3(70, 0.8, 8),
    cameraConfig: { radius: 12, beta: 1.30, fov: 0.95 },
    getSeats: () => toraToraRide.getSeats(),
  });

  RideManager.registerRide({
    id: 'kettuvallam',
    name: 'Houseboat Cruise',
    malayalamName: 'കെട്ടുവള്ളം',
    worldCenter: new Vector3(14, 0, 55),
    boardingRadius: 8,
    exitPosition: new Vector3(14, 0.6, 48),
    cameraConfig: { radius: 12, beta: 1.40, fov: 0.85 },
    getSeats: () => kettuvallam.getSeats(),
  });

  RideManager.registerRide({
    id: 'festival_elephant',
    name: 'Caparisoned Elephant',
    malayalamName: 'ഗജവീരൻ',
    worldCenter: new Vector3(-22, 0, -15),
    boardingRadius: 6,
    exitPosition: new Vector3(-22, 0, -11),
    cameraConfig: { radius: 8, beta: 1.35, fov: 0.85 },
    getSeats: () => festivalElephant.getSeats(),
  });

  return {
    entranceArch,
    nalukettu,
    shopsPavilion,
    foodPavilion,
    pookkalamStage,
    rideArena,
    ferrisWheel,
    carousel,
    columbusRide,
    toraToraRide,
    festivalElephant,
    thattukada,
    templePond,
    kettuvallam,
    kathakaliStage,
    chendaMelam,
    horrorHouse,
    aquaTunnelExpo,
    tradeFairStalls,
    carnivalGames,
    selfieZone,
    chundanVallam,
    playableChenda,
    coconutClimbingRig,
    coirWorkshop,
    potteryStudio,
  };
}
