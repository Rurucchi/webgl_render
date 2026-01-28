import { ImGui, ImGuiImplWeb } from "@mori2003/jsimgui";

// shaders
import vs from "./shaders/vertexShader";
import fs from "./shaders/fragmentShader";
import Camera from "./camera";
import { vec3 } from "gl-matrix";
import Input from "./input";

const vertices = new Float32Array([
  // vertex
  0.0, +0.75, 1,
  // color
  0.5, 1, 1,
  // vertex
  0.75, -0.5, 0,
  // color
  1, 1, 1,
  // vertex
  -0.75, -0.5, 0,
  // color
  1, 1, 1,
]);

// units per second
const speed = 0.5;

class Engine {
  // Rendering related
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement | OffscreenCanvas;
  width = 0.0;
  height = 0.0;
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;

  lastTime: number = 0.0;

  camera: Camera;
  input: Input;

  constructor(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) {
    this.canvas = canvas;
    this.gl = gl;
    this._update = this._update.bind(this);

    const vertexShader: WebGLShader = this.compileVS();
    const fragShader: WebGLShader = this.compileFS();

    const program = this.bindShaders(vertexShader, fragShader);

    // Create vertex buffer: one triangle with color lerping
    const vbo = gl.createBuffer(); // vertex buffer object

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Setup Vertex Array Object
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

    const posLocation = gl.getAttribLocation(program, "i_pos");
    const colorLocation = gl.getAttribLocation(program, "i_color");
    const stride = 6 * 4;

    gl.enableVertexAttribArray(posLocation);
    gl.vertexAttribPointer(posLocation, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, stride, 8);

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // SET for internal use

    // rendering context
    this.program = program;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.vao = vao;

    // camera
    this.camera = new Camera(this.width, this.height, vec3.create(), 0, 0, 0);

    // inputs
    this.input = new Input();
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

    // using update as a callback for rendering loop (vsync is forced)
    requestAnimationFrame(this._update);
  }

  _update(time: number) {
    // Engine loop
    const delta = time - this.lastTime;

    let fps = (1000 / delta).toString();
    let text = "";

    // input detection + camera
    this.input.update();

    const movement: vec3 = vec3.create();

    if (this.input.directions.forward) {
      text += " forward";
      vec3.add(movement, movement, this.camera.getForward());
    }
    if (this.input.directions.backward) {
      text += " backward";
      vec3.add(movement, movement, this.camera.getBackward());
    }
    if (this.input.directions.left) {
      text += " left";
      vec3.add(movement, movement, this.camera.getLeft());
    }
    if (this.input.directions.right) {
      text += " right";
      vec3.add(movement, movement, this.camera.getRight());
    }
    if (this.input.directions.up) {
      text += " up";
      vec3.add(movement, movement, this.camera.getUp());
    }
    if (this.input.directions.down) {
      text += " down";
      vec3.add(movement, movement, this.camera.getDown());
    }

    if (vec3.length(movement) > 0) {
      vec3.normalize(movement, movement);
      vec3.scale(movement, movement, speed * delta);
      vec3.add(this.camera.position, this.camera.position, movement);
    }

    // rendering

    const gl = this.gl;

    ImGuiImplWeb.BeginRender();

    ImGui.Begin("My Window");
    ImGui.Text("FPS: " + fps);
    ImGui.Text("Input:" + text);
    ImGui.Text("Camera Postion:" + this.camera.position);
    ImGui.Text("Camera Angle:" + text);
    ImGui.End();

    this.lastTime = time;

    gl.clearColor(0.5, 0.5, 0.5, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // useProgram
    gl.useProgram(this.program);

    // viewport
    gl.viewport(0, 0, this.width, this.height);

    // bind VAO
    gl.bindVertexArray(this.vao);

    // Draw triangle
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    requestAnimationFrame(this._update);

    ImGuiImplWeb.EndRender();
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  dispose() {}
}

export default Engine;
