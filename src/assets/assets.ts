import { initMeshBuffer, MeshBuffer } from "./mesh";
import { Texture } from "./texture";
import { Material } from "./material";
import { Sampler } from "./sampler";
import { GLTFModel } from "../scene/GLTFModel";

export type Assets = {
  meshBuffer: MeshBuffer;
  texBuffer: Array<Texture>;
  matBuffer: Array<Material>;
  samplerBuffer: Array<Sampler>;
};

export async function prepareAssets(gl: WebGL2RenderingContext) {
  const assets: Assets = {
    meshBuffer: initMeshBuffer(),
    texBuffer: new Array<Texture>(),
    matBuffer: new Array<Material>(),
    samplerBuffer: new Array<Sampler>(),
  };

  const assetsPath = `${import.meta.env.BASE_URL}assets/Sponza.gltf`;
  const processedGLTF = await GLTFModel.loadAssets(
    // For supporting URL paths
    assetsPath,
  );

  console.log(processedGLTF);

  if (processedGLTF) {
    // Meshes
    GLTFModel.processNodes(gl, processedGLTF, assets);

    // Textures
    GLTFModel.processTextures(gl, processedGLTF, assets);

    // Samplers
    GLTFModel.processSampler(gl, processedGLTF, assets);

    // Materials
    await GLTFModel.processMaterials(processedGLTF, assets);
  } else {
    throw new Error("GLTF processing failed.");
  }

  return assets;
}
