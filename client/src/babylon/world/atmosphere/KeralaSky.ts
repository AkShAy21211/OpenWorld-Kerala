/**
 * KeralaSky.ts — Realistic Blue & White Mixed Sky with Drifting Cumulus Clouds
 * Features:
 * - High-resolution atmospheric sky dome with realistic blue-to-white gradient
 * - Multi-layered procedural fluffy white cumulus and cirrus cloud formations
 * - Real-time cloud drift animation across the sky dome
 * - Radiant sun disc with soft solar glow
 * - Festive daytime confetti and firework particle bursts (വെടിക്കെട്ട്)
 */

import {
  Scene,
  MeshBuilder,
  Vector3,
  Color3,
  Color4,
  ParticleSystem,
  TransformNode,
  Mesh,
  StandardMaterial,
  DynamicTexture,
} from '@babylonjs/core';

export class KeralaSky {
  public skyDome: Mesh;
  private skyMat: StandardMaterial;
  private skyTex: DynamicTexture;
  private cloudLayer: Mesh;
  private cloudTex: DynamicTexture;
  private fireworkSystem: ParticleSystem | null = null;
  private nextBurstTime: number = 4.0;

  constructor(scene: Scene) {
    // ── 1. Create Giant Sky Dome (900m diameter hemisphere) ─────────────────
    this.skyDome = MeshBuilder.CreateSphere('keralaSkyDome', {
      diameter: 950,
      segments: 32,
      slice: 0.55, // Hemisphere covering the full upper sky to horizon
      sideOrientation: Mesh.BACKSIDE,
    }, scene);
    this.skyDome.position = new Vector3(0, -30, 0);

    this.skyMat = new StandardMaterial('keralaSkyMat', scene);
    this.skyMat.backFaceCulling = false;
    this.skyMat.disableLighting = true;

    // ── 2. High-Res Procedural Blue Sky & Cloud Texture (2048x1024) ─────────
    const texW = 2048;
    const texH = 1024;
    this.skyTex = new DynamicTexture('skyCanvasTex', { width: texW, height: texH }, scene, false);
    this.drawBlueAndWhiteSky(this.skyTex, texW, texH);

    this.skyMat.diffuseTexture = this.skyTex;
    this.skyMat.emissiveTexture = this.skyTex; // Self-illuminated daylight
    this.skyDome.material = this.skyMat;

    // ── 3. Secondary Drifting Cloud Layer (3D Depth & Motion) ───────────────
    this.cloudLayer = MeshBuilder.CreateDisc('driftingCloudDome', {
      radius: 420,
      tessellation: 32,
      sideOrientation: Mesh.DOUBLESIDE,
    }, scene);
    this.cloudLayer.rotation.x = Math.PI / 2;
    this.cloudLayer.position = new Vector3(0, 180, 0);

    const cloudMat = new StandardMaterial('driftingCloudMat', scene);
    cloudMat.disableLighting = true;
    cloudMat.backFaceCulling = false;

    this.cloudTex = new DynamicTexture('cloudLayerTex', { width: 1024, height: 1024 }, scene, false);
    this.drawCloudLayer(this.cloudTex, 1024, 1024);

    cloudMat.diffuseTexture = this.cloudTex;
    cloudMat.opacityTexture = this.cloudTex;
    cloudMat.alpha = 0.85;
    this.cloudLayer.material = cloudMat;

    // ── 4. Festival Fireworks / Daytime Festive Sparkles (Vedikkettu) ───────
    this.setupFireworks(scene);

    // ── 5. Real-Time Cloud Drift & Sky Animation Loop ───────────────────────
    let time = 0;
    scene.onBeforeRenderObservable.add(() => {
      const dt = scene.getEngine().getDeltaTime() / 1000;
      time += dt;

      // Slowly rotate the upper cloud layer to simulate wind drift (~0.003 rad/s)
      this.cloudLayer.rotation.y += 0.0025 * dt;

      // Slow pan of the main sky dome
      this.skyDome.rotation.y += 0.0008 * dt;

      // Trigger periodic festive sparkles/fireworks
      if (time >= this.nextBurstTime) {
        this.triggerFireworkBurst(scene);
        this.nextBurstTime = time + 4.0 + Math.random() * 5.0;
      }
    });
  }

  /**
   * Renders a realistic deep blue sky gradient populated with soft white cumulus clouds
   */
  private drawBlueAndWhiteSky(dynTex: DynamicTexture, w: number, h: number) {
    const ctx = dynTex.getContext();

    // ── A. Realistic Blue Sky Gradient ──────────────────────────────────────
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0.0, '#0284C7'); // Deep vivid azure blue at zenith
    skyGrad.addColorStop(0.25, '#0EA5E9'); // Radiant sky blue
    skyGrad.addColorStop(0.55, '#38BDF8'); // Clear tropical blue
    skyGrad.addColorStop(0.80, '#7DD3FC'); // Bright soft blue
    skyGrad.addColorStop(0.92, '#BAE6FD'); // Pale horizon blue
    skyGrad.addColorStop(1.0, '#F0F9FF'); // Soft crisp white horizon mist
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // ── B. Radiant Sun Glow ──────────────────────────────────────────────────
    const sunX = w * 0.72;
    const sunY = h * 0.32;
    const sunRadius = 90;

    const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, sunRadius * 2.5);
    sunGrad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    sunGrad.addColorStop(0.2, 'rgba(255, 250, 220, 0.9)');
    sunGrad.addColorStop(0.5, 'rgba(254, 240, 138, 0.4)');
    sunGrad.addColorStop(0.8, 'rgba(125, 211, 252, 0.15)');
    sunGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // ── C. Paint Natural Fluffy White Cumulus Cloud Formations ──────────────
    // We generate 32 organic puffy cloud clusters across the sky
    const numClouds = 36;
    for (let c = 0; c < numClouds; c++) {
      const cx = (c / numClouds) * w + (Math.random() - 0.5) * 120;
      // Distribute from upper-mid sky down towards horizon
      const cy = h * 0.22 + Math.random() * (h * 0.55);
      const cloudScale = 50 + Math.random() * 85;

      this.paintCumulusCloud(ctx, cx, cy, cloudScale);
    }

    // ── D. Wispy High-Altitude Cirrus Feathers ────────────────────────────────
    for (let ci = 0; ci < 16; ci++) {
      const sx = Math.random() * w;
      const sy = h * 0.1 + Math.random() * (h * 0.25);
      const len = 120 + Math.random() * 200;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate((Math.random() - 0.5) * 0.25);

      const cirrusGrad = ctx.createLinearGradient(0, 0, len, 0);
      cirrusGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
      cirrusGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.45)');
      cirrusGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.35)');
      cirrusGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
      ctx.fillStyle = cirrusGrad;

      ctx.beginPath();
      ctx.scale(1, 0.2);
      ctx.arc(len / 2, 0, len / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    dynTex.update();
  }

  /**
   * Helper to draw a soft organic cumulus cloud puff cluster
   */
  private paintCumulusCloud(ctx: any, x: number, y: number, size: number) {
    const puffs = 7 + Math.floor(Math.random() * 6);

    ctx.save();
    // 1. Soft shaded underside for 3D depth
    for (let p = 0; p < puffs; p++) {
      const px = x + (p - puffs / 2) * (size * 0.35) + (Math.random() - 0.5) * 20;
      const py = y + size * 0.18 + (Math.random() - 0.5) * 10;
      const r = size * (0.35 + Math.random() * 0.25);

      const shadeGrad = ctx.createRadialGradient(px, py, r * 0.2, px, py, r);
      shadeGrad.addColorStop(0.0, 'rgba(224, 242, 254, 0.6)');
      shadeGrad.addColorStop(0.8, 'rgba(186, 230, 253, 0.3)');
      shadeGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
      ctx.fillStyle = shadeGrad;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Bright white cloud core & puffy tops
    for (let p = 0; p < puffs; p++) {
      const px = x + (p - puffs / 2) * (size * 0.32) + (Math.random() - 0.5) * 15;
      const py = y + (Math.random() - 0.5) * (size * 0.25);
      const r = size * (0.38 + Math.random() * 0.3);

      const whiteGrad = ctx.createRadialGradient(px, py - r * 0.2, r * 0.1, px, py, r);
      whiteGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.96)');
      whiteGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0.85)');
      whiteGrad.addColorStop(0.88, 'rgba(240, 249, 255, 0.45)');
      whiteGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
      ctx.fillStyle = whiteGrad;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Generates the secondary drifting cloud overlay texture
   */
  private drawCloudLayer(dynTex: DynamicTexture, w: number, h: number) {
    const ctx = dynTex.getContext();
    ctx.clearRect(0, 0, w, h);

    // Scattered soft white cloud patches on transparent background
    for (let i = 0; i < 24; i++) {
      const cx = Math.random() * w;
      const cy = Math.random() * h;
      const scale = 60 + Math.random() * 100;
      this.paintCumulusCloud(ctx, cx, cy, scale);
    }
    dynTex.update();
  }

  private setupFireworks(scene: Scene) {
    const burstEmitter = MeshBuilder.CreateBox('fireworkEmitter', { size: 0.05 }, scene);
    burstEmitter.isVisible = false;
    burstEmitter.position = new Vector3(0, 50, 0);

    const ps = new ParticleSystem('vedikkettu', 500, scene);
    ps.emitter = burstEmitter;
    ps.minEmitBox = new Vector3(-0.5, -0.5, -0.5);
    ps.maxEmitBox = new Vector3(0.5, 0.5, 0.5);

    ps.minSize = 0.35;
    ps.maxSize = 0.8;
    ps.minLifeTime = 1.0;
    ps.maxLifeTime = 2.0;
    ps.emitRate = 0;
    ps.gravity = new Vector3(0, -6.0, 0);
    ps.direction1 = new Vector3(-1, -1, -1);
    ps.direction2 = new Vector3(1, 1, 1);
    ps.minEmitPower = 8;
    ps.maxEmitPower = 20;
    ps.updateSpeed = 0.015;
    ps.blendMode = ParticleSystem.BLENDMODE_ADD;

    this.fireworkSystem = ps;
  }

  public triggerFireworkBurst(scene: Scene) {
    if (!this.fireworkSystem) return;

    const x = (Math.random() - 0.5) * 120;
    const y = 45 + Math.random() * 25;
    const z = (Math.random() - 0.5) * 120;

    (this.fireworkSystem.emitter as Mesh).position.set(x, y, z);

    const burstColors = [
      new Color4(1.0, 0.2, 0.2, 1.0),
      new Color4(1.0, 0.85, 0.0, 1.0),
      new Color4(0.2, 0.8, 1.0, 1.0),
      new Color4(0.3, 1.0, 0.4, 1.0),
      new Color4(1.0, 0.4, 0.9, 1.0),
    ];

    this.fireworkSystem.color1 = burstColors[Math.floor(Math.random() * burstColors.length)];
    this.fireworkSystem.color2 = burstColors[Math.floor(Math.random() * burstColors.length)];
    this.fireworkSystem.colorDead = new Color4(0.1, 0.05, 0.0, 0.0);

    this.fireworkSystem.manualEmitCount = 200 + Math.floor(Math.random() * 150);
    this.fireworkSystem.start();
  }
}
