/**
 * Kettuvallam.ts — Traditional Kerala Backwater Houseboat (കെട്ടുവള്ളം)
 * Features:
 * - Handcrafted wooden hull with pointed, curved prows at bow and stern
 * - Arched bamboo and palm-leaf thatched roof canopy (പനമ്പ് മേഞ്ഞ മേൽക്കൂര)
 * - Open front balcony viewing deck with wooden railing
 * - Warm brass lantern hanging from the front arch
 * - Gentle floating water bobbing animation
 * - Havok physics static collider
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

export class Kettuvallam {
  public root: TransformNode;
  private seats: TransformNode[] = [];

  constructor(scene: Scene, position: Vector3, shadowCast?: (m: Mesh) => void) {
    this.root = new TransformNode('kettuvallamRoot', scene);
    this.root.position = position;

    // ── 1. Materials ──────────────────────────────────────────────────────────
    // Dark oiled teak/anjili wood
    const woodMat = new PBRMaterial('boatWood', scene);
    woodMat.albedoColor = Color3.FromHexString('#4A2E18');
    woodMat.roughness = 0.85;
    woodMat.metallic = 0.05;

    // Bamboo thatch roof
    const thatchMat = new PBRMaterial('boatThatch', scene);
    thatchMat.albedoColor = Color3.FromHexString('#B59A57');
    thatchMat.roughness = 0.95;
    thatchMat.metallic = 0.0;

    // Coir rope accent
    const ropeMat = new PBRMaterial('boatRope', scene);
    ropeMat.albedoColor = Color3.FromHexString('#8C7040');
    ropeMat.roughness = 0.9;
    ropeMat.metallic = 0.0;

    const goldMat = new PBRMaterial('boatLanternMat', scene);
    goldMat.albedoColor = Color3.FromHexString('#FFD700');
    goldMat.roughness = 0.3;
    goldMat.metallic = 0.85;

    // ── 2. Wooden Hull ────────────────────────────────────────────────────────
    // Main middle hull (box)
    const hullMid = MeshBuilder.CreateBox('boatHullMid', { width: 3.2, height: 1.2, depth: 7.0 }, scene);
    hullMid.position = new Vector3(0, 0.6, 0);
    hullMid.material = woodMat;
    hullMid.parent = this.root;
    hullMid.receiveShadows = true;
    if (shadowCast) shadowCast(hullMid);

    // Bow (front curved pointed prow)
    const hullBow = MeshBuilder.CreateCylinder('boatHullBow', {
      height: 2.8,
      diameterTop: 0.2,
      diameterBottom: 3.2,
      tessellation: 8,
    }, scene);
    hullBow.rotation.x = -Math.PI / 2;
    hullBow.position = new Vector3(0, 0.7, 4.8);
    hullBow.scaling = new Vector3(1, 1, 0.45);
    hullBow.material = woodMat;
    hullBow.parent = this.root;
    if (shadowCast) shadowCast(hullBow);

    // Stern (rear tapered prow)
    const hullStern = MeshBuilder.CreateCylinder('boatHullStern', {
      height: 2.4,
      diameterTop: 0.4,
      diameterBottom: 3.2,
      tessellation: 8,
    }, scene);
    hullStern.rotation.x = Math.PI / 2;
    hullStern.position = new Vector3(0, 0.7, -4.6);
    hullStern.scaling = new Vector3(1, 1, 0.45);
    hullStern.material = woodMat;
    hullStern.parent = this.root;
    if (shadowCast) shadowCast(hullStern);

    // ── 3. Arched Bamboo Thatched Roof ──────────────────────────────────────
    const roof = MeshBuilder.CreateCylinder('boatRoof', {
      height: 6.2,
      diameter: 3.6,
      tessellation: 16,
      arc: 0.5, // Semi-cylinder arch
    }, scene);
    roof.rotation.x = Math.PI / 2;
    roof.rotation.y = Math.PI;
    roof.position = new Vector3(0, 1.4, -0.4);
    roof.material = thatchMat;
    roof.parent = this.root;
    roof.receiveShadows = true;
    if (shadowCast) shadowCast(roof);

    // Wooden rib arches along the roof (3 coir-bound rib rings)
    [-2.2, 0, 2.2].forEach((zPos, ri) => {
      const rib = MeshBuilder.CreateTorus(`boatRoofRib_${ri}`, {
        diameter: 3.65,
        thickness: 0.12,
        tessellation: 16,
      }, scene);
      rib.rotation.x = Math.PI / 2;
      rib.position = new Vector3(0, 1.4, zPos - 0.4);
      rib.material = ropeMat;
      rib.parent = this.root;
    });

    // ── 4. Front Viewing Deck & Railings ─────────────────────────────────────
    const deckRailL = MeshBuilder.CreateCylinder('boatDeckRailL', { height: 2.2, diameter: 0.08 }, scene);
    deckRailL.rotation.x = Math.PI / 2;
    deckRailL.position = new Vector3(-1.2, 1.6, 3.8);
    deckRailL.material = woodMat;
    deckRailL.parent = this.root;

    const deckRailR = MeshBuilder.CreateCylinder('boatDeckRailR', { height: 2.2, diameter: 0.08 }, scene);
    deckRailR.rotation.x = Math.PI / 2;
    deckRailR.position = new Vector3(1.2, 1.6, 3.8);
    deckRailR.material = woodMat;
    deckRailR.parent = this.root;

    // Dedicated passenger viewing deck mount nodes
    [new Vector3(0, 1.2, 3.2), new Vector3(-0.8, 1.2, 1.8), new Vector3(0.8, 1.2, 1.8)].forEach((sPos, idx) => {
      const seat = new TransformNode(`boatDeckSeat_${idx}`, scene);
      seat.position = sPos;
      seat.parent = this.root;
      this.seats.push(seat);
    });

    // ── 5. Hanging Brass Oil Lantern ─────────────────────────────────────────
    const lantern = MeshBuilder.CreateSphere('boatLantern', { diameter: 0.35, segments: 6 }, scene);
    lantern.position = new Vector3(0, 2.5, 2.6);
    const lanternMat = new PBRMaterial('boatLanternEmissive', scene);
    lanternMat.albedoColor = Color3.FromHexString('#FFD700');
    lanternMat.emissiveColor = Color3.FromHexString('#FFA500');
    lanternMat.emissiveIntensity = 2.0;
    lantern.material = lanternMat;
    lantern.parent = this.root;

    const lanternLight = new PointLight('boatLanternLight', new Vector3(0, 2.4, 2.6), scene);
    lanternLight.diffuse = Color3.FromHexString('#FFB74D');
    lanternLight.intensity = 0.5;
    lanternLight.range = 8;
    lanternLight.parent = this.root;

    // ── 6. Havok Physics Static Collider ─────────────────────────────────────
    if (scene.isPhysicsEnabled()) {
      PhysicsManager.addStaticBoxCollider(hullMid, scene, new Vector3(3.4, 2.5, 11));
    }

    // ── 7. Gentle Water Buoyancy / Bobbing Animation ─────────────────────────
    let time = 0;
    scene.onBeforeRenderObservable.add(() => {
      const dt = scene.getEngine().getDeltaTime() / 1000;
      time += dt;
      // Gentle pitch and roll bobbing
      this.root.position.y = position.y + Math.sin(time * 1.4) * 0.04;
      this.root.rotation.z = Math.sin(time * 1.1) * 0.02;
      this.root.rotation.x = Math.cos(time * 0.9) * 0.015;
    });
  }

  public getSeats(): TransformNode[] {
    return this.seats;
  }
}
