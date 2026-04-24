// GLTF
import { load } from "@loaders.gl/core";
import { GLTFLoader, postProcessGLTF } from "@loaders.gl/gltf";
import type { GLTFPostprocessed, GLTFWithBuffers } from "@loaders.gl/gltf";
import type { Mesh } from "./mesh";
import type { Texture } from "./texture";

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

  processNodes(processedGLTF: GLTFPostprocessed, meshBuffer: Array<Mesh>) {
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
            this.processMesh(primitive, meshBuffer);
          }
        }
      }
    }
  }

  processMesh(primitiveGLTF: any, meshBuffer: Array<Mesh>) {
    console.log(primitiveGLTF);
    if (primitiveGLTF.attributes.TANGENT) {
      // Assuming the vertex data has the same number of component per vertex.
      const position = primitiveGLTF.attributes.POSITION;
      const normal = primitiveGLTF.attributes.NORMAL;
      const tangent = primitiveGLTF.attributes.TANGENT;
      const texPos = primitiveGLTF.attributes.TEXCOORD_0;
      const pbrMetallicRoughness = primitiveGLTF.material.pbrMetallicRoughness;

      const count = position.count;
      if (
        normal.count === count &&
        texPos.count === count &&
        tangent.count === count
      ) {
        // vertexBuffer size = vertices count * attributes count.

        const floatsPerVertex = 12;
        const newMesh: Mesh = {
          vertexData: new Float32Array(count * floatsPerVertex),
          indexData: primitiveGLTF.indices.value,
          indexCount: primitiveGLTF.indices.count,
          texId: pbrMetallicRoughness.baseColorTexture.texture.id,
          texIndex: pbrMetallicRoughness.baseColorTexture.texture.index,
          vao: null,
          vbo: null,
          ibo: null,
        };

        // Interleave vertices.
        for (let i = 0; i < count; i++) {
          const base = i * floatsPerVertex;

          // POSITION (vec3)
          newMesh.vertexData[base + 0] = position.value[i * 3 + 0];
          newMesh.vertexData[base + 1] = position.value[i * 3 + 1];
          newMesh.vertexData[base + 2] = position.value[i * 3 + 2];

          // NORMAL (vec3)
          newMesh.vertexData[base + 3] = normal.value[i * 3 + 0];
          newMesh.vertexData[base + 4] = normal.value[i * 3 + 1];
          newMesh.vertexData[base + 5] = normal.value[i * 3 + 2];

          // TANGENT (vec4)
          newMesh.vertexData[base + 6] = tangent.value[i * 4 + 0];
          newMesh.vertexData[base + 7] = tangent.value[i * 4 + 1];
          newMesh.vertexData[base + 8] = tangent.value[i * 4 + 2];
          newMesh.vertexData[base + 9] = tangent.value[i * 4 + 3];

          // TEXCOORD (vec2)
          newMesh.vertexData[base + 10] = texPos.value[i * 2 + 0];
          newMesh.vertexData[base + 11] = texPos.value[i * 2 + 1];
        }

        // Checking mask as transparency materials should be drawn after opaque ones
        if (
          primitiveGLTF.material.alphaMode === "MASK" ||
          primitiveGLTF.material.alphaMode === "BLEND"
        ) {
          meshBuffer.push(newMesh);
        } else {
          meshBuffer.unshift(newMesh);
        }
      }
    }
  }

  async processTextures(
    processedGLTF: GLTFPostprocessed,
    texBuffer: Array<Texture>,
  ) {
    for (const tex of processedGLTF.textures) {
      // Check that texture object is not empty.
      if (
        tex.id &&
        tex.source?.image.width &&
        tex.source?.image.height &&
        tex.source?.image &&
        tex.source?.mimeType &&
        tex.source?.bufferView?.data
      ) {
        // This should not be made like this; but GLTFPostprocessed forces such workaround.
        const blob = new Blob([tex.source?.bufferView.data.slice(0)], {
          type: "image/jpeg",
        });
        const imageBitmap = await createImageBitmap(blob);

        const texture: Texture = {
          id: tex.id,
          width: tex.source?.image.width,
          height: tex.source?.image.height,
          image: imageBitmap,
          webGLTexture: null,
        };

        texBuffer.push(texture);
      }
    }
  }
}
