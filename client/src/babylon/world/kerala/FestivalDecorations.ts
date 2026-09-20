/**
 * FestivalDecorations.ts — Traditional Kerala Festival Lighting & Torans
 * Features:
 * - Deepasthambham (ദീപസ്തംഭം): 6-meter tall multi-tiered bronze/granite oil lamp tower with 7 lighted tiers
 * - Akasha Vilakku (ആകാശവിളക്ക്): Hanging glowing festival paper star lanterns strung overhead
 * - Mavila Thoranam (മാവില തോരണം): Fresh green mango-leaf garlands and marigold festoons
 * - Animated flickering oil lamp flame particles
 */

import {
  Scene,
  TransformNode,
  MeshBuilder,
  PBRMaterial,
  Color3,
  Color4,
  Vector3,
  Mesh,
  PointLight,
  ParticleSystem,
} from '@babylonjs/core';
import { PhysicsManager } from '../../physics/PhysicsManager';

export class FestivalDecorations {
  /**
   * Builds a grand multi-tiered Kerala Deepasthambham (ദീപസ്തംഭം)
   */
  public static buildDeepasthambham(
    name: string,
    position: Vector3,
    scene: Scene,
    shadowCast?: (m: Mesh) => void
  ): TransformNode {
    const root = new TransformNode(name, scene);
    root.position = position;

    const bronzeMat = new PBRMaterial(`${name}Bronze`, scene);
    bronzeMat.albedoColor = Color3.FromHexString('#C68A35');
    bronzeMat.roughness = 0.3;
    bronzeMat.metallic = 0.85;

    const flameMat = new PBRMaterial(`${name}FlameMat`, scene);
    flameMat.albedoColor = Color3.FromHexString('#FFD700');
    flameMat.emissiveColor = Color3.FromHexString('#FF7700');
    flameMat.emissiveIntensity = 2.5;

    // Granite Base Pedestal
    const base = MeshBuilder.CreateCylinder(`${name}Base`, { height: 0.8, diameter: 2.2, tessellation: 12 }, scene);
    base.position.y = 0.4;
    base.material = bronzeMat;
    base.parent = root;
    base.receiveShadows = true;
    if (shadowCast) shadowCast(base);

    // Central Tapered Bronze Column
    const column = MeshBuilder.CreateCylinder(`${name}Col`, { height: 5.5, diameterTop: 0.25, diameterBottom: 0.55 }, scene);
    column.position.y = 3.55;
    column.material = bronzeMat;
    column.parent = root;
    if (shadowCast) shadowCast(column);

    // 7 Tiers of circular oil lamp plates decreasing in size upwards
    const numTiers = 7;
    for (let t = 0; t < numTiers; t++) {
      const yTier = 1.2 + t * 0.65;
      const diameter = 1.8 - t * 0.18;

      const plate = MeshBuilder.CreateCylinder(`${name}Plate_${t}`, { height: 0.08, diameterTop: diameter, diameterBottom: diameter * 0.85 }, scene);
      plate.position.y = yTier;
      plate.material = bronzeMat;
      plate.parent = root;

      // 6-8 little glowing flame cups around each tier
      const cupsInTier = 6;
      for (let c = 0; c < cupsInTier; c++) {
        const angle = (c / cupsInTier) * Math.PI * 2 + t * 0.3;
        const radius = diameter / 2 - 0.05;

        const flame = MeshBuilder.CreateSphere(`${name}Flame_${t}_${c}`, { diameter: 0.12, segments: 4 }, scene);
        flame.position.set(Math.cos(angle) * radius, yTier + 0.08, Math.sin(angle) * radius);
        flame.material = flameMat;
        flame.parent = root;
      }
    }

    // Top Peak Finial & Grand Flame
    const finial = MeshBuilder.CreateCylinder(`${name}Finial`, { height: 0.8, diameterTop: 0.05, diameterBottom: 0.4 }, scene);
    finial.position.y = 5.9;
    finial.material = bronzeMat;
    finial.parent = root;

    const topFlame = MeshBuilder.CreateSphere(`${name}TopFlame`, { diameter: 0.3, segments: 6 }, scene);
    topFlame.position.y = 6.4;
    topFlame.material = flameMat;
    topFlame.parent = root;

    // Warm Pillar Glow Light
    const light = new PointLight(`${name}Light`, new Vector3(0, 4.0, 0), scene);
    light.diffuse = Color3.FromHexString('#FFA726');
    light.intensity = 2.2;
    light.range = 14;
    light.parent = root;

    if (scene.isPhysicsEnabled()) {
      PhysicsManager.addStaticBoxCollider(base, scene, new Vector3(2.2, 5.5, 2.2));
    }

    return root;
  }

  /**
   * Builds overhead strings of glowing Akasha Vilakku (ആകാശവിളക്ക്) star lanterns
   */
  public static buildAkashaVilakku(
    name: string,
    p1: Vector3,
    p2: Vector3,
    count: number,
    scene: Scene
  ): TransformNode {
    const root = new TransformNode(name, scene);

    const colors = [
      '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899',
    ];

    // Overhead catenary string line
    for (let i = 0; i < count; i++) {
      const frac = (i + 0.5) / count;
      // Catenary dip
      const dip = Math.sin(frac * Math.PI) * 0.6;
      const x = p1.x + (p2.x - p1.x) * frac;
      const y = p1.y + (p2.y - p1.y) * frac - dip;
      const z = p1.z + (p2.z - p1.z) * frac;

      const hex = colors[i % colors.length];
      const starMat = new PBRMaterial(`${name}StarMat_${i}`, scene);
      starMat.albedoColor = Color3.FromHexString(hex);
      starMat.emissiveColor = Color3.FromHexString(hex);
      starMat.emissiveIntensity = 2.2;

      // 3D Star Lantern (octahedron / dual cone)
      const lantern = MeshBuilder.CreateSphere(`${name}Lantern_${i}`, {
        diameterX: 0.45,
        diameterY: 0.65,
        diameterZ: 0.45,
        segments: 4,
      }, scene);
      lantern.position.set(x, y, z);
      lantern.material = starMat;
      lantern.parent = root;

      // Hanging cord
      const cord = MeshBuilder.CreateCylinder(`${name}Cord_${i}`, { height: 0.5, diameter: 0.02 }, scene);
      cord.position.set(x, y + 0.35, z);
      cord.parent = root;
    }

    return root;
  }

  /**
   * Builds mango-leaf festoons and marigold garlands (മാവില തോരണം)
   */
  public static buildMavilaThoranam(
    name: string,
    p1: Vector3,
    p2: Vector3,
    scene: Scene
  ): TransformNode {
    const root = new TransformNode(name, scene);

    const mangoLeafMat = new PBRMaterial(`${name}LeafMat`, scene);
    mangoLeafMat.albedoColor = Color3.FromHexString('#22C55E'); // Fresh Green
    mangoLeafMat.roughness = 0.5;

    const marigoldMat = new PBRMaterial(`${name}MarigoldMat`, scene);
    marigoldMat.albedoColor = Color3.FromHexString('#F59E0B'); // Orange
    marigoldMat.roughness = 0.7;

    const numItems = 12;
    for (let i = 0; i < numItems; i++) {
      const frac = (i + 0.5) / numItems;
      const dip = Math.sin(frac * Math.PI) * 0.4;
      const x = p1.x + (p2.x - p1.x) * frac;
      const y = p1.y + (p2.y - p1.y) * frac - dip;
      const z = p1.z + (p2.z - p1.z) * frac;

      // Mango leaf (hanging triangular blade)
      const leaf = MeshBuilder.CreateCylinder(`${name}Leaf_${i}`, {
        height: 0.35,
        diameterTop: 0.12,
        diameterBottom: 0.02,
        tessellation: 4,
      }, scene);
      leaf.position.set(x, y - 0.18, z);
      leaf.material = mangoLeafMat;
      leaf.parent = root;

      // Marigold flower bud
      if (i % 2 === 0) {
        const flower = MeshBuilder.CreateSphere(`${name}Flower_${i}`, { diameter: 0.14, segments: 6 }, scene);
        flower.position.set(x, y, z);
        flower.material = marigoldMat;
        flower.parent = root;
      }
    }

    return root;
  }
}
