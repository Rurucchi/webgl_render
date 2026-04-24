import { isPowerOf2 } from "../utils";

export type Texture = {
  id: string;
  width: number;
  height: number;
  image: ImageBitmap;
  webGLTexture: WebGLTexture | null; // OpenGL texture type.
};

export function initTexture(gl: WebGL2RenderingContext, tex: Texture): void {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    tex.width,
    tex.height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    tex.image,
  );

  if (isPowerOf2(tex.width) && isPowerOf2(tex.height)) {
    gl.generateMipmap(gl.TEXTURE_2D);
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }

  tex.webGLTexture = texture;
}
