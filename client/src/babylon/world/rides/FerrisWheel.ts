/**
 * FerrisWheel.ts — Giant Animated Kerala Fair Ferris Wheel (ഭീമൻ രാട്ടിനം / Rattinam)
 * Features:
 * - 18m diameter steel truss wheel with 12 radial spokes
 * - 12 gravity-counterbalanced passenger gondolas that stay upright as the wheel spins
 * - Festive glowing neon LED lights along spokes and rim
 * - Boarding platform with staircase and Havok static physics colliders
 * - Continuous smooth rotation in the render loop
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
} from '@babylonjs/core';
import { PhysicsManager } from '../../physics/PhysicsManager';

export class FerrisWheel {
  public root: TransformNode;
  private wheelHub: TransformNode;
  private gondolas: TransformNode[] = [];
  private seats: TransformNode[] = [];
  private rotationSpeed = 0.25; // radians per second (~25 sec per full rotation)
  private currentAngle = 0;

  constructor(scene: Scene, position: Vector3, shadowCast?: (m: Mesh) => void) {
    this.root = new TransformNode('ferrisWheelRoot', scene);
    this.root.position = position;

    // ── Materials ─────────────────────────────────────────────────────────────
    const steelMat = new PBRMaterial('fwSteel', scene);
    steelMat.albedoColor = new Color3(0.85, 0.85, 0.9);
    steelMat.metallic = 0.85;
    steelMat.roughness = 0.25;

    const supportMat = new PBRMaterial('fwSupport', scene);
    supportMat.albedoColor = new Color3(0.8, 0.15, 0.15); // Carnivals red
    supportMat.metallic = 0.3;
    supportMat.roughness = 0.4;

    const platformMat = new PBRMaterial('fwPlatform', scene);
    platformMat.albedoColor = new Color3(0.45, 0.3, 0.18); // Wood platform
    platformMat.roughness = 0.8;

    const gondolaColors = [
      '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
      '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
      '#F97316', '#6366F1', '#14B8A6', '#D946EF',
    ];

    // ── 1. Boarding Platform & Foundations ────────────────────────────────────
    const platform = MeshBuilder.CreateBox('fwPlatformMesh', { width: 10, height: 1.2, depth: 16 }, scene);
    platform.position = new Vector3(0, 0.6, 0);
    platform.material = platformMat;
    platform.receiveShadows = true;
    platform.parent = this.root;

    if (scene.isPhysicsEnabled()) {
      PhysicsManager.addStaticBoxCollider(platform, scene, new Vector3(10, 1.2, 16));
    }

    // Boarding stairs
    const stairs = MeshBuilder.CreateBox('fwStairs', { width: 4, height: 0.6, depth: 3 }, scene);
    stairs.position = new Vector3(0, 0.3, -8.5);
    stairs.material = platformMat;
    stairs.parent = this.root;

    // ── 2. A-Frame Structural Steel Supports (Left & Right) ─────────────────
    const hubHeight = 12; // Axis height
    const legLength = 13.5;

    [-2.2, 2.2].forEach((zOff, sideIdx) => {
      [-3.5, 3.5].forEach((xOff, legIdx) => {
        const leg = MeshBuilder.CreateCylinder(`fwLeg_${sideIdx}_${legIdx}`, {
          height: legLength,
          diameter: 0.45,
          tessellation: 8,
        }, scene);

        leg.position = new Vector3(xOff / 2, hubHeight / 2, zOff);
        // Lean inward towards the axle
        leg.rotation.z = (xOff > 0 ? 1 : -1) * 0.28;
        leg.material = supportMat;
        leg.parent = this.root;
        leg.receiveShadows = true;
        if (shadowCast) shadowCast(leg);
      });

      // Cross support beam
      const brace = MeshBuilder.CreateCylinder(`fwBrace_${sideIdx}`, {
        height: 5.5,
        diameter: 0.3,
        tessellation: 8,
      }, scene);
      brace.rotation.z = Math.PI / 2;
      brace.position = new Vector3(0, 5.5, zOff);
      brace.material = steelMat;
      brace.parent = this.root;
    });

    // Central axle
    const axle = MeshBuilder.CreateCylinder('fwAxle', { height: 5.2, diameter: 0.6, tessellation: 12 }, scene);
    axle.rotation.x = Math.PI / 2;
    axle.position = new Vector3(0, hubHeight, 0);
    axle.material = steelMat;
    axle.parent = this.root;

    // ── 3. Rotating Wheel Assembly ──────────────────────────────────────────
    this.wheelHub = new TransformNode('fwRotatingWheel', scene);
    this.wheelHub.position = new Vector3(0, hubHeight, 0);
    this.wheelHub.parent = this.root;

    const wheelRadius = 8.5;
    const spokeCount = 12;

    // Dual circular rims (front & back)
    [-1.2, 1.2].forEach((zOff, rimIdx) => {
      const rim = MeshBuilder.CreateTorus(`fwRim_${rimIdx}`, {
        diameter: wheelRadius * 2,
        thickness: 0.2,
        tessellation: 32,
      }, scene);
      rim.rotation.x = Math.PI / 2;
      rim.position = new Vector3(0, 0, zOff);
      rim.material = steelMat;
      rim.parent = this.wheelHub;

      // Inner truss ring
      const innerRim = MeshBuilder.CreateTorus(`fwInnerRim_${rimIdx}`, {
        diameter: wheelRadius * 1.1,
        thickness: 0.15,
        tessellation: 24,
      }, scene);
      innerRim.rotation.x = Math.PI / 2;
      innerRim.position = new Vector3(0, 0, zOff);
      innerRim.material = steelMat;
      innerRim.parent = this.wheelHub;
    });

    // 12 radial spokes and passenger gondolas
    for (let i = 0; i < spokeCount; i++) {
      const angle = (i / spokeCount) * Math.PI * 2;

      // Spoke connecting axle to outer rim
      [-1.2, 1.2].forEach((zOff, spokeSide) => {
        const spoke = MeshBuilder.CreateCylinder(`fwSpoke_${i}_${spokeSide}`, {
          height: wheelRadius,
          diameter: 0.14,
          tessellation: 6,
        }, scene);
        spoke.position = new Vector3(
          Math.cos(angle) * (wheelRadius / 2),
          Math.sin(angle) * (wheelRadius / 2),
          zOff
        );
        spoke.rotation.z = angle + Math.PI / 2;
        spoke.material = steelMat;
        spoke.parent = this.wheelHub;

        // Glowing neon LED light bulb on spoke tip
        const light = MeshBuilder.CreateSphere(`fwBulb_${i}_${spokeSide}`, { diameter: 0.28, segments: 6 }, scene);
        light.position = new Vector3(
          Math.cos(angle) * (wheelRadius + 0.1),
          Math.sin(angle) * (wheelRadius + 0.1),
          zOff
        );
        const bulbMat = new PBRMaterial(`fwBulbMat_${i}_${spokeSide}`, scene);
        bulbMat.albedoColor = Color3.FromHexString(gondolaColors[i % gondolaColors.length]);
        bulbMat.emissiveColor = Color3.FromHexString(gondolaColors[i % gondolaColors.length]);
        bulbMat.emissiveIntensity = 2.5;
        light.material = bulbMat;
        light.parent = this.wheelHub;
      });

      // Crossbar between rims holding the gondola pin
      const pin = MeshBuilder.CreateCylinder(`fwPin_${i}`, { height: 2.6, diameter: 0.18 }, scene);
      pin.rotation.x = Math.PI / 2;
      pin.position = new Vector3(
        Math.cos(angle) * wheelRadius,
        Math.sin(angle) * wheelRadius,
        0
      );
      pin.material = steelMat;
      pin.parent = this.wheelHub;

      // ── Passenger Gondola / Cabin (Counter-balanced) ──────────────────────
      const gondolaPivot = new TransformNode(`fwGondolaPivot_${i}`, scene);
      gondolaPivot.position = new Vector3(
        Math.cos(angle) * wheelRadius,
        Math.sin(angle) * wheelRadius,
        0
      );
      gondolaPivot.parent = this.wheelHub;
      this.gondolas.push(gondolaPivot);

      // Cabin container hanging below the pin
      const cabinColor = gondolaColors[i % gondolaColors.length];
      const cabinMat = new PBRMaterial(`fwCabinMat_${i}`, scene);
      cabinMat.albedoColor = Color3.FromHexString(cabinColor);
      cabinMat.roughness = 0.4;
      cabinMat.metallic = 0.1;

      // Cabin body
      const cabin = MeshBuilder.CreateBox(`fwCabin_${i}`, { width: 1.5, height: 1.4, depth: 1.3 }, scene);
      cabin.position = new Vector3(0, -1.0, 0); // hangs 1m below pivot
      cabin.material = cabinMat;
      cabin.parent = gondolaPivot;
      if (shadowCast) shadowCast(cabin);

      // Dedicated seat node for player boarding
      const seat = new TransformNode(`fwSeat_${i}`, scene);
      seat.position = new Vector3(0, -0.95, 0);
      seat.parent = gondolaPivot;
      this.seats.push(seat);

      // Cabin canopy roof
      const roof = MeshBuilder.CreateCylinder(`fwCabinRoof_${i}`, {
        height: 1.4,
        diameterTop: 0,
        diameterBottom: 1.8,
        tessellation: 4,
      }, scene);
      roof.position = new Vector3(0, -0.15, 0);
      roof.material = cabinMat;
      roof.parent = gondolaPivot;

      // Cabin hanger struts
      [-0.55, 0.55].forEach((zStrut, sIdx) => {
        const strut = MeshBuilder.CreateCylinder(`fwStrut_${i}_${sIdx}`, {
          height: 1.1,
          diameter: 0.08,
        }, scene);
        strut.position = new Vector3(0, -0.5, zStrut);
        strut.material = steelMat;
        strut.parent = gondolaPivot;
      });
    }

    // ── 4. Render Loop Animation ────────────────────────────────────────────
    scene.onBeforeRenderObservable.add(() => {
      const dt = scene.getEngine().getDeltaTime() / 1000;
      this.currentAngle += this.rotationSpeed * dt;

      // Rotate wheel hub
      this.wheelHub.rotation.z = this.currentAngle;

      // Counter-rotate each gondola so it stays perfectly upright via gravity
      for (const gondola of this.gondolas) {
        gondola.rotation.z = -this.currentAngle;
      }
    });
  }

  public getSeats(): TransformNode[] {
    return this.seats;
  }
}
