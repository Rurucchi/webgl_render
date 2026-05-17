import { isPowerOf2 } from "../utils";

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
