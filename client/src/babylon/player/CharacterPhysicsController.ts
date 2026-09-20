/**
 * CharacterPhysicsController.ts — Havok Physics Character Controller
 * - Dynamic PhysicsBody with locked inertia (prevents tumbling)
 * - Capsule shape (1.8m height, 0.35m radius)
 * - Downward raycasting for accurate ground detection and slope normal calculation
 * - Slope tangent projection for smooth hill climbing and slope sliding
 * - Ground snapping on downward movement
 */

import {
  Scene,
  TransformNode,
  Vector3,
  Quaternion,
  PhysicsBody,
  PhysicsMotionType,
  PhysicsShapeCapsule,
  Ray,
  Scalar,
} from '@babylonjs/core';

export interface MovementInput {
  moveDir: Vector3;       // normalized horizontal direction in world space (XZ)
  isRunning: boolean;     // sprint flag
  jumpRequested: boolean; // jump trigger
}

export class CharacterPhysicsController {
  public body: PhysicsBody;
  public isGrounded = false;
  private currentHorizontalVel = new Vector3(0, 0, 0);
  private currentVerticalVelocity = 0;
  private bankAngle = 0;
  private yaw = 0; // Current character facing direction in radians

  // Speeds and acceleration rates
  public walkSpeed = 6.5;
  public runSpeed = 12.0;
  public acceleration = 12.0;   // smooth ramp up to full speed
  public deceleration = 15.0;   // smooth natural stop (prevents robotic abrupt stops)
  public turnSpeed = 13.0;      // radians/sec for fluid turning
  public jumpVelocity = 8.0;
  public gravity = 22.0;
  public maxSlopeAngle = Math.PI / 4; // 45 degrees

  constructor(private node: TransformNode, private scene: Scene) {
    // 1. Create upright Capsule Shape (total height 1.8m, radius 0.35m)
    const capsule = new PhysicsShapeCapsule(
      new Vector3(0, 0.35, 0),
      new Vector3(0, 1.45, 0),
      0.35,
      scene
    );
    capsule.material = { friction: 0.2, restitution: 0.0 };

    // 2. Dynamic PhysicsBody with locked angular inertia (never falls over)
    this.body = new PhysicsBody(node, PhysicsMotionType.DYNAMIC, false, scene);
    this.body.shape = capsule;
    this.body.setMassProperties({
      mass: 70,
      inertia: Vector3.Zero(), // Locks pitch, roll, yaw in physics solver
    });
    this.body.disablePreStep = false; // Allows manual orientation to propagate to Havok

    // Ensure rotationQuaternion exists and is initialized
    if (!this.node.rotationQuaternion) {
      this.node.rotationQuaternion = new Quaternion();
    }
  }

  /**
   * Updates physics velocity and ground state every frame.
   * Employs acceleration, deceleration (inertia), shortest-angle turn slerp, and bank tilt.
   */
  public update(input: MovementInput, dt: number): { speed: number; isGrounded: boolean } {
    const pos = this.node.position;

    // 1. Ground detection via downward raycast from center of character
    const rayStart = new Vector3(pos.x, pos.y + 0.9, pos.z);
    const rayLength = 1.15;
    const ray = new Ray(rayStart, Vector3.Down(), rayLength);

    // Pick against ground/environment, excluding player's own meshes
    const hit = this.scene.pickWithRay(ray, (m) => {
      return !m.name.startsWith('player') && !m.name.startsWith('costume');
    });

    let groundNormal = Vector3.Up();
    this.isGrounded = false;

    if (hit && hit.hit && hit.pickedPoint) {
      groundNormal = hit.getNormal(true) || Vector3.Up();
      const slopeAngle = Math.acos(Scalar.Clamp(Vector3.Dot(groundNormal, Vector3.Up()), -1, 1));
      if (slopeAngle <= this.maxSlopeAngle) {
        this.isGrounded = true;
      }
    }

    // 2. Compute horizontal target velocity with acceleration / inertia
    const hasInput = input.moveDir.lengthSquared() > 0.001;
    const targetSpeed = input.isRunning ? this.runSpeed : this.walkSpeed;
    let targetHorizontalVel = hasInput ? input.moveDir.scale(targetSpeed) : Vector3.Zero();

    if (this.isGrounded) {
      // Slope tangent projection: project velocity along ground plane
      const dot = Vector3.Dot(targetHorizontalVel, groundNormal);
      targetHorizontalVel = targetHorizontalVel.subtract(groundNormal.scale(dot));

      // Handle jump or stick-to-ground snap
      if (input.jumpRequested) {
        this.currentVerticalVelocity = this.jumpVelocity;
        this.isGrounded = false;
      } else {
        this.currentVerticalVelocity = -2.0; // Stick to ground slopes
      }

      // Smooth acceleration vs deceleration on ground
      const rate = hasInput ? this.acceleration : this.deceleration;
      this.currentHorizontalVel = Vector3.Lerp(
        this.currentHorizontalVel,
        targetHorizontalVel,
        Scalar.Clamp(rate * dt, 0, 1)
      );
    } else {
      // In-air freefall under gravity (reduced horizontal air control)
      this.currentVerticalVelocity -= this.gravity * dt;
      if (this.currentVerticalVelocity < -30) {
        this.currentVerticalVelocity = -30;
      }
      this.currentHorizontalVel = Vector3.Lerp(
        this.currentHorizontalVel,
        targetHorizontalVel,
        Scalar.Clamp(3.0 * dt, 0, 1)
      );
    }

    // 3. Apply final linear velocity directly to Havok PhysicsBody
    this.body.setLinearVelocity(
      new Vector3(
        this.currentHorizontalVel.x,
        this.currentVerticalVelocity,
        this.currentHorizontalVel.z
      )
    );

    const currentSpeed = Math.sqrt(
      this.currentHorizontalVel.x * this.currentHorizontalVel.x +
      this.currentHorizontalVel.z * this.currentHorizontalVel.z
    );

    // 4. Smooth shortest-path rotation towards movement direction & natural banking
    if (hasInput && currentSpeed > 0.2) {
      const targetAngle = Math.atan2(this.currentHorizontalVel.x, this.currentHorizontalVel.z);

      // Shortest angular difference to prevent spinning 360° the long way
      let diff = targetAngle - this.yaw;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.yaw += diff * Scalar.Clamp(this.turnSpeed * dt, 0, 1);

      // Natural human lean/bank into left & right turns
      const targetBank = Scalar.Clamp(-diff * (currentSpeed / this.runSpeed) * 0.35, -0.14, 0.14);
      this.bankAngle = Scalar.Lerp(this.bankAngle, targetBank, 10.0 * dt);
    } else {
      // Recover upright posture when stopped
      this.bankAngle = Scalar.Lerp(this.bankAngle, 0, 10.0 * dt);
    }

    // Apply rotation to TransformNode via Quaternion (required when PhysicsBody is attached)
    if (!this.node.rotationQuaternion) {
      this.node.rotationQuaternion = new Quaternion();
    }
    Quaternion.RotationYawPitchRollToRef(this.yaw, 0, this.bankAngle, this.node.rotationQuaternion);

    return { speed: currentSpeed, isGrounded: this.isGrounded };
  }

  public getYaw(): number {
    return this.yaw;
  }

  public setYaw(val: number) {
    this.yaw = val;
    if (!this.node.rotationQuaternion) {
      this.node.rotationQuaternion = new Quaternion();
    }
    Quaternion.RotationYawPitchRollToRef(this.yaw, 0, 0, this.node.rotationQuaternion);
  }

  public teleport(pos: Vector3) {
    this.node.position.copyFrom(pos);
    this.currentHorizontalVel.set(0, 0, 0);
    this.currentVerticalVelocity = 0;
    this.body.setLinearVelocity(Vector3.Zero());
    this.body.setAngularVelocity(Vector3.Zero());
  }

  public resetVelocity() {
    this.currentHorizontalVel.set(0, 0, 0);
    this.currentVerticalVelocity = 0;
    this.body.setLinearVelocity(Vector3.Zero());
    this.body.setAngularVelocity(Vector3.Zero());
  }

  public setEnabled(enabled: boolean) {
    if (enabled) {
      this.body.setMotionType(PhysicsMotionType.DYNAMIC);
      this.resetVelocity();
    } else {
      this.body.setMotionType(PhysicsMotionType.ANIMATED);
      this.resetVelocity();
    }
  }

  public dispose() {
    this.body.dispose();
  }
}
