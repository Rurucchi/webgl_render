interface Direction {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

// TODO: mouse movement w/ pitch & yaw

export default class Input {
  // key mapping
  public forwardKey: string = "KeyW";
  public backwardKey: string = "KeyS";
  public leftKey: string = "KeyA";
  public rightKey: string = "KeyD";
  public upKey: string = "Space";
  public downKey: string = "ShiftLeft";
  public directions: Direction = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
  };
  public keys: Record<string, boolean> = {};
  public pressedThisFrame: Record<string, boolean> = {};

  getInputs() {
    // forward
    if (this.keys[this.forwardKey]) {
      this.directions.forward = true;
    } else {
      this.directions.forward = false;
    }

    // backward
    if (this.keys[this.backwardKey]) {
      this.directions.backward = true;
    } else {
      this.directions.backward = false;
    }

    // left
    if (this.keys[this.leftKey]) {
      this.directions.left = true;
    } else {
      this.directions.left = false;
    }

    // right
    if (this.keys[this.rightKey]) {
      this.directions.right = true;
    } else {
      this.directions.right = false;
    }

    // up
    if (this.keys[this.upKey]) {
      this.directions.up = true;
    } else {
      this.directions.up = false;
    }

    // down
    if (this.keys[this.downKey]) {
      this.directions.down = true;
    } else {
      this.directions.down = false;
    }
  }

  // this is used to filter opposite inputs to avoid computing useless movement vectors (this assumes that movement speed is equal in all directions)
  filterInputs() {
    // forward | backward
    if (this.directions.forward && this.directions.backward) {
      // negate both directions
      this.directions.forward = false;
      this.directions.backward = false;
    }

    // left | right
    if (this.directions.left && this.directions.right) {
      this.directions.left = false;
      this.directions.right = false;
    }

    // up | down
    if (this.directions.up && this.directions.down) {
      this.directions.up = false;
      this.directions.down = false;
    }
  }

  // using addEventListener requires to run on the main thread
  start() {
    addEventListener("keydown", (e) => {
      if (!this.keys[e.code]) {
        this.pressedThisFrame[e.code] = true;
      }
      this.keys[e.code] = true;
    });

    addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });
  }

  update() {
    this.getInputs();
    this.filterInputs();
  }
}
