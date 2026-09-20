import {
  Engine,
  Scene,
  Color4,
} from '@babylonjs/core';

let _engine: Engine | null = null;
let _scene: Scene | null = null;

export function createEngine(canvas: HTMLCanvasElement): Engine {
  _engine = new Engine(canvas, true, {
    preserveDrawingBuffer: true, // for screenshots
    stencil: true,
    antialias: true,
    adaptToDeviceRatio: true,
  });
  return _engine;
}

export function createScene(engine: Engine): Scene {
  _scene = new Scene(engine);
  _scene.clearColor = new Color4(0.05, 0.03, 0.01, 1); // deep night bg fallback
  return _scene;
}

export function getEngine(): Engine | null { return _engine; }
export function getScene(): Scene | null { return _scene; }

export function disposeEngine() {
  _scene?.dispose();
  _engine?.dispose();
  _scene = null;
  _engine = null;
}
