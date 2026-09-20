/**
 * TradeFairStalls.ts — Malabar Food Street & Trade Fair Exhibition Stalls
 * Authentic culinary and shopping attractions at Kannur Police Maidan Fair.
 * Features:
 * 1. Live Kozhikodan Halwa Making Counter with giant bronze Uruli cauldron and halwa stacks
 * 2. Vintage Cotton Candy & Popcorn Cart (പഞ്ഞിമിഠായി വണ്ടി)
 * 3. Spiced Pickled Fruit Counter (ഉപ്പിലിട്ട മാങ്ങ, നെല്ലിക്ക & കാന്താരി)
 * 4. Covered Consumer Trade Expo Hangar Row
 * 5. Havok physics colliders on all counters
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

export class TradeFairStalls {
  public root: TransformNode;

  constructor(scene: Scene, position: Vector3, shadowCast?: (m: Mesh) => void) {
    this.root = new TransformNode('tradeFairStallsRoot', scene);
    this.root.position = position;

    // ── 1. Materials ──────────────────────────────────────────────────────────
    const woodMat = new PBRMaterial('tfsWood', scene);
    woodMat.albedoColor = Color3.FromHexString('#5C3826');
    woodMat.roughness = 0.8;

    const bronzeMat = new PBRMaterial('tfsBronze', scene);
    bronzeMat.albedoColor = Color3.FromHexString('#B87333'); // Polished Bell Bronze
    bronzeMat.metallic = 0.9;
    bronzeMat.roughness = 0.25;

    const blackHalwaMat = new PBRMaterial('tfsBlackHalwa', scene);
    blackHalwaMat.albedoColor = Color3.FromHexString('#1C1917'); // Glossy Black Ghee Halwa
    blackHalwaMat.roughness = 0.2;
    blackHalwaMat.metallic = 0.1;

    const redHalwaMat = new PBRMaterial('tfsRedHalwa', scene);
    redHalwaMat.albedoColor = Color3.FromHexString('#DC2626'); // Red Kerala Halwa
    redHalwaMat.roughness = 0.3;

    const glassMat = new PBRMaterial('tfsGlass', scene);
    glassMat.albedoColor = Color3.FromHexString('#E0F2FE');
    glassMat.alpha = 0.35;
    glassMat.roughness = 0.1;

    const cottonPinkMat = new PBRMaterial('tfsCottonPink', scene);
    cottonPinkMat.albedoColor = Color3.FromHexString('#F472B6'); // Pink Cotton Candy
    cottonPinkMat.roughness = 0.95;

    const bananaLeafMat = new PBRMaterial('tfsBananaLeaf', scene);
    bananaLeafMat.albedoColor = Color3.FromHexString('#4D7C0F');

    // ── 2. Live Kozhikodan Halwa Counter (കോഴിക്കോടൻ ഹൽവ) ─────────────────────
    const halwaStall = new TransformNode('halwaStall', scene);
    halwaStall.position = new Vector3(-8.0, 0, 0);
    halwaStall.parent = this.root;

    // Wooden Counter
    const halwaCounter = MeshBuilder.CreateBox('halwaCounter', { width: 4.5, height: 1.0, depth: 1.8 }, scene);
    halwaCounter.position = new Vector3(0, 0.5, 0);
    halwaCounter.material = woodMat;
    halwaCounter.parent = halwaStall;
    if (shadowCast) shadowCast(halwaCounter);

    // Giant Bronze Uruli Cauldron (ഉരുളി)
    const uruli = MeshBuilder.CreateCylinder('halwaUruli', {
      height: 0.6,
      diameterTop: 1.6,
      diameterBottom: 1.2,
      tessellation: 16,
    }, scene);
    uruli.position = new Vector3(-1.1, 1.3, 0);
    uruli.material = bronzeMat;
    uruli.parent = halwaStall;
    if (shadowCast) shadowCast(uruli);

    // Steaming Hot Black Halwa inside Uruli
    const halwaContent = MeshBuilder.CreateCylinder('halwaInside', { height: 0.1, diameter: 1.5 }, scene);
    halwaContent.position = new Vector3(-1.1, 1.5, 0);
    halwaContent.material = blackHalwaMat;
    halwaContent.parent = halwaStall;

    // Wooden Stirring Ladle (തുടുപ്പ്)
    const thuduppu = MeshBuilder.CreateCylinder('thuduppu', { height: 1.4, diameter: 0.08 }, scene);
    thuduppu.rotation.z = Math.PI / 4;
    thuduppu.position = new Vector3(-0.7, 1.8, 0);
    thuduppu.material = woodMat;
    thuduppu.parent = halwaStall;

    // Sliced Halwa Blocks Display
    [
      { color: blackHalwaMat, x: 0.5, z: -0.3 },
      { color: redHalwaMat, x: 1.3, z: -0.3 },
      { color: blackHalwaMat, x: 0.5, z: 0.3 },
      { color: redHalwaMat, x: 1.3, z: 0.3 },
    ].forEach((spec, idx) => {
      // Banana leaf liner
      const leaf = MeshBuilder.CreateBox(`leaf_${idx}`, { width: 0.65, height: 0.02, depth: 0.5 }, scene);
      leaf.position = new Vector3(spec.x, 1.02, spec.z);
      leaf.material = bananaLeafMat;
      leaf.parent = halwaStall;

      // Halwa Block Stack
      const block = MeshBuilder.CreateBox(`halwaBlock_${idx}`, { width: 0.55, height: 0.25, depth: 0.4 }, scene);
      block.position = new Vector3(spec.x, 1.15, spec.z);
      block.material = spec.color;
      block.parent = halwaStall;
    });

    // ── 3. Cotton Candy & Popcorn Cart (പഞ്ഞിമിഠായി വണ്ടി) ────────────────────
    const cottonCart = new TransformNode('cottonCandyCart', scene);
    cottonCart.position = new Vector3(0, 0, 0);
    cottonCart.parent = this.root;

    // Cart Body (Red vintage box)
    const cartBody = MeshBuilder.CreateBox('cartBody', { width: 2.8, height: 1.1, depth: 1.6 }, scene);
    cartBody.position = new Vector3(0, 0.75, 0);
    const cartRedMat = new PBRMaterial('cartRed', scene);
    cartRedMat.albedoColor = Color3.FromHexString('#E11D48');
    cartBody.material = cartRedMat;
    cartBody.parent = cottonCart;
    if (shadowCast) shadowCast(cartBody);

    // Spoke Wheels (2 wheels on sides)
    [-1.42, 1.42].forEach((xWheel, wIdx) => {
      const wheel = MeshBuilder.CreateTorus(`cartWheel_${wIdx}`, { diameter: 0.9, thickness: 0.08 }, scene);
      wheel.position = new Vector3(xWheel, 0.45, 0);
      wheel.material = bronzeMat;
      wheel.parent = cottonCart;
    });

    // Striped Awning Roof
    const awning = MeshBuilder.CreateBox('cartAwning', { width: 3.0, height: 0.15, depth: 1.8 }, scene);
    awning.position = new Vector3(0, 2.3, 0);
    awning.material = cartRedMat;
    awning.parent = cottonCart;

    // 4 Awning Poles
    [[-1.3, -0.7], [1.3, -0.7], [-1.3, 0.7], [1.3, 0.7]].forEach(([px, pz], pIdx) => {
      const pole = MeshBuilder.CreateCylinder(`awningPole_${pIdx}`, { height: 1.1, diameter: 0.05 }, scene);
      pole.position = new Vector3(px, 1.8, pz);
      pole.material = bronzeMat;
      pole.parent = cottonCart;
    });

    // Cotton Candy Display Tree (Fluffy pink & white sugar cloud sticks)
    for (let c = 0; c < 5; c++) {
      const stick = MeshBuilder.CreateCylinder(`cottonStick_${c}`, { height: 0.6, diameter: 0.02 }, scene);
      stick.position = new Vector3(-0.7 + c * 0.35, 1.5, 0.3);
      stick.parent = cottonCart;

      const candy = MeshBuilder.CreateSphere(`cottonCandy_${c}`, { diameterX: 0.28, diameterY: 0.42, diameterZ: 0.28 }, scene);
      candy.position = new Vector3(-0.7 + c * 0.35, 1.7, 0.3);
      candy.material = cottonPinkMat;
      candy.parent = cottonCart;
    }

    // ── 4. Spiced Pickled Fruit Counter (ഉപ്പിലിട്ട മാങ്ങ & നെല്ലിക്ക) ────────
    const pickleStall = new TransformNode('pickleStall', scene);
    pickleStall.position = new Vector3(8.0, 0, 0);
    pickleStall.parent = this.root;

    const pickleCounter = MeshBuilder.CreateBox('pickleCounter', { width: 4.2, height: 1.0, depth: 1.6 }, scene);
    pickleCounter.position = new Vector3(0, 0.5, 0);
    pickleCounter.material = woodMat;
    pickleCounter.parent = pickleStall;
    if (shadowCast) shadowCast(pickleCounter);

    // 6 Clear Glass Jars with Pickled Mangoes & Chilies
    const mangaMat = new PBRMaterial('tfsManga', scene);
    mangaMat.albedoColor = Color3.FromHexString('#84CC16'); // Green Mango
    const chiliMat = new PBRMaterial('tfsChili', scene);
    chiliMat.albedoColor = Color3.FromHexString('#DC2626'); // Red Kanthari Chili

    for (let j = 0; j < 6; j++) {
      const xJar = -1.5 + (j % 3) * 1.5;
      const zJar = j < 3 ? -0.3 : 0.3;

      // Glass Jar Outer
      const jar = MeshBuilder.CreateCylinder(`jar_${j}`, { height: 0.7, diameter: 0.45, tessellation: 12 }, scene);
      jar.position = new Vector3(xJar, 1.35, zJar);
      jar.material = glassMat;
      jar.parent = pickleStall;

      // Pickled mango/nellikka inside
      const insideFruit = MeshBuilder.CreateSphere(`fruitInside_${j}`, { diameter: 0.35 }, scene);
      insideFruit.position = new Vector3(xJar, 1.3, zJar);
      insideFruit.material = j % 2 === 0 ? mangaMat : chiliMat;
      insideFruit.parent = pickleStall;
    }

    if (scene.isPhysicsEnabled()) {
      PhysicsManager.addStaticBoxCollider(halwaCounter, scene, new Vector3(4.5, 1.0, 1.8));
      PhysicsManager.addStaticBoxCollider(cartBody, scene, new Vector3(2.8, 1.1, 1.6));
      PhysicsManager.addStaticBoxCollider(pickleCounter, scene, new Vector3(4.2, 1.0, 1.6));
    }
  }
}
