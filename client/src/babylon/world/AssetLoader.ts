/**
 * AssetLoader.ts — Central GLB/GLTF Asset Manager
 *
 * Loads the small set of downloaded CC0 hero assets (see
 * client/scripts/download-assets.mjs) from client/public/assets/nature/,
 * caches the source meshes, and exposes cheap ways to place many instances
 * of them around the scene (regular clones for a handful of hero pieces,
 * thin instancing for anything scattered in bulk).
 */

import {
  Scene,
  SceneLoader,
  TransformNode,
  Mesh,
  AbstractMesh,
  Vector3,
  Matrix,
  Quaternion,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

export interface LoadedAsset {
  /** Root meshes as imported (kept hidden — used as a template only). */
  meshes: AbstractMesh[];
  /** Merged/primary mesh used for thin instancing, if any. */
  root: TransformNode;
}

const ASSET_BASE = '/assets/nature';

/** Name -> relative folder + gltf filename under ASSET_BASE. */
const ASSET_MANIFEST: Record<string, string> = {
  fern_02: 'fern_02/fern_02.gltf',
  boulder_01: 'boulder_01/boulder_01.gltf',
  calathea_orbifolia_01: 'calathea_orbifolia_01/calathea_orbifolia_01.gltf',
  anthurium_botany_01: 'anthurium_botany_01/anthurium_botany_01.gltf',
};

export class AssetLoader {
  private cache = new Map<string, LoadedAsset>();
  private pending = new Map<string, Promise<LoadedAsset | null>>();

  constructor(private scene: Scene) {}

  /** Load (and cache) a named asset from the manifest. Safe to call multiple times. */
  async load(name: keyof typeof ASSET_MANIFEST | string): Promise<LoadedAsset | null> {
    if (this.cache.has(name)) return this.cache.get(name)!;
    if (this.pending.has(name)) return this.pending.get(name)!;

    const relPath = ASSET_MANIFEST[name];
    if (!relPath) {
      console.warn(`[AssetLoader] Unknown asset "${name}" — not in manifest.`);
      return null;
    }

    const [folder, file] = splitPath(relPath);

    const promise = SceneLoader.ImportMeshAsync('', `${ASSET_BASE}/${folder}/`, file, this.scene)
      .then((result) => {
        const root = new TransformNode(`${name}_template`, this.scene);
        result.meshes.forEach((m) => {
          if (m.parent === null) m.parent = root;
          m.isVisible = false;
          m.setEnabled(false);
          m.isPickable = false;
        });
        const asset: LoadedAsset = { meshes: result.meshes, root };
        this.cache.set(name, asset);
        return asset;
      })
      .catch((err) => {
        console.warn(`[AssetLoader] Failed to load "${name}" from ${relPath}:`, err);
        return null;
      })
      .finally(() => {
        this.pending.delete(name);
      });

    this.pending.set(name, promise);
    return promise;
  }

  /** Load every asset in the manifest up front; resolves once all attempts finish. */
  async preload(names: string[]): Promise<void> {
    await Promise.all(names.map((n) => this.load(n)));
  }

  /**
   * Places a full clone of a loaded asset (hero placement — use sparingly,
   * a handful of times per asset, not for bulk scattering).
   */
  cloneAsset(
    name: string,
    position: Vector3,
    rotationY = 0,
    scale = 1,
    parent?: TransformNode,
  ): TransformNode | null {
    const asset = this.cache.get(name);
    if (!asset) {
      console.warn(`[AssetLoader] cloneAsset("${name}") called before it finished loading.`);
      return null;
    }

    const instanceRoot = new TransformNode(`${name}_${position.x}_${position.z}`, this.scene);
    instanceRoot.position = position.clone();
    instanceRoot.rotation.y = rotationY;
    instanceRoot.scaling.setAll(scale);
    if (parent) instanceRoot.parent = parent;

    asset.meshes.forEach((m) => {
      if (!(m instanceof Mesh)) return;
      const clone = m.clone(`${m.name}_clone`, instanceRoot, false, true);
      if (!clone) return;
      clone.isVisible = true;
      clone.setEnabled(true);
      clone.isPickable = false;
      clone.receiveShadows = true;
      // Preserve the clone's own local transform relative to the template mesh,
      // only re-parent it under our instance root.
      clone.parent = instanceRoot;
    });

    return instanceRoot;
  }

  /**
   * Scatters many cheap thin-instances of a loaded asset's meshes across the
   * given world-space transforms — one draw call per source mesh regardless
   * of instance count. Use for bulk ground-cover scattering (ferns, grass).
   */
  scatterThinInstances(
    name: string,
    transforms: Array<{ position: Vector3; rotationY?: number; scale?: number }>,
  ): void {
    const asset = this.cache.get(name);
    if (!asset) {
      console.warn(`[AssetLoader] scatterThinInstances("${name}") called before it finished loading.`);
      return;
    }

    const sourceMeshes = asset.meshes.filter((m): m is Mesh => m instanceof Mesh && m.getTotalVertices() > 0);
    if (sourceMeshes.length === 0) return;

    sourceMeshes.forEach((sourceMesh) => {
      // Make a single visible, enabled base mesh (the "instance 0") that all
      // thin instances render as copies of.
      const base = sourceMesh.clone(`${sourceMesh.name}_thinBase`, null, false, true);
      if (!base) return;
      base.isVisible = true;
      base.setEnabled(true);
      base.isPickable = false;
      base.receiveShadows = true;
      base.parent = null;
      base.position.copyFrom(sourceMesh.getAbsolutePosition());
      base.thinInstanceEnablePicking = false;

      const matrices: Matrix[] = transforms.map(({ position, rotationY = 0, scale = 1 }) => {
        const quat = Quaternion.RotationYawPitchRoll(rotationY, 0, 0);
        return Matrix.Compose(new Vector3(scale, scale, scale), quat, position);
      });

      base.thinInstanceSetBuffer(
        'matrix',
        floatArrayFromMatrices(matrices),
        16,
        true,
      );
    });
  }

  dispose(): void {
    this.cache.forEach((asset) => asset.root.dispose(false, true));
    this.cache.clear();
  }
}

function splitPath(relPath: string): [string, string] {
  const idx = relPath.lastIndexOf('/');
  return [relPath.slice(0, idx), relPath.slice(idx + 1)];
}

function floatArrayFromMatrices(matrices: Matrix[]): Float32Array {
  const out = new Float32Array(matrices.length * 16);
  matrices.forEach((m, i) => out.set(m.asArray(), i * 16));
  return out;
}
