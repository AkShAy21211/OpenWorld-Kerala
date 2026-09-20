/**
 * KathakaliStage.ts — Traditional Kerala Kathakali Performance Stage (കഥകളി മണ്ഡപം)
 * Features:
 * - Raised wooden Natyagriham stage pavilion with carved pillars and terracotta roof
 * - Highly detailed Kathakali Pacha (Noble Hero) performer:
 *     - Multi-tiered ornate gold Kireedam (കിരീടം) crown with circular halo disc
 *     - Green facial mask (പച്ച വേഷം) with white Chutti ridge border
 *     - Multi-layered pleated flare costume skirt (ഉത്തരീയം) with gold-bordered frills
 *     - Red silk jacket with decorative waist sash
 *     - Expressive Mudra hands in classical Natyarambham pose
 *     - Animated expressive head tilting and rhythmic Mudra gestures
 * - Massive traditional bronze Aattavilakku (ആട്ടവിളക്ക്) stage oil lamp
 * - Havok physics platform colliders
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

export class KathakaliStage {
  public root: TransformNode;
  private performerNode: TransformNode;
  private headNode: TransformNode;
  private leftArmNode: TransformNode;
  private rightArmNode: TransformNode;

  constructor(scene: Scene, position: Vector3, shadowCast?: (m: Mesh) => void) {
    this.root = new TransformNode('kathakaliStageRoot', scene);
    this.root.position = position;

    // ── 1. Materials ──────────────────────────────────────────────────────────
    const woodMat = new PBRMaterial('kkWood', scene);
    woodMat.albedoColor = Color3.FromHexString('#5A3319');
    woodMat.roughness = 0.85;

    const tileMat = new PBRMaterial('kkTile', scene);
    tileMat.albedoColor = Color3.FromHexString('#8C3820');
    tileMat.roughness = 0.9;

    const goldMat = new PBRMaterial('kkGold', scene);
    goldMat.albedoColor = Color3.FromHexString('#FFD700');
    goldMat.roughness = 0.25;
    goldMat.metallic = 0.9;

    const pachaGreenMat = new PBRMaterial('kkPachaGreen', scene);
    pachaGreenMat.albedoColor = Color3.FromHexString('#16A34A'); // Emerald Green
    pachaGreenMat.roughness = 0.4;

    const chuttiWhiteMat = new PBRMaterial('kkChuttiWhite', scene);
    chuttiWhiteMat.albedoColor = Color3.FromHexString('#FAFAFA');
    chuttiWhiteMat.roughness = 0.3;

    const redSilkMat = new PBRMaterial('kkRedSilk', scene);
    redSilkMat.albedoColor = Color3.FromHexString('#DC2626'); // Crimson
    redSilkMat.roughness = 0.6;

    const skirtWhiteMat = new PBRMaterial('kkSkirtWhite', scene);
    skirtWhiteMat.albedoColor = Color3.FromHexString('#FFFBEB'); // Kasavu cream
    skirtWhiteMat.roughness = 0.7;

    // ── 2. Raised Wooden Stage Platform ──────────────────────────────────────
    const stageWidth = 10;
    const stageDepth = 8;
    const stageHeight = 0.8;

    const stageFloor = MeshBuilder.CreateBox('kkStageFloor', {
      width: stageWidth,
      height: stageHeight,
      depth: stageDepth,
    }, scene);
    stageFloor.position = new Vector3(0, stageHeight / 2, 0);
    stageFloor.material = woodMat;
    stageFloor.parent = this.root;
    stageFloor.receiveShadows = true;
    if (shadowCast) shadowCast(stageFloor);

    // 4 Corner Wooden Pillars
    const pillarPositions = [
      [-stageWidth / 2 + 0.6, -stageDepth / 2 + 0.6],
      [stageWidth / 2 - 0.6, -stageDepth / 2 + 0.6],
      [-stageWidth / 2 + 0.6, stageDepth / 2 - 0.6],
      [stageWidth / 2 - 0.6, stageDepth / 2 - 0.6],
    ];

    pillarPositions.forEach(([px, pz], i) => {
      const pillar = MeshBuilder.CreateCylinder(`kkPillar_${i}`, {
        height: 4.5,
        diameterTop: 0.35,
        diameterBottom: 0.45,
        tessellation: 8,
      }, scene);
      pillar.position = new Vector3(px, stageHeight + 2.25, pz);
      pillar.material = woodMat;
      pillar.parent = this.root;
      if (shadowCast) shadowCast(pillar);
    });

    // Stage Canopy Roof
    const roof = MeshBuilder.CreateCylinder('kkStageRoof', {
      height: 2.2,
      diameterTop: 0,
      diameterBottom: 11.5,
      tessellation: 4,
    }, scene);
    roof.position = new Vector3(0, stageHeight + 4.5 + 1.1, 0);
    roof.rotation.y = Math.PI / 4;
    roof.material = tileMat;
    roof.parent = this.root;
    if (shadowCast) shadowCast(roof);

    // Front stage stairs
    const stairs = MeshBuilder.CreateBox('kkStairs', { width: 3.5, height: 0.4, depth: 1.5 }, scene);
    stairs.position = new Vector3(0, 0.2, -stageDepth / 2 - 0.75);
    stairs.material = woodMat;
    stairs.parent = this.root;

    if (scene.isPhysicsEnabled()) {
      PhysicsManager.addStaticBoxCollider(stageFloor, scene, new Vector3(stageWidth, stageHeight, stageDepth));
    }

    // ── 3. Kathakali Performer Character ────────────────────────────────────
    this.performerNode = new TransformNode('kathakaliPerformer', scene);
    this.performerNode.position = new Vector3(0, stageHeight, 0);
    this.performerNode.parent = this.root;

    // A. Flared Pleated Skirt (Ghagroo) — Multi-tiered flared cylinders
    const skirtBottom = MeshBuilder.CreateCylinder('kkSkirtBtm', {
      height: 1.1,
      diameterTop: 0.8,
      diameterBottom: 2.4,
      tessellation: 16,
    }, scene);
    skirtBottom.position = new Vector3(0, 0.55, 0);
    skirtBottom.material = skirtWhiteMat;
    skirtBottom.parent = this.performerNode;
    if (shadowCast) shadowCast(skirtBottom);

    // Gold decorative border ring at skirt rim
    const skirtBorder = MeshBuilder.CreateTorus('kkSkirtBorder', {
      diameter: 2.38,
      thickness: 0.08,
      tessellation: 20,
    }, scene);
    skirtBorder.rotation.x = Math.PI / 2;
    skirtBorder.position = new Vector3(0, 0.05, 0);
    skirtBorder.material = goldMat;
    skirtBorder.parent = this.performerNode;

    // B. Red Torso & Kasavu Stole
    const torso = MeshBuilder.CreateBox('kkTorso', { width: 0.75, height: 0.9, depth: 0.45 }, scene);
    torso.position = new Vector3(0, 1.55, 0);
    torso.material = redSilkMat;
    torso.parent = this.performerNode;
    if (shadowCast) shadowCast(torso);

    // Gold breastplate jewelry necklace
    const necklace = MeshBuilder.CreateBox('kkNecklace', { width: 0.65, height: 0.5, depth: 0.48 }, scene);
    necklace.position = new Vector3(0, 1.6, 0.02);
    necklace.material = goldMat;
    necklace.parent = this.performerNode;

    // C. Head & Elaborate Makeup
    this.headNode = new TransformNode('kkHeadNode', scene);
    this.headNode.position = new Vector3(0, 2.2, 0);
    this.headNode.parent = this.performerNode;

    // Green Face Sphere
    const face = MeshBuilder.CreateSphere('kkFace', { diameter: 0.52, segments: 10 }, scene);
    face.position = new Vector3(0, 0, 0);
    face.material = pachaGreenMat;
    face.parent = this.headNode;

    // White Chutti Ridge (raised white crescent beard border)
    const chutti = MeshBuilder.CreateTorus('kkChutti', {
      diameter: 0.56,
      thickness: 0.08,
      tessellation: 16,
    }, scene);
    chutti.position = new Vector3(0, -0.08, 0.1);
    chutti.rotation.x = Math.PI / 3;
    chutti.material = chuttiWhiteMat;
    chutti.parent = this.headNode;

    // D. Grand Kireedam Crown (കിരീടം)
    // Multi-tier conical gold crown
    const crownBase = MeshBuilder.CreateCylinder('kkCrownBase', { height: 0.35, diameterTop: 0.65, diameterBottom: 0.5 }, scene);
    crownBase.position = new Vector3(0, 0.4, 0);
    crownBase.material = goldMat;
    crownBase.parent = this.headNode;

    const crownCone = MeshBuilder.CreateCylinder('kkCrownCone', { height: 0.8, diameterTop: 0.1, diameterBottom: 0.65 }, scene);
    crownCone.position = new Vector3(0, 0.9, 0);
    crownCone.material = goldMat;
    crownCone.parent = this.headNode;

    // Circular halo disc behind head (ഓട്ടുകിരീട വട്ട)
    const haloDisc = MeshBuilder.CreateCylinder('kkHaloDisc', { height: 0.06, diameter: 1.3, tessellation: 24 }, scene);
    haloDisc.rotation.x = Math.PI / 2;
    haloDisc.position = new Vector3(0, 0.45, -0.15);
    haloDisc.material = goldMat;
    haloDisc.parent = this.headNode;
    if (shadowCast) shadowCast(haloDisc);

    // E. Arms & Mudras (Natyarambham Pose)
    this.leftArmNode = new TransformNode('kkArmL', scene);
    this.leftArmNode.position = new Vector3(-0.5, 1.8, 0);
    this.leftArmNode.parent = this.performerNode;

    const lArm = MeshBuilder.CreateCylinder('kkLArmMesh', { height: 0.65, diameter: 0.18 }, scene);
    lArm.rotation.z = Math.PI / 3;
    lArm.position = new Vector3(-0.25, -0.15, 0.2);
    lArm.material = redSilkMat;
    lArm.parent = this.leftArmNode;

    // Gold Bangle / Mudra Hand Left
    const lHand = MeshBuilder.CreateSphere('kkLHand', { diameter: 0.16 }, scene);
    lHand.position = new Vector3(-0.55, -0.3, 0.4);
    lHand.material = goldMat;
    lHand.parent = this.leftArmNode;

    this.rightArmNode = new TransformNode('kkArmR', scene);
    this.rightArmNode.position = new Vector3(0.5, 1.8, 0);
    this.rightArmNode.parent = this.performerNode;

    const rArm = MeshBuilder.CreateCylinder('kkRArmMesh', { height: 0.65, diameter: 0.18 }, scene);
    rArm.rotation.z = -Math.PI / 3;
    rArm.position = new Vector3(0.25, -0.15, 0.2);
    rArm.material = redSilkMat;
    rArm.parent = this.rightArmNode;

    // Gold Bangle / Mudra Hand Right
    const rHand = MeshBuilder.CreateSphere('kkRHand', { diameter: 0.16 }, scene);
    rHand.position = new Vector3(0.55, -0.3, 0.4);
    rHand.material = goldMat;
    rHand.parent = this.rightArmNode;

    // ── 4. Grand Bronze Aattavilakku (ആട്ടവിളക്ക്) ───────────────────────────
    const lamp = MeshBuilder.CreateCylinder('kkAattavilakku', { height: 1.8, diameterTop: 0.7, diameterBottom: 0.8 }, scene);
    lamp.position = new Vector3(0, stageHeight + 0.9, -2.5);
    lamp.material = goldMat;
    lamp.parent = this.root;
    if (shadowCast) shadowCast(lamp);

    // Glowing flame on lamp
    const flame = MeshBuilder.CreateSphere('kkLampFlame', { diameter: 0.28, segments: 6 }, scene);
    flame.position = new Vector3(0, stageHeight + 1.9, -2.5);
    const flameMat = new PBRMaterial('kkFlameMat', scene);
    flameMat.albedoColor = Color3.FromHexString('#FFD700');
    flameMat.emissiveColor = Color3.FromHexString('#FF6B00');
    flameMat.emissiveIntensity = 3.0;
    flame.material = flameMat;
    flame.parent = this.root;

    const lampLight = new PointLight('kkStageLight', new Vector3(0, stageHeight + 2.0, -2.3), scene);
    lampLight.diffuse = Color3.FromHexString('#FFA726');
    lampLight.intensity = 1.8;
    lampLight.range = 10;
    lampLight.parent = this.root;

    // ── 5. Classical Performance Mudra & Head Gestures Animation ─────────────
    let time = 0;
    scene.onBeforeRenderObservable.add(() => {
      const dt = scene.getEngine().getDeltaTime() / 1000;
      time += dt;

      // Head rhythmic nodding / tilt
      this.headNode.rotation.y = Math.sin(time * 1.5) * 0.12;
      this.headNode.rotation.z = Math.sin(time * 1.2) * 0.06;

      // Arm gestures (Mudra transitions)
      this.leftArmNode.rotation.x = Math.sin(time * 2.0) * 0.15;
      this.rightArmNode.rotation.x = -Math.sin(time * 2.0) * 0.15;

      // Subtle breath rise of torso
      torso.position.y = 1.55 + Math.sin(time * 2.5) * 0.02;
    });
  }
}
