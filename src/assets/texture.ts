// import { isPowerOf2 } from "../utils";

const skybox_top = `${import.meta.env.BASE_URL}assets/skybox_top.jpg`;

export type Texture = {
  id: string;
  width: number;
  height: number;
  webGLTexture: WebGLTexture | null; // OpenGL texture
  samplerId: string | undefined;
};

export async function createTexture(
  gl: WebGL2RenderingContext,
  id: string,
  width: number,
  height: number,
  mimeType: string,
  imageData: Uint8Array,
  samplerId: string | undefined,
) {
  // This should not be made like this; but browser limitations forces such workaround.

  const copied = new Uint8Array(imageData);

  const blob = new Blob([copied], { type: mimeType });

  const imageBitmap = await createImageBitmap(blob);

  // WebGL Texture.
  const glTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, glTex);

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    imageBitmap,
  );

  gl.generateMipmap(gl.TEXTURE_2D);

  const texture: Texture = {
    id: id,
    width: width,
    height: height,
    webGLTexture: glTex,
    samplerId: samplerId,
  };

  return texture;
}

export function createDepthTexture(
  gl: WebGL2RenderingContext,
  glTex: WebGLTexture,
  width: number,
  height: number,
) {
  gl.bindTexture(gl.TEXTURE_2D, glTex);

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.DEPTH_COMPONENT24,
    width,
    height,
    0,
    gl.DEPTH_COMPONENT,
    gl.UNSIGNED_INT,
    null,
  );

  // Texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.bindTexture(gl.TEXTURE_2D, null);
}

export function createFramebufferTexture(
  gl: WebGL2RenderingContext,
  glTex: WebGLTexture,
  width: number,
  height: number,
) {
  gl.bindTexture(gl.TEXTURE_2D, glTex);

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA16F, // HDR
    width,
    height,
    0,
    gl.RGBA,
    gl.HALF_FLOAT,
    null,
  );

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

// this should not be hardcoded
export async function createSkyboxCubeMap(gl: WebGL2RenderingContext) {
  const cubemap = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemap);

  const faces = [
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, image: "skybox_right.jpg" },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, image: "skybox_left.jpg" },
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, image: "skybox_top.jpg" },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, image: "skybox_bottom.jpg" },
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, image: "skybox_front.jpg" },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, image: "skybox_back.jpg" },
  ];

  for (const face of faces) {
    const response = await fetch(
      `${import.meta.env.BASE_URL}assets/${face.image}`,
    );

    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);

    gl.texImage2D(face.target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
  }
  const status = gl.getError();

  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

  return cubemap;
}
