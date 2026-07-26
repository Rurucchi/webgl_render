import cube from "../scene/sample/cube";
import { createSkyboxCubeMap } from "./texture";

export type Skybox = {
  vertexData: Float32Array;
  indexData: Uint16Array;
  indexCount: number;
  vao: WebGLVertexArrayObject | null;
  vbo: WebGLVertexArrayObject | null;
  ibo: WebGLBuffer | null;
  texture: WebGLTexture;
};

export async function createSkybox(gl: WebGL2RenderingContext) {
  // Create vertex buffer
  const vbo = gl.createBuffer(); // vertex buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

  // Setup Vertex Array Object
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, cube.vertices, gl.STATIC_DRAW);

  // Create index buffer
  const ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cube.indices, gl.STATIC_DRAW);

  const stride = 12 * 4;

  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);

  const texture = await createSkyboxCubeMap(gl);
  const skybox: Skybox = {
    vertexData: cube.vertices,
    indexData: cube.indices,
    indexCount: cube.indices.length,
    vao: vao,
    vbo: vbo,
    ibo: ibo,
    texture: texture,
  };

  gl.bindVertexArray(null);

  return skybox;
}
