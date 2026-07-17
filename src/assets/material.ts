import { vec3, vec4 } from "gl-matrix";
import type { GLTFMaterialPostprocessed } from "@loaders.gl/gltf";

export type Material = {
  id: string;
  alphaMode?: string;
  alphaCutoff?: number;
  doubleSided?: boolean;
  emissiveFactor?: vec3; // Not used
  baseColorFactor?: vec4;
  baseColorTextureId?: string;
  normalTextureId?: string;
  metallicRoughnessTextureId?: string;
};

export function createMaterial(mat: GLTFMaterialPostprocessed): Material {
  // Textures
  const baseColorTextureId =
    mat.pbrMetallicRoughness?.baseColorTexture?.texture.id;
  const normalTextureId: string | undefined = mat.normalTexture?.texture.id;
  const metallicRoughnessTextureId: string | undefined =
    mat.pbrMetallicRoughness?.metallicRoughnessTexture?.texture.id;

  // Material properties
  const material: Material = {
    id: mat.id,
    alphaMode: mat.alphaMode,
    alphaCutoff: mat.alphaCutoff,
    doubleSided: mat.doubleSided,
    emissiveFactor: mat.emissiveFactor,
    baseColorFactor: mat.pbrMetallicRoughness?.baseColorFactor,
    baseColorTextureId: baseColorTextureId,
    normalTextureId: normalTextureId,
    metallicRoughnessTextureId: metallicRoughnessTextureId,
  };
  return material;
}
