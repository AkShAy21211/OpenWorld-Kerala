/**
 * ToraToraRide.ts — High-Speed Spinning Carnival Thrill Ride (ടോറ ടോറ / Tora Tora)
 * Signature Kerala Carnival & Police Maidan fair attraction.
 * Features:
 * - Octagonal elevated metal platform with perimeter safety railings
 * - Central rotating mechanical hub with 4 articulated steel cross-arms
 * - 4 circular passenger car pods (each with 4 bucket seats and lap bars)
 * - Dual-axis centrifugal rotation: Main platform rotates clockwise while individual pods spin rapidly counter-clockwise with undulating height tilt
 * - Flashing neon LED edge lights in vibrant carnival colors
 * - Havok physics platform collider
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

export class ToraToraRide {
  public root: TransformNode;
  private mainHub: TransformNode;
  private carPods: { pivot: TransformNode; carBody: Mesh }[] = [];
  private seats: TransformNode[] = [];

  constructor(scene: Scene, position: Vector3, shadowCast?: (m: Mesh) => void) {
    this.root = new TransformNode('toraToraRideRoot', scene);
    this.root.position = position;

    // ── 1. Materials ──────────────────────────────────────────────────────────
    const platformMat = new PBRMaterial('ttPlatformMat', scene);
    platformMat.albedoColor = Color3.FromHexString('#3F3F46'); // Dark metal plate
    platformMat.roughness = 0.7;
    platformMat.metallic = 0.4;

    const armSteelMat = new PBRMaterial('ttArmSteel', scene);
    armSteelMat.albedoColor = Color3.FromHexString('#F97316'); // Vibrant Orange
    armSteelMat.metallic = 0.6;
    armSteelMat.roughness = 0.35;

    const centerHubMat = new PBRMaterial('ttCenterHub', scene);
    centerHubMat.albedoColor = Color3.FromHexString('#7C3AED'); // Purple
    centerHubMat.metallic = 0.5;
    centerHubMat.roughness = 0.3;

    const podColors = ['#EF4444', '#10B981', '#3B82F6', '#F59E0B'];

    // ── 2. Base Platform & Railings ──────────────────────────────────────────
    const platformRadius = 8.5;
    const platformHeight = 0.8;

    const basePlatform = MeshBuilder.CreateCylinder('ttBasePlatform', {
      diameter: platformRadius * 2,
      height: platformHeight,
      tessellation: 16,
    }, scene);
    basePlatform.position = new Vector3(0, platformHeight / 2, 0);
    basePlatform.material = platformMat;
    basePlatform.parent = this.root;
    basePlatform.receiveShadows = true;
    if (shadowCast) shadowCast(basePlatform);

    // Perimeter safety railing (16 posts)
    for (let p = 0; p < 16; p++) {
      const angle = (p / 16) * Math.PI * 2;
      const post = MeshBuilder.CreateCylinder(`ttRailPost_${p}`, { height: 1.1, diameter: 0.08 }, scene);
      post.position = new Vector3(
        Math.cos(angle) * (platformRadius - 0.2),
        platformHeight + 0.55,
        Math.sin(angle) * (platformRadius - 0.2)
      );
      post.material = armSteelMat;
      post.parent = this.root;
    }

    // Boarding stairs
    const stairs = MeshBuilder.CreateBox('ttStairs', { width: 4.0, height: 0.4, depth: 2.0 }, scene);
    stairs.position = new Vector3(0, 0.2, -platformRadius - 0.8);
    stairs.material = platformMat;
    stairs.parent = this.root;

    if (scene.isPhysicsEnabled()) {
      PhysicsManager.addStaticBoxCollider(basePlatform, scene, new Vector3(platformRadius * 2, platformHeight, platformRadius * 2));
    }

    // ── 3. Central Rotating Mechanism ───────────────────────────────────────
    this.mainHub = new TransformNode('ttMainRotatingHub', scene);
    this.mainHub.position = new Vector3(0, platformHeight + 0.3, 0);
    this.mainHub.parent = this.root;

    // Central Dome / Cone Motor Casing
    const centerCone = MeshBuilder.CreateCylinder('ttCenterCone', {
      height: 2.4,
      diameterTop: 0.8,
      diameterBottom: 2.8,
      tessellation: 12,
    }, scene);
    centerCone.position = new Vector3(0, 1.2, 0);
    centerCone.material = centerHubMat;
    centerCone.parent = this.mainHub;
    if (shadowCast) shadowCast(centerCone);

    // Glowing Top Spire Sphere
    const topOrb = MeshBuilder.CreateSphere('ttTopOrb', { diameter: 0.85 }, scene);
    topOrb.position = new Vector3(0, 2.6, 0);
    const orbMat = new PBRMaterial('ttOrbMat', scene);
    orbMat.albedoColor = Color3.FromHexString('#FFD700');
    orbMat.emissiveColor = Color3.FromHexString('#FF6B00');
    orbMat.emissiveIntensity = 2.0;
    topOrb.material = orbMat;
    topOrb.parent = this.mainHub;

    // ── 4. Four Articulated Cross-Arms & Passenger Pods ──────────────────────
    const armRadius = 5.2;

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;

      // Heavy cross arm extending outwards from center
      const arm = MeshBuilder.CreateBox(`ttCrossArm_${i}`, { width: 0.5, height: 0.45, depth: armRadius }, scene);
      arm.position = new Vector3(
        Math.cos(angle) * (armRadius / 2),
        0.5,
        Math.sin(angle) * (armRadius / 2)
      );
      arm.rotation.y = -angle + Math.PI / 2;
      arm.material = armSteelMat;
      arm.parent = this.mainHub;
      if (shadowCast) shadowCast(arm);

      // Independent Pod Rotation Pivot at the end of the arm
      const podPivot = new TransformNode(`ttPodPivot_${i}`, scene);
      podPivot.position = new Vector3(
        Math.cos(angle) * armRadius,
        0.5,
        Math.sin(angle) * armRadius
      );
      podPivot.parent = this.mainHub;

      // Passenger Car Pod (Round saucer capsule)
      const podColor = podColors[i % podColors.length];
      const podMat = new PBRMaterial(`ttPodMat_${i}`, scene);
      podMat.albedoColor = Color3.FromHexString(podColor);
      podMat.roughness = 0.35;
      podMat.metallic = 0.4;

      const podBody = MeshBuilder.CreateCylinder(`ttPodBody_${i}`, {
        height: 0.85,
        diameterTop: 2.5,
        diameterBottom: 2.1,
        tessellation: 12,
      }, scene);
      podBody.position = new Vector3(0, 0.4, 0);
      podBody.material = podMat;
      podBody.parent = podPivot;
      if (shadowCast) shadowCast(podBody);

      // 4 Bucket Seats inside Pod
      for (let s = 0; s < 4; s++) {
        const sAngle = (s / 4) * Math.PI * 2;
        const seat = MeshBuilder.CreateBox(`ttSeat_${i}_${s}`, { width: 0.6, height: 0.6, depth: 0.5 }, scene);
        seat.position = new Vector3(Math.cos(sAngle) * 0.7, 0.55, Math.sin(sAngle) * 0.7);
        seat.rotation.y = -sAngle - Math.PI / 2;
        seat.material = platformMat;
        seat.parent = podBody;

        // Dedicated mount node for player boarding
        const seatMount = new TransformNode(`ttSeatMount_${i}_${s}`, scene);
        seatMount.position = new Vector3(Math.cos(sAngle) * 0.7, 0.7, Math.sin(sAngle) * 0.7);
        seatMount.rotation.y = -sAngle - Math.PI / 2;
        seatMount.parent = podBody;
        this.seats.push(seatMount);
      }

      // Neon Rim Ring around the Pod
      const neonRing = MeshBuilder.CreateTorus(`ttNeonRing_${i}`, {
        diameter: 2.52,
        thickness: 0.08,
        tessellation: 16,
      }, scene);
      neonRing.rotation.x = Math.PI / 2;
      neonRing.position = new Vector3(0, 0.8, 0);
      const ringMat = new PBRMaterial(`ttRingMat_${i}`, scene);
      ringMat.albedoColor = Color3.FromHexString(podColor);
      ringMat.emissiveColor = Color3.FromHexString(podColor);
      ringMat.emissiveIntensity = 2.5;
      neonRing.material = ringMat;
      neonRing.parent = podBody;

      this.carPods.push({ pivot: podPivot, carBody: podBody });
    }

    // ── 5. High-Speed Thrill Dual-Axis Spin Animation ────────────────────────
    let time = 0;
    scene.onBeforeRenderObservable.add(() => {
      const dt = scene.getEngine().getDeltaTime() / 1000;
      time += dt;

      // 1. Main hub spins clockwise at ~0.9 rad/s
      this.mainHub.rotation.y += 0.9 * dt;

      // 2. Each car pod spins counter-clockwise at ~2.2 rad/s with dynamic centrifugal tilt
      this.carPods.forEach((pod, idx) => {
        const phase = (idx * Math.PI * 2) / 4;
        pod.pivot.rotation.y -= 2.2 * dt;
        // Dynamic undulating centrifugal banking
        pod.carBody.rotation.z = Math.sin(time * 3.5 + phase) * 0.18;
        pod.carBody.rotation.x = Math.cos(time * 3.5 + phase) * 0.18;
      });
    });
  }

  public getSeats(): TransformNode[] {
    return this.seats;
  }
}
