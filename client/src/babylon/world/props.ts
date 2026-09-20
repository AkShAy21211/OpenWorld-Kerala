/**
 * props.ts — Kerala Fair Decorative Props (procedurally generated)
 * Coconut palms, banana trees, Nilavilakku lamp, pookkalam carpet,
 * festival flags, toran garlands, elephant statue.
 */

import {
  Scene,
  MeshBuilder,
  PBRMaterial,
  StandardMaterial,
  Color3,
  Color4,
  Vector3,
  Mesh,
  TransformNode,
  DynamicTexture,
  VertexData,
  SolidParticleSystem,
} from '@babylonjs/core';

import { FestivalDecorations } from './kerala/FestivalDecorations';

function pbr(name: string, hex: string, roughness: number, metallic: number, scene: Scene) {
  const m = new PBRMaterial(name, scene);
  m.albedoColor = Color3.FromHexString(hex);
  m.roughness = roughness;
  m.metallic = metallic;
  return m;
}

// ── Realistic Coconut Palm with Wind Sway ───────────────────────────────────
function buildCoconutPalm(name: string, x: number, z: number, scene: Scene): TransformNode {
  const root = new TransformNode(name, scene);
  root.position = new Vector3(x, 0, z);

  const trunkMat = pbr(`${name}Trunk`, '#6D4C2B', 0.9, 0.05, scene);
  const frondMat = pbr(`${name}Frond`, '#1E5E1E', 0.75, 0, scene);
  const coconutMat = pbr(`${name}Coconut`, '#4E3618', 0.85, 0, scene);

  // Curved segmented trunk (4 connected segments for natural organic bend)
  const numSegments = 5;
  const segHeight = 1.9;
  const leanAngleZ = (Math.random() - 0.5) * 0.18;
  const leanAngleX = (Math.random() - 0.5) * 0.18;

  let prevNode: TransformNode = root;
  const trunkNodes: TransformNode[] = [];

  for (let s = 0; s < numSegments; s++) {
    const dTop = 0.45 - s * 0.05;
    const dBot = 0.55 - s * 0.05;
    const seg = MeshBuilder.CreateCylinder(`${name}Seg_${s}`, {
      height: segHeight,
      diameterTop: dTop,
      diameterBottom: dBot,
      tessellation: 8,
    }, scene);
    seg.position = new Vector3(0, s === 0 ? segHeight / 2 : segHeight, 0);
    seg.rotation.z = leanAngleZ;
    seg.rotation.x = leanAngleX;
    seg.material = trunkMat;
    seg.parent = prevNode;
    prevNode = seg as unknown as TransformNode;
    trunkNodes.push(prevNode);
  }

  const crownNode = new TransformNode(`${name}Crown`, scene);
  crownNode.position = new Vector3(0, segHeight, 0);
  crownNode.parent = prevNode;

  // 10 arching palm fronds with cascading leaflet blades
  const fronds: Mesh[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const frond = MeshBuilder.CreateBox(`${name}Frond_${i}`, {
      width: 0.35,
      height: 0.06,
      depth: 3.5 + Math.random() * 0.8,
    }, scene);
    frond.position = new Vector3(
      Math.cos(angle) * 1.5,
      0.2,
      Math.sin(angle) * 1.5,
    );
    frond.rotation.y = angle;
    frond.rotation.x = 0.42 + (i % 2 === 0 ? 0.12 : -0.08);
    frond.material = frondMat;
    frond.parent = crownNode;
    fronds.push(frond);
  }

  // Cluster of ripe brown coconuts
  for (let c = 0; c < 5; c++) {
    const cAngle = (c / 5) * Math.PI * 2;
    const coconut = MeshBuilder.CreateSphere(`${name}Coc_${c}`, { diameter: 0.4, segments: 6 }, scene);
    coconut.position = new Vector3(Math.cos(cAngle) * 0.35, -0.3, Math.sin(cAngle) * 0.35);
    coconut.material = coconutMat;
    coconut.parent = crownNode;
  }

  // Wind breeze swaying animation
  let t = Math.random() * 10;
  scene.onBeforeRenderObservable.add(() => {
    t += 0.025;
    crownNode.rotation.z = Math.sin(t) * 0.05;
    crownNode.rotation.x = Math.cos(t * 0.8) * 0.04;
  });

  return root;
}

// ── Realistic Kerala Banana Plant with Vazhakula (വാഴക്കുല) ──────────────────
function buildBananaTree(name: string, x: number, z: number, scene: Scene): TransformNode {
  const root = new TransformNode(name, scene);
  root.position = new Vector3(x, 0, z);

  const trunkMat = pbr(`${name}Trunk`, '#4A7C2E', 0.85, 0, scene);
  const leafMat  = pbr(`${name}Leaf`,  '#256B1E', 0.8, 0, scene);
  const bunchMat = pbr(`${name}Bunch`, '#84CC16', 0.7, 0, scene); // Green banana
  const flowerMat = pbr(`${name}Flower`, '#7E22CE', 0.6, 0, scene); // Purple blossom (വാഴക്കൂമ്പ്)

  // Fleshy succulent pseudostem trunk
  const trunk = MeshBuilder.CreateCylinder(`${name}Trunk`, {
    height: 3.6, diameterTop: 0.38, diameterBottom: 0.65, tessellation: 10,
  }, scene);
  trunk.position = new Vector3(0, 1.8, 0);
  trunk.material = trunkMat;
  trunk.parent = root;

  // 6 Broad drooping banana leaves
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const leaf = MeshBuilder.CreateBox(`${name}Leaf_${i}`, {
      width: 0.75,
      height: 0.04,
      depth: 2.8,
    }, scene);
    leaf.position = new Vector3(Math.cos(angle) * 1.1, 3.4, Math.sin(angle) * 1.1);
    leaf.rotation.y = angle;
    leaf.rotation.x = 0.55;
    leaf.material = leafMat;
    leaf.parent = root;
  }

  // Vazhakula (Banana Fruit Bunch + Purple Blossom)
  const bunchNode = new TransformNode(`${name}Vazhakula`, scene);
  bunchNode.position = new Vector3(0.5, 3.1, 0.3);
  bunchNode.parent = root;

  // Banana hand tiers
  for (let b = 0; b < 3; b++) {
    const tier = MeshBuilder.CreateCylinder(`${name}Tier_${b}`, { height: 0.25, diameter: 0.45 - b * 0.06 }, scene);
    tier.position.y = -b * 0.28;
    tier.material = bunchMat;
    tier.parent = bunchNode;
  }

  // Hanging Purple Flower (വാഴക്കൂമ്പ്)
  const flower = MeshBuilder.CreateSphere(`${name}Flower`, { diameterX: 0.25, diameterY: 0.5, diameterZ: 0.25 }, scene);
  flower.position.y = -1.1;
  flower.material = flowerMat;
  flower.parent = bunchNode;

  return root;
}

// ── Brass Nilavilakku (Oil Lamp) ─────────────────────────────────────────────
export function buildNilavilakku(name: string, x: number, y: number, z: number, scene: Scene): TransformNode {
  const root = new TransformNode(name, scene);
  root.position = new Vector3(x, y, z);

  const brassMat = pbr(`${name}Brass`, '#B8860B', 0.25, 0.85, scene);
  const flameMat = new PBRMaterial(`${name}Flame`, scene);
  flameMat.albedoColor = new Color3(1.0, 0.55, 0.05);
  flameMat.emissiveColor = new Color3(1.0, 0.65, 0.1);
  flameMat.roughness = 1;
  flameMat.metallic = 0;

  // Stacked lamp tiers
  const tiers = [
    { h: 0.2, dTop: 1.2, dBot: 0.9, y: 0.1 },
    { h: 0.5, dTop: 0.3, dBot: 0.3, y: 0.5 },
    { h: 0.15, dTop: 1.0, dBot: 0.8, y: 0.825 },
    { h: 0.4, dTop: 0.25, dBot: 0.25, y: 1.1 },
    { h: 0.12, dTop: 0.85, dBot: 0.65, y: 1.46 },
    { h: 0.3, dTop: 0.2,  dBot: 0.2,  y: 1.66 },
    { h: 0.1, dTop: 0.7,  dBot: 0.55, y: 1.91 },
  ];

  tiers.forEach((t, i) => {
    const tier = MeshBuilder.CreateCylinder(`${name}T${i}`, {
      height: t.h, diameterTop: t.dTop, diameterBottom: t.dBot, tessellation: 12,
    }, scene);
    tier.position = new Vector3(0, t.y, 0);
    tier.material = brassMat;
    tier.parent = root;
  });

  // Flame at top
  const flame = MeshBuilder.CreateSphere(`${name}Flame`, {
    diameterX: 0.18, diameterY: 0.35, diameterZ: 0.18, segments: 6,
  }, scene);
  flame.position = new Vector3(0, 2.1, 0);
  flame.material = flameMat;
  flame.parent = root;

  // 5 oil cups (petal arms at tier 3)
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const arm = MeshBuilder.CreateCylinder(`${name}Arm${i}`, {
      height: 0.06, diameterTop: 0.22, diameterBottom: 0.18, tessellation: 8,
    }, scene);
    arm.position = new Vector3(Math.cos(angle) * 0.5, 0.97, Math.sin(angle) * 0.5);
    arm.material = brassMat;
    arm.parent = root;

    const cup = MeshBuilder.CreateSphere(`${name}Cup${i}`, {
      diameterX: 0.25, diameterY: 0.1, diameterZ: 0.25, segments: 6,
    }, scene);
    cup.position = new Vector3(Math.cos(angle) * 0.5, 1.0, Math.sin(angle) * 0.5);
    cup.material = brassMat;
    cup.parent = root;
  }

  return root;
}

// ── Pookkalam (Flower Carpet) ─────────────────────────────────────────────────
function buildPookkalam(name: string, x: number, z: number, scene: Scene): TransformNode {
  const root = new TransformNode(name, scene);
  root.position = new Vector3(x, 0.02, z);

  // Use SolidParticleSystem for thousands of flower petals in one draw call
  const sps = new SolidParticleSystem(`${name}SPS`, scene, { isPickable: false });
  const petalTemplate = MeshBuilder.CreateDisc(`${name}PetalTpl`, { radius: 0.06, tessellation: 5 }, scene);
  sps.addShape(petalTemplate, 1800);
  petalTemplate.dispose();
  const spsMesh = sps.buildMesh();
  spsMesh.parent = root;

  // Kerala pookkalam colours
  const petalColors = [
    new Color4(1.0, 0.75, 0.0, 1),   // marigold yellow
    new Color4(1.0, 0.25, 0.25, 1),  // red
    new Color4(1.0, 1.0, 1.0, 1),    // white
    new Color4(0.85, 0.25, 0.65, 1), // pink
    new Color4(0.15, 0.75, 0.2, 1),  // green leaves
  ];

  sps.initParticles = () => {
    sps.particles.forEach((p, i) => {
      // Concentric ring placement
      const ring = Math.floor(i / (sps.nbParticles / 9));
      const r = 0.15 + ring * 0.42;
      const numInRing = Math.max(6, Math.floor(2 * Math.PI * r / 0.14));
      const posInRing = i % numInRing;
      const angle = (posInRing / numInRing) * Math.PI * 2 + ring * 0.15;

      p.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
      p.rotation.set(-Math.PI / 2, 0, angle + Math.PI / 2);
      p.color = petalColors[ring % petalColors.length];
      p.scaling.setAll(1 + Math.random() * 0.3);
    });
  };
  sps.initParticles();
  sps.setParticles();

  const spsMat = new PBRMaterial(`${name}Mat`, scene);
  spsMat.roughness = 0.95;
  spsMat.metallic = 0;
  spsMesh.material = spsMat;

  return root;
}

// ── Festival Flag ─────────────────────────────────────────────────────────────
function buildFestivalFlag(name: string, x: number, z: number, color: string, scene: Scene): TransformNode {
  const root = new TransformNode(name, scene);
  root.position = new Vector3(x, 0, z);
  const poleMat = pbr(`${name}Pole`, '#8B6914', 0.85, 0, scene);
  const flagMat = pbr(`${name}Flag`, color, 0.7, 0, scene);

  const pole = MeshBuilder.CreateCylinder(`${name}Pole`, { height: 7, diameter: 0.1, tessellation: 6 }, scene);
  pole.position = new Vector3(0, 3.5, 0);
  pole.material = poleMat;
  pole.parent = root;

  const flag = MeshBuilder.CreateBox(`${name}Flag`, { width: 1.8, height: 0.9, depth: 0.03 }, scene);
  flag.position = new Vector3(0.9, 7.0, 0);
  flag.material = flagMat;
  flag.parent = root;

  // Waving animation via observable
  let t = Math.random() * Math.PI * 2;
  scene.onBeforeRenderObservable.add(() => {
    t += 0.04;
    flag.rotation.y = Math.sin(t) * 0.15;
  });

  return root;
}

// ── Low-poly Elephant ─────────────────────────────────────────────────────────
function buildElephant(name: string, x: number, z: number, scene: Scene): TransformNode {
  const root = new TransformNode(name, scene);
  root.position = new Vector3(x, 0, z);
  const mat = pbr(`${name}Mat`, '#4A4A4A', 0.88, 0.05, scene);
  const goldMat = pbr(`${name}Gold`, '#DAA520', 0.4, 0.3, scene);

  // Body
  const body = MeshBuilder.CreateBox(`${name}Body`, { width: 2.5, height: 2.2, depth: 3.5 }, scene);
  body.position = new Vector3(0, 2.0, 0);
  body.material = mat;
  body.parent = root;

  // Head
  const head = MeshBuilder.CreateSphere(`${name}Head`, { diameterX: 1.5, diameterY: 1.5, diameterZ: 1.3, segments: 8 }, scene);
  head.position = new Vector3(0, 3.2, -2.0);
  head.material = mat;
  head.parent = root;

  // Trunk (cylinder chain)
  for (let i = 0; i < 4; i++) {
    const seg = MeshBuilder.CreateCylinder(`${name}Trunk${i}`, {
      height: 0.55, diameterTop: 0.28 - i * 0.04, diameterBottom: 0.32 - i * 0.04, tessellation: 8,
    }, scene);
    seg.position = new Vector3(0, 2.5 - i * 0.45, -2.65 - i * 0.1);
    seg.rotation.x = 0.3 + i * 0.15;
    seg.material = mat;
    seg.parent = root;
  }

  // 4 legs
  [[-0.7, -1.4], [0.7, -1.4], [-0.7, 1.1], [0.7, 1.1]].forEach(([lx, lz], i) => {
    const leg = MeshBuilder.CreateCylinder(`${name}Leg${i}`, {
      height: 1.6, diameterTop: 0.5, diameterBottom: 0.55, tessellation: 8,
    }, scene);
    leg.position = new Vector3(lx, 0.8, lz);
    leg.material = mat;
    leg.parent = root;
  });

  // Caparison (gold decorated cloth panel)
  const cloth = MeshBuilder.CreateBox(`${name}Cloth`, { width: 2.5, height: 0.05, depth: 3.5 }, scene);
  cloth.position = new Vector3(0, 3.2, 0);
  cloth.material = goldMat;
  cloth.parent = root;

  return root;
}

// ── Main export ──────────────────────────────────────────────────────────────
export function buildProps(scene: Scene) {
  // Coconut palms around perimeter
  const palmPositions = [
    [-85, -85], [0, -90], [85, -85],
    [-88, 0], [88, 0],
    [-85, 85], [0, 90], [85, 85],
    [-60, -60], [60, -60], [-60, 60], [60, 60],
    [-20, -70], [20, -70], [-70, -20], [70, -20],
    [-20, 70], [20, 70], [-70, 20], [70, 20],
  ];
  palmPositions.forEach(([x, z], i) => buildCoconutPalm(`palm${i}`, x, z, scene));

  // Banana trees near pavilions
  [[-40, -25], [40, -25], [-40, 45], [40, 45], [-10, -50], [10, -50]].forEach(([x, z], i) =>
    buildBananaTree(`banana${i}`, x, z, scene),
  );

  // Central Nilavilakku (the grand lamp)
  buildNilavilakku('centralLamp', 0, 0, -5, scene);

  // Smaller lamps at each pavilion entrance
  buildNilavilakku('lampShops1',    44, 0, -25, scene);
  buildNilavilakku('lampShops2',    56, 0, -25, scene);
  buildNilavilakku('lampFood1',    -44, 0,  35, scene);
  buildNilavilakku('lampFood2',    -56, 0,  35, scene);
  buildNilavilakku('lampRide1',     44, 0,  35, scene);
  buildNilavilakku('lampRide2',     56, 0,  35, scene);
  buildNilavilakku('lampPook1',    -44, 0, -25, scene);

  // Pookkalam carpets
  buildPookkalam('pookMain', -50, -30, scene);
  buildPookkalam('pookSmall1',  8, -8, scene);
  buildPookkalam('pookSmall2', -8, -8, scene);

  // Festival flags around the perimeter
  const flagColors = ['#FFD700', '#E11D48', '#22C55E', '#3B82F6', '#A855F7', '#F97316', '#EC4899', '#14B8A6'];
  const flagPositions = [
    [-90, -90], [0, -92], [90, -90],
    [-92, 0], [92, 0],
    [-90, 90], [0, 92], [90, 90],
  ];
  flagPositions.forEach(([x, z], i) => buildFestivalFlag(`flag${i}`, x, z, flagColors[i], scene));

  // Path-side flags
  [-30, -15, 15, 30].forEach((z, i) => {
    buildFestivalFlag(`pathFlag${i}L`, -5, z, flagColors[i % flagColors.length], scene);
    buildFestivalFlag(`pathFlag${i}R`, 5, z, flagColors[(i + 4) % flagColors.length], scene);
  });

  // Elephant statue near entrance
  buildElephant('elephant', -15, -75, scene);

  // ── Deepasthambham (Tall Oil Lamp Towers) ─────────────────────────────────
  FestivalDecorations.buildDeepasthambham('deepasthambham_entrance', new Vector3(0, 0, -82), scene);
  FestivalDecorations.buildDeepasthambham('deepasthambham_courtyard', new Vector3(0, 0, 18), scene);

  // ── Akasha Vilakku (Hanging Star Lanterns) ────────────────────────────────
  // Entrance to Nalukettu string
  FestivalDecorations.buildAkashaVilakku('akasha_entrance_L', new Vector3(-8, 6, -85), new Vector3(-8, 6, -60), 6, scene);
  FestivalDecorations.buildAkashaVilakku('akasha_entrance_R', new Vector3(8, 6, -85), new Vector3(8, 6, -60), 6, scene);
  // Courtyard to Pavilions strings
  FestivalDecorations.buildAkashaVilakku('akasha_shops', new Vector3(6, 6, -15), new Vector3(45, 6, -30), 8, scene);
  FestivalDecorations.buildAkashaVilakku('akasha_food', new Vector3(-6, 6, -15), new Vector3(-45, 6, 35), 8, scene);

  // ── Mavila Thoranam (Mango Leaf & Marigold Garlands) ──────────────────────
  FestivalDecorations.buildMavilaThoranam('thoranam_arch', new Vector3(-4, 6.5, -88), new Vector3(4, 6.5, -88), scene);
  FestivalDecorations.buildMavilaThoranam('thoranam_nalukettu', new Vector3(-6, 5.0, -15), new Vector3(6, 5.0, -15), scene);

  return {};
}
