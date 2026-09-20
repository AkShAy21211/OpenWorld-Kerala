/**
 * ChendaMelam.ts — Traditional Kerala Percussion Ensemble (മേളക്കൂട്ടം / പഞ്ചവാദ്യം)
 * Features:
 * - 5 traditional Kerala percussionists standing in festival formation
 * - Authentic 3D Uruttu Chenda (ഉരുട്ടുചെണ്ട), Veekku Chenda, and Ilathalam cymbals
 * - Percussionists clad in Kasavu Mundu (കേരള വസ്ത്രം) with red silk waistbands
 * - Realistic drum construction: Jackfruit wood barrel, leather drumhead, rope tensioners
 * - Animated rhythmic striking and synchronized head/shoulder swaying
 * - Platform with Havok physics static collider
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

export class ChendaMelam {
  public root: TransformNode;
  private artists: { root: TransformNode; drumArmR: TransformNode; head: TransformNode; role: 'chenda' | 'cymbal' }[] = [];

  constructor(scene: Scene, position: Vector3, shadowCast?: (m: Mesh) => void) {
    this.root = new TransformNode('chendaMelamRoot', scene);
    this.root.position = position;

    // ── 1. Materials ──────────────────────────────────────────────────────────
    // Jackfruit wood (പ്ലാവ്) for Chenda body
    const chendaWoodMat = new PBRMaterial('cmChendaWood', scene);
    chendaWoodMat.albedoColor = Color3.FromHexString('#8B4513');
    chendaWoodMat.roughness = 0.6;
    chendaWoodMat.metallic = 0.05;

    // Parchment leather drumhead
    const leatherMat = new PBRMaterial('cmLeather', scene);
    leatherMat.albedoColor = Color3.FromHexString('#E5DCC5');
    leatherMat.roughness = 0.9;
    leatherMat.metallic = 0.0;

    // Bronze cymbals (ഇലത്താളം)
    const bronzeMat = new PBRMaterial('cmBronze', scene);
    bronzeMat.albedoColor = Color3.FromHexString('#CD7F32');
    bronzeMat.roughness = 0.25;
    bronzeMat.metallic = 0.85;

    // Kasavu Mundu (White with gold border)
    const munduMat = new PBRMaterial('cmMundu', scene);
    munduMat.albedoColor = Color3.FromHexString('#FDFBF7');
    munduMat.roughness = 0.8;

    // Red waistband
    const redSashMat = new PBRMaterial('cmRedSash', scene);
    redSashMat.albedoColor = Color3.FromHexString('#B91C1C');
    redSashMat.roughness = 0.7;

    // Human skin tone
    const skinMat = new PBRMaterial('cmSkin', scene);
    skinMat.albedoColor = Color3.FromHexString('#A1623C'); // Warm south-Indian skin tone
    skinMat.roughness = 0.75;

    // Wooden Stage Platform
    const platform = MeshBuilder.CreateBox('cmPlatform', { width: 12, height: 0.6, depth: 6 }, scene);
    platform.position = new Vector3(0, 0.3, 0);
    platform.material = new PBRMaterial('cmPlatformMat', scene);
    (platform.material as PBRMaterial).albedoColor = Color3.FromHexString('#4A2E18');
    platform.parent = this.root;
    platform.receiveShadows = true;
    if (shadowCast) shadowCast(platform);

    if (scene.isPhysicsEnabled()) {
      PhysicsManager.addStaticBoxCollider(platform, scene, new Vector3(12, 0.6, 6));
    }

    // ── 2. Five Artists in Formation ─────────────────────────────────────────
    const artistLayout = [
      { x: -4.0, z: 0.2, role: 'chenda' as const },
      { x: -2.0, z: 0.5, role: 'chenda' as const },
      { x:  0.0, z: 0.7, role: 'chenda' as const }, // Lead Melam master
      { x:  2.0, z: 0.5, role: 'chenda' as const },
      { x:  4.0, z: 0.2, role: 'cymbal' as const }, // Ilathalam cymbalist
    ];

    artistLayout.forEach((spec, i) => {
      const aRoot = new TransformNode(`melamArtist_${i}`, scene);
      aRoot.position = new Vector3(spec.x, 0.6, spec.z);
      aRoot.parent = this.root;

      // Mundu wrap (lower body)
      const mundu = MeshBuilder.CreateCylinder(`artistMundu_${i}`, { height: 1.0, diameterTop: 0.55, diameterBottom: 0.65 }, scene);
      mundu.position = new Vector3(0, 0.5, 0);
      mundu.material = munduMat;
      mundu.parent = aRoot;
      if (shadowCast) shadowCast(mundu);

      // Red waist sash
      const sash = MeshBuilder.CreateTorus(`artistSash_${i}`, { diameter: 0.62, thickness: 0.12 }, scene);
      sash.rotation.x = Math.PI / 2;
      sash.position = new Vector3(0, 1.0, 0);
      sash.material = redSashMat;
      sash.parent = aRoot;

      // Bare chest / Torso
      const torso = MeshBuilder.CreateBox(`artistTorso_${i}`, { width: 0.65, height: 0.8, depth: 0.35 }, scene);
      torso.position = new Vector3(0, 1.4, 0);
      torso.material = skinMat;
      torso.parent = aRoot;
      if (shadowCast) shadowCast(torso);

      // Head with Kurikootu / Chandanam tilak
      const head = new TransformNode(`artistHeadNode_${i}`, scene);
      head.position = new Vector3(0, 1.95, 0);
      head.parent = aRoot;

      const headMesh = MeshBuilder.CreateSphere(`artistHead_${i}`, { diameter: 0.45 }, scene);
      headMesh.material = skinMat;
      headMesh.parent = head;

      // Arm Right (Striking Arm)
      const armR = new TransformNode(`artistArmR_${i}`, scene);
      armR.position = new Vector3(0.38, 1.6, 0);
      armR.parent = aRoot;

      const armRMesh = MeshBuilder.CreateCylinder(`artistArmRMesh_${i}`, { height: 0.6, diameter: 0.15 }, scene);
      armRMesh.rotation.z = -Math.PI / 4;
      armRMesh.position = new Vector3(0.15, -0.2, 0.15);
      armRMesh.material = skinMat;
      armRMesh.parent = armR;

      // Arm Left (Guiding Arm)
      const armL = MeshBuilder.CreateCylinder(`artistArmL_${i}`, { height: 0.6, diameter: 0.15 }, scene);
      armL.rotation.z = Math.PI / 4;
      armL.position = new Vector3(-0.38, 1.4, 0.15);
      armL.material = skinMat;
      armL.parent = aRoot;

      if (spec.role === 'chenda') {
        // ── 3D Chenda Instrument ─────────────────────────────────────────────
        const chenda = new TransformNode(`chenda_${i}`, scene);
        chenda.position = new Vector3(0, 1.1, 0.38);
        chenda.parent = aRoot;

        // Cylindrical wooden drum barrel
        const barrel = MeshBuilder.CreateCylinder(`chendaBarrel_${i}`, {
          height: 0.85,
          diameter: 0.42,
          tessellation: 12,
        }, scene);
        barrel.material = chendaWoodMat;
        barrel.parent = chenda;
        if (shadowCast) shadowCast(barrel);

        // Top & bottom parchment leather drumheads
        const drumHeadTop = MeshBuilder.CreateCylinder(`chendaTop_${i}`, { height: 0.05, diameter: 0.44 }, scene);
        drumHeadTop.position.y = 0.425;
        drumHeadTop.material = leatherMat;
        drumHeadTop.parent = chenda;

        const drumHeadBottom = MeshBuilder.CreateCylinder(`chendaBtm_${i}`, { height: 0.05, diameter: 0.44 }, scene);
        drumHeadBottom.position.y = -0.425;
        drumHeadBottom.material = leatherMat;
        drumHeadBottom.parent = chenda;

        // Curved drumstick (Kolu) in right hand
        const kolu = MeshBuilder.CreateCylinder(`chendaKolu_${i}`, { height: 0.4, diameter: 0.04 }, scene);
        kolu.rotation.x = Math.PI / 3;
        kolu.position = new Vector3(0.3, -0.45, 0.35);
        kolu.material = chendaWoodMat;
        kolu.parent = armR;
      } else {
        // ── Ilathalam Cymbals (Bronze) ───────────────────────────────────────
        const cymbalL = MeshBuilder.CreateCylinder(`cymbalL_${i}`, { height: 0.04, diameter: 0.35, tessellation: 16 }, scene);
        cymbalL.rotation.x = Math.PI / 2;
        cymbalL.position = new Vector3(-0.15, 1.2, 0.35);
        cymbalL.material = bronzeMat;
        cymbalL.parent = aRoot;

        const cymbalR = MeshBuilder.CreateCylinder(`cymbalR_${i}`, { height: 0.04, diameter: 0.35, tessellation: 16 }, scene);
        cymbalR.rotation.x = Math.PI / 2;
        cymbalR.position = new Vector3(0.2, -0.4, 0.3);
        cymbalR.material = bronzeMat;
        cymbalR.parent = armR;
      }

      this.artists.push({
        root: aRoot,
        drumArmR: armR,
        head,
        role: spec.role,
      });
    });

    // ── 3. Rhythmic Chenda Melam Beat Animation ─────────────────────────────
    let time = 0;
    scene.onBeforeRenderObservable.add(() => {
      const dt = scene.getEngine().getDeltaTime() / 1000;
      time += dt;

      // Temple beat rhythm (~140 BPM festival tempo)
      const beatFreq = 4.5;

      this.artists.forEach((artist, idx) => {
        const phase = idx * 0.15; // slight wave sync
        // Rhythmic arm striking
        artist.drumArmR.rotation.x = Math.sin(time * beatFreq + phase) * 0.45;

        // Head energetic nodding
        artist.head.rotation.x = Math.abs(Math.sin(time * beatFreq * 0.5 + phase)) * 0.18;

        // Subtle torso sway
        artist.root.rotation.z = Math.sin(time * (beatFreq * 0.25) + phase) * 0.04;
      });
    });
  }
}
