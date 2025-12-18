const vs =
  `#version 300 es
precision mediump float;

in vec2 i_pos;
in vec4 i_color;

out vec4 o_color;

void main()
{
  o_color = i_color;
  gl_Position = vec4(i_pos, 0.0, 1.0);
}
`;

const fs =
  `#version 300 es
precision mediump float;

in vec4 o_color;

out vec4 o_FragColor;

void main()
{
  o_FragColor = o_color;
}
`;

class Engine {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement | OffscreenCanvas;

  lastTime: number = 0.0;

  width = 0.0;
  height = 0.0;

  program: WebGLProgram;
  vao: WebGLVertexArrayObject;

  constructor(canvas: HTMLCanvasElement | OffscreenCanvas, gl: WebGL2RenderingContext) {
    this.canvas = canvas;
    this.gl = gl;
    this._update = this._update.bind(this);

    // Compile VS and FS
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (vertexShader) {
      gl.shaderSource(vertexShader, vs);
      gl.compileShader(vertexShader);

      const status = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
      if (!status) {
        const error = gl.getShaderInfoLog(vertexShader);
        throw "Could not compile shader \"" + "VS" + "\" \n" + error;
      }
    }
    else {
      throw "Something happened";
    }

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (fragShader) {
      gl.shaderSource(fragShader, fs);
      gl.compileShader(fragShader);

      const status = gl.getShaderParameter(fragShader, gl.COMPILE_STATUS);
      if (!status) {
        const error = gl.getShaderInfoLog(fragShader);
        throw "Could not compile shader \"" + "FS" + "\" \n" + error;
      }
    }
    else {
      throw "Something happened";
    }

    // Set program
    const program = gl.createProgram();
    if (program) {
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragShader);

      gl.linkProgram(program);
      const status = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (!status) {
        const error = gl.getShaderInfoLog(fragShader);
        throw "Could not link program \"" + "\" \n" + error;
      }
    }

    // Create vertex buffer: one triangle with color lerping
    const vbo = gl.createBuffer(); // vertex buffer object
    const vertices = new Float32Array([
      0.00, +0.75, 1, 1, 1, 1,
      0.75, -0.50, 0, 1, 1, 1,
      -0.75, -0.50, 0, 1, 1, 1,
    ]);
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
    this.program = program;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.vao = vao;
  }

  start() {
    requestAnimationFrame(this._update);
  }

  _update(time: number) {
    // Engine loop
    const delta = time - this.lastTime;
    const gl = this.gl;

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
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  dispose() {
  }
}

export default Engine;