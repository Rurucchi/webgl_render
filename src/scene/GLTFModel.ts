// GLTF
import { vec3 } from "gl-matrix";
import { load } from "@loaders.gl/core";
import { GLTFLoader, postProcessGLTF } from "@loaders.gl/gltf";
import type { GLTFPostprocessed, GLTFWithBuffers } from "@loaders.gl/gltf";
import type { Mesh } from "./mesh";

export default class GLTFModel {
  async loadAssets(url: string) {
    // Load and parse a file
    try {
      const gltfWithBuffers: GLTFWithBuffers = await load(url, GLTFLoader, {
        baseUri: "/assets/",
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
    console.log(processedGLTF);
    for (const node of processedGLTF.nodes) {
      // check node is empty
      const meshInfo = node.mesh;
      if (!meshInfo) {
        continue;
      }

      if (node.mesh?.primitives) {
        for (const primitive of node.mesh?.primitives) {
          // console.log(primitive);
          if (node.mesh) {
            this.interleaveVertices(primitive, meshBuffer);
          }
        }
      }
    }
  }

  interleaveVertices(primitiveGLTF: any, meshBuffer: Array<Mesh>) {
    // console.log(primitiveGLTF);
    // const vertexCount = primitiveGLTF.positions.length / 3;
    if (primitiveGLTF.attributes.TANGENT) {
      // Assuming the vertex data has the same number of component per vertex.
      const position = primitiveGLTF.attributes.POSITION;
      const normal = primitiveGLTF.attributes.NORMAL;
      const tangent = primitiveGLTF.attributes.TANGENT;
      const tex = primitiveGLTF.attributes.TEXCOORD_0;

      const count = position.count;
      if (
        normal.count === count &&
        tex.count === count &&
        tangent.count === count
      ) {
        // vertexBuffer size = vertices count * attributes count.

        const floatsPerVertex = 12;
        const newMesh: Mesh = {
          vertexData: new Float32Array(count * floatsPerVertex),
          indexData: primitiveGLTF.indices.value,
          indexCount: primitiveGLTF.indices.count,
          vao: null,
          vbo: null,
          ibo: null,
        };

        // Transpose GLTF data for the renderer.
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
          newMesh.vertexData[base + 10] = tex.value[i * 2 + 0];
          newMesh.vertexData[base + 11] = tex.value[i * 2 + 1];
        }

        meshBuffer.push(newMesh);
        // console.log({ position, normal, tex });
        // console.log(newMesh);
      }
    }
  }
}
