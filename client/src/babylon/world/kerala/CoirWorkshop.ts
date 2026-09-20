/**
 * CoirWorkshop.ts — Traditional Kerala Coir-Making Machine & Workshop (കയർ റാട്ട്)
 * Features:
 * - Traditional 2-wheel wooden spinning apparatus (കയർ റാട്ട്) with rotating gears and twin twisting hooks
 * - Coconut husk fiber feeding trough box (ചകിരി പാത്രം) with golden fiber tufts
 * - Finished coir rope spools and bundles on display shelves
 * - Bamboo-thatched roof shelter canopy
 * - Rotating wheel drive mechanism with rope tension vibration
 */

import {
  Scene,
  TransformNode,
  MeshBuilder,
  PBRMaterial,
  Color3,
  Vector3,
  Mesh,
} from '@babylonjs/core';
import { PhysicsManager } from '../../physics/PhysicsManager';

export class CoirWorkshop {
  public root: TransformNode;
  private driveWheel: TransformNode;
  private smallWheel: TransformNode;
  private ropeStrands: Mesh[] = [];

  constructor(scene: Scene, position: Vector3, shadowCast?: (m: Mesh) => void) {
    this.root = new TransformNode('coirWorkshopRoot', scene);
    this.root.position = position;

    // ── 1. Materials ──────────────────────────────────────────────────────────
    const woodMat = new PBRMaterial('coirWoodMat', scene);
    woodMat.albedoColor = Color3.FromHexString('#5D4037'); // Weathered timber
    woodMat.roughness = 0.85;

    const coirMat = new PBRMaterial('goldenCoirMat', scene);
    coirMat.albedoColor = Color3.FromHexString('#D4A373'); // Golden coconut husk fiber
    coirMat.roughness = 0.95;

    const ironMat = new PBRMaterial('coirIronMat', scene);
    ironMat.albedoColor = Color3.FromHexString('#374151'); // Cast iron wheel rims
    ironMat.metallic = 0.8;
    ironMat.roughness = 0.4;

    const thatchMat = new PBRMaterial('coirThatchMat', scene);
    thatchMat.albedoColor = Color3.FromHexString('#A78B60');
    thatchMat.roughness = 0.9;

    // ── 2. Workshop Wooden Platform & Canopy ────────────────────────────────
    const platform = MeshBuilder.CreateBox('coirPlatform', { width: 6.5, height: 0.35, depth: 5.5 }, scene);
    platform.position = new Vector3(0, 0.17, 0);
    platform.material = woodMat;
    platform.receiveShadows = true;
    platform.parent = this.root;

    if (scene.isPhysicsEnabled()) {
      PhysicsManager.addStaticBoxCollider(platform, scene, new Vector3(6.5, 0.35, 5.5));
    }

    // 4 Bamboo Corner Posts
    [[-3.0, -2.4], [3.0, -2.4], [-3.0, 2.4], [3.0, 2.4]].forEach(([x, z], pIdx) => {
      const post = MeshBuilder.CreateCylinder(`coirPost_${pIdx}`, { height: 3.2, diameter: 0.12 }, scene);
      post.position = new Vector3(x, 1.6, z);
      post.material = woodMat;
      post.parent = this.root;
    });

    // Thatched Hip Canopy Roof
    const roof = MeshBuilder.CreateBox('coirRoof', { width: 7.2, height: 0.25, depth: 6.2 }, scene);
    roof.position = new Vector3(0, 3.3, 0);
    roof.material = thatchMat;
    roof.parent = this.root;
    roof.receiveShadows = true;
    if (shadowCast) shadowCast(roof);

    // ── 3. Traditional Coir Spinning Ratt Machine (കയർ റാട്ട്) ──────────────
    const machineNode = new TransformNode('coirRattMachine', scene);
    machineNode.position = new Vector3(-1.4, 0.35, 0);
    machineNode.parent = this.root;

    // Wooden A-frame stands
    [-0.5, 0.5].forEach((zStand, sIdx) => {
      const stand = MeshBuilder.CreateBox(`rattStand_${sIdx}`, { width: 0.15, height: 1.6, depth: 0.8 }, scene);
      stand.position = new Vector3(0, 0.8, zStand);
      stand.material = woodMat;
      stand.parent = machineNode;
    });

    // Large Drive Flywheel (വലിയ ചക്രം)
    this.driveWheel = new TransformNode('coirDriveWheel', scene);
    this.driveWheel.position = new Vector3(0, 1.1, 0);
    this.driveWheel.parent = machineNode;

    const flywheel = MeshBuilder.CreateTorus('flywheelRim', { diameter: 1.4, thickness: 0.08, tessellation: 24 }, scene);
    flywheel.rotation.z = Math.PI / 2;
    flywheel.material = ironMat;
    flywheel.parent = this.driveWheel;
    if (shadowCast) shadowCast(flywheel);

    // 6 Wooden Spokes on Flywheel
    for (let sp = 0; sp < 6; sp++) {
      const angle = (sp / 6) * Math.PI * 2;
      const spoke = MeshBuilder.CreateCylinder(`flywheelSpoke_${sp}`, { height: 1.3, diameter: 0.04 }, scene);
      spoke.position = new Vector3(0, Math.sin(angle) * 0.35, Math.cos(angle) * 0.35);
      spoke.rotation.x = angle;
      spoke.material = woodMat;
      spoke.parent = this.driveWheel;
    }

    // Small High-Speed Pinion Wheel (ചെറിയ ചക്രം)
    this.smallWheel = new TransformNode('coirSmallWheel', scene);
    this.smallWheel.position = new Vector3(0, 1.6, 0);
    this.smallWheel.parent = machineNode;

    const smallFlywheel = MeshBuilder.CreateTorus('smallWheelRim', { diameter: 0.45, thickness: 0.05 }, scene);
    smallFlywheel.rotation.z = Math.PI / 2;
    smallFlywheel.material = ironMat;
    smallFlywheel.parent = this.smallWheel;

    // ── 4. Fiber Feed Box & Twisting Rope Strands ─────────────────────────────
    const feedBox = MeshBuilder.CreateBox('coirFeedBox', { width: 1.4, height: 0.6, depth: 1.2 }, scene);
    feedBox.position = new Vector3(1.6, 0.65, 0);
    feedBox.material = woodMat;
    feedBox.parent = this.root;

    // Raw coconut husk fiber mound in box
    const fiberTuft = MeshBuilder.CreateSphere('huskFiberTuft', { diameterX: 1.2, diameterY: 0.4, diameterZ: 1.0 }, scene);
    fiberTuft.position = new Vector3(1.6, 0.95, 0);
    fiberTuft.material = coirMat;
    fiberTuft.parent = this.root;

    // 2 Twisting Golden Coir Strands connecting machine to feed box
    [-0.15, 0.15].forEach((zOff, rIdx) => {
      const strand = MeshBuilder.CreateCylinder(`ropeStrand_${rIdx}`, { height: 2.8, diameter: 0.03 }, scene);
      strand.position = new Vector3(0.1, 1.4 + rIdx * 0.1, zOff);
      strand.rotation.z = Math.PI / 2;
      strand.material = coirMat;
      strand.parent = this.root;
      this.ropeStrands.push(strand);
    });

    // Finished Coir Rope Spool on shelf
    const ropeSpool = MeshBuilder.CreateCylinder('finishedRopeSpool', { height: 0.6, diameter: 0.7, tessellation: 16 }, scene);
    ropeSpool.position = new Vector3(-2.2, 0.6, 1.8);
    ropeSpool.material = coirMat;
    ropeSpool.parent = this.root;

    // Signpost
    const signBoard = MeshBuilder.CreatePlane('coirSignBoard', { width: 2.5, height: 0.9 }, scene);
    signBoard.position = new Vector3(0, 2.7, -2.8);
    const signMat = new PBRMaterial('coirSignMat', scene);
    signMat.albedoColor = Color3.FromHexString('#D97706');
    signBoard.material = signMat;
    signBoard.parent = this.root;

    // ── 5. Mechanical Spinning Animation Loop ────────────────────────────────
    let time = 0;
    scene.onBeforeRenderObservable.add(() => {
      const dt = scene.getEngine().getDeltaTime() / 1000;
      time += dt;

      // Rotate flywheel and small wheel at proportional gear speeds
      this.driveWheel.rotation.x += 1.5 * dt;
      this.smallWheel.rotation.x += 4.5 * dt;

      // Subtle tension vibration on rope strands
      this.ropeStrands.forEach((strand, idx) => {
        strand.position.y = (1.4 + idx * 0.1) + Math.sin(time * 12.0 + idx) * 0.01;
      });
    });
  }
}
