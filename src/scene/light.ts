import { vec3 } from "gl-matrix";
// export type Light = {
//   pos: vec3;
//   color: vec3;
//   intensity: number;
// };

export type Sun = {
  dir: vec3;
  color: vec3;
  bufferSize: number;
};

export function getSunFloatCount() {
  return 8;
}

export function getSunBufferSize() {
  return 4 * 4 + 4 * 4;
}
