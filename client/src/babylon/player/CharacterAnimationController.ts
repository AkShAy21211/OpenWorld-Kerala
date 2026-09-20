/**
 * CharacterAnimationController.ts — Animation State Machine & Blend Tree
 * Supports both:
 * 1. Skeletal glTF/GLB AnimationGroups with weight crossfading and speed synchronization
 * 2. Articulated procedural limb animation fallback (smooth natural human arm & leg swing)
 */

import { AnimationGroup, Scalar, Mesh, Vector3 } from '@babylonjs/core';

export type AnimStateType = 'idle' | 'walk' | 'run' | 'jump' | 'fall' | 'sitting';

export interface ArticulatedLimbs {
  lArm: Mesh;
  rArm: Mesh;
  lLeg: Mesh;
  rLeg: Mesh;
  torso: Mesh;
  head: Mesh;
}

export class CharacterAnimationController {
  private groups = new Map<AnimStateType, AnimationGroup>();
  private currentState: AnimStateType = 'idle';
  private isSitting: boolean = false;
  private blendDuration = 0.2; // 200ms crossfade

  // Procedural limb articulation state
  private walkCycle = 0;
  private limbs: ArticulatedLimbs | null = null;

  public setArticulatedLimbs(limbs: ArticulatedLimbs) {
    this.limbs = limbs;
  }

  public setSittingState(sitting: boolean) {
    this.isSitting = sitting;
  }

  public registerAnimationGroup(state: AnimStateType, group: AnimationGroup) {
    group.stop();
    group.setWeightForAllAnimatables(0);
    this.groups.set(state, group);
  }

  public hasSkeletalAnimations(): boolean {
    return this.groups.size > 0;
  }

  public start() {
    const idle = this.groups.get('idle');
    if (idle) {
      idle.play(true);
      idle.setWeightForAllAnimatables(1);
    }
  }

  /**
   * Updates animations based on physics speed and grounded state.
   */
  public update(speed: number, isGrounded: boolean, dt: number) {
    // 1. Determine target animation state
    let targetState: AnimStateType = 'idle';
    if (this.isSitting) {
      targetState = 'sitting';
    } else if (!isGrounded) {
      targetState = 'fall';
    } else if (speed > 8.0) {
      targetState = 'run';
    } else if (speed > 0.3) {
      targetState = 'walk';
    }

    this.currentState = targetState;

    // 2. If we have glTF/GLB skeletal animation groups, update weight crossfade & speed matching
    if (this.hasSkeletalAnimations()) {
      const walkGroup = this.groups.get('walk');
      if (walkGroup && this.currentState === 'walk') {
        // Synchronize footstep speed with actual physics ground velocity
        walkGroup.speedRatio = Scalar.Clamp(speed / 6.0, 0.6, 1.8);
      }

      const runGroup = this.groups.get('run');
      if (runGroup && this.currentState === 'run') {
        runGroup.speedRatio = Scalar.Clamp(speed / 11.0, 0.7, 1.8);
      }

      for (const [state, group] of this.groups.entries()) {
        const targetWeight = state === this.currentState ? 1.0 : 0.0;
        const currentWeight = group.animatables[0]?.weight ?? 0;
        const newWeight = Scalar.Lerp(currentWeight, targetWeight, dt / this.blendDuration);

        if (newWeight > 0.02 && !group.isPlaying) {
          group.play(state !== 'jump');
        }
        group.setWeightForAllAnimatables(newWeight);
        if (newWeight <= 0.01 && group.isPlaying && state !== this.currentState) {
          group.stop();
        }
      }
    }

    // 3. Update procedural articulated limbs (natural human arm/leg swing)
    if (this.limbs) {
      this.updateProceduralLimbs(speed, isGrounded, dt);
    }
  }

  /**
   * Procedurally animates limbs for realistic human walking/running physics:
   * - Opposite arm & leg counter-swing
   * - Knee flexion on backward leg swing
   * - Slight torso twist and head counter-rotation
   */
  private updateProceduralLimbs(speed: number, isGrounded: boolean, dt: number) {
    const { lArm, rArm, lLeg, rLeg, torso, head } = this.limbs!;

    if (this.isSitting) {
      // Sitting / Riding posture: legs forward at ~90 deg, hands gripping lap bar / reins
      const bob = Math.sin(Date.now() * 0.003) * 0.015;
      lLeg.rotation.x = Scalar.Lerp(lLeg.rotation.x, Math.PI / 2.2, 0.2);
      rLeg.rotation.x = Scalar.Lerp(rLeg.rotation.x, Math.PI / 2.2, 0.2);
      lArm.rotation.x = Scalar.Lerp(lArm.rotation.x, 0.5 + bob, 0.2);
      rArm.rotation.x = Scalar.Lerp(rArm.rotation.x, 0.5 + bob, 0.2);
      lArm.rotation.z = -0.12;
      rArm.rotation.z = 0.12;
      torso.rotation.x = 0.05;
      torso.rotation.y = 0;
      torso.rotation.z = 0;
      head.rotation.x = -0.05;
      head.rotation.y = 0;
      return;
    }

    const isMoving = speed > 0.3;

    if (isMoving) {
      const speedRatio = Scalar.Clamp(speed / 6.5, 0.2, 1.4);
      const cadence = 6.0 + speedRatio * 7.0; // Cadence matches speed
      this.walkCycle += dt * cadence;

      const baseAmp = speed > 8.0 ? 0.70 : 0.48;
      const legSwing = Math.sin(this.walkCycle) * baseAmp * speedRatio;
      const armSwing = -legSwing * 1.15; // Natural arm counter-swing

      // Legs swing forward and backward
      lLeg.rotation.x = Scalar.Lerp(lLeg.rotation.x, legSwing, 0.3);
      rLeg.rotation.x = Scalar.Lerp(rLeg.rotation.x, -legSwing, 0.3);

      // Arms swing with slight natural outward flair
      lArm.rotation.x = Scalar.Lerp(lArm.rotation.x, armSwing, 0.3);
      rArm.rotation.x = Scalar.Lerp(rArm.rotation.x, -armSwing, 0.3);
      lArm.rotation.z = -0.09;
      rArm.rotation.z = 0.09;

      // Natural organic pelvic/hip sway and torso twist
      torso.rotation.x = 0;
      torso.rotation.y = Math.sin(this.walkCycle) * 0.06 * speedRatio;
      torso.rotation.z = Math.sin(this.walkCycle) * 0.03 * speedRatio;
      head.rotation.x = 0;
      head.rotation.y = -Math.sin(this.walkCycle) * 0.03 * speedRatio; // Head stays forward
    } else {
      // Idle: smooth return to relaxed standing posture with gentle breathing
      const breath = Math.sin(Date.now() * 0.002) * 0.02;
      lLeg.rotation.x = Scalar.Lerp(lLeg.rotation.x, 0, 0.15);
      rLeg.rotation.x = Scalar.Lerp(rLeg.rotation.x, 0, 0.15);
      lArm.rotation.x = Scalar.Lerp(lArm.rotation.x, breath, 0.15);
      rArm.rotation.x = Scalar.Lerp(rArm.rotation.x, breath, 0.15);
      lArm.rotation.z = Scalar.Lerp(lArm.rotation.z, -0.05, 0.15);
      rArm.rotation.z = Scalar.Lerp(rArm.rotation.z, 0.05, 0.15);
      torso.rotation.x = 0;
      torso.rotation.y = Scalar.Lerp(torso.rotation.y, 0, 0.15);
      torso.rotation.z = Scalar.Lerp(torso.rotation.z, 0, 0.15);
      head.rotation.x = 0;
      head.rotation.y = Scalar.Lerp(head.rotation.y, 0, 0.15);
    }
  }

  public getState(): AnimStateType {
    return this.currentState;
  }
}
