import { vec3 } from "gl-matrix";
import { ImGui, ImGuiImplWeb, ImVec2 } from "@mori2003/jsimgui";

// shaders
import vs from "./render/shaders/vertexShader";
import fs from "./render/shaders/fragmentShader";

// rendering
import { type Mesh } from "./render/mesh";

// camera
import Camera from "./engine/camera";
import Input from "./engine/input";

// GLTF
import GLTFModel from "./scene/GLTFModel";
import { type Texture } from "./render/texture";
import {
  getSunBufferSize,
  getSunFloatCount,
  // type Light,
  type Sun,
} from "./scene/light";
import type { Material } from "./render/material";
import type { Sampler } from "./render/sampler";

/* Constants */

// units per second
const speed = 500;

class Engine {
  // Rendering
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement | OffscreenCanvas;
  width = 0.0;
  height = 0.0;
  program: WebGLProgram;
  cameraBuffer: WebGLBuffer;
  lightBuffer: WebGLBuffer;

  // Assets
  gltfModel: GLTFModel;

  // Engine
  lastTime: number = 0.0;
  meshBuffer: Array<Mesh>;
  texBuffer: Array<Texture>;
  matBuffer: Array<Material>;
  samplerBuffer: Array<Sampler>;
  sun: Sun;
  camera: Camera;
  input: Input;

  constructor(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) {
    this.canvas = canvas;
    this.gl = gl;
    this._update = this._update.bind(this);

    // camera
    this.camera = new Camera(
      this.width,
      this.height,
      vec3.fromValues(0, 150, -43),
      90,
      0,
      (90 * Math.PI) / 180,
    );

    // Add Sun
    const sun: Sun = {
      dir: vec3.fromValues(0.1, 1.0, 0.0),
      // color: vec3.fromValues(1.0, 0.95, 0.8), // Blue
      color: vec3.fromValues(1.0, 1.0, 1.0),
      // position vector (std140 layout rounds it to 16 bytes, 4 * 4)
      bufferSize: getSunBufferSize(),
    };

    this.sun = sun;

    // inputs
    this.input = new Input();

    // gltf model
    this.gltfModel = new GLTFModel();

    // GL
    const vertexShader: WebGLShader = this.compileVS();
    const fragShader: WebGLShader = this.compileFS();

    const program = this.bindShaders(vertexShader, fragShader);

    gl.useProgram(program);

    // Setup Camera UBO
    const cameraBuffer = gl.createBuffer();
    gl.bindBuffer(gl.UNIFORM_BUFFER, cameraBuffer);
    // In bytes
    gl.bufferData(gl.UNIFORM_BUFFER, this.camera.bufferSize, gl.DYNAMIC_DRAW);
    const camBlockIndex = gl.getUniformBlockIndex(program, "Camera");
    const camBindingPoint = 0;
    gl.uniformBlockBinding(program, camBlockIndex, camBindingPoint);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, camBindingPoint, cameraBuffer);

    // Setup Light UBO
    const lightBuffer = gl.createBuffer();
    gl.bindBuffer(gl.UNIFORM_BUFFER, lightBuffer);
    // In bytes
    gl.bufferData(gl.UNIFORM_BUFFER, getSunBufferSize(), gl.DYNAMIC_DRAW);
    const lightBlockIndex = gl.getUniformBlockIndex(program, "Light");
    const lightBindingPoint = 1;
    gl.uniformBlockBinding(program, lightBlockIndex, lightBindingPoint);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, lightBindingPoint, lightBuffer);

    // Samplers & texture slots
    const texSamplerLoc = gl.getUniformLocation(program, "uTex");
    gl.uniform1i(texSamplerLoc, 0); // 0 = TEXTURE0
    const normalSamplerLoc = gl.getUniformLocation(program, "uNormal");
    gl.uniform1i(normalSamplerLoc, 1); // 1 = TEXTURE1
    const metallicSamplerSamplerLoc = gl.getUniformLocation(
      program,
      "uMetallicRoughness",
    );
    gl.uniform1i(metallicSamplerSamplerLoc, 2); // 2 = TEXTURE2

    // Depth testing
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // Blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // rendering context
    this.program = program;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.cameraBuffer = cameraBuffer;
    this.lightBuffer = lightBuffer;

    this.meshBuffer = new Array<Mesh>();
    this.texBuffer = new Array<Texture>();
    this.matBuffer = new Array<Material>();
    this.samplerBuffer = new Array<Sampler>();
  }

  compileVS() {
    // Compile VS
    const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    if (vertexShader) {
      this.gl.shaderSource(vertexShader, vs);
      this.gl.compileShader(vertexShader);

      const status = this.gl.getShaderParameter(
        vertexShader,
        this.gl.COMPILE_STATUS,
      );
      if (!status) {
        const error = this.gl.getShaderInfoLog(vertexShader);
        throw 'Could not compile shader "' + "VS" + '" \n' + error;
      }
    } else {
      throw "Something happened";
    }

    // Compiling success
    return vertexShader;
  }

  compileFS() {
    // Compile FS
    const fragShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    if (fragShader) {
      this.gl.shaderSource(fragShader, fs);
      this.gl.compileShader(fragShader);

      const status = this.gl.getShaderParameter(
        fragShader,
        this.gl.COMPILE_STATUS,
      );
      if (!status) {
        const error = this.gl.getShaderInfoLog(fragShader);
        throw 'Could not compile shader "' + "FS" + '" \n' + error;
      }
    } else {
      throw "Something happened";
    }

    // Compiling success
    return fragShader;
  }

  bindShaders(vertexShader: WebGLShader, fragShader: WebGLShader) {
    // Set program
    const program = this.gl.createProgram();
    if (program) {
      this.gl.attachShader(program, vertexShader);
      this.gl.attachShader(program, fragShader);

      this.gl.linkProgram(program);
      const status = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
      if (!status) {
        const error = this.gl.getShaderInfoLog(fragShader);
        throw 'Could not link program "' + '" \n' + error;
      }
    }

    return program;
  }

  async start() {
    if (this.canvas instanceof HTMLCanvasElement) {
      await ImGuiImplWeb.Init({
        canvas: this.canvas,
        // device: myGPUDevice, // Required for WebGPU
      });
    }

    // input detection
    this.input.start();

    window.addEventListener("unhandledrejection", (e) => {
      console.error("UNHANDLED PROMISE:", e.reason);
    });

    // loading GLTF
    const processedGLTF = await this.gltfModel.loadAssets(
      // For supporting URL paths
      `${import.meta.env.BASE_URL}assets/Sponza.gltf`,
    );

    // TODO: Thread this, too heavy on startup
    if (processedGLTF) {
      // Meshes
      this.gltfModel.processNodes(
        this.gl,
        processedGLTF,

        this.program,
        this.meshBuffer,
      );

      // Textures
      await this.gltfModel.processTextures(
        this.gl,
        processedGLTF,
        this.texBuffer,
      );

      // Sampler
      this.gltfModel.processSampler(this.gl, processedGLTF, this.samplerBuffer);

      // Materials
      await this.gltfModel.processMaterials(processedGLTF, this.matBuffer);
    }

    // using update as a callback for rendering loop (vsync is forced)
    requestAnimationFrame(this._update);
  }

  queryTexture(texId: string | undefined) {
    if (texId) {
      const tex = this.texBuffer.find((tex) => tex.id === texId);
      return tex;
    } else {
      return undefined;
    }
  }

  querySampler(samplerId: string | undefined) {
    if (samplerId) {
      const sampler = this.samplerBuffer.find(
        (sampler) => sampler.id === samplerId,
      );
      return sampler;
    } else {
      return undefined;
    }
  }

  queryMaterial(matId: string | undefined) {
    if (matId) {
      const mat = this.matBuffer.find((material) => material.id === matId);
      return mat;
    } else {
      return undefined;
    }
  }

  drawMesh(gl: WebGL2RenderingContext, mesh: Mesh) {
    // Binding vertex arrays.
    gl.bindVertexArray(mesh.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);

    // Material
    const mat = this.queryMaterial(mesh.matId);

    // This should be changed
    if (mat) {
      const baseColorTexture: Texture | undefined = this.queryTexture(
        mat.baseColorTextureId,
      );

      const normalTexture: Texture | undefined = this.queryTexture(
        mat.normalTextureId,
      );
      const metallicRoughnessTexture: Texture | undefined = this.queryTexture(
        mat.metallicRoughnessTextureId,
      );

      // Bind textures
      if (mat.baseColorTextureId && baseColorTexture) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, baseColorTexture.webGLTexture);

        // Bind sampler
        const sampler = this.querySampler(baseColorTexture.samplerId);
        if (sampler) {
          gl.bindSampler(0, sampler.glSampler);
        }
      }

      if (mat.normalTextureId && normalTexture) {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, normalTexture.webGLTexture);
        // Bind sampler
        const sampler = this.querySampler(normalTexture.samplerId);
        if (sampler) {
          gl.bindSampler(1, sampler.glSampler);
        }
      }

      if (mat.metallicRoughnessTextureId && metallicRoughnessTexture) {
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, metallicRoughnessTexture.webGLTexture);
        // Bind sampler
        const sampler = this.querySampler(metallicRoughnessTexture.samplerId);
        if (sampler) {
          gl.bindSampler(2, sampler.glSampler);
        }
      }

      if (mat?.doubleSided) {
        gl.disable(gl.CULL_FACE);
        gl.cullFace(gl.FRONT_AND_BACK);
      } else {
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
      }
    }

    gl.drawElements(gl.TRIANGLES, mesh.indexCount, gl.UNSIGNED_SHORT, 0);

    // Remove samplers for Imgui & UI rendering
    gl.bindSampler(0, null);
    gl.bindSampler(1, null);
    gl.bindSampler(2, null);
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

    // update camera pitch/yaw
    this.camera.pitch -= this.input.mousePos.y * 0.005;
    this.camera.yaw += this.input.mousePos.x * 0.005;

    // clamp camera pitch/yaw
    const PITCH_LIMIT = Math.PI / 2 - 0.001;
    this.camera.pitch = Math.max(
      -PITCH_LIMIT,
      Math.min(PITCH_LIMIT, this.camera.pitch),
    );
    this.camera.yaw =
      ((this.camera.yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

    // update camera view matrix
    this.camera.updateViewMatrix();
    this.camera.updatePerspectiveMatrix();

    // rendering

    const gl = this.gl;

    // imgui
    ImGuiImplWeb.BeginRender();

    ImGui.Begin("Controls");
    ImGui.Text("Use W/A/S/D and Space/Shift to move around the scene!");
    if (ImGui.Button("Control Camera")) {
      console.log("changed mouse mode");
      this.input.mouseFree = false;
      const canvas = document.getElementById("game");
      canvas?.requestPointerLock();
    }
    ImGui.Text("---------------");
    ImGui.Text("Debug:");
    ImGui.Text("FPS: " + Math.floor(fps));
    ImGui.Text("Input:" + inputDirection);
    ImGui.Text(
      `Camera Postion: ${this.camera.position[0].toFixed(1)} ${this.camera.position[1].toFixed(1)} ${this.camera.position[2].toFixed(1)}`,
    );
    ImGui.Text(
      "pitch:" + (this.camera.pitch * (180 / Math.PI)).toFixed(1) + "°",
    );
    ImGui.Text("yaw:" + (this.camera.yaw * (180 / Math.PI)).toFixed(1) + "°");
    ImGui.Text("Mouse free:" + this.input.mouseFree);

    ImGui.CloseCurrentPopup();
    ImGui.End();

    this.lastTime = time;

    // gl

    const cameraData = new Float32Array(16 + 16 + 4);

    cameraData.set(this.camera.viewMatrix, 0); // mat4
    cameraData.set(this.camera.projectionMatrix, 16); // mat4
    cameraData.set(this.camera.position, 32);
    cameraData[35] = 1.0; // padding

    // In floats
    const sunData = new Float32Array(getSunFloatCount());
    sunData.set(this.sun.dir, 0);
    sunData.set(this.sun.color, 4);

    /* rendering */
    gl.clearColor(0.5, 0.6, 0.7, 0.5);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // useProgram
    gl.useProgram(this.program);

    // viewport
    gl.viewport(0, 0, this.width, this.height);

    // bind Camera buffer
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.cameraBuffer);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, cameraData);

    // bind Light buffer
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.lightBuffer);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, sunData);

    this.meshBuffer.forEach((mesh) => {
      this.drawMesh(this.gl, mesh);
    });

    requestAnimationFrame(this._update);

    ImGuiImplWeb.EndRender();

    // Reset this to avoid infinite camera movement.
    this.input.mousePos.x = 0;
    this.input.mousePos.y = 0;
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  dispose() {}
}

export default Engine;
