/**
 * LocalPlayer.ts — Third-person player character for Kerala Fair 3D
 * - Low-poly character mesh built from primitives
 * - 4 Real-World Camera View Modes:
 *     1. 'third_person' — Classic behind-the-back eye level (real-world perspective)
 *     2. 'first_person' — Immersive eyes-level view looking through character's eyes
 *     3. 'aerial'       — Drone bird's-eye view to see the WHOLE fair grounds from where you stand
 *     4. 'diorama'      — 45° isometric diorama perspective
 * - Keyboard 'V' / 'C' or HUD button cycles camera mode smoothly
 * - WASD + mouse camera orbit + mobile joystick support via Zustand
 * - Cosmetic slot attachments
 * - Zone detection by distance
 */

import {
  Scene,
  TransformNode,
  MeshBuilder,
  PBRMaterial,
  Color3,
  Vector3,
  ArcRotateCamera,
  Scalar,
  Mesh,
  KeyboardInfo,
  KeyboardEventTypes,
} from '@babylonjs/core';
import { FairZone, EquippedCosmetics } from 'fair-shared';
import { useGameStore, CameraViewMode } from '../../store/useGameStore';
import { sendPlayerMovement } from '../../services/socket';
import { CharacterPhysicsController } from './CharacterPhysicsController';
import { CharacterAnimationController } from './CharacterAnimationController';
import { AvatarModelLoader } from './AvatarModelLoader';
import { RideManager } from './RideManager';

const WALK_SPEED = 10; // units per second
const ZONE_RADIUS: Record<FairZone, { center: [number, number]; r: number }> = {
  entrance:  { center: [0, -75], r: 18 },
  courtyard: { center: [0, -15], r: 22 },
  shops:     { center: [50, -30], r: 18 },
  foodcourt: { center: [-50, 40], r: 18 },
  rides:     { center: [50, 40],  r: 18 },
};

export const WORKSTATIONS: { name: string; malayalam: string; center: [number, number]; radius: number; modal: string }[] = [
  { name: 'Vallam Kali Snake Boat Race', malayalam: 'ചുണ്ടൻ വള്ളം കളി', center: [18, 75], radius: 10, modal: 'vallamkali' },
  { name: 'Chenda Melam Rhythm Station', malayalam: 'ചെണ്ടമേളം', center: [25, -52], radius: 6, modal: 'chenda_rhythm' },
  { name: 'Pottery Wheel & Lamp Studio', malayalam: 'മൺപാത്ര നിർമ്മാണം', center: [-35, -45], radius: 6, modal: 'pottery' },
  { name: 'Coir Rope Making Workshop', malayalam: 'കയർ റാട്ട്', center: [32, -45], radius: 6, modal: 'coir' },
  { name: 'Coconut Climbing Sprint', malayalam: 'തെങ്ങുകയറ്റം', center: [-25, 20], radius: 6, modal: 'coconut_climb' },
  { name: 'Live Kozhikodan Halwa Cauldron', malayalam: 'കോഴിക്കോടൻ ഹൽവ', center: [50, -25], radius: 6, modal: 'halwa' },
];

export class LocalPlayer {
  private root: TransformNode;
  private camera!: ArcRotateCamera;
  private cameraTarget!: TransformNode;
  private scene: Scene;

  private physicsController: CharacterPhysicsController | null = null;
  private animController: CharacterAnimationController;

  private characterMeshes: Mesh[] = [];
  private keys = { w: false, a: false, s: false, d: false, shift: false, space: false };
  private joystickVec = { x: 0, y: 0 };
  private currentZone: FairZone | null = null;
  private emitTimer = 0;
  private animState: 'idle' | 'walk' = 'idle';
  private walkPhase = 0;
  private lastCameraMode: CameraViewMode | null = null;

  // Cosmetic child nodes
  private outfitMesh: Mesh | null = null;
  private instrumentMesh: Mesh | null = null;
  private headwearMesh: Mesh | null = null;

  constructor(scene: Scene, avatarColor: string, equipped: EquippedCosmetics) {
    this.scene = scene;
    this.root = new TransformNode('localPlayer', scene);
    this.root.position = new Vector3(0, 0, -60); // start near entrance arch

    this.animController = new CharacterAnimationController();

    this.buildCharacter(avatarColor);
    this.buildCamera();
    this.setupInput();
    this.applyCosmetics(equipped);

    // Initialize Havok Physics Character Controller if scene physics is active
    if (scene.isPhysicsEnabled()) {
      this.physicsController = new CharacterPhysicsController(this.root, scene);
    }

    scene.onBeforeRenderObservable.add(() => this.update());
  }

  private buildCharacter(avatarColor: string) {
    const bodyMat = new PBRMaterial('playerBodyMat', this.scene);
    bodyMat.albedoColor = Color3.FromHexString(avatarColor);
    bodyMat.roughness = 0.7;
    bodyMat.metallic = 0;

    const skinMat = new PBRMaterial('playerSkinMat', this.scene);
    skinMat.albedoColor = new Color3(0.85, 0.7, 0.55);
    skinMat.roughness = 0.75;
    skinMat.metallic = 0;

    // Torso
    const torso = MeshBuilder.CreateBox('playerTorso', { width: 0.6, height: 0.85, depth: 0.35 }, this.scene);
    torso.position = new Vector3(0, 1.5, 0);
    torso.material = bodyMat;
    torso.parent = this.root;
    this.characterMeshes.push(torso);

    // Head
    const head = MeshBuilder.CreateSphere('playerHead', { diameter: 0.55, segments: 8 }, this.scene);
    head.position = new Vector3(0, 2.2, 0);
    head.material = skinMat;
    head.parent = this.root;
    this.characterMeshes.push(head);

    // Left arm — pivot at shoulder
    const lArm = MeshBuilder.CreateCylinder('playerLArm', { height: 0.7, diameter: 0.2, tessellation: 6 }, this.scene);
    lArm.position = new Vector3(-0.45, 1.45, 0);
    lArm.setPivotPoint(new Vector3(0, 0.35, 0));
    lArm.material = bodyMat;
    lArm.parent = this.root;
    this.characterMeshes.push(lArm);

    // Right arm — pivot at shoulder
    const rArm = MeshBuilder.CreateCylinder('playerRArm', { height: 0.7, diameter: 0.2, tessellation: 6 }, this.scene);
    rArm.position = new Vector3(0.45, 1.45, 0);
    rArm.setPivotPoint(new Vector3(0, 0.35, 0));
    rArm.material = bodyMat;
    rArm.parent = this.root;
    this.characterMeshes.push(rArm);

    // Left leg — pivot at hip
    const lLeg = MeshBuilder.CreateCylinder('playerLLeg', { height: 0.85, diameter: 0.22, tessellation: 6 }, this.scene);
    lLeg.position = new Vector3(-0.18, 0.75, 0);
    lLeg.setPivotPoint(new Vector3(0, 0.42, 0));
    lLeg.material = bodyMat;
    lLeg.parent = this.root;
    this.characterMeshes.push(lLeg);

    // Right leg — pivot at hip
    const rLeg = MeshBuilder.CreateCylinder('playerRLeg', { height: 0.85, diameter: 0.22, tessellation: 6 }, this.scene);
    rLeg.position = new Vector3(0.18, 0.75, 0);
    rLeg.setPivotPoint(new Vector3(0, 0.42, 0));
    rLeg.material = bodyMat;
    rLeg.parent = this.root;
    this.characterMeshes.push(rLeg);

    // Register articulated limbs for procedural locomotion physics
    this.animController.setArticulatedLimbs({
      torso,
      head,
      lArm,
      rArm,
      lLeg,
      rLeg,
    });
  }

  private buildCamera() {
    // Camera target node parented to the player root — auto-follows without manual updates
    this.cameraTarget = new TransformNode('playerCamTarget', this.scene);
    this.cameraTarget.parent = this.root;
    this.cameraTarget.position = new Vector3(0, 1.6, 0); // chest/eye height relative to root

    // ArcRotateCamera: beta is angle from zenith (0=top-down, π/2=horizontal)
    // beta = 1.50 (~86° from top) = realistic shoulder-level behind-the-back view
    this.camera = new ArcRotateCamera(
      'playerCam',
      -Math.PI / 2,  // alpha: behind the player
      1.50,          // beta: nearly horizontal, slightly above eye level
      8,             // radius: distance behind player
      this.cameraTarget.getAbsolutePosition(),
      this.scene
    );

    // Lock camera to follow the target node — this is the correct BabylonJS way
    // to follow a moving object without manually setting camera.target each frame
    this.camera.lockedTarget = this.cameraTarget;

    this.camera.lowerRadiusLimit = 3.5;
    this.camera.upperRadiusLimit = 16;
    this.camera.lowerBetaLimit = 1.2;                // HARD floor: never go above ~69° from horizontal (no top-down!)
    this.camera.upperBetaLimit = Math.PI / 2 + 0.1;  // allow slightly below horizon for looking up slopes
    this.camera.panningSensibility = 0;              // disable panning
    this.camera.wheelPrecision = 20;

    // Disable camera's own keyboard controls so WASD only moves player
    this.camera.keysUp = [];
    this.camera.keysDown = [];
    this.camera.keysLeft = [];
    this.camera.keysRight = [];

    const canvas = this.scene.getEngine().getRenderingCanvas();
    if (canvas) {
      this.camera.attachControl(canvas, true);
    }
  }

  private setupInput() {
    this.scene.onKeyboardObservable.add((info: KeyboardInfo) => {
      const key = info.event.key.toLowerCase();
      const down = info.type === KeyboardEventTypes.KEYDOWN;
      if (key === 'w' || key === 'arrowup')    this.keys.w = down;
      if (key === 's' || key === 'arrowdown')  this.keys.s = down;
      if (key === 'a' || key === 'arrowleft')  this.keys.a = down;
      if (key === 'd' || key === 'arrowright') this.keys.d = down;
      if (key === 'shift')                     this.keys.shift = down;
      if (key === ' ' || key === 'space')      this.keys.space = down;

      // E-key or Space to interact with rides or current zone
      if (down && key === 'e') this.toggleRideAction();
      if (down && (key === ' ' || key === 'space') && RideManager.isPlayerRiding()) {
        this.toggleRideAction();
      }

      // V or C key to cycle camera view mode
      if (down && (key === 'v' || key === 'c')) {
        useGameStore.getState().cycleCameraMode();
      }
    });

    // Window event listener for HUD button clicks
    window.addEventListener('fair-toggle-ride', this.handleCustomRideToggle);

    // Subscribe to joystick from Zustand
    useGameStore.subscribe((state) => {
      this.joystickVec = state.joystickVec ?? { x: 0, y: 0 };
    });
  }

  private handleCustomRideToggle = () => {
    this.toggleRideAction();
  };

  public toggleRideAction() {
    if (RideManager.isPlayerRiding()) {
      RideManager.dismountRide(this.root, (exitPos) => {
        this.animController.setSittingState(false);
        if (this.physicsController) {
          this.physicsController.setEnabled(true);
          this.physicsController.teleport(exitPos);
        } else {
          this.root.position.copyFrom(exitPos);
        }
      });
      return;
    }

    const currentPos = this.root.getAbsolutePosition();

    // 1. Check if near an interactive workstation (Vallam Kali, Chenda, Pottery, Coir, Coconut, Halwa)
    for (const ws of WORKSTATIONS) {
      const dist = Math.hypot(currentPos.x - ws.center[0], currentPos.z - ws.center[1]);
      if (dist <= ws.radius) {
        useGameStore.getState().openModal(ws.modal as any);
        return;
      }
    }

    // 2. Check if near a ridable ride
    const nearRide = RideManager.getNearbyRide(currentPos);
    if (nearRide) {
      if (this.physicsController) {
        this.physicsController.setEnabled(false);
      }
      RideManager.mountRide(nearRide.id, this.root, currentPos, () => {
        this.animController.setSittingState(true);
      });
      return;
    }

    // 3. Default zone modal trigger if no ride nearby
    this.triggerZoneInteraction();
  }

  private update() {
    const dt = this.scene.getEngine().getDeltaTime() / 1000; // seconds

    // ── 1. Check if Player is actively riding an attraction ─────────────────
    if (RideManager.isPlayerRiding()) {
      this.animController.setSittingState(true);
      this.animController.update(0, true, dt);
      this.animState = 'idle';

      // Dynamic G-force ride camera
      RideManager.updateRideCamera(this.camera, dt);

      // Clear proximity prompt while riding
      const gameStore = useGameStore.getState();
      if (gameStore.nearbyRidePrompt) {
        gameStore.setNearbyRidePrompt(null);
      }

      // Emit live world position of seat
      this.emitTimer += dt;
      if (this.emitTimer >= 0.065) {
        this.emitTimer = 0;
        const absPos = this.root.getAbsolutePosition();
        gameStore.setPlayerWorldPos({ x: absPos.x, z: absPos.z });
        sendPlayerMovement({
          x: absPos.x,
          y: absPos.y,
          z: absPos.z,
          rotY: 0,
          direction: 'idle',
          anim: 'sitting',
          animState: 'idle',
        });
      }
      return;
    }

    // ── 2. Check Proximity to Nearby Rides & Workstations ───────────────────
    const currentPos = this.root.position;
    const store = useGameStore.getState();

    let activePrompt: { rideId: string; rideName: string; malayalamName: string } | null = null;
    for (const ws of WORKSTATIONS) {
      const dist = Math.hypot(currentPos.x - ws.center[0], currentPos.z - ws.center[1]);
      if (dist <= ws.radius) {
        activePrompt = {
          rideId: ws.modal,
          rideName: ws.name,
          malayalamName: ws.malayalam,
        };
        break;
      }
    }

    if (!activePrompt) {
      const nearRide = RideManager.getNearbyRide(currentPos);
      if (nearRide) {
        activePrompt = {
          rideId: nearRide.id,
          rideName: nearRide.name,
          malayalamName: nearRide.malayalamName,
        };
      }
    }

    if (activePrompt) {
      if (!store.nearbyRidePrompt || store.nearbyRidePrompt.rideId !== activePrompt.rideId) {
        store.setNearbyRidePrompt(activePrompt);
      }
    } else if (store.nearbyRidePrompt) {
      store.setNearbyRidePrompt(null);
    }

    // ── 3. Movement vector from WASD or joystick ────────────────────────────
    let dx = 0, dz = 0;

    if (this.keys.w || this.joystickVec.y < -0.2) dz += 1;
    if (this.keys.s || this.joystickVec.y >  0.2) dz -= 1;
    if (this.keys.a || this.joystickVec.x < -0.2) dx -= 1;
    if (this.keys.d || this.joystickVec.x >  0.2) dx += 1;

    // Project movement relative to camera's horizontal view direction
    const camAlpha = this.camera.alpha;
    const forwardX = -Math.cos(camAlpha);
    const forwardZ = -Math.sin(camAlpha);
    const rightX = -Math.sin(camAlpha);
    const rightZ = Math.cos(camAlpha);

    const worldDx = dx * rightX + dz * forwardX;
    const worldDz = dx * rightZ + dz * forwardZ;

    const moveDir = new Vector3(worldDx, 0, worldDz);
    if (moveDir.lengthSquared() > 0.001) {
      moveDir.normalize();
    }

    if (this.physicsController) {
      // ── Havok Physics Character Control ──────────────────────────────────
      const { speed, isGrounded } = this.physicsController.update(
        {
          moveDir,
          isRunning: this.keys.shift,
          jumpRequested: this.keys.space,
        },
        dt
      );

      this.animController.update(speed, isGrounded, dt);
      this.animState = speed > 0.3 ? 'walk' : 'idle';

      // Clamp inside fair grounds (200x200 area)
      this.root.position.x = Scalar.Clamp(this.root.position.x, -95, 95);
      this.root.position.z = Scalar.Clamp(this.root.position.z, -95, 95);
    } else {
      // ── Kinematic Fallback ────────────────────────────────────────────────
      const isMoving = worldDx !== 0 || worldDz !== 0;
      this.animState = isMoving ? 'walk' : 'idle';

      if (isMoving) {
        const len = Math.sqrt(worldDx * worldDx + worldDz * worldDz);
        const nx = worldDx / len, nz = worldDz / len;

        this.root.position.x += nx * WALK_SPEED * dt;
        this.root.position.z += nz * WALK_SPEED * dt;

        // Clamp inside fair grounds (200x200 area)
        this.root.position.x = Scalar.Clamp(this.root.position.x, -95, 95);
        this.root.position.z = Scalar.Clamp(this.root.position.z, -95, 95);

        // Rotate player to face movement direction
        const targetRotY = Math.atan2(nx, nz);
        this.root.rotation.y = Scalar.Lerp(this.root.rotation.y, targetRotY, 0.15);
      }

      this.animController.update(isMoving ? WALK_SPEED : 0, true, dt);
    }

    // ── Camera Update for Current View Mode ─────────────────────────────────
    this.updateCamera();

    // ── Zone detection ───────────────────────────────────────────────────────
    let nearestZone: FairZone | null = null;
    let nearestDist = Infinity;

    for (const [zoneName, def] of Object.entries(ZONE_RADIUS)) {
      const dx2 = this.root.position.x - def.center[0];
      const dz2 = this.root.position.z - def.center[1];
      const dist = Math.sqrt(dx2 * dx2 + dz2 * dz2);
      if (dist < def.r && dist < nearestDist) {
        nearestDist = dist;
        nearestZone = zoneName as FairZone;
      }
    }

    if (nearestZone !== this.currentZone) {
      this.currentZone = nearestZone;
      useGameStore.getState().setCurrentZone(nearestZone ?? undefined);
    }

    // ── Emit position at ~15 Hz ──────────────────────────────────────────────
    this.emitTimer += dt;
    if (this.emitTimer >= 0.065) {
      this.emitTimer = 0;
      const pos = this.root.position;
      const yaw = this.getRotationY();

      // Sync with HUD and OpenStreetMap minimap
      const gameStore = useGameStore.getState();
      gameStore.setPlayerWorldPos({ x: pos.x, z: pos.z });
      gameStore.setPlayerYaw(yaw);

      sendPlayerMovement({
        x: pos.x,
        y: pos.y,
        z: pos.z,
        rotY: yaw,
        direction: this.animState === 'walk' ? 'down' : 'idle',
        anim: this.animState,
        animState: this.animState,
      });
    }
  }

  /**
   * Smoothly adapts camera parameters to the selected view mode.
   * Camera follows the player automatically via lockedTarget → cameraTarget (parented to root).
   * We only adjust beta, radius, limits, and target Y-offset per mode.
   */
  private updateCamera() {
    const mode: CameraViewMode = useGameStore.getState().cameraMode;
    const modeChanged = mode !== this.lastCameraMode;

    let targetRadius = 8.0;
    let targetBeta = 1.50;
    let targetYOffset = 1.6;
    let isFirstPerson = false;

    if (mode === 'third_person') {
      targetRadius = 8.0;
      targetBeta = 1.50;   // ~86° from zenith = realistic behind-the-shoulder view
      targetYOffset = 1.6;  // chest height
      this.camera.lowerRadiusLimit = 3.5;
      this.camera.upperRadiusLimit = 16;
      this.camera.lowerBetaLimit = 1.2;   // HARD: never go above ~69° from horizontal
      this.camera.upperBetaLimit = Math.PI / 2 + 0.1;
    } else if (mode === 'first_person') {
      targetRadius = 0.05;
      targetBeta = Math.PI / 2;  // perfectly horizontal eye-level
      targetYOffset = 2.15;      // head height
      isFirstPerson = true;
      this.camera.lowerRadiusLimit = 0.01;
      this.camera.upperRadiusLimit = 0.2;
      this.camera.lowerBetaLimit = 0.3;
      this.camera.upperBetaLimit = 2.5;
    } else if (mode === 'aerial') {
      targetRadius = 72;
      targetBeta = 0.35;    // looking almost straight down
      targetYOffset = 0.5;
      this.camera.lowerRadiusLimit = 25;
      this.camera.upperRadiusLimit = 130;
      this.camera.lowerBetaLimit = 0.15;
      this.camera.upperBetaLimit = 1.0;
    } else if (mode === 'diorama') {
      targetRadius = 26;
      targetBeta = 1.05;    // ~60° isometric angle
      targetYOffset = 1.2;
      this.camera.lowerRadiusLimit = 12;
      this.camera.upperRadiusLimit = 42;
      this.camera.lowerBetaLimit = 0.6;
      this.camera.upperBetaLimit = 1.35;
    }

    // Toggle character mesh visibility for first-person
    const charVisible = !isFirstPerson;
    for (const m of this.characterMeshes) {
      m.isVisible = charVisible;
    }
    if (this.outfitMesh) this.outfitMesh.isVisible = charVisible;
    if (this.instrumentMesh) this.instrumentMesh.isVisible = charVisible;
    if (this.headwearMesh) this.headwearMesh.isVisible = charVisible;

    // Update camera target Y-offset (smooth lerp for the cameraTarget node position)
    this.cameraTarget.position.y = Scalar.Lerp(this.cameraTarget.position.y, targetYOffset, 0.15);

    if (modeChanged) {
      // Animate beta and radius smoothly toward the new mode's values during transition
      this.lastCameraMode = mode;
    }

    // Always lerp radius/beta toward target — but because lockedTarget is set,
    // BabylonJS won't recompute beta from camera position (no camera.target assignment!)
    this.camera.radius = Scalar.Lerp(this.camera.radius, targetRadius, 0.08);
    this.camera.beta = Scalar.Lerp(this.camera.beta, targetBeta, 0.10);
  }

  private triggerZoneInteraction() {
    if (!this.currentZone) return;
    const modal: Record<FairZone, string> = {
      entrance: 'auth',
      courtyard: 'guestbook',
      shops: 'shop',
      foodcourt: 'foodcourt',
      rides: 'ride',
    };
    const m = modal[this.currentZone];
    if (m) useGameStore.getState().openModal(m as any);
  }

  applyCosmetics(equipped: EquippedCosmetics) {
    this.outfitMesh?.dispose();
    this.instrumentMesh?.dispose();
    this.headwearMesh?.dispose();

    if (equipped.outfit) {
      // Kasavu outfit: white+gold mundu wrap
      const kasavuMat = new PBRMaterial('costumeOutfit', this.scene);
      kasavuMat.albedoColor = new Color3(0.98, 0.96, 0.88);
      kasavuMat.roughness = 0.65;
      kasavuMat.metallic = 0;
      const mundu = MeshBuilder.CreateBox('costumeOutfitMesh', { width: 0.65, height: 0.75, depth: 0.38 }, this.scene);
      mundu.position = new Vector3(0, 1.12, 0);
      mundu.material = kasavuMat;
      mundu.parent = this.root;
      this.outfitMesh = mundu;
    }

    if (equipped.instrument) {
      // Chenda drum
      const drumMat = new PBRMaterial('costumeInstrument', this.scene);
      drumMat.albedoColor = new Color3(0.55, 0.3, 0.1);
      drumMat.roughness = 0.8;
      const drum = MeshBuilder.CreateCylinder('costumeInstrumentMesh', {
        height: 0.45, diameter: 0.3, tessellation: 10,
      }, this.scene);
      drum.rotation.z = Math.PI / 2;
      drum.position = new Vector3(0.7, 1.55, 0);
      drum.material = drumMat;
      drum.parent = this.root;
      this.instrumentMesh = drum;
    }

    if (equipped.headwear) {
      // Pookkalam crown: ring of flowers
      const crownMat = new PBRMaterial('costumeHeadwear', this.scene);
      crownMat.albedoColor = new Color3(1, 0.55, 0.05);
      crownMat.roughness = 0.85;
      const crown = MeshBuilder.CreateTorus('costumeHeadwearMesh', {
        diameter: 0.6, thickness: 0.12, tessellation: 12,
      }, this.scene);
      crown.position = new Vector3(0, 2.52, 0);
      crown.material = crownMat;
      crown.parent = this.root;
      this.headwearMesh = crown;
    }
  }

  getPosition() { return this.root.position; }
  getRotationY() {
    return this.physicsController ? this.physicsController.getYaw() : this.root.rotation.y;
  }
  getAnimState() { return this.animState; }

  /**
   * Dynamically loads a rigged GLB avatar (e.g. Ready Player Me or Mixamo),
   * hiding procedural primitives and transferring animation groups.
   */
  public async loadGlbAvatar(url: string) {
    const loaded = await AvatarModelLoader.loadAvatar(url, this.root, this.scene, this.animController);
    if (loaded) {
      for (const m of this.characterMeshes) {
        m.isVisible = false;
      }
    }
  }

  dispose() {
    window.removeEventListener('fair-toggle-ride', this.handleCustomRideToggle);
    this.physicsController?.dispose();
    this.camera.dispose();
    this.root.dispose();
  }
}
