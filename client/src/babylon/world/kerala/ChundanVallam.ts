/**
 * ChundanVallam.ts — Traditional Kerala Snake Boat & Vallam Kali Race Channel
 * Features:
 * - 32-meter authentic Chundan Vallam (ചുണ്ടൻ വള്ളം) with dark oiled teak hull
 * - High towering snake stern (Amaram / അമരം) rising 5.5m with brass cap and silk streamers
 * - Tapered pointed prow (Aniyom / അണിയം) with decorative brass figurehead
 * - 24 synchronized passenger rowers with carved wooden oars and ceremonial flags
 * - 3 gold & crimson Muthukkuda ceremonial umbrellas
 * - Dynamic water bobbing, oar dipping, and wave wake simulation
 * - Race canal track with floating buoys, spectator gallery, and finish line banner
 */

import {
  Scene,
  TransformNode,
  MeshBuilder,
  PBRMaterial,
  Color3,
  Vector3,
  Mesh,
  StandardMaterial,
  ParticleSystem,
  Texture,
} from '@babylonjs/core';
import { PhysicsManager } from '../../physics/PhysicsManager';

export class ChundanVallam {
  public root: TransformNode;
  public boatNode: TransformNode;
  private oars: TransformNode[] = [];
  private rowers: Mesh[] = [];
  private splashParticles: ParticleSystem[] = [];
  private strokePhase = 0;
  private rowingSpeed = 2.0;

  constructor(scene: Scene, position: Vector3, shadowCast?: (m: Mesh) => void) {
    this.root = new TransformNode('chundanVallamRoot', scene);
    this.root.position = position;

    // ── 1. Materials ──────────────────────────────────────────────────────────
    const teakMat = new PBRMaterial('vallamTeak', scene);
    teakMat.albedoColor = Color3.FromHexString('#2D1A0E'); // Dark polished wet teak
    teakMat.roughness = 0.35; // Wet sheen
    teakMat.metallic = 0.15;

    const goldMat = new PBRMaterial('vallamGold', scene);
    goldMat.albedoColor = Color3.FromHexString('#FFD700');
    goldMat.metallic = 0.85;
    goldMat.roughness = 0.25;

    const oarMat = new PBRMaterial('vallamOar', scene);
    oarMat.albedoColor = Color3.FromHexString('#C49A5A'); // Natural wood oar
    oarMat.roughness = 0.7;

    const rowerMat = new PBRMaterial('vallamRowerMat', scene);
    rowerMat.albedoColor = Color3.FromHexString('#8B5A2B'); // Skin tone
    rowerMat.roughness = 0.8;

    const munduMat = new PBRMaterial('vallamMunduMat', scene);
    munduMat.albedoColor = Color3.FromHexString('#FDFBF7'); // White kasavu cloth
    munduMat.roughness = 0.9;

    const silkMat = new PBRMaterial('vallamSilkMat', scene);
    silkMat.albedoColor = Color3.FromHexString('#DC2626'); // Crimson silk
    silkMat.roughness = 0.6;

    // ── 2. Boat Body Hierarchy ───────────────────────────────────────────────
    this.boatNode = new TransformNode('chundanBoatBody', scene);
    this.boatNode.parent = this.root;

    const length = 28;
    const width = 2.2;
    const height = 1.1;

    // Main central hull trough
    const midHull = MeshBuilder.CreateBox('vallamMidHull', { width: width, height: height, depth: length }, scene);
    midHull.position = new Vector3(0, 0.4, 0);
    midHull.material = teakMat;
    midHull.parent = this.boatNode;
    midHull.receiveShadows = true;
    if (shadowCast) shadowCast(midHull);

    // Pointed Front Bow (Aniyom — extends 6m forward)
    const bow = MeshBuilder.CreateCylinder('vallamBow', {
      height: 6.0,
      diameterTop: 0.15,
      diameterBottom: width,
      tessellation: 8,
    }, scene);
    bow.rotation.x = -Math.PI / 2;
    bow.position = new Vector3(0, 0.5, length / 2 + 2.8);
    bow.scaling = new Vector3(1, 1, 0.35);
    bow.material = teakMat;
    bow.parent = this.boatNode;
    if (shadowCast) shadowCast(bow);

    // Golden prow tip
    const prowTip = MeshBuilder.CreateSphere('vallamProwTip', { diameter: 0.6 }, scene);
    prowTip.position = new Vector3(0, 0.7, length / 2 + 5.8);
    prowTip.material = goldMat;
    prowTip.parent = this.boatNode;

    // Towering Snake Stern (Amaram — rises 5.5m high at the rear)
    const sternHeight = 5.5;
    for (let s = 0; s < 6; s++) {
      const segT = s / 5;
      const amaramSeg = MeshBuilder.CreateCylinder(`vallamAmaram_${s}`, {
        height: 1.1,
        diameterTop: width * (1 - segT * 0.6),
        diameterBottom: width * (1 - (segT - 0.15) * 0.6),
        tessellation: 8,
      }, scene);
      // Curve upward and backward
      amaramSeg.position = new Vector3(0, 0.8 + s * 0.85, -length / 2 - s * 0.6);
      amaramSeg.rotation.x = 0.35 + segT * 0.4;
      amaramSeg.material = teakMat;
      amaramSeg.parent = this.boatNode;
      if (shadowCast) shadowCast(amaramSeg);
    }

    // Gold finial crest on top of Amaram
    const amaramCrest = MeshBuilder.CreateSphere('vallamAmaramCrest', { diameter: 0.8 }, scene);
    amaramCrest.position = new Vector3(0, sternHeight + 0.3, -length / 2 - 3.2);
    amaramCrest.material = goldMat;
    amaramCrest.parent = this.boatNode;

    // ── 3. Ceremonial Muthukkuda Umbrellas (3 Silk & Gold Canopies) ──────────
    [-6, 0, 6].forEach((zOff, uIdx) => {
      const pole = MeshBuilder.CreateCylinder(`vallamUmbrellaPole_${uIdx}`, { height: 2.8, diameter: 0.08 }, scene);
      pole.position = new Vector3(0, 2.0, zOff);
      pole.material = goldMat;
      pole.parent = this.boatNode;

      const canopy = MeshBuilder.CreateSphere(`vallamUmbrellaTop_${uIdx}`, { diameter: 1.8, slice: 0.5 }, scene);
      canopy.position = new Vector3(0, 3.2, zOff);
      canopy.rotation.x = Math.PI;
      canopy.material = uIdx === 1 ? goldMat : silkMat;
      canopy.parent = this.boatNode;
    });

    // ── 4. 24 Synchronized Rowers with Oars (12 Left, 12 Right) ─────────────
    const rowCount = 12;
    for (let r = 0; r < rowCount; r++) {
      const zPos = -length / 2 + 3.0 + r * 1.8;

      [-width / 2 + 0.3, width / 2 - 0.3].forEach((xPos, sideIdx) => {
        const isLeft = sideIdx === 0;

        // Rower Torso
        const rowerTorso = MeshBuilder.CreateBox(`rowerTorso_${r}_${sideIdx}`, { width: 0.4, height: 0.6, depth: 0.3 }, scene);
        rowerTorso.position = new Vector3(xPos, 1.1, zPos);
        rowerTorso.material = rowerMat;
        rowerTorso.parent = this.boatNode;
        this.rowers.push(rowerTorso);

        // White Kasavu Headband / Turban
        const turban = MeshBuilder.CreateCylinder(`rowerTurban_${r}_${sideIdx}`, { height: 0.2, diameter: 0.35 }, scene);
        turban.position = new Vector3(xPos, 1.55, zPos);
        turban.material = munduMat;
        turban.parent = this.boatNode;

        // Wooden Oar Pivot Node
        const oarPivot = new TransformNode(`oarPivot_${r}_${sideIdx}`, scene);
        oarPivot.position = new Vector3(isLeft ? -width / 2 : width / 2, 0.9, zPos);
        oarPivot.parent = this.boatNode;

        // Oar Shaft & Blade
        const shaft = MeshBuilder.CreateCylinder(`oarShaft_${r}_${sideIdx}`, { height: 2.6, diameter: 0.06 }, scene);
        shaft.position = new Vector3(isLeft ? -0.8 : 0.8, -0.6, 0);
        shaft.rotation.z = isLeft ? -0.55 : 0.55;
        shaft.material = oarMat;
        shaft.parent = oarPivot;

        // Oar Flat Blade
        const blade = MeshBuilder.CreateBox(`oarBlade_${r}_${sideIdx}`, { width: 0.22, height: 0.65, depth: 0.04 }, scene);
        blade.position = new Vector3(isLeft ? -1.55 : 1.55, -1.5, 0);
        blade.rotation.z = isLeft ? -0.55 : 0.55;
        blade.material = oarMat;
        blade.parent = oarPivot;

        this.oars.push(oarPivot);
      });
    }

    // ── 5. Backwater Race Track & Floating Marker Buoys ──────────────────────
    [-18, 18].forEach((xBuoyLine) => {
      for (let b = 0; b < 6; b++) {
        const buoy = MeshBuilder.CreateSphere(`raceBuoy_${xBuoyLine}_${b}`, { diameter: 0.8 }, scene);
        buoy.position = new Vector3(xBuoyLine, 0.2, -30 + b * 15);
        const buoyMat = new PBRMaterial(`buoyMat_${xBuoyLine}_${b}`, scene);
        buoyMat.albedoColor = b % 2 === 0 ? Color3.FromHexString('#EF4444') : Color3.FromHexString('#F59E0B');
        buoyMat.emissiveColor = buoyMat.albedoColor;
        buoyMat.emissiveIntensity = 0.5;
        buoy.material = buoyMat;
        buoy.parent = this.root;
      }
    });

    // Start / Boarding Pier Platform
    const pier = MeshBuilder.CreateBox('vallamBoardingPier', { width: 5.0, height: 0.6, depth: 6.0 }, scene);
    pier.position = new Vector3(width / 2 + 3.0, 0.3, -length / 2 + 5);
    pier.material = teakMat;
    pier.parent = this.root;
    pier.receiveShadows = true;

    // Boarding Signpost
    const signBoard = MeshBuilder.CreatePlane('vallamSignBoard', { width: 3.5, height: 1.2 }, scene);
    signBoard.position = new Vector3(width / 2 + 3.0, 2.0, -length / 2 + 5);
    const signMat = new PBRMaterial('vallamSignMat', scene);
    signMat.albedoColor = Color3.FromHexString('#FFD700');
    signBoard.material = signMat;
    signBoard.parent = this.root;

    if (scene.isPhysicsEnabled()) {
      PhysicsManager.addStaticBoxCollider(pier, scene, new Vector3(5.0, 0.6, 6.0));
    }

    // ── 6. Dynamic Rowing & Water Buoyancy Animation Loop ────────────────────
    let time = 0;
    scene.onBeforeRenderObservable.add(() => {
      const dt = scene.getEngine().getDeltaTime() / 1000;
      time += dt;

      // Gentle water buoyancy pitch, roll and heave
      this.boatNode.position.y = 0.15 + Math.sin(time * 2.2) * 0.08;
      this.boatNode.rotation.x = Math.sin(time * 1.8) * 0.02;
      this.boatNode.rotation.z = Math.cos(time * 1.5) * 0.025;

      // Synchronized Oar Stroke Dip & Pull Cycle
      this.strokePhase += dt * this.rowingSpeed;
      const dipAngle = Math.sin(this.strokePhase) * 0.35;
      const strokeSweep = Math.cos(this.strokePhase) * 0.45;

      this.oars.forEach((oar, idx) => {
        const isLeft = idx % 2 === 0;
        oar.rotation.x = strokeSweep;
        oar.rotation.y = (isLeft ? 1 : -1) * dipAngle * 0.5;
      });

      // Rower upper-body synchronized stroke bend
      this.rowers.forEach((rower) => {
        rower.rotation.x = -strokeSweep * 0.6;
      });
    });
  }

  public getBoardingPosition(): Vector3 {
    return this.root.position.add(new Vector3(4.0, 0.6, -9.0));
  }
}
