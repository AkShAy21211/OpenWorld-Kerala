/**
 * PhysicsManager.ts — Havok Physics V2 Orchestrator for Kerala Fair 3D
 * Initializes the WASM-powered Havok physics engine and sets up the scene physics world.
 */

import {
  Scene,
  Vector3,
  Quaternion,
  PhysicsBody,
  PhysicsMotionType,
  PhysicsShapeBox,
  PhysicsShapeCapsule,
  Mesh,
  TransformNode,
} from '@babylonjs/core';
import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import HavokPhysics from '@babylonjs/havok';

export class PhysicsManager {
  private static plugin: HavokPlugin | null = null;

  /**
   * Initializes Havok Physics on the given Babylon scene.
   * Safe to call multiple times (caches the plugin instance).
   */
  public static async initPhysics(scene: Scene): Promise<HavokPlugin> {
    if (!this.plugin) {
      const havok = await HavokPhysics();
      this.plugin = new HavokPlugin(true, havok);
    }

    // Realistic game gravity (snappy and responsive)
    const gravity = new Vector3(0, -18.0, 0);
    scene.enablePhysics(gravity, this.plugin);

    return this.plugin;
  }

  public static getPlugin(): HavokPlugin | null {
    return this.plugin;
  }

  /**
   * Creates a static box collider on a mesh (e.g. walls, stalls).
   */
  public static addStaticBoxCollider(mesh: Mesh, scene: Scene, size?: Vector3): PhysicsBody {
    const s = size || mesh.getBoundingInfo().boundingBox.extendSize.scale(2);
    const shape = new PhysicsShapeBox(
      Vector3.Zero(),
      mesh.rotationQuaternion || Quaternion.Identity(),
      s,
      scene
    );
    shape.material = { friction: 0.8, restitution: 0.0 };

    const body = new PhysicsBody(mesh, PhysicsMotionType.STATIC, false, scene);
    body.shape = shape;
    body.setMassProperties({ mass: 0 });
    return body;
  }

  /**
   * Creates a static ground collider.
   */
  public static addStaticGroundCollider(ground: Mesh, scene: Scene, width: number, depth: number, height = 0.5): PhysicsBody {
    const shape = new PhysicsShapeBox(
      new Vector3(0, -height / 2, 0),
      Quaternion.Identity(),
      new Vector3(width, height, depth),
      scene
    );
    shape.material = { friction: 0.9, restitution: 0.0 };

    const body = new PhysicsBody(ground, PhysicsMotionType.STATIC, false, scene);
    body.shape = shape;
    body.setMassProperties({ mass: 0 });
    return body;
  }
}
