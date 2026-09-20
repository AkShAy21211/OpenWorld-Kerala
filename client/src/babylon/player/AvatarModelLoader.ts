/**
 * AvatarModelLoader.ts — glTF / GLB Humanoid Avatar Loader
 * Loads rigged humanoid avatars (Ready Player Me, Mixamo, Babylon test models),
 * sets up shadows/materials, and registers animation tracks to CharacterAnimationController.
 */

import {
  Scene,
  SceneLoader,
  TransformNode,
  AbstractMesh,
  AnimationGroup,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { CharacterAnimationController, AnimStateType } from './CharacterAnimationController';

export interface LoadedAvatar {
  rootMesh: AbstractMesh;
  allMeshes: AbstractMesh[];
  animationGroups: AnimationGroup[];
}

export class AvatarModelLoader {
  /**
   * Loads a GLB avatar from a URL or asset path and parents it to the player transform node.
   */
  public static async loadAvatar(
    url: string,
    parentNode: TransformNode,
    scene: Scene,
    animController?: CharacterAnimationController
  ): Promise<LoadedAvatar | null> {
    try {
      const result = await SceneLoader.ImportMeshAsync('', '', url, scene);
      if (!result.meshes || result.meshes.length === 0) {
        return null;
      }

      const rootMesh = result.meshes[0];
      rootMesh.parent = parentNode;
      rootMesh.position.set(0, 0, 0);

      // Disable Babylon mesh collisions — collision is handled by the Havok capsule body
      for (const mesh of result.meshes) {
        mesh.checkCollisions = false;
        mesh.receiveShadows = true;
      }

      // Map loaded animations to the animation controller
      if (animController && result.animationGroups.length > 0) {
        for (const group of result.animationGroups) {
          const name = group.name.toLowerCase();
          if (name.includes('idle')) {
            animController.registerAnimationGroup('idle', group);
          } else if (name.includes('walk')) {
            animController.registerAnimationGroup('walk', group);
          } else if (name.includes('run') || name.includes('sprint')) {
            animController.registerAnimationGroup('run', group);
          } else if (name.includes('jump')) {
            animController.registerAnimationGroup('jump', group);
          }
        }
        animController.start();
      }

      return {
        rootMesh,
        allMeshes: result.meshes,
        animationGroups: result.animationGroups,
      };
    } catch (err) {
      console.warn('[AvatarModelLoader] Could not load avatar model:', url, err);
      return null;
    }
  }
}
