/**
 * CoconutClimbingRig.ts — Traditional Kerala Coconut Tree Climbing Arena (തെങ്ങുകയറ്റം)
 * Features:
 * - 12-meter authentic swaying coconut palm trunk with bark ring ridges
 * - 16 tropical green coconut fronds with wind sway animation
 * - 3 large clusters of fresh green and golden tender coconuts (ഇളനീർ കുലകൾ)
 * - Steel safety cable guide with harness carabiner
 * - Coir climbing foot-loops (തളപ്പ് / Thallappu)
 * - Safety sand landing pit with bamboo perimeter fence
 * - Taliparamba Coconut Sprint challenge signpost
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

export class CoconutClimbingRig {
  public root: TransformNode;
  private trunkTop: TransformNode;
  private fronds: TransformNode[] = [];

  constructor(scene: Scene, position: Vector3, shadowCast?: (m: Mesh) => void) {
    this.root = new TransformNode('coconutClimbingRigRoot', scene);
    this.root.position = position;

    // ── 1. Materials ──────────────────────────────────────────────────────────
    const barkMat = new PBRMaterial('palmBarkMat', scene);
    barkMat.albedoColor = Color3.FromHexString('#5D4037'); // Textured palm trunk
    barkMat.roughness = 0.9;
    barkMat.metallic = 0.05;

    const ringMat = new PBRMaterial('palmRingMat', scene);
    ringMat.albedoColor = Color3.FromHexString('#3E2723'); // Darker bark ring
    ringMat.roughness = 0.95;

    const frondMat = new PBRMaterial('palmFrondMat', scene);
    frondMat.albedoColor = Color3.FromHexString('#2E7D32'); // Tropical green
    frondMat.roughness = 0.7;

    const nutMat = new PBRMaterial('coconutMat', scene);
    nutMat.albedoColor = Color3.FromHexString('#689F38'); // Green tender coconut
    nutMat.roughness = 0.6;

    const goldNutMat = new PBRMaterial('goldCoconutMat', scene);
    goldNutMat.albedoColor = Color3.FromHexString('#F59E0B'); // Golden King coconut
    goldNutMat.roughness = 0.5;

    const sandMat = new PBRMaterial('sandPitMat', scene);
    sandMat.albedoColor = Color3.FromHexString('#D7CCC8'); // Soft safety sand
    sandMat.roughness = 0.95;

    const bambooMat = new PBRMaterial('bambooFenceMat', scene);
    bambooMat.albedoColor = Color3.FromHexString('#9E9D24');
    bambooMat.roughness = 0.75;

    const harnessMat = new PBRMaterial('safetyHarnessMat', scene);
    harnessMat.albedoColor = Color3.FromHexString('#E11D48'); // Safety red
    harnessMat.metallic = 0.5;

    // ── 2. Sand Landing Pit & Bamboo Perimeter Fence ────────────────────────
    const sandPit = MeshBuilder.CreateCylinder('sandPitMesh', { diameter: 7.0, height: 0.35, tessellation: 16 }, scene);
    sandPit.position = new Vector3(0, 0.17, 0);
    sandPit.material = sandMat;
    sandPit.receiveShadows = true;
    sandPit.parent = this.root;

    if (scene.isPhysicsEnabled()) {
      PhysicsManager.addStaticBoxCollider(sandPit, scene, new Vector3(7.0, 0.35, 7.0));
    }

    // Bamboo fence posts
    for (let p = 0; p < 12; p++) {
      const angle = (p / 12) * Math.PI * 2;
      const post = MeshBuilder.CreateCylinder(`fencePost_${p}`, { height: 1.2, diameter: 0.1 }, scene);
      post.position = new Vector3(Math.cos(angle) * 3.3, 0.6, Math.sin(angle) * 3.3);
      post.material = bambooMat;
      post.parent = this.root;
    }

    // ── 3. Slender Curved Coconut Palm Trunk (12m tall) ─────────────────────
    const trunkSegments = 10;
    let currentParent = this.root;

    for (let i = 0; i < trunkSegments; i++) {
      const segH = 1.2;
      const segDiam = 0.55 - (i / trunkSegments) * 0.18; // Tapering upward

      const seg = MeshBuilder.CreateCylinder(`palmSeg_${i}`, { height: segH, diameter: segDiam, tessellation: 12 }, scene);
      seg.position = new Vector3(0, i === 0 ? 0.6 : segH, 0);
      // Slight natural organic curve
      seg.rotation.z = Math.sin(i * 0.4) * 0.035;
      seg.material = barkMat;
      seg.parent = currentParent;
      if (shadowCast) shadowCast(seg);

      // Ring ridges on trunk
      const ring = MeshBuilder.CreateTorus(`palmRing_${i}`, { diameter: segDiam + 0.03, thickness: 0.03 }, scene);
      ring.position = new Vector3(0, 0, 0);
      ring.material = ringMat;
      ring.parent = seg;

      currentParent = seg as unknown as TransformNode;
    }

    this.trunkTop = currentParent;

    // ── 4. Crown Fronds & Coconut Bunches (Elaneer) ──────────────────────────
    const crownNode = new TransformNode('palmCrownNode', scene);
    crownNode.position = new Vector3(0, 0.8, 0);
    crownNode.parent = this.trunkTop;

    // 16 Arching Green Fronds
    for (let f = 0; f < 16; f++) {
      const fAngle = (f / 16) * Math.PI * 2;
      const frondPivot = new TransformNode(`frondPivot_${f}`, scene);
      frondPivot.rotation.y = fAngle;
      frondPivot.parent = crownNode;

      const frondMesh = MeshBuilder.CreateCylinder(`frondMesh_${f}`, {
        height: 3.6,
        diameterTop: 0.1,
        diameterBottom: 0.85,
        tessellation: 4,
      }, scene);
      frondMesh.position = new Vector3(0, 0.8, 1.6);
      frondMesh.rotation.x = Math.PI / 3.2; // Arch downward
      frondMesh.scaling = new Vector3(0.15, 1, 1);
      frondMesh.material = frondMat;
      frondMesh.parent = frondPivot;
      if (shadowCast) shadowCast(frondMesh);

      this.fronds.push(frondPivot);
    }

    // Bunches of Green & Golden Coconuts
    for (let c = 0; c < 8; c++) {
      const cAngle = (c / 8) * Math.PI * 2;
      const nut = MeshBuilder.CreateSphere(`coconutNut_${c}`, { diameterX: 0.35, diameterY: 0.45, diameterZ: 0.35 }, scene);
      nut.position = new Vector3(Math.cos(cAngle) * 0.45, -0.2, Math.sin(cAngle) * 0.45);
      nut.material = c === 3 || c === 7 ? goldNutMat : nutMat;
      nut.parent = crownNode;
    }

    // ── 5. Vertical Steel Safety Line & Harness ─────────────────────────────
    const safetyLine = MeshBuilder.CreateCylinder('safetyCableMesh', { height: 11.5, diameter: 0.03 }, scene);
    safetyLine.position = new Vector3(0.5, 6.0, 0);
    safetyLine.material = harnessMat;
    safetyLine.parent = this.root;

    // Coir climbing foot loops (തളപ്പ്) at bottom
    const footLoop = MeshBuilder.CreateTorus('thallappuLoop', { diameter: 0.45, thickness: 0.06 }, scene);
    footLoop.position = new Vector3(0, 0.9, 0);
    footLoop.rotation.x = Math.PI / 2;
    footLoop.material = bambooMat;
    footLoop.parent = this.root;

    // Signpost
    const signBoard = MeshBuilder.CreatePlane('coconutSprintSign', { width: 2.8, height: 1.1 }, scene);
    signBoard.position = new Vector3(0, 1.8, 3.8);
    const signMat = new PBRMaterial('coconutSprintSignMat', scene);
    signMat.albedoColor = Color3.FromHexString('#FACC15');
    signBoard.material = signMat;
    signBoard.parent = this.root;

    // ── 6. Natural Wind Sway Animation Loop ──────────────────────────────────
    let time = 0;
    scene.onBeforeRenderObservable.add(() => {
      const dt = scene.getEngine().getDeltaTime() / 1000;
      time += dt;

      // Gentle wind breeze swaying the fronds
      this.fronds.forEach((frond, idx) => {
        frond.rotation.x = Math.sin(time * 2.0 + idx * 0.4) * 0.05;
      });
    });
  }
}
