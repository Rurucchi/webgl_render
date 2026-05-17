// GLTF
import { load } from "@loaders.gl/core";
import { GLTFLoader, postProcessGLTF } from "@loaders.gl/gltf";
import type { GLTFPostprocessed, GLTFWithBuffers } from "@loaders.gl/gltf";
import {
  createMesh,
  interleaveVertices,
  createMeshGLBuffers,
  type Mesh,
} from "../render/mesh";
import { createTexture, type Texture } from "../render/texture";
import { createMaterial, type Material } from "../render/material";
import { createSampler, type Sampler } from "../render/sampler";

export default class GLTFModel {
  async loadAssets(url: string) {
    // Load and parse a file
    try {
      const gltfWithBuffers: GLTFWithBuffers = await load(url, GLTFLoader, {
        baseUri: `${import.meta.env.BASE_URL}assets/`,
        fetch: async (url: string) => {
          console.log("FETCH:", url);
          const res = await fetch(url);
          console.log("→", res.status, res.headers.get("content-type"));
          return res;
        },
      });

      const processedGLTF = postProcessGLTF(gltfWithBuffers);
      return processedGLTF;
    } catch (err) {
      console.error(err);
    }
  }

  processNodes(
    gl: WebGL2RenderingContext,
    processedGLTF: GLTFPostprocessed,
    glProgram: WebGLProgram,
    meshBuffer: Array<Mesh>,
  ) {
    // console.log(processedGLTF);
    for (const node of processedGLTF.nodes) {
      // check node is empty
      const meshInfo = node.mesh;
      if (!meshInfo) {
        continue;
      }
      if (node.mesh?.primitives) {
        for (const primitive of node.mesh?.primitives) {
          if (node.mesh) {
            this.processMesh(gl, primitive, glProgram, meshBuffer);
          }
        }
      }
    }
  }

  processMesh(
    gl: WebGL2RenderingContext,
    primitiveGLTF: any,
    glProgram: WebGLProgram,
    meshBuffer: Array<Mesh>,
  ) {
    const floatsPerVertex = 12;

    if (primitiveGLTF.attributes.TANGENT) {
      // Assuming the vertex data has the same number of component per vertex.
      const position = primitiveGLTF.attributes.POSITION;
      const normal = primitiveGLTF.attributes.NORMAL;
      const tangent = primitiveGLTF.attributes.TANGENT;
      const texPos = primitiveGLTF.attributes.TEXCOORD_0;
      const pbrMetallicRoughness = primitiveGLTF.material.pbrMetallicRoughness;

      const indexData = primitiveGLTF.indices.value;
      const indexCount = primitiveGLTF.indices.count;
      const matId = primitiveGLTF.material.id;
      const texId = pbrMetallicRoughness.baseColorTexture.texture.id;
      const texIndex = pbrMetallicRoughness.baseColorTexture.texture.index;

      const count = position.count;
      if (
        normal.count === count &&
        texPos.count === count &&
        tangent.count === count
      ) {
        const mesh = createMesh(
          count,
          floatsPerVertex,
          indexData,
          indexCount,
          matId,
          texId,
          texIndex,
        );

        interleaveVertices(
          mesh,
          count,
          floatsPerVertex,
          position,
          normal,
          tangent,
          texPos,
        );

        createMeshGLBuffers(gl, glProgram, mesh);

        // Checking mask to determine draw order.
        if (
          primitiveGLTF.material.alphaMode === "MASK" ||
          primitiveGLTF.material.alphaMode === "BLEND"
        ) {
          meshBuffer.push(mesh);
        } else {
          meshBuffer.unshift(mesh);
        }
      }
    }
  }

  // This function is async because it involves async browser API calls.
  async processTextures(
    gl: WebGL2RenderingContext,
    processedGLTF: GLTFPostprocessed,
    texBuffer: Array<Texture>,
  ) {
    // Promises to try parallelizing decoding on Chromium based browsers. Firefox forces singlethread (even with workers).
    const texturePromises = processedGLTF.textures.map(async (tex) => {
      // Check that texture object is not empty.
      if (
        tex.id &&
        tex.source?.image.width &&
        tex.source?.image.height &&
        tex.source?.mimeType &&
        tex.source?.bufferView?.data &&
        tex.sampler
      ) {
        const id = tex.id;
        const width = tex.source?.image.width;
        const height = tex.source?.image.height;
        const mimeType = tex.source?.mimeType;
        const data = tex.source?.bufferView?.data;
        const samplerId = tex.sampler?.id;

        const texture = await createTexture(
          gl,
          id,
          width,
          height,
          mimeType,
          data,
          samplerId,
        );

        texBuffer.push(texture);
      }
    });
    await Promise.all(texturePromises);
  }

  processMaterials(
    processedGLTF: GLTFPostprocessed,
    matBuffer: Array<Material>,
  ) {
    for (const mat of processedGLTF.materials) {
      const material: Material = createMaterial(mat);
      matBuffer.push(material);
    }
  }

  // This is unnecessary as there is only one sampler in the GLTF data.
  // This was added for sanity purposes.
  processSampler(
    gl: WebGL2RenderingContext,
    processedGLTF: GLTFPostprocessed,
    samplerBuffer: Array<Sampler>,
  ) {
    processedGLTF.samplers.forEach((texSampler) => {
      const id: string = texSampler.id;
      const magFilter: number | undefined = texSampler.magFilter;
      const minFilter: number | undefined = texSampler.minFilter;
      const parameters: any = texSampler.parameters;
      const wrapS: number | undefined = texSampler.wrapS;
      const wrapT: number | undefined = texSampler.wrapT;

      const sampler = createSampler(
        gl,
        id,
        magFilter,
        minFilter,
        parameters,
        wrapS,
        wrapT,
      );

      samplerBuffer.push(sampler);
    });
  }
}
