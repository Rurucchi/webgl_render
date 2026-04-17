import { vec3 } from "gl-matrix";
import { ImGui, ImGuiImplWeb } from "@mori2003/jsimgui";

// shaders
import vs from "./shaders/vertexShader";
import fs from "./shaders/fragmentShader";

// rendering
import { type Mesh, createMeshBuffers } from "./scene/mesh";
import triangle2d from "./scene/sample/triangle2d";
import Cube from "./scene/sample/cube";

// camera
import Camera from "./camera";
import Input from "./input";

// GLTF
import GLTFModel from "./scene/GLTFModel";

// utils

/* Constants */

// units per second
const speed = 200;

class Engine {
  // Rendering
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement | OffscreenCanvas;
  width = 0.0;
  height = 0.0;
  program: WebGLProgram;
  // vao: WebGLVertexArrayObject;
  // ibo: WebGLBuffer;
  ubo: WebGLBuffer;

  // Assets
  gltfModel: GLTFModel;

  // Engine
  lastTime: number = 0.0;
  meshBuffer = new Array<Mesh>();
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
      vec3.fromValues(0, 0, 3),
      0,
      0,
      (90 * Math.PI) / 180,
    );

    // inputs
    this.input = new Input();

    // gltf model
    this.gltfModel = new GLTFModel();

    // renderer init

    const vertexShader: WebGLShader = this.compileVS();
    const fragShader: WebGLShader = this.compileFS();

    const program = this.bindShaders(vertexShader, fragShader);

    // // Create vertex buffer
    // const vbo = gl.createBuffer(); // vertex buffer object
    // gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

    // Setup Vertex Array Object
    // const vao = gl.createVertexArray();
    // gl.bindVertexArray(vao);
    // gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    // gl.bufferData(gl.ARRAY_BUFFER, Cube.vertices, gl.STATIC_DRAW);

    // // Create index buffer
    // const ibo = gl.createBuffer();
    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Cube.indices, gl.STATIC_DRAW);

    // Setup Uniform Buffer Object
    const ubo = gl.createBuffer();
    gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
    gl.bufferData(gl.UNIFORM_BUFFER, this.camera.bufferSize, gl.DYNAMIC_DRAW);
    const blockIndex = gl.getUniformBlockIndex(program, "Camera");
    const bindingPoint = 0;
    gl.uniformBlockBinding(program, blockIndex, bindingPoint);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, bindingPoint, ubo);

    const posLocation = gl.getAttribLocation(program, "i_pos");
    const normalLocation = gl.getAttribLocation(program, "i_normal");
    const tangentLocation = gl.getAttribLocation(program, "i_tangent");
    const texLocation = gl.getAttribLocation(program, "i_tex");

    // const colorLocation = gl.getAttribLocation(program, "i_color");
    const stride = 11 * 4;

    gl.enableVertexAttribArray(posLocation);
    gl.vertexAttribPointer(posLocation, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(normalLocation);
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, stride, 3 * 4); //12
    gl.enableVertexAttribArray(tangentLocation);
    gl.vertexAttribPointer(tangentLocation, 3, gl.FLOAT, false, stride, 6 * 4); //24
    gl.enableVertexAttribArray(texLocation);
    gl.vertexAttribPointer(texLocation, 2, gl.FLOAT, false, stride, 9 * 4); //36

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // SET for internal use

    // rendering context
    this.program = program;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    // this.vao = vao;
    this.ubo = ubo;
    // this.ibo = ibo;

    this.meshBuffer = new Array<Mesh>();
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
      "/assets/Sponza.gltf",
    );

    // TODO: Thread this, too heavy on startup
    if (processedGLTF) {
      this.gltfModel.processNodes(processedGLTF, this.meshBuffer);
      this.meshBuffer.forEach((mesh) => {
        createMeshBuffers(this.gl, this.program, mesh);
      });
    }

    // using update as a callback for rendering loop (vsync is forced)
    requestAnimationFrame(this._update);
  }

  drawMesh(gl: WebGL2RenderingContext, mesh: Mesh) {
    gl.bindVertexArray(mesh.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);
    gl.drawElements(gl.LINES, mesh.indexCount, gl.UNSIGNED_SHORT, 0);
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
      vec3.scale(movement, movement, speed * (1 / (delta * 10)));
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

    ImGui.Begin("My Window");
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
    if (ImGui.Button("Switch camera mode")) {
      console.log("changed mouse mode");
      this.input.mouseFree = false;
      const canvas = document.getElementById("game");
      canvas?.requestPointerLock();
    }
    ImGui.End();

    this.lastTime = time;

    // gl

    const data = new Float32Array(16 + 16 + 4);

    data.set(this.camera.viewMatrix, 0); // mat4
    data.set(this.camera.projectionMatrix, 16); // mat4
    data.set(this.camera.position, 32);
    data[35] = 1.0; // padding

    gl.clearColor(0.5, 0.5, 0.5, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // useProgram
    gl.useProgram(this.program);

    // viewport
    gl.viewport(0, 0, this.width, this.height);

    // bind UBO
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.ubo);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, data);

    // draw
    // gl.drawArrays(gl.TRIANGLES, 0, 3);

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
