import {
  Scene,
  TransformNode,
  MeshBuilder,
  PBRMaterial,
  Color3,
  Vector3,
  Mesh,
  PointLight,
} from '@babylonjs/core';
import { PhysicsManager } from '../../physics/PhysicsManager';

export class Carousel {
  public root: TransformNode;
  private seats: TransformNode[] = [];

  constructor(scene: Scene, position: Vector3, shadowCast?: (m: Mesh) => void) {
    this.root = new TransformNode('CarouselRoot', scene);
    this.root.position = position;

    // Materials
    const woodMat = new PBRMaterial('carouselWood', scene);
    woodMat.albedoColor = new Color3(0.6, 0.4, 0.2);
    woodMat.roughness = 0.8;
    woodMat.metallic = 0.1;

    const roofMat = new PBRMaterial('carouselRoof', scene);
    roofMat.albedoColor = new Color3(0.8, 0.1, 0.1); // Festive Red
    roofMat.roughness = 0.9;
    roofMat.metallic = 0.05;

    const goldMat = new PBRMaterial('carouselGold', scene);
    goldMat.albedoColor = new Color3(1.0, 0.8, 0.0);
    goldMat.roughness = 0.3;
    goldMat.metallic = 0.9;

    const horseMats: PBRMaterial[] = [];
    const colors = [
      new Color3(0.9, 0.9, 0.9), // White
      new Color3(0.8, 0.3, 0.1), // Orange/Brown
      new Color3(0.1, 0.6, 0.2), // Green
      new Color3(0.1, 0.2, 0.8), // Blue
    ];
    
    colors.forEach((c, i) => {
      const m = new PBRMaterial(`horseMat${i}`, scene);
      m.albedoColor = c;
      m.roughness = 0.7;
      m.metallic = 0.1;
      horseMats.push(m);
    });

    // Base platform (static for physics)
    const platform = MeshBuilder.CreateCylinder('carouselPlatform', { diameter: 6, height: 0.5 }, scene);
    platform.parent = this.root;
    platform.position.y = 0.25;
    platform.material = woodMat;
    platform.receiveShadows = true;
    if (shadowCast) shadowCast(platform);

    if (scene.isPhysicsEnabled()) {
      PhysicsManager.addStaticBoxCollider(platform, scene, new Vector3(6, 0.5, 6));
    }

    // Rotating group (visual floor, roof, horses)
    const rotatingGroup = new TransformNode('carouselRotatingGroup', scene);
    rotatingGroup.parent = this.root;

    // Rotating visual floor
    const rotatingFloor = MeshBuilder.CreateCylinder('carouselRotatingFloor', { diameter: 6.01, height: 0.51 }, scene);
    rotatingFloor.parent = rotatingGroup;
    rotatingFloor.position.y = 0.25;
    rotatingFloor.material = woodMat;
    rotatingFloor.receiveShadows = true;
    if (shadowCast) shadowCast(rotatingFloor);

    // Central pole
    const centralPole = MeshBuilder.CreateCylinder('carouselCenterPole', { diameter: 0.8, height: 4.5 }, scene);
    centralPole.parent = rotatingGroup;
    centralPole.position.y = 0.51 + 4.5 / 2;
    centralPole.material = goldMat;
    if (shadowCast) shadowCast(centralPole);

    // Roof (4m above platform)
    const roof = MeshBuilder.CreateCylinder('carouselRoof', { diameterTop: 0, diameterBottom: 6.5, height: 2, tessellation: 16 }, scene);
    roof.parent = rotatingGroup;
    roof.position.y = 0.5 + 4 + 1; // Base of roof is 4m above platform
    roof.material = roofMat;
    if (shadowCast) shadowCast(roof);

    const finial = MeshBuilder.CreateCylinder('carouselFinial', { diameterBottom: 0.2, diameterTop: 0, height: 1 }, scene);
    finial.parent = roof;
    finial.position.y = 1.5;
    finial.material = goldMat;
    if (shadowCast) shadowCast(finial);

    // Light
    const light = new PointLight('carouselLight', new Vector3(0, 3, 0), scene);
    light.parent = this.root;
    light.intensity = 0.6;
    light.range = 12;
    light.diffuse = new Color3(1.0, 0.9, 0.7);

    // Horses
    const horses: TransformNode[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      
      const horseGroup = new TransformNode(`horseGroup${i}`, scene);
      horseGroup.parent = rotatingGroup;
      
      // Position at radius 2.5m
      horseGroup.position = new Vector3(Math.cos(angle) * 2.5, 2.0, Math.sin(angle) * 2.5);
      // Face forward along tangent
      horseGroup.rotation.y = -angle + Math.PI;

      const hMat = horseMats[i % horseMats.length];

      // Body (elongated box)
      const body = MeshBuilder.CreateBox(`horseBody${i}`, { width: 0.4, height: 0.5, depth: 1.2 }, scene);
      body.parent = horseGroup;
      body.material = hMat;
      if (shadowCast) shadowCast(body);

      // Head (tilted box)
      const head = MeshBuilder.CreateBox(`horseHead${i}`, { width: 0.3, height: 0.6, depth: 0.4 }, scene);
      head.parent = horseGroup;
      head.position = new Vector3(0, 0.4, 0.5);
      head.rotation.x = Math.PI / 6;
      head.material = hMat;
      if (shadowCast) shadowCast(head);

      // Legs
      const legPositions = [
        new Vector3(-0.15, -0.4, 0.4),
        new Vector3(0.15, -0.4, 0.4),
        new Vector3(-0.15, -0.4, -0.4),
        new Vector3(0.15, -0.4, -0.4)
      ];
      legPositions.forEach((pos, j) => {
        const leg = MeshBuilder.CreateCylinder(`horseLeg${i}_${j}`, { diameter: 0.1, height: 0.8 }, scene);
        leg.parent = horseGroup;
        leg.position = pos;
        leg.material = hMat;
        if (shadowCast) shadowCast(leg);
      });

      // Gold pole
      const pole = MeshBuilder.CreateCylinder(`horsePole${i}`, { diameter: 0.08, height: 4 }, scene);
      pole.parent = rotatingGroup;
      pole.position = new Vector3(Math.cos(angle) * 2.5, 2.5, Math.sin(angle) * 2.5);
      pole.material = goldMat;
      if (shadowCast) shadowCast(pole);

      // Dedicated seat mount on horse saddle
      const horseSeat = new TransformNode(`carouselHorseSeat_${i}`, scene);
      horseSeat.position = new Vector3(0, 0.45, 0);
      horseSeat.parent = horseGroup;
      this.seats.push(horseSeat);

      horses.push(horseGroup);
    }

    // Animation
    let time = 0;
    scene.onBeforeRenderObservable.add(() => {
      const dt = scene.getEngine().getDeltaTime() / 1000;
      time += dt;
      
      rotatingGroup.rotation.y += 0.4 * dt;

      horses.forEach((horse, i) => {
        const phase = (i * Math.PI * 2) / 8;
        horse.position.y = 2.0 + Math.sin(time * 2 + phase) * 0.3;
      });
    });
  }

  public getSeats(): TransformNode[] {
    return this.seats;
  }
}
