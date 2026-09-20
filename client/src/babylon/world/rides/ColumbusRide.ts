/**
 * ColumbusRide.ts — Giant Swinging Pirate Galley Ship Ride (കൊളംബസ് / Columbus Boat)
 * Signature Kerala Carnival & Police Maidan fair attraction.
 * Features:
 * - 14-meter tall heavy-duty structural steel A-frame towers (Left & Right)
 * - 10-meter long detailed wooden pirate ship with 6 rows of passenger seats and lap bars
 * - Pointed dragon-head prow and decorative stern with glowing carnival LED neon strips
 * - 4 steel suspension arms connecting ship to central top bearing axle
 * - Smooth harmonic pendulum swinging animation (reaching ±60° high amplitude)
 * - Raised wooden boarding platform with stairs, operator booth, and Havok physics colliders
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

export class ColumbusRide {
  public root: TransformNode;
  private shipPivot: TransformNode;
  private seats: TransformNode[] = [];
  private swingAngle: number = 0;
  private swingSpeed: number = 1.35; // Harmonic frequency
  private maxSwingAngle: number = 1.05; // ~60 degrees high swing

  constructor(scene: Scene, position: Vector3, shadowCast?: (m: Mesh) => void) {
    this.root = new TransformNode('columbusRideRoot', scene);
    this.root.position = position;

    // ── 1. Materials ──────────────────────────────────────────────────────────
    // Vibrant Carnival steel colors
    const steelMat = new PBRMaterial('columbusSteel', scene);
    steelMat.albedoColor = Color3.FromHexString('#E11D48'); // Carnival Rose Red
    steelMat.metallic = 0.7;
    steelMat.roughness = 0.3;

    const yellowSteelMat = new PBRMaterial('columbusYellowSteel', scene);
    yellowSteelMat.albedoColor = Color3.FromHexString('#FACC15'); // Bright Yellow
    yellowSteelMat.metallic = 0.6;
    yellowSteelMat.roughness = 0.35;

    const shipWoodMat = new PBRMaterial('columbusShipWood', scene);
    shipWoodMat.albedoColor = Color3.FromHexString('#78350F'); // Dark Marine Wood
    shipWoodMat.roughness = 0.75;
    shipWoodMat.metallic = 0.05;

    const shipTrimMat = new PBRMaterial('columbusShipTrim', scene);
    shipTrimMat.albedoColor = Color3.FromHexString('#0284C7'); // Ocean Blue Trim
    shipTrimMat.roughness = 0.4;
    shipTrimMat.metallic = 0.3;

    const platformMat = new PBRMaterial('columbusPlatformMat', scene);
    platformMat.albedoColor = Color3.FromHexString('#52525B'); // Industrial Diamond Plate
    platformMat.roughness = 0.8;
    platformMat.metallic = 0.3;

    const neonMat = new PBRMaterial('columbusNeon', scene);
    neonMat.albedoColor = Color3.FromHexString('#FF0055');
    neonMat.emissiveColor = Color3.FromHexString('#FF0055');
    neonMat.emissiveIntensity = 2.5;

    // ── 2. Boarding Platform & Operator Cabin ────────────────────────────────
    const platformW = 12;
    const platformH = 1.4;
    const platformD = 14;

    const platform = MeshBuilder.CreateBox('columbusPlatform', {
      width: platformW,
      height: platformH,
      depth: platformD,
    }, scene);
    platform.position = new Vector3(0, platformH / 2, 0);
    platform.material = platformMat;
    platform.parent = this.root;
    platform.receiveShadows = true;
    if (shadowCast) shadowCast(platform);

    // Boarding stairs (Front and Rear)
    [-platformD / 2 - 1.2, platformD / 2 + 1.2].forEach((zPos, si) => {
      const stairs = MeshBuilder.CreateBox(`columbusStairs_${si}`, { width: 5, height: 0.7, depth: 2.4 }, scene);
      stairs.position = new Vector3(0, 0.35, zPos);
      stairs.material = platformMat;
      stairs.parent = this.root;
    });

    // Operator Control Cabin (Side)
    const cabin = MeshBuilder.CreateBox('columbusControlCabin', { width: 2.2, height: 2.4, depth: 2.2 }, scene);
    cabin.position = new Vector3(platformW / 2 + 1.2, 1.2, 0);
    cabin.material = yellowSteelMat;
    cabin.parent = this.root;
    if (shadowCast) shadowCast(cabin);

    if (scene.isPhysicsEnabled()) {
      PhysicsManager.addStaticBoxCollider(platform, scene, new Vector3(platformW, platformH, platformD));
      PhysicsManager.addStaticBoxCollider(cabin, scene, new Vector3(2.2, 2.4, 2.2));
    }

    // ── 3. Heavy-Duty Steel A-Frame Towers (Left & Right) ────────────────────
    const axleHeight = 12.5; // Axle height above ground
    const towerSpanX = 5.8;

    [-towerSpanX, towerSpanX].forEach((xSide, sideIdx) => {
      // 2 Leaning legs per side forming A-frame
      [-4.5, 4.5].forEach((zLeg, legIdx) => {
        const leg = MeshBuilder.CreateCylinder(`columbusTowerLeg_${sideIdx}_${legIdx}`, {
          height: 14.2,
          diameter: 0.55,
          tessellation: 8,
        }, scene);
        leg.position = new Vector3(xSide, axleHeight / 2 + 0.5, zLeg / 2);
        // Angle legs inward towards the top axle
        leg.rotation.x = (zLeg > 0 ? -1 : 1) * 0.32;
        leg.material = steelMat;
        leg.parent = this.root;
        leg.receiveShadows = true;
        if (shadowCast) shadowCast(leg);
      });

      // Horizontal Cross Braces
      [4.0, 8.0].forEach((yBrace, bIdx) => {
        const brace = MeshBuilder.CreateCylinder(`columbusBrace_${sideIdx}_${bIdx}`, {
          height: 7.0 - bIdx * 2.0,
          diameter: 0.35,
          tessellation: 8,
        }, scene);
        brace.rotation.x = Math.PI / 2;
        brace.position = new Vector3(xSide, yBrace, 0);
        brace.material = yellowSteelMat;
        brace.parent = this.root;
      });
    });

    // Top Main Axle Cylinder
    const topAxle = MeshBuilder.CreateCylinder('columbusTopAxle', { height: towerSpanX * 2 + 1.2, diameter: 0.65 }, scene);
    topAxle.rotation.z = Math.PI / 2;
    topAxle.position = new Vector3(0, axleHeight, 0);
    topAxle.material = yellowSteelMat;
    topAxle.parent = this.root;

    // ── 4. Swinging Ship Assembly (Pivot at top axle) ────────────────────────
    this.shipPivot = new TransformNode('columbusShipPivot', scene);
    this.shipPivot.position = new Vector3(0, axleHeight, 0);
    this.shipPivot.parent = this.root;

    const armLength = 9.2;

    // 4 Steel Suspension Hanger Arms
    [-2.2, 2.2].forEach((xArm, aIdx) => {
      [-1.8, 1.8].forEach((zArm, zIdx) => {
        const arm = MeshBuilder.CreateCylinder(`columbusHangerArm_${aIdx}_${zIdx}`, {
          height: armLength,
          diameter: 0.22,
          tessellation: 6,
        }, scene);
        arm.position = new Vector3(xArm, -armLength / 2, zArm);
        arm.material = yellowSteelMat;
        arm.parent = this.shipPivot;
      });
    });

    // ── 5. Pirate Galley Ship Body ──────────────────────────────────────────
    const shipNode = new TransformNode('columbusShipBody', scene);
    shipNode.position = new Vector3(0, -armLength, 0);
    shipNode.parent = this.shipPivot;

    // Main Mid Hull (trough shape)
    const hull = MeshBuilder.CreateBox('columbusHull', { width: 4.8, height: 1.6, depth: 8.5 }, scene);
    hull.position = new Vector3(0, 0, 0);
    hull.material = shipWoodMat;
    hull.parent = shipNode;
    if (shadowCast) shadowCast(hull);

    // Blue side panels & neon accents
    [-2.42, 2.42].forEach((xSide, sideIdx) => {
      const trim = MeshBuilder.CreateBox(`columbusTrim_${sideIdx}`, { width: 0.1, height: 0.35, depth: 8.5 }, scene);
      trim.position = new Vector3(xSide, 0.6, 0);
      trim.material = shipTrimMat;
      trim.parent = shipNode;

      const neonStrip = MeshBuilder.CreateBox(`columbusNeon_${sideIdx}`, { width: 0.08, height: 0.1, depth: 8.2 }, scene);
      neonStrip.position = new Vector3(xSide * 1.02, 0.7, 0);
      neonStrip.material = neonMat;
      neonStrip.parent = shipNode;
    });

    // Pointed Dragon Bow (Front)
    const bow = MeshBuilder.CreateCylinder('columbusBow', {
      height: 3.2,
      diameterTop: 0.2,
      diameterBottom: 4.8,
      tessellation: 6,
    }, scene);
    bow.rotation.x = -Math.PI / 2;
    bow.position = new Vector3(0, 0.5, 5.4);
    bow.scaling = new Vector3(1, 1, 0.45);
    bow.material = shipWoodMat;
    bow.parent = shipNode;
    if (shadowCast) shadowCast(bow);

    // Decorative Stern (Rear)
    const stern = MeshBuilder.CreateCylinder('columbusStern', {
      height: 2.8,
      diameterTop: 0.4,
      diameterBottom: 4.8,
      tessellation: 6,
    }, scene);
    stern.rotation.x = Math.PI / 2;
    stern.position = new Vector3(0, 0.6, -5.2);
    stern.scaling = new Vector3(1, 1, 0.45);
    stern.material = shipWoodMat;
    stern.parent = shipNode;
    if (shadowCast) shadowCast(stern);

    // 6 Rows of Passenger Seats with Safety Lap Bars
    for (let r = 0; r < 6; r++) {
      const zSeat = -3.2 + r * 1.3;
      // Bench Seat
      const seat = MeshBuilder.CreateBox(`columbusSeat_${r}`, { width: 4.2, height: 0.45, depth: 0.6 }, scene);
      seat.position = new Vector3(0, 0.45, zSeat);
      seat.material = shipTrimMat;
      seat.parent = shipNode;

      // Seat mount transform nodes (Left & Right spots on each bench)
      [-1.2, 1.2].forEach((xSeat, sIdx) => {
        const seatNode = new TransformNode(`columbusSeatNode_${r}_${sIdx}`, scene);
        seatNode.position = new Vector3(xSeat, 0.7, zSeat);
        seatNode.parent = shipNode;
        this.seats.push(seatNode);
      });

      // Safety Lap Bar
      const lapBar = MeshBuilder.CreateCylinder(`columbusLapBar_${r}`, { height: 4.2, diameter: 0.08 }, scene);
      lapBar.rotation.z = Math.PI / 2;
      lapBar.position = new Vector3(0, 0.95, zSeat + 0.2);
      lapBar.material = yellowSteelMat;
      lapBar.parent = shipNode;
    }

    // ── 6. Harmonic Pendulum Swing Animation Loop ────────────────────────────
    let time = 0;
    scene.onBeforeRenderObservable.add(() => {
      const dt = scene.getEngine().getDeltaTime() / 1000;
      time += dt;

      // Sinusoidal swinging with gradual natural speed variation
      this.swingAngle = Math.sin(time * this.swingSpeed) * this.maxSwingAngle;
      this.shipPivot.rotation.x = this.swingAngle; // Swings forward and backward along Z axis
    });
  }

  public getSeats(): TransformNode[] {
    return this.seats;
  }
}
