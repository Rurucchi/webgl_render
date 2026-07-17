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

export const sampleSun: Sun = {
  dir: vec3.fromValues(0.1, 1.0, 0.0),
  // color: vec3.fromValues(1.0, 0.95, 0.8), // Blue
  color: vec3.fromValues(1.0, 1.0, 1.0),
  // position vector (std140 layout rounds it to 16 bytes, 4 * 4)
  bufferSize: getSunBufferSize(),
};
