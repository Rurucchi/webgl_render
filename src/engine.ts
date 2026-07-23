import { vec3, vec2 } from "gl-matrix";
import { ImGui, ImGuiImplWeb, ImTextureRef, ImVec2 } from "@mori2003/jsimgui";
import { degToRad } from "./utils";

// rendering
import { Renderer, setupRendererContext, RenderContext } from "./render/render";

// camera
import Camera from "./engine/camera";
import Input from "./engine/input";

// GLTF
import { Assets, prepareAssets } from "./assets/assets";

/* Constants */

// units per second
const speed = 2;

class Engine {
  // Rendering
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement | OffscreenCanvas;
  width = 0.0;
  height = 0.0;

  // sun!: Sun;
  camera: Camera;
  shadowCamera: Camera;

  // Assets
  assets: Assets | null = null;

  // Rendering
  renderContext: RenderContext;

  // Engine
  lastTime: number = 0.0;

  input: Input;
  toggleShadowMapCamera = false;

  constructor(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) {
    this.canvas = canvas;
    this.gl = gl;
    this._update = this._update.bind(this);

    // camera, used for render pass and controlled by player.
    const camera = new Camera(
      canvas.width,
      canvas.height,
      vec3.fromValues(0, 1, 0),
      0,
      degToRad(90),
      degToRad(90),
      "perspective",
    );

    const shadowCamera = new Camera(
      canvas.width,
      canvas.height,
      vec3.fromValues(-1.5, 18, -1.7),
      degToRad(-70),
      degToRad(230),
      degToRad(90),
      "orthographic",
      21.5,
    );

    // inputs
    const input = new Input();

    // Rendering setup
    const renderContext = setupRendererContext(gl, canvas);
    Renderer.renderPass.prepare(renderContext, camera);
    Renderer.shadowPass.prepare(renderContext, shadowCamera);
    Renderer.debugPass.prepare(renderContext);

    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.renderContext = renderContext;
    this.camera = camera;
    this.shadowCamera = shadowCamera;
    this.input = input;
  }

  async start() {
    if (this.canvas instanceof HTMLCanvasElement) {
      await ImGuiImplWeb.Init({
        canvas: this.canvas,
        backend: "webgl2",
        // device: myGPUDevice, // Required for WebGPU
      });
    }

    // input detection
    this.input.start();

    window.addEventListener("unhandledrejection", (e) => {
      console.error("UNHANDLED PROMISE:", e.reason);
    });

    // loading GLTF
    this.assets = await prepareAssets(this.gl);

    // using update as a callback for rendering loop (vsync is forced)
    requestAnimationFrame(this._update);
  }

  _update(time: number) {
    // Engine loop
    const delta = time - this.lastTime;

    let fps = 1000 / delta;
    let inputDirection = "";

    // input detection + camera
    this.input.update();

    // key movement
    const movement: vec3 = vec3.create();

    if (this.input.directions.forward) {
      inputDirection += " forward";
      vec3.add(movement, movement, this.camera.getForward());
    }
    if (this.input.directions.backward) {
      inputDirection += " backward";
      vec3.add(movement, movement, this.camera.getBackward());
    }
    if (this.input.directions.left) {
      inputDirection += " left";
      vec3.add(movement, movement, this.camera.getLeft());
    }
    if (this.input.directions.right) {
      inputDirection += " right";
      vec3.add(movement, movement, this.camera.getRight());
    }
    if (this.input.directions.up) {
      inputDirection += " up";
      vec3.add(movement, movement, this.camera.getUp());
    }
    if (this.input.directions.down) {
      inputDirection += " down";
      vec3.add(movement, movement, this.camera.getDown());
    }

    if (vec3.length(movement) > 0) {
      vec3.normalize(movement, movement);
      vec3.scale(movement, movement, speed / fps);
      vec3.add(this.camera.position, this.camera.position, movement);
    }

    // update camera viewport
    this.camera.viewportWidth = this.width;
    this.camera.viewportHeight = this.height;
    if (this.renderContext.shadowPassContext.shadowmapResolution) {
      this.shadowCamera.viewportWidth =
        this.renderContext.shadowPassContext.shadowmapResolution; // Shadowmap resolution
      this.shadowCamera.viewportHeight =
        this.renderContext.shadowPassContext.shadowmapResolution;
    }

    // update camera pitch/yaw
    this.camera.pitch -= this.input.mousePos.y * 0.005;
    this.camera.yaw += this.input.mousePos.x * 0.005;

    // clamp camera pitch/yaw
    const PITCH_LIMIT = Math.PI / 2 - 0.001; // 89.999
    this.camera.pitch = Math.max(
      -PITCH_LIMIT,
      Math.min(PITCH_LIMIT, this.camera.pitch),
    );
    this.camera.yaw =
      ((this.camera.yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); // 360

    // update camera view matrix
    this.camera.updateViewMatrix();
    this.camera.updateProjectionMatrix();
    this.shadowCamera.updateViewMatrix();
    this.shadowCamera.updateProjectionMatrix();

    // rendering
    const gl = this.gl;

    // imgui
    ImGuiImplWeb.BeginRender();

    ImGui.Begin("Controls");
    ImGui.Text("Use W/A/S/D and Space/Shift to move around the scene!");
    if (ImGui.Button("Control Camera")) {
      // console.log("changed mouse mode");
      this.input.mouseFree = false;
      const canvas = document.getElementById("game");
      canvas?.requestPointerLock();
    }
    if (ImGui.Button("Reset camera")) {
      this.camera.position = vec3.fromValues(0, 1, 0);
    }

    // if (ImGui.Button("change camera mode")) {
    //   this.camera = this.shadowmapCamera;
    // }

    ImGui.Text("---------------");
    ImGui.Text("Debug:");
    ImGui.Text("FPS: " + Math.floor(fps));
    ImGui.Text("Input:" + inputDirection);
    ImGui.Text(
      `Camera Postion: ${this.camera.position[0].toFixed(1)} ${this.camera.position[1].toFixed(1)} ${this.camera.position[2].toFixed(1)}`,
    );
    ImGui.Text(
      "pitch:" + (this.camera.pitch * (180 / Math.PI)).toFixed(3) + "°",
    );
    ImGui.Text("yaw:" + (this.camera.yaw * (180 / Math.PI)).toFixed(1) + "°");
    // ImGui.Text("Mouse free:" + this.input.mouseFree);

    ImGui.CloseCurrentPopup();
    ImGui.End();

    this.lastTime = time;

    if (this.assets) {
      Renderer.shadowPass.render(
        this.renderContext,
        this.assets,
        this.shadowCamera,
      );
      Renderer.renderPass.render(
        this.renderContext,
        this.assets,
        this.camera,
        this.shadowCamera,
      );
      Renderer.debugPass.render(this.renderContext);
    }

    // viewport
    gl.viewport(0, 0, this.width, this.height);

    requestAnimationFrame(this._update);

    ImGuiImplWeb.EndRender();

    // Reset mouse pos to avoid infinite camera movement.
    this.input.mousePos.x = 0;
    this.input.mousePos.y = 0;

    // Resize canvas size in render context.
    this.resize(this.canvas.width, this.canvas.height);
  }

  resize(width: number, height: number) {
    this.renderContext.canvas.width = width;
    this.renderContext.canvas.height = height;
    this.width = width;
    this.height = height;
  }

  dispose() {}
}

export default Engine;
