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

export type MeshBuffer = {
  opaque: Array<Mesh>;
  mask: Array<Mesh>;
  blend: Array<Mesh>;
};

export function initMeshBuffer() {
  const meshBuffer: MeshBuffer = {
    opaque: new Array<Mesh>(),
    mask: new Array<Mesh>(),
    blend: new Array<Mesh>(),
  };
  return meshBuffer;
}

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
  scale: number,
) {
  // Interleave vertices.
  for (let i = 0; i < vertexCount; i++) {
    const base = i * floatsPerVertex;

    // POSITION (vec3)
    mesh.vertexData[base + 0] = scaleFloat(position.value[i * 3 + 0], scale);
    mesh.vertexData[base + 1] = scaleFloat(position.value[i * 3 + 1], scale);
    mesh.vertexData[base + 2] = scaleFloat(position.value[i * 3 + 2], scale);

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

export function createMeshGLBuffers(gl: WebGL2RenderingContext, mesh: Mesh) {
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

  const stride = 12 * 4;

  // Attributes. This has been replaced in favor of permanently assigned attributes locations.
  // const posLocation = gl.getAttribLocation(program, "i_pos");
  // const normalLocation = gl.getAttribLocation(program, "i_normal");
  // const tangentLocation = gl.getAttribLocation(program, "i_tangent");
  // const texLocation = gl.getAttribLocation(program, "i_tex");

  // // Check for shader attributes.
  // if (posLocation !== -1) {
  //   // Map the attributes.
  //   gl.enableVertexAttribArray(posLocation);
  //   gl.vertexAttribPointer(posLocation, 3, gl.FLOAT, false, stride, 0);
  // }
  // if (normalLocation !== -1) {
  //   gl.enableVertexAttribArray(normalLocation);
  //   gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, stride, 3 * 4);
  // }
  // if (tangentLocation !== -1) {
  //   gl.enableVertexAttribArray(tangentLocation);
  //   gl.vertexAttribPointer(tangentLocation, 4, gl.FLOAT, false, stride, 6 * 4);
  // }
  // if (texLocation !== -1) {
  //   gl.enableVertexAttribArray(texLocation);
  //   gl.vertexAttribPointer(texLocation, 2, gl.FLOAT, false, stride, 10 * 4);
  // }

  // Map the attributes.
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);

  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 3 * 4);

  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 4, gl.FLOAT, false, stride, 6 * 4);

  gl.enableVertexAttribArray(3);
  gl.vertexAttribPointer(3, 2, gl.FLOAT, false, stride, 10 * 4);

  gl.bindVertexArray(null);
}

function scaleFloat(scale: number, float: number) {
  return float * scale;
}
