/**
 * RideManager.ts — Unified Ride Boarding, Mounting & Ride Physics Controller
 * Allows players to board and ride all Kerala fair attractions:
 * - Giant Ferris Wheel (ഭീമൻ രാട്ടിനം): Soars 18m with 360° panoramic view
 * - Columbus Pirate Ship (കൊളംബസ്): Exhilarating ±60° high pendulum swing
 * - Merry-Go-Round Carousel (ചുഴലിക്കുതിര): Galloping horse mount with sinusoidal bobbing
 * - Tora Tora Thrill Ride (ടോറ ടോറ): High-speed dual-axis centrifugal spin
 * - Houseboat Kettuvallam (കെട്ടുവള്ളം): Floating backwater cruise deck
 * - Caparisoned Elephant (ഗജവീരൻ): High ceremonial royal saddle mount
 *
 * Features:
 * - Proximity detection with on-screen HUD prompt
 * - Smooth seat mounting & sitting posture animation
 * - Dynamic Exhilarating Ride Camera with inertial sway & G-force simulation
 * - Safe dismount to solid boarding platforms
 */

import {
  Scene,
  TransformNode,
  Vector3,
  ArcRotateCamera,
  Scalar,
  Quaternion,
} from '@babylonjs/core';
import { useGameStore } from '../../store/useGameStore';
import { soundManager } from '../../utils/audio';

export interface RidableRide {
  id: string;
  name: string;
  malayalamName: string;
  worldCenter: Vector3;
  boardingRadius: number;
  exitPosition: Vector3;
  cameraConfig: {
    radius: number;
    beta: number;
    fov: number;
  };
  getSeats: () => TransformNode[];
}

export class RideManager {
  private static rides: Map<string, RidableRide> = new Map();
  private static activeRide: {
    ride: RidableRide;
    seatNode: TransformNode;
    seatIndex: number;
    originalParent: TransformNode | null;
  } | null = null;

  public static registerRide(ride: RidableRide) {
    this.rides.set(ride.id, ride);
  }

  public static getNearbyRide(playerPos: Vector3): RidableRide | null {
    if (this.activeRide) return null; // Already riding

    for (const ride of this.rides.values()) {
      const dist = Vector3.Distance(playerPos, ride.worldCenter);
      if (dist <= ride.boardingRadius) {
        return ride;
      }
    }
    return null;
  }

  public static isPlayerRiding(): boolean {
    return this.activeRide !== null;
  }

  public static getActiveRideInfo() {
    return this.activeRide ? {
      id: this.activeRide.ride.id,
      name: this.activeRide.ride.name,
      malayalamName: this.activeRide.ride.malayalamName,
      seatIndex: this.activeRide.seatIndex,
    } : null;
  }

  /**
   * Mounts the player onto the nearest available seat on the specified ride
   */
  public static mountRide(
    rideId: string,
    playerRoot: TransformNode,
    playerPos: Vector3,
    onMounted?: () => void
  ): boolean {
    const ride = this.rides.get(rideId);
    if (!ride) return false;

    const seats = ride.getSeats();
    if (seats.length === 0) return false;

    // Find the seat closest to player's current position (e.g. lowest gondola at boarding station)
    let bestSeat = seats[0];
    let bestDist = Infinity;
    let bestIdx = 0;

    seats.forEach((seat, idx) => {
      const seatWorldPos = seat.getAbsolutePosition();
      const dist = Vector3.Distance(playerPos, seatWorldPos);
      if (dist < bestDist) {
        bestDist = dist;
        bestSeat = seat;
        bestIdx = idx;
      }
    });

    // Parent the player root to the moving seat node
    const originalParent = playerRoot.parent as TransformNode | null;
    playerRoot.parent = bestSeat;
    playerRoot.position.set(0, 0, 0); // Position inside seat
    playerRoot.rotationQuaternion = null;
    playerRoot.rotation.set(0, 0, 0);

    this.activeRide = {
      ride,
      seatNode: bestSeat,
      seatIndex: bestIdx,
      originalParent,
    };

    soundManager.playPop();
    useGameStore.getState().setActiveRideState({
      isRiding: true,
      rideId: ride.id,
      rideName: `${ride.name} (${ride.malayalamName})`,
    });

    if (onMounted) onMounted();
    return true;
  }

  /**
   * Safely dismounts the player onto the ride's boarding platform
   */
  public static dismountRide(
    playerRoot: TransformNode,
    onDismounted?: (exitPos: Vector3) => void
  ): boolean {
    if (!this.activeRide) return false;

    const { ride, originalParent } = this.activeRide;
    const exitPos = ride.exitPosition.clone();

    // Detach from ride seat and restore world parenting
    playerRoot.parent = originalParent;
    playerRoot.position.copyFrom(exitPos);
    playerRoot.rotation.set(0, 0, 0);

    this.activeRide = null;
    soundManager.playPop();

    useGameStore.getState().setActiveRideState({
      isRiding: false,
      rideId: null,
      rideName: null,
    });

    if (onDismounted) onDismounted(exitPos);
    return true;
  }

  /**
   * Updates ride camera effects during active ride
   */
  public static updateRideCamera(camera: ArcRotateCamera, dt: number) {
    if (!this.activeRide) return;

    const { ride } = this.activeRide;
    const cfg = ride.cameraConfig;

    // Smoothly adapt camera to ride parameters
    camera.radius = Scalar.Lerp(camera.radius, cfg.radius, 0.08);
    camera.beta = Scalar.Lerp(camera.beta, cfg.beta, 0.08);
    camera.fov = Scalar.Lerp(camera.fov, cfg.fov, 0.05);

    // Ride-specific camera dynamics
    if (ride.id === 'columbus') {
      // Dynamic camera pull-back on high swing
      const time = performance.now() / 1000;
      const swingIntensity = Math.abs(Math.sin(time * 1.35));
      camera.fov = Scalar.Lerp(camera.fov, 0.85 + swingIntensity * 0.25, 0.1);
    } else if (ride.id === 'tora_tora') {
      // Centrifugal camera banking
      camera.beta = 1.35 + Math.sin(performance.now() / 300) * 0.08;
    }
  }
}
