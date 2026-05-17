import { vec3, mat4 } from "gl-matrix";

const worldUp: vec3 = vec3.fromValues(0, 1, 0);
const near = 0.2;
const far = 10000.0;

export default class Camera {
  public freeMouse: boolean = true;
  public viewportWidth: number = 0;
  public viewportHeight: number = 0;
  public position: vec3; // x, y, z
  public yaw: number = 0; // clamped between 0 and 360 (circular horizontal movement), radiants
  public pitch: number = 0; // clamped between 0 and 90 (circular vertical movement), radiants
  public fov: number = 0; // degrees
  public viewMatrix: mat4 = mat4.create();
  public projectionMatrix: mat4 = mat4.create();
  public inverseProjectionMatrix: mat4 = mat4.create();
  public bufferSize: number;

  constructor(
    viewportWidth: number,
    viewportHeight: number,
    position: vec3,
    yaw: number,
    pitch: number,
    fov: number,
  ) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.position = position;
    this.yaw = yaw;
    this.pitch = pitch;
    this.fov = fov;
    this.bufferSize = this.getBufferSize();
  }

  // Buffer size for ubo
  getBufferSize(): number {
    let bufferSize: number =
      // view matrix
      16 * 4 +
      // projectionMatrix
      16 * 4 +
      // position vector (std140 layout rounds it to 16 bytes)
      4 * 4;

    return bufferSize;
  }

  // Camera movements
  getForward(): vec3 {
    let forward: vec3 = vec3.create();
    forward[0] = Math.cos(this.pitch) * Math.sin(this.yaw);
    forward[1] = Math.sin(this.pitch);
    forward[2] = -Math.cos(this.pitch) * Math.cos(this.yaw);
    return forward;
  }

  getFlatForward(): vec3 {
    const forward = this.getForward();
    const flatForward = vec3.fromValues(forward[0], 0, forward[2]);

    if (vec3.length(flatForward) > 0) {
      vec3.normalize(flatForward, flatForward);
    }

    return flatForward;
  }

  getBackward(): vec3 {
    const backward = vec3.create();
    vec3.negate(backward, this.getForward());
    return backward;
  }

  getRight(): vec3 {
    const right = vec3.create();
    vec3.cross(right, this.getFlatForward(), worldUp);
    vec3.normalize(right, right);

    return right;
  }

  getLeft() {
    const left = vec3.create();
    vec3.negate(left, this.getRight());
    return left;
  }

  getUp(): vec3 {
    return worldUp;
  }

  getDown(): vec3 {
    const down = vec3.create();
    vec3.negate(down, this.getUp());
    return down;
  }

  updateViewMatrix() {
    const viewMatrix = mat4.create();

    const target = vec3.create();
    vec3.add(target, this.position, this.getForward());

    // const target = vec3.fromValues(0, 0, 0);

    mat4.lookAt(viewMatrix, this.position, target, worldUp);

    this.viewMatrix = viewMatrix;
  }

  updatePerspectiveMatrix() {
    const projection = mat4.create();

    mat4.perspectiveNO(
      projection,
      this.fov, // vertical field of view
      this.viewportWidth / this.viewportHeight, // width / height
      near, // > 0
      far,
    );

    this.projectionMatrix = projection;
  }
}
