/**
 * PlayableChenda.ts — Traditional Kerala Cylindrical Percussion Drum Station
 * Features:
 * - Handcrafted jackfruit wood cylindrical shell (ചെണ്ടക്കുറ്റി)
 * - Bull-hide percussion parchment drum skin (വട്ടം)
 * - Braided hemp rope lacing (വള്ളി) with adjustable tuning sliders
 * - Two traditional tamarind wood drum sticks (വാഞ്ചി)
 * - Ceremonial red velvet shoulder sash with Kasavu gold border
 * - Brass Nilavilakku lamp and marigold flower garland
 * - Hit impact vibration animation
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

export class PlayableChenda {
  public root: TransformNode;
  private drumNode: TransformNode;
  private leftStick: TransformNode;
  private rightStick: TransformNode;
  private hitVibration = 0;

  constructor(scene: Scene, position: Vector3, shadowCast?: (m: Mesh) => void) {
    this.root = new TransformNode('playableChendaRoot', scene);
    this.root.position = position;

    // ── 1. Materials ──────────────────────────────────────────────────────────
    const woodMat = new PBRMaterial('chendaWoodMat', scene);
    woodMat.albedoColor = Color3.FromHexString('#5C2E14'); // Dark oiled jackfruit wood
    woodMat.roughness = 0.55;
    woodMat.metallic = 0.1;

    const skinMat = new PBRMaterial('chendaSkinMat', scene);
    skinMat.albedoColor = Color3.FromHexString('#E6D3B3'); // Tanned hide parchment
    skinMat.roughness = 0.9;
    skinMat.metallic = 0.0;

    const brassMat = new PBRMaterial('chendaBrassMat', scene);
    brassMat.albedoColor = Color3.FromHexString('#FFD700'); // Brass rim
    brassMat.metallic = 0.85;
    brassMat.roughness = 0.25;

    const ropeMat = new PBRMaterial('chendaRopeMat', scene);
    ropeMat.albedoColor = Color3.FromHexString('#A17A48'); // Braided coir/hemp
    ropeMat.roughness = 0.95;

    const redSashMat = new PBRMaterial('chendaSashMat', scene);
    redSashMat.albedoColor = Color3.FromHexString('#DC2626');
    redSashMat.roughness = 0.7;

    // ── 2. Wooden Stage Platform ─────────────────────────────────────────────
    const platform = MeshBuilder.CreateCylinder('chendaPlatform', { diameter: 4.5, height: 0.4 }, scene);
    platform.position = new Vector3(0, 0.2, 0);
    platform.material = woodMat;
    platform.parent = this.root;
    platform.receiveShadows = true;

    if (scene.isPhysicsEnabled()) {
      PhysicsManager.addStaticBoxCollider(platform, scene, new Vector3(4.5, 0.4, 4.5));
    }

    // ── 3. Chenda Drum Body ──────────────────────────────────────────────────
    this.drumNode = new TransformNode('chendaDrumBody', scene);
    this.drumNode.position = new Vector3(0, 1.35, 0);
    this.drumNode.parent = this.root;

    // Central cylindrical wooden hollow shell
    const shell = MeshBuilder.CreateCylinder('chendaShell', { height: 1.1, diameter: 0.62, tessellation: 24 }, scene);
    shell.material = woodMat;
    shell.parent = this.drumNode;
    if (shadowCast) shadowCast(shell);

    // Top and bottom brass ring hoops (വളയം)
    [-0.56, 0.56].forEach((yRing, rIdx) => {
      const ring = MeshBuilder.CreateTorus(`chendaRing_${rIdx}`, { diameter: 0.65, thickness: 0.06 }, scene);
      ring.position = new Vector3(0, yRing, 0);
      ring.material = brassMat;
      ring.parent = this.drumNode;
    });

    // Top drum strike membrane (ചെണ്ട വട്ടം)
    const topSkin = MeshBuilder.CreateCylinder('chendaTopSkin', { height: 0.04, diameter: 0.61 }, scene);
    topSkin.position = new Vector3(0, 0.56, 0);
    topSkin.material = skinMat;
    topSkin.parent = this.drumNode;

    // Bottom resonance membrane
    const bottomSkin = MeshBuilder.CreateCylinder('chendaBottomSkin', { height: 0.04, diameter: 0.61 }, scene);
    bottomSkin.position = new Vector3(0, -0.56, 0);
    bottomSkin.material = skinMat;
    bottomSkin.parent = this.drumNode;

    // 12 Braided Hemp Tension Ropes around cylinder
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const rope = MeshBuilder.CreateCylinder(`chendaRope_${i}`, { height: 1.12, diameter: 0.025 }, scene);
      rope.position = new Vector3(Math.cos(angle) * 0.32, 0, Math.sin(angle) * 0.32);
      rope.material = ropeMat;
      rope.parent = this.drumNode;
    }

    // Red ceremonial shoulder drape
    const sash = MeshBuilder.CreateTorus('chendaSash', { diameter: 0.72, thickness: 0.08 }, scene);
    sash.rotation.x = Math.PI / 3;
    sash.position = new Vector3(0, 0.1, 0);
    sash.material = redSashMat;
    sash.parent = this.drumNode;

    // ── 4. Crossed Drum Sticks (വാഞ്ചി / Sticks) ─────────────────────────────
    this.leftStick = new TransformNode('chendaLeftStick', scene);
    this.leftStick.position = new Vector3(-0.25, 1.85, -0.1);
    this.leftStick.rotation.z = -0.55;
    this.leftStick.parent = this.root;

    const lStickMesh = MeshBuilder.CreateCylinder('chendaLeftStickMesh', { height: 0.55, diameter: 0.035 }, scene);
    lStickMesh.material = woodMat;
    lStickMesh.parent = this.leftStick;

    this.rightStick = new TransformNode('chendaRightStick', scene);
    this.rightStick.position = new Vector3(0.25, 1.85, -0.1);
    this.rightStick.rotation.z = 0.55;
    this.rightStick.parent = this.root;

    const rStickMesh = MeshBuilder.CreateCylinder('chendaRightStickMesh', { height: 0.55, diameter: 0.035 }, scene);
    rStickMesh.material = woodMat;
    rStickMesh.parent = this.rightStick;

    // ── 5. Brass Nilavilakku Oil Lamp & Marigold Garland ─────────────────────
    const lamp = MeshBuilder.CreateCylinder('chendaLampBase', { height: 1.5, diameterTop: 0.3, diameterBottom: 0.6 }, scene);
    lamp.position = new Vector3(1.4, 0.95, -0.4);
    lamp.material = brassMat;
    lamp.parent = this.root;

    const flame = MeshBuilder.CreateSphere('chendaFlame', { diameter: 0.2 }, scene);
    flame.position = new Vector3(1.4, 1.8, -0.4);
    const flameMat = new PBRMaterial('chendaFlameMat', scene);
    flameMat.albedoColor = Color3.FromHexString('#FF9900');
    flameMat.emissiveColor = Color3.FromHexString('#FFAA00');
    flameMat.emissiveIntensity = 3.0;
    flame.material = flameMat;
    flame.parent = this.root;

    const flameLight = new PointLight('chendaFlameLight', new Vector3(1.4, 1.85, -0.4), scene);
    flameLight.diffuse = Color3.FromHexString('#FFB74D');
    flameLight.intensity = 0.5;
    flameLight.range = 6;
    flameLight.parent = this.root;

    // ── 6. Idle Floating & Hit Physics Loop ──────────────────────────────────
    let time = 0;
    scene.onBeforeRenderObservable.add(() => {
      const dt = scene.getEngine().getDeltaTime() / 1000;
      time += dt;

      // Gentle rhythmic bobbing
      this.leftStick.rotation.x = Math.sin(time * 3.5) * 0.15;
      this.rightStick.rotation.x = Math.cos(time * 3.5) * 0.15;

      if (this.hitVibration > 0) {
        this.drumNode.position.y = 1.35 + (Math.random() - 0.5) * 0.04 * this.hitVibration;
        this.hitVibration = Math.max(0, this.hitVibration - dt * 4.0);
      }
    });
  }

  public triggerHitVibration() {
    this.hitVibration = 1.0;
  }
}
