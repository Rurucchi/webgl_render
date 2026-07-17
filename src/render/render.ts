import { vec3 } from "gl-matrix";
import { degToRad } from "../utils";

import Camera from "../engine/camera";

// Assets types
import { Assets } from "../assets/assets";
import { createDepthTexture, Texture } from "../assets/texture"; // Needed for shadowmap texture.
import { Mesh } from "../assets/mesh";
import { Sampler } from "../assets/sampler";
import { Material } from "../assets/material";
import {
  Sun,
  sampleSun,
  getSunBufferSize,
  getSunFloatCount,
} from "../assets/light";

// Shaders
import shadowVS from "./shaders/shadow.vert?raw";
import shadowFS from "./shaders/shadow.frag?raw";
import renderVS from "./shaders/render.vert?raw";
import renderFS from "./shaders/render.frag?raw";

export type RenderContext = {
  // General OpenGL states and context
  gl: WebGL2RenderingContext;
  canvas: {
    canvas: HTMLCanvasElement | OffscreenCanvas;
    width: number;
    height: number;
  };

  // Rendering specific passes context and values
  shadowPassContext: {
    VS: WebGLShader | null;
    FS: WebGLShader | null;
    program: WebGLProgram | null;

    // Pass specific parameters
    shadowmapResolution: number | null;

    cameraBuffer: WebGLBuffer | null;
    shadowmapTexture: WebGLTexture | null;
    shadowmapFramebuffer: WebGLFramebuffer | null;
  };

  renderPassContext: {
    // Generic OpenGL parameters
    VS: WebGLShader | null;
    FS: WebGLShader | null;
    program: WebGLProgram | null;
    useAlphaMaskLoc: WebGLUniformLocation | null;

    // Pass specific parameters
    sunBuffer: WebGLBuffer | null;
    cameraBuffer: WebGLBuffer | null;
  };
};

export function setupRendererContext(
  gl: WebGL2RenderingContext,
  canvas: HTMLCanvasElement | OffscreenCanvas,
): RenderContext {
  const renderContext: RenderContext = {
    gl: gl,
    canvas: {
      canvas: canvas,
      width: canvas.width,
      height: canvas.height,
    },
    shadowPassContext: {
      VS: null,
      FS: null,
      program: null,

      // Pass specific parameters
      shadowmapResolution: null,

      cameraBuffer: null,
      shadowmapTexture: null,
      shadowmapFramebuffer: null,
    },

    renderPassContext: {
      // Generic OpenGL parameters
      VS: null,
      FS: null,
      program: null,
      useAlphaMaskLoc: null,

      // Pass specific parameters
      sunBuffer: null,
      cameraBuffer: null,
    },
  };

  return renderContext;
}

// This is not used outside of this file, but exposed for sanity.
export const renderBackend = {
  // Shader related functions.
  shader: {
    bindShaders(
      renderContext: RenderContext,
      vertexShader: WebGLShader,
      fragShader: WebGLShader,
    ): WebGLProgram {
      const gl = renderContext.gl;

      // Set program
      const program = gl.createProgram();
      if (program) {
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragShader);

        gl.linkProgram(program);
        const status = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!status) {
          const error = gl.getShaderInfoLog(fragShader);
          throw 'Could not link program "' + '" \n' + error;
        }
      }

      return program;
    },
    compileVS(gl: WebGL2RenderingContext, vs: any) {
      // Compile VS
      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      if (vertexShader) {
        gl.shaderSource(vertexShader, vs);
        gl.compileShader(vertexShader);

        const status = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
        if (!status) {
          const error = gl.getShaderInfoLog(vertexShader);
          throw 'Could not compile shader "' + "VS" + '" \n' + error;
        }
      } else {
        throw "Something happened";
      }

      // Compiling success
      return vertexShader;
    },
    compileFS(gl: WebGL2RenderingContext, fs: any) {
      // Compile FS
      const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
      if (fragShader) {
        gl.shaderSource(fragShader, fs);
        gl.compileShader(fragShader);

        const status = gl.getShaderParameter(fragShader, gl.COMPILE_STATUS);
        if (!status) {
          const error = gl.getShaderInfoLog(fragShader);
          throw 'Could not compile shader "' + "FS" + '" \n' + error;
        }
      } else {
        throw "Something happened";
      }

      // Compiling success
      return fragShader;
    },
  },

  // Asset query
  asset: {
    queryTexture(
      assets: Assets,
      texId: string | undefined,
    ): Texture | undefined {
      if (texId) {
        const tex = assets.texBuffer.find((tex) => tex.id === texId);
        return tex;
      } else {
        return undefined;
      }
    },

    querySampler(
      assets: Assets,
      samplerId: string | undefined,
    ): Sampler | undefined {
      if (samplerId) {
        const sampler = assets.samplerBuffer.find(
          (sampler) => sampler.id === samplerId,
        );
        return sampler;
      } else {
        return undefined;
      }
    },

    queryMaterial(
      assets: Assets,
      matId: string | undefined,
    ): Material | undefined {
      if (matId) {
        const mat = assets.matBuffer.find((material) => material.id === matId);
        return mat;
      } else {
        return undefined;
      }
    },
  },

  render: {
    shadowPassDrawMesh(gl: WebGL2RenderingContext, mesh: Mesh) {
      // Binding vertex arrays.
      gl.bindVertexArray(mesh.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);

      gl.drawElements(gl.TRIANGLES, mesh.indexCount, gl.UNSIGNED_SHORT, 0);
    },

    renderPassDrawMesh(
      renderContext: RenderContext,
      assets: Assets,
      mesh: Mesh,
      alphaMode: number,
    ) {
      const gl = renderContext.gl;

      if (alphaMode === 0) {
        // OPAQUE
        gl.disable(gl.BLEND);
        gl.depthMask(true);
      } else if (alphaMode === 1) {
        // MASK
        gl.disable(gl.BLEND);
        gl.depthMask(true);
      } else if (alphaMode === 2) {
        // BLEND
        gl.enable(gl.BLEND);
        gl.depthMask(false);
      }

      // Binding vertex arrays.
      gl.bindVertexArray(mesh.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);

      // todo: change this.
      // Material
      const mat = renderBackend.asset.queryMaterial(assets, mesh.matId);

      // This should be changed
      if (mat) {
        const baseColorTexture: Texture | undefined =
          renderBackend.asset.queryTexture(assets, mat.baseColorTextureId);

        const normalTexture: Texture | undefined =
          renderBackend.asset.queryTexture(assets, mat.normalTextureId);
        const metallicRoughnessTexture: Texture | undefined =
          renderBackend.asset.queryTexture(
            assets,
            mat.metallicRoughnessTextureId,
          );

        // Bind textures
        if (mat.baseColorTextureId && baseColorTexture) {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, baseColorTexture.webGLTexture);

          // Bind sampler
          const sampler = renderBackend.asset.querySampler(
            assets,
            baseColorTexture.samplerId,
          );
          if (sampler) {
            gl.bindSampler(0, sampler.glSampler);
          }
        }

        if (mat.normalTextureId && normalTexture) {
          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, normalTexture.webGLTexture);
          // Bind sampler
          const sampler = renderBackend.asset.querySampler(
            assets,
            normalTexture.samplerId,
          );
          if (sampler) {
            gl.bindSampler(1, sampler.glSampler);
          }
        }

        if (mat.metallicRoughnessTextureId && metallicRoughnessTexture) {
          gl.activeTexture(gl.TEXTURE2);
          gl.bindTexture(gl.TEXTURE_2D, metallicRoughnessTexture.webGLTexture);
          // Bind sampler
          const sampler = renderBackend.asset.querySampler(
            assets,
            metallicRoughnessTexture.samplerId,
          );
          if (sampler) {
            gl.bindSampler(2, sampler.glSampler);
          }
        }

        if (mat?.doubleSided) {
          gl.disable(gl.CULL_FACE);
          gl.cullFace(gl.FRONT_AND_BACK);
        } else {
          gl.enable(gl.CULL_FACE);
          gl.cullFace(gl.BACK);
        }
      }

      gl.drawElements(gl.TRIANGLES, mesh.indexCount, gl.UNSIGNED_SHORT, 0);

      // Remove samplers for Imgui & UI rendering
      gl.bindSampler(0, null);
      gl.bindSampler(1, null);
      gl.bindSampler(2, null);
    },
  },
};

const shadowPass = {
  prepare(renderContext: RenderContext, shadowCamera: Camera) {
    const gl = renderContext.gl;

    const VS = renderBackend.shader.compileVS(gl, shadowVS);
    const FS = renderBackend.shader.compileFS(gl, shadowFS);

    const program = renderBackend.shader.bindShaders(renderContext, VS, FS);

    renderContext.shadowPassContext.cameraBuffer = gl.createBuffer();
    gl.bindBuffer(
      gl.UNIFORM_BUFFER,
      renderContext.shadowPassContext.cameraBuffer,
    );
    gl.bufferData(gl.UNIFORM_BUFFER, shadowCamera.bufferSize, gl.DYNAMIC_DRAW);
    const shadowCamBlockIndex = gl.getUniformBlockIndex(
      program,
      "shadowCamera",
    );
    const shadowCamBindingPoint = 0;
    gl.uniformBlockBinding(program, shadowCamBlockIndex, shadowCamBindingPoint);
    gl.bindBufferBase(
      gl.UNIFORM_BUFFER,
      shadowCamBindingPoint,
      renderContext.shadowPassContext.cameraBuffer,
    );
    // Shadowmap
    renderContext.shadowPassContext.shadowmapResolution = 1024;
    renderContext.shadowPassContext.shadowmapFramebuffer =
      gl.createFramebuffer();
    renderContext.shadowPassContext.shadowmapTexture = gl.createTexture();
    createDepthTexture(
      gl,
      renderContext.shadowPassContext.shadowmapTexture,
      renderContext.shadowPassContext.shadowmapResolution,
      renderContext.shadowPassContext.shadowmapResolution,
    );

    gl.bindFramebuffer(
      gl.FRAMEBUFFER,
      renderContext.shadowPassContext.shadowmapFramebuffer,
    );

    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.TEXTURE_2D,
      renderContext.shadowPassContext.shadowmapTexture,
      0,
    );

    // no color attachment
    gl.drawBuffers([gl.NONE]);

    console.log(gl.checkFramebufferStatus(gl.FRAMEBUFFER));

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    renderContext.shadowPassContext.VS = VS;
    renderContext.shadowPassContext.FS = FS;
    renderContext.shadowPassContext.program = program;
    gl.useProgram(null);
  },

  render(
    renderContext: RenderContext,
    assets: Assets,
    shadowPassCamera: Camera,
  ) {
    const gl = renderContext.gl;
    const shadowPassContext = renderContext.shadowPassContext;

    // Camera data
    const cameraData = new Float32Array(16 + 16 + 4);

    cameraData.set(shadowPassCamera.viewMatrix, 0); // mat4
    cameraData.set(shadowPassCamera.projectionMatrix, 16); // mat4
    cameraData.set(shadowPassCamera.position, 32);
    cameraData[35] = 1.0; // padding

    // --- GL parameters
    gl.useProgram(shadowPassContext.program);

    // Depth testing
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

    // bind for shadowmap texture rendering
    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowPassContext.shadowmapFramebuffer);

    // convert clip space to pixels

    gl.bindBuffer(gl.UNIFORM_BUFFER, shadowPassContext.cameraBuffer);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, cameraData);

    if (shadowPassContext.shadowmapResolution) {
      gl.viewport(
        0,
        0,
        shadowPassContext.shadowmapResolution,
        shadowPassContext.shadowmapResolution,
      );
    } else {
      gl.viewport(0, 0, 1024, 1024);
    }

    // clear color
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // rendering
    assets.meshBuffer.opaque.forEach((mesh) => {
      renderBackend.render.shadowPassDrawMesh(gl, mesh);
    });
    assets.meshBuffer.blend.forEach((mesh) => {
      renderBackend.render.shadowPassDrawMesh(gl, mesh);
    });
    assets.meshBuffer.mask.forEach((mesh) => {
      renderBackend.render.shadowPassDrawMesh(gl, mesh);
    });

    // Framebuffer
    // gl.bindFramebuffer(gl.FRAMEBUFFER, shadowPassContext.shadowmapFramebuffer);
    // const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    // console.log(status === gl.FRAMEBUFFER_COMPLETE, status);

    gl.bindTexture(gl.TEXTURE_2D, null);

    // Disable Depth testing
    gl.disable(gl.DEPTH_TEST);

    gl.useProgram(null);
  },
};

const renderPass = {
  prepare(renderContext: RenderContext, gameCamera: Camera) {
    const gl = renderContext.gl;

    const VS = renderBackend.shader.compileVS(gl, renderVS);
    const FS = renderBackend.shader.compileFS(gl, renderFS);

    const program = renderBackend.shader.bindShaders(renderContext, VS, FS);

    gl.useProgram(program);
    gl.viewport(0, 0, renderContext.canvas.width, renderContext.canvas.height);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Setup Camera UBO
    const cameraBuffer = gl.createBuffer();
    gl.bindBuffer(gl.UNIFORM_BUFFER, cameraBuffer);
    gl.bufferData(gl.UNIFORM_BUFFER, gameCamera.bufferSize, gl.DYNAMIC_DRAW);
    const camBlockIndex = gl.getUniformBlockIndex(program, "Camera");
    const camBindingPoint = 0;
    gl.uniformBlockBinding(program, camBlockIndex, camBindingPoint);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, camBindingPoint, cameraBuffer);

    // Setup Light UBO
    const sunBuffer = gl.createBuffer();
    gl.bindBuffer(gl.UNIFORM_BUFFER, sunBuffer);
    // In bytes
    gl.bufferData(gl.UNIFORM_BUFFER, getSunBufferSize(), gl.DYNAMIC_DRAW);
    const sunBlockIndex = gl.getUniformBlockIndex(program, "uSun");
    const sunBindingPoint = 1;
    gl.uniformBlockBinding(program, sunBlockIndex, sunBindingPoint);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, sunBindingPoint, sunBuffer);

    // Samplers & texture slots
    const texSamplerLoc = gl.getUniformLocation(program, "uTex");
    gl.uniform1i(texSamplerLoc, 0); // 0 = TEXTURE0
    const normalSamplerLoc = gl.getUniformLocation(program, "uNormal");
    gl.uniform1i(normalSamplerLoc, 1); // 1 = TEXTURE1
    const metallicSamplerSamplerLoc = gl.getUniformLocation(
      program,
      "uMetallicRoughness",
    );
    gl.uniform1i(metallicSamplerSamplerLoc, 2); // 2 = TEXTURE2

    // AlphaCutoff
    const useAlphaMaskLoc = gl.getUniformLocation(program, "uUseAlphaMask");

    // rendering context
    renderContext.renderPassContext.program = program;
    renderContext.renderPassContext.useAlphaMaskLoc = useAlphaMaskLoc;
    renderContext.renderPassContext.cameraBuffer = cameraBuffer;
    renderContext.renderPassContext.cameraBuffer = cameraBuffer;
    renderContext.renderPassContext.sunBuffer = sunBuffer;
    renderContext.renderPassContext.VS = VS;
    renderContext.renderPassContext.FS = FS;

    gl.useProgram(null);
  },

  render(renderContext: RenderContext, assets: Assets, gameCamera: Camera) {
    const gl = renderContext.gl;
    const renderPassContext = renderContext.renderPassContext;

    const cameraData = new Float32Array(16 + 16 + 4);

    cameraData.set(gameCamera.viewMatrix, 0); // mat4
    cameraData.set(gameCamera.projectionMatrix, 16); // mat4
    cameraData.set(gameCamera.position, 32);
    cameraData[35] = 1.0; // padding

    // sun
    const sun: Sun = {
      dir: vec3.fromValues(0.1, 1.0, 0.0),
      // color: vec3.fromValues(1.0, 0.95, 0.8), // Blue
      color: vec3.fromValues(1.0, 1.0, 1.0),
      // position vector (std140 layout rounds it to 16 bytes, 4 * 4)
      bufferSize: getSunBufferSize(),
    };

    // Reset framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, renderContext.canvas.width, renderContext.canvas.height);

    gl.useProgram(renderPassContext.program);

    gl.clearColor(0.5, 0.6, 0.7, 0.5);

    // Depth testing
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

    // Blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, renderPassContext.cameraBuffer);

    // bind Camera buffer
    gl.bindBuffer(gl.UNIFORM_BUFFER, renderPassContext.cameraBuffer);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, cameraData);

    // Upload sun data
    const sunData = new Float32Array(getSunFloatCount());
    sunData.set(sun.dir, 0);
    sunData.set(sun.color, 4);

    // bind Sun data
    gl.bindBuffer(gl.UNIFORM_BUFFER, renderPassContext.sunBuffer);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, sunData);

    // opaque meshes pass
    assets.meshBuffer.opaque.forEach((mesh) => {
      renderBackend.render.renderPassDrawMesh(renderContext, assets, mesh, 0);
    });

    // mask
    gl.uniform1i(renderPassContext.useAlphaMaskLoc, 1); // enable AlphaCutoff
    assets.meshBuffer.mask.forEach((mesh) => {
      renderBackend.render.renderPassDrawMesh(renderContext, assets, mesh, 1);
    });
    gl.uniform1i(renderPassContext.useAlphaMaskLoc, 0); // disable AlphaCutoff

    // blend

    assets.meshBuffer.blend.forEach((mesh) => {
      renderBackend.render.renderPassDrawMesh(renderContext, assets, mesh, 2);
    });

    gl.useProgram(null);
  },
};

// Interface
export const Renderer = {
  shadowPass: shadowPass,
  renderPass: renderPass,
};
