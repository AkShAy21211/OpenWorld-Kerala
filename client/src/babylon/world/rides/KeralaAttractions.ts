import {
  Scene,
  TransformNode,
  MeshBuilder,
  PBRMaterial,
  Color3,
  Vector3,
  Mesh,
  StandardMaterial,
  PointLight,
} from '@babylonjs/core';
import { PhysicsManager } from '../../physics/PhysicsManager';

export class FestivalElephant {
  public root: TransformNode;
  private time: number = 0;
  private body: Mesh;
  private trunk: Mesh;
  private seats: TransformNode[] = [];

  constructor(scene: Scene, position: Vector3, shadowCast?: (m: Mesh) => void) {
    this.root = new TransformNode('festival-elephant-root', scene);
    this.root.position = position;

    // Materials
    const bodyMat = new PBRMaterial('elephant-body-mat', scene);
    bodyMat.albedoColor = Color3.FromHexString('#888888');
    bodyMat.roughness = 0.8;
    bodyMat.metallic = 0.1;

    const headMat = new PBRMaterial('elephant-head-mat', scene);
    headMat.albedoColor = Color3.FromHexString('#6a6a6a');
    headMat.roughness = 0.8;
    headMat.metallic = 0.1;

    const legMat = new PBRMaterial('elephant-leg-mat', scene);
    legMat.albedoColor = Color3.FromHexString('#666666');
    legMat.roughness = 0.8;
    legMat.metallic = 0.1;

    const tuskMat = new PBRMaterial('elephant-tusk-mat', scene);
    tuskMat.albedoColor = Color3.FromHexString('#EEEEEE');
    tuskMat.roughness = 0.4;
    tuskMat.metallic = 0.05;

    const goldMat = new PBRMaterial('elephant-gold-mat', scene);
    goldMat.albedoColor = Color3.FromHexString('#FFD700');
    goldMat.roughness = 0.2;
    goldMat.metallic = 0.8;

    const clothMat = new PBRMaterial('elephant-cloth-mat', scene);
    clothMat.albedoColor = Color3.FromHexString('#CC0000');
    clothMat.roughness = 0.9;
    clothMat.metallic = 0.0;

    // Body container for animation
    this.body = MeshBuilder.CreateSphere('elephant-body', { segments: 16, diameter: 3 }, scene);
    this.body.parent = this.root;
    this.body.position = new Vector3(0, 2, 0);
    this.body.scaling = new Vector3(1.3, 1, 0.9);
    this.body.material = bodyMat;
    if (shadowCast) shadowCast(this.body);

    // Head
    const head = MeshBuilder.CreateSphere('elephant-head', { segments: 16, diameter: 2.2 }, scene);
    head.parent = this.body;
    head.position = new Vector3(1.5, 0.5, 0);
    // Inverse scale for correct aspect
    head.scaling = new Vector3(1/1.3, 1, 1/0.9);
    head.material = headMat;
    if (shadowCast) shadowCast(head);

    // Trunk
    this.trunk = MeshBuilder.CreateCylinder('elephant-trunk', { height: 2, diameterTop: 0.6, diameterBottom: 0.2 }, scene);
    this.trunk.parent = head;
    this.trunk.position = new Vector3(0.8, -0.5, 0);
    this.trunk.rotation.z = Math.PI / 8; // Tilted slightly outward/downward
    this.trunk.material = headMat;
    if (shadowCast) shadowCast(this.trunk);

    // Legs
    const legPositions = [
      new Vector3(-0.8, -1.2, 0.6), // back left
      new Vector3(-0.8, -1.2, -0.6), // back right
      new Vector3(0.8, -1.2, 0.6), // front left
      new Vector3(0.8, -1.2, -0.6), // front right
    ];

    legPositions.forEach((pos, i) => {
      const leg = MeshBuilder.CreateCylinder(`elephant-leg-${i}`, { height: 1.6, diameter: 0.8 }, scene);
      leg.parent = this.body;
      leg.position = pos;
      leg.scaling = new Vector3(1/1.3, 1, 1/0.9);
      leg.material = legMat;
      if (shadowCast) shadowCast(leg);
    });

    // Tusks
    const tuskPositions = [
      new Vector3(0.8, -0.2, 0.5), // left
      new Vector3(0.8, -0.2, -0.5), // right
    ];

    tuskPositions.forEach((pos, i) => {
      const tusk = MeshBuilder.CreateCylinder(`elephant-tusk-${i}`, { height: 1.2, diameterTop: 0.15, diameterBottom: 0.05 }, scene);
      tusk.parent = head;
      tusk.position = pos;
      tusk.rotation.z = Math.PI / 4;
      tusk.rotation.x = i === 0 ? -Math.PI / 8 : Math.PI / 8;
      tusk.material = tuskMat;
      if (shadowCast) shadowCast(tusk);
    });

    // Ears
    const earPositions = [
      new Vector3(0, 0.2, 1.1), // left
      new Vector3(0, 0.2, -1.1), // right
    ];

    earPositions.forEach((pos, i) => {
      const ear = MeshBuilder.CreateSphere(`elephant-ear-${i}`, { diameterX: 1.5, diameterY: 2, diameterZ: 0.2 }, scene);
      ear.parent = head;
      ear.position = pos;
      // Angle ears outward
      ear.rotation.y = i === 0 ? -Math.PI / 6 : Math.PI / 6;
      ear.material = headMat;
      if (shadowCast) shadowCast(ear);
    });

    // Tail
    const tail = MeshBuilder.CreateCylinder('elephant-tail', { height: 1.5, diameter: 0.1 }, scene);
    tail.parent = this.body;
    tail.position = new Vector3(-1.4, -0.2, 0);
    tail.rotation.z = -Math.PI / 6;
    tail.scaling = new Vector3(1/1.3, 1, 1/0.9);
    tail.material = bodyMat;
    if (shadowCast) shadowCast(tail);

    // Gold Nettipattom headpiece
    const nettipattom = MeshBuilder.CreateBox('elephant-nettipattom', { width: 0.8, height: 1.8, depth: 0.1 }, scene);
    nettipattom.parent = head;
    nettipattom.position = new Vector3(1.1, 0.2, 0);
    nettipattom.rotation.z = -Math.PI / 6;
    nettipattom.material = goldMat;
    if (shadowCast) shadowCast(nettipattom);

    // Muthukkuda ceremonial umbrella
    const umbrellaPole = MeshBuilder.CreateCylinder('elephant-umbrella-pole', { height: 2, diameter: 0.1 }, scene);
    umbrellaPole.parent = this.body;
    umbrellaPole.position = new Vector3(0, 1.5, 0);
    umbrellaPole.scaling = new Vector3(1/1.3, 1, 1/0.9);
    umbrellaPole.material = goldMat;
    if (shadowCast) shadowCast(umbrellaPole);

    const umbrellaTop = MeshBuilder.CreateSphere('elephant-umbrella-top', { diameter: 2, slice: 0.5 }, scene);
    umbrellaTop.parent = umbrellaPole;
    umbrellaTop.position = new Vector3(0, 1, 0);
    umbrellaTop.rotation.x = Math.PI; // flip hemisphere
    umbrellaTop.material = goldMat;
    if (shadowCast) shadowCast(umbrellaTop);

    // Kerala festival cloth
    const cloth = MeshBuilder.CreateBox('elephant-cloth', { width: 2, height: 0.2, depth: 2.8 }, scene);
    cloth.parent = this.body;
    cloth.position = new Vector3(0, 1.4, 0);
    cloth.scaling = new Vector3(1/1.3, 1, 1/0.9);
    cloth.material = clothMat;
    if (shadowCast) shadowCast(cloth);

    // Royal howdah saddle seat mount for player riding
    const howdahSeat = new TransformNode('elephantHowdahSeat', scene);
    howdahSeat.position = new Vector3(0, 1.6, 0);
    howdahSeat.parent = this.body;
    this.seats.push(howdahSeat);

    // Animation loop
    scene.onBeforeRenderObservable.add(() => {
      this.time += scene.getEngine().getDeltaTime() / 1000;
      this.body.rotation.z = Math.sin(this.time * 1.5) * 0.03;
      this.trunk.rotation.x = Math.sin(this.time * 2.0) * 0.1;
    });

    // Physics
    if (scene.isPhysicsEnabled()) {
      PhysicsManager.addStaticBoxCollider(this.body, scene, new Vector3(4, 4, 2));
    }
  }

  public getSeats(): TransformNode[] {
    return this.seats;
  }
}

export class Thattukada {
  public root: TransformNode;

  constructor(scene: Scene, position: Vector3, shadowCast?: (m: Mesh) => void) {
    this.root = new TransformNode('thattukada-root', scene);
    this.root.position = position;

    // Materials
    const woodMat = new PBRMaterial('thattukada-wood-mat', scene);
    woodMat.albedoColor = Color3.FromHexString('#8b5a2b');
    woodMat.roughness = 0.9;
    woodMat.metallic = 0.05;

    const backWallMat = new PBRMaterial('thattukada-backwall-mat', scene);
    backWallMat.albedoColor = Color3.FromHexString('#a0522d');
    backWallMat.roughness = 0.9;
    backWallMat.metallic = 0.05;

    const roofMat = new PBRMaterial('thattukada-roof-mat', scene);
    roofMat.albedoColor = Color3.FromHexString('#A0A0A0');
    roofMat.roughness = 0.6;
    roofMat.metallic = 0.8;

    const glassMat = new PBRMaterial('thattukada-glass-mat', scene);
    glassMat.albedoColor = Color3.FromHexString('#E0FFFF');
    glassMat.alpha = 0.3;
    glassMat.roughness = 0.1;
    glassMat.metallic = 0.2;

    const brassMat = new PBRMaterial('thattukada-brass-mat', scene);
    brassMat.albedoColor = Color3.FromHexString('#B5A642');
    brassMat.roughness = 0.3;
    brassMat.metallic = 0.9;

    const cupMat = new PBRMaterial('thattukada-cup-mat', scene);
    cupMat.albedoColor = Color3.FromHexString('#DDDDDD');
    cupMat.roughness = 0.7;
    cupMat.metallic = 0.0;

    const signMat = new PBRMaterial('thattukada-sign-mat', scene);
    signMat.albedoColor = Color3.FromHexString('#FFD700'); // Yellowish sign
    signMat.roughness = 0.8;
    signMat.metallic = 0.1;

    // Wooden counter
    const counter = MeshBuilder.CreateBox('thattukada-counter', { width: 3, height: 1, depth: 1 }, scene);
    counter.parent = this.root;
    counter.position = new Vector3(0, 0.5, 0.5);
    counter.material = woodMat;
    if (shadowCast) shadowCast(counter);

    // Back wall
    const backWall = MeshBuilder.CreateBox('thattukada-backwall', { width: 3, height: 2, depth: 0.1 }, scene);
    backWall.parent = this.root;
    backWall.position = new Vector3(0, 1, -0.45);
    backWall.material = backWallMat;
    if (shadowCast) shadowCast(backWall);

    // Tin roof
    const roof = MeshBuilder.CreateBox('thattukada-roof', { width: 3.2, height: 0.05, depth: 1.8 }, scene);
    roof.parent = this.root;
    roof.position = new Vector3(0, 2.1, 0.2);
    roof.rotation.x = Math.PI / 16; // slightly angled
    roof.material = roofMat;
    if (shadowCast) shadowCast(roof);

    // Glass snack cabinet
    const cabinet = MeshBuilder.CreateBox('thattukada-cabinet', { width: 0.8, height: 0.6, depth: 0.5 }, scene);
    cabinet.parent = counter;
    cabinet.position = new Vector3(0.8, 0.8, 0);
    cabinet.material = glassMat;
    // Don't cast shadows for transparent glass if it causes issues, but can leave it
    if (shadowCast) shadowCast(cabinet);

    // Brass samovar
    const samovar = MeshBuilder.CreateCylinder('thattukada-samovar', { height: 0.5, diameter: 0.4 }, scene);
    samovar.parent = counter;
    samovar.position = new Vector3(-0.8, 0.75, 0);
    samovar.material = brassMat;
    if (shadowCast) shadowCast(samovar);

    // Stacked cups
    const cupPos = new Vector3(-0.4, 0.55, 0.2);
    for (let i = 0; i < 3; i++) {
      const cup = MeshBuilder.CreateCylinder(`thattukada-cup-${i}`, { height: 0.1, diameter: 0.08 }, scene);
      cup.parent = counter;
      cup.position = new Vector3(cupPos.x, cupPos.y + (i * 0.1), cupPos.z);
      cup.material = cupMat;
      if (shadowCast) shadowCast(cup);
    }

    // Hanging signboard
    const signboard = MeshBuilder.CreatePlane('thattukada-signboard', { width: 1.5, height: 0.5 }, scene);
    signboard.parent = this.root;
    signboard.position = new Vector3(0, 1.8, 0.8);
    // Double-sided material could be configured, but for simplicity:
    signboard.material = signMat;
    if (shadowCast) shadowCast(signboard);

    // Warm point light inside
    const light = new PointLight('thattukada-light', new Vector3(0, 1.5, 0.2), scene);
    light.parent = this.root;
    light.diffuse = Color3.FromHexString('#FFE4B5');
    light.intensity = 0.4;
    light.range = 8;

    // Physics
    if (scene.isPhysicsEnabled()) {
      PhysicsManager.addStaticBoxCollider(counter, scene, new Vector3(3, 1, 1));
      PhysicsManager.addStaticBoxCollider(backWall, scene, new Vector3(3, 2, 0.1));
    }
  }
}
