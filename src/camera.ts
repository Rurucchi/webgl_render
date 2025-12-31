import { vec3, mat4 } from "gl-matrix";

export default class Camera {
  public viewportWidth: number = 0;
  public viewportHeight: number = 0;
  public position: vec3; // x, y, z
  public target: vec3;
  public yaw: number = 0; // clamped between 0 and 360 (circular horizontal movement), radiants
  public pitch: number = 0; // clamped between 0 and 90 (circular vertical movement), radiants
  public fov: number = 0; // degrees
  public projectionMatrix: mat4 = mat4.create();
  public inverseProjectionMatrix: mat4 = mat4.create();

  constructor(
    viewportWidth: number,
    viewportHeight: number,
    position: vec3,
    target: vec3,
    yaw: number,
    pitch: number,
    fov: number
  ) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.position = position;
    this.target = target;
    this.yaw = yaw;
    this.pitch = pitch;
    this.fov = fov;
  }

  // Camera movements
  updateTarget() {
    let forward: vec3 = vec3.create();
    forward[0] = Math.cos(this.pitch) * Math.sin(this.yaw);
    forward[1] = Math.sin(this.pitch);
    forward[2] = -Math.cos(this.pitch) * Math.cos(this.yaw);
    this.target = forward;
  }

  moveForward() {}

  moveLeft() {}
}
