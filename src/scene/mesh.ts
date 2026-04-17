export type Mesh = {
  vertexData: Float32Array;
  indexData: Uint16Array;
  indexCount: number;
  vao: WebGLVertexArrayObject | null;
  vbo: WebGLVertexArrayObject | null;
  ibo: WebGLBuffer | null;
};

export function createMeshBuffers(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  mesh: Mesh,
) {
  // Setup VAO.
  mesh.vao = gl.createVertexArray();
  gl.bindVertexArray(mesh.vao);

  // Buffer Vertex data.
  mesh.vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.vertexData, gl.STATIC_DRAW);

  // Buffer Index Data.
  mesh.ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indexData, gl.STATIC_DRAW);

  // Attributes.
  const posLocation = gl.getAttribLocation(program, "i_pos");
  const normalLocation = gl.getAttribLocation(program, "i_normal");
  const tangentLocation = gl.getAttribLocation(program, "i_tangent");
  const texLocation = gl.getAttribLocation(program, "i_tex");

  // const colorLocation = gl.getAttribLocation(program, "i_color");
  const stride = 12 * 4;

  // Check for shader attributes.
  if (posLocation !== -1) {
    // Map the attributes.
    gl.enableVertexAttribArray(posLocation);
    gl.vertexAttribPointer(posLocation, 3, gl.FLOAT, false, stride, 0);
  }
  if (normalLocation !== -1) {
    gl.enableVertexAttribArray(normalLocation);
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, stride, 3 * 4);
  }
  if (tangentLocation !== -1) {
    gl.enableVertexAttribArray(tangentLocation);
    gl.vertexAttribPointer(tangentLocation, 3, gl.FLOAT, false, stride, 6 * 4);
  }
  if (texLocation !== -1) {
    gl.enableVertexAttribArray(texLocation);
    gl.vertexAttribPointer(texLocation, 2, gl.FLOAT, false, stride, 10 * 4);
  }

  gl.bindVertexArray(null);
}
