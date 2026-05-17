export type Mesh = {
  vertexData: Float32Array;
  indexData: Uint16Array;
  indexCount: number;
  matId: string;
  texId: string;
  texIndex: number;
  vao: WebGLVertexArrayObject | null;
  vbo: WebGLVertexArrayObject | null;
  ibo: WebGLBuffer | null;
};

export function createMesh(
  vertexCount: number,
  floatsPerVertex: number,
  indexData: Uint16Array,
  indexCount: number,
  matId: string,
  texId: string,
  texIndex: number,
) {
  // This should be somewhere else for modularity

  // Mesh data
  const mesh: Mesh = {
    // vertexBuffer size = vertices count * attributes count.
    vertexData: new Float32Array(vertexCount * floatsPerVertex),
    indexData: indexData,
    indexCount: indexCount,
    matId: matId,
    texId: texId,
    texIndex: texIndex,
    vao: null,
    vbo: null,
    ibo: null,
  };

  return mesh;
}

export function interleaveVertices(
  mesh: Mesh,
  vertexCount: number,
  floatsPerVertex: number,
  position: any,
  normal: any,
  tangent: any,
  texPos: any,
) {
  // Interleave vertices.
  for (let i = 0; i < vertexCount; i++) {
    const base = i * floatsPerVertex;

    // POSITION (vec3)
    mesh.vertexData[base + 0] = position.value[i * 3 + 0];
    mesh.vertexData[base + 1] = position.value[i * 3 + 1];
    mesh.vertexData[base + 2] = position.value[i * 3 + 2];

    // NORMAL (vec3)
    mesh.vertexData[base + 3] = normal.value[i * 3 + 0];
    mesh.vertexData[base + 4] = normal.value[i * 3 + 1];
    mesh.vertexData[base + 5] = normal.value[i * 3 + 2];

    // TANGENT (vec4)
    mesh.vertexData[base + 6] = tangent.value[i * 4 + 0];
    mesh.vertexData[base + 7] = tangent.value[i * 4 + 1];
    mesh.vertexData[base + 8] = tangent.value[i * 4 + 2];
    mesh.vertexData[base + 9] = tangent.value[i * 4 + 3];

    // TEXCOORD (vec2)
    mesh.vertexData[base + 10] = texPos.value[i * 2 + 0];
    mesh.vertexData[base + 11] = texPos.value[i * 2 + 1];
  }
}

export function createMeshGLBuffers(
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
    gl.vertexAttribPointer(tangentLocation, 4, gl.FLOAT, false, stride, 6 * 4);
  }
  if (texLocation !== -1) {
    gl.enableVertexAttribArray(texLocation);
    gl.vertexAttribPointer(texLocation, 2, gl.FLOAT, false, stride, 10 * 4);
  }

  gl.bindVertexArray(null);
}
