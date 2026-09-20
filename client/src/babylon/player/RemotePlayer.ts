/**
 * RemotePlayer.ts — Network-synced 3D avatar for other players
 * - Same low-poly character mesh as LocalPlayer
 * - Lerp-smoothed position & rotation updates from Socket.IO
 * - Floating name label via DynamicTexture on a plane
 * - Emote particle burst
 */

import {
  Scene,
  TransformNode,
  MeshBuilder,
  PBRMaterial,
  Color3,
  Vector3,
  Scalar,
  Mesh,
  DynamicTexture,
  ParticleSystem,
  Texture,
} from '@babylonjs/core';
import { PlayerState, EquippedCosmetics } from 'fair-shared';

export class RemotePlayer {
  private root: TransformNode;
  private scene: Scene;

  private targetPos: Vector3;
  private targetRotY: number = 0;

  private animState: 'idle' | 'walk' = 'idle';
  private walkPhase = 0;

  constructor(scene: Scene, state: PlayerState) {
    this.scene = scene;
    this.root = new TransformNode(`remote_${state.userId}`, scene);
    this.root.position = new Vector3(state.x, state.y, state.z);
    this.targetPos = this.root.position.clone();

    this.buildCharacter(state.avatarColor);
    this.buildNameLabel(state.displayName, state.avatarColor);
    this.applyCosmetics(state.equipped);

    scene.onBeforeRenderObservable.add(() => this.lerp());
  }

  private buildCharacter(avatarColor: string) {
    const bodyMat = new PBRMaterial(`rp_body_${Math.random()}`, this.scene);
    bodyMat.albedoColor = Color3.FromHexString(avatarColor);
    bodyMat.roughness = 0.7;
    bodyMat.metallic = 0;

    const skinMat = new PBRMaterial(`rp_skin_${Math.random()}`, this.scene);
    skinMat.albedoColor = new Color3(0.85, 0.7, 0.55);
    skinMat.roughness = 0.75;
    skinMat.metallic = 0;

    // Torso
    const torso = MeshBuilder.CreateBox(`rp_torso`, { width: 0.6, height: 0.85, depth: 0.35 }, this.scene);
    torso.position = new Vector3(0, 1.5, 0);
    torso.material = bodyMat;
    torso.parent = this.root;

    const head = MeshBuilder.CreateSphere(`rp_head`, { diameter: 0.55, segments: 8 }, this.scene);
    head.position = new Vector3(0, 2.2, 0);
    head.material = skinMat;
    head.parent = this.root;

    [[0.45, 1.45], [-0.45, 1.45]].forEach(([x, y], i) => {
      const arm = MeshBuilder.CreateCylinder(`rp_arm${i}`, { height: 0.7, diameter: 0.2, tessellation: 6 }, this.scene);
      arm.position = new Vector3(x, y, 0);
      arm.material = bodyMat;
      arm.parent = this.root;
    });

    [[0.18, 0.75], [-0.18, 0.75]].forEach(([x, y], i) => {
      const leg = MeshBuilder.CreateCylinder(`rp_leg${i}`, { height: 0.85, diameter: 0.22, tessellation: 6 }, this.scene);
      leg.position = new Vector3(x, y, 0);
      leg.material = bodyMat;
      leg.parent = this.root;
    });
  }

  /** Floating name plate above player */
  private buildNameLabel(displayName: string, avatarColor: string) {
    const texW = 256, texH = 64;

    // Create an offscreen canvas for drawing — avoids Babylon ICanvasRenderingContext limitations
    const offCanvas = document.createElement('canvas');
    offCanvas.width = texW;
    offCanvas.height = texH;
    const ctx = offCanvas.getContext('2d')!;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.60)';
    ctx.fillRect(4, 4, texW - 8, texH - 8);

    // Avatar colour dot
    ctx.fillStyle = avatarColor;
    ctx.beginPath();
    ctx.arc(22, texH / 2, 8, 0, Math.PI * 2);
    ctx.fill();

    // Name text
    ctx.fillStyle = '#FAFAFA';
    ctx.font = 'bold 20px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayName.substring(0, 16), 38, texH / 2);

    // Bake to DynamicTexture
    const nameTex = new DynamicTexture(`label_${displayName}`, { width: texW, height: texH }, this.scene, false);
    const babylonCtx = nameTex.getContext();
    babylonCtx.drawImage(offCanvas, 0, 0);
    nameTex.update();

    const labelMat = new PBRMaterial(`labelMat_${displayName}`, this.scene);
    labelMat.albedoTexture = nameTex;
    labelMat.roughness = 1;
    labelMat.metallic = 0;
    labelMat.transparencyMode = PBRMaterial.MATERIAL_ALPHABLEND;
    labelMat.useAlphaFromAlbedoTexture = true;
    labelMat.backFaceCulling = false;

    const label = MeshBuilder.CreatePlane(`rp_label`, { width: 2.2, height: 0.55 }, this.scene);
    label.position = new Vector3(0, 2.9, 0);
    label.billboardMode = Mesh.BILLBOARDMODE_Y;
    label.material = labelMat;
    label.parent = this.root;
  }

  private applyCosmetics(equipped: EquippedCosmetics) {
    if (equipped.outfit) {
      const mat = new PBRMaterial('rp_outfit', this.scene);
      mat.albedoColor = new Color3(0.98, 0.96, 0.88);
      mat.roughness = 0.65;
      const mundu = MeshBuilder.CreateBox('rp_mundu', { width: 0.65, height: 0.75, depth: 0.38 }, this.scene);
      mundu.position = new Vector3(0, 1.12, 0);
      mundu.material = mat;
      mundu.parent = this.root;
    }

    if (equipped.instrument) {
      const mat = new PBRMaterial('rp_drum', this.scene);
      mat.albedoColor = new Color3(0.55, 0.3, 0.1);
      mat.roughness = 0.8;
      const drum = MeshBuilder.CreateCylinder('rp_drumMesh', { height: 0.45, diameter: 0.3, tessellation: 10 }, this.scene);
      drum.rotation.z = Math.PI / 2;
      drum.position = new Vector3(0.7, 1.55, 0);
      drum.material = mat;
      drum.parent = this.root;
    }

    if (equipped.headwear) {
      const mat = new PBRMaterial('rp_crown', this.scene);
      mat.albedoColor = new Color3(1, 0.55, 0.05);
      mat.roughness = 0.85;
      const crown = MeshBuilder.CreateTorus('rp_crownMesh', { diameter: 0.6, thickness: 0.12, tessellation: 12 }, this.scene);
      crown.position = new Vector3(0, 2.52, 0);
      crown.material = mat;
      crown.parent = this.root;
    }
  }

  /** Call when a new socket position update arrives */
  updateFromServer(state: Partial<PlayerState>) {
    if (state.x !== undefined) {
      this.targetPos = new Vector3(state.x, state.y ?? 0, state.z ?? 0);
    }
    if (state.rotY !== undefined) this.targetRotY = state.rotY;
    if (state.animState) this.animState = state.animState;
  }

  /** Lerp towards target position each frame */
  private lerp() {
    const dt = this.scene.getEngine().getDeltaTime() / 1000;
    this.root.position = Vector3.Lerp(this.root.position, this.targetPos, 0.15);
    this.root.rotation.y = Scalar.Lerp(this.root.rotation.y, this.targetRotY, 0.15);

    // Walk bob
    if (this.animState === 'walk') {
      this.walkPhase += dt * 8;
      this.root.position.y = Math.abs(Math.sin(this.walkPhase)) * 0.07;
    }
  }

  /** Show emote burst (pops up from player) */
  showEmote(emote: string) {
    const emojiMap: Record<string, string> = {
      wave: '👋', clap: '👏', sparkle: '✨', namaste: '🙏',
    };
    const emoji = emojiMap[emote] ?? emote;
    // Use a text plane bubble
    const texW = 128, texH = 64;
    const tex = new DynamicTexture('emoteTex', { width: texW, height: texH }, this.scene, false);
    const ctx = tex.getContext();
    ctx.font = '40px serif';
    ctx.fillText(emoji, 35, 52);
    tex.update();

    const mat = new PBRMaterial('emoteMat', this.scene);
    mat.albedoTexture = tex;
    mat.roughness = 1;
    mat.metallic = 0;
    mat.transparencyMode = PBRMaterial.MATERIAL_ALPHABLEND;
    mat.useAlphaFromAlbedoTexture = true;

    const plane = MeshBuilder.CreatePlane('emotePlane', { width: 1.2, height: 0.6 }, this.scene);
    plane.position = this.root.position.add(new Vector3(0, 3.5, 0));
    plane.billboardMode = Mesh.BILLBOARDMODE_Y;
    plane.material = mat;

    // Auto-remove after 2 s
    setTimeout(() => {
      plane.dispose();
      tex.dispose();
    }, 2000);
  }

  dispose() {
    this.root.dispose();
  }
}
