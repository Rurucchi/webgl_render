import Engine from './engine';
import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <canvas id="game" />
  </div>
`;

function main() {
  const canvas = document.getElementById("game");
  if(canvas instanceof HTMLCanvasElement) {
    resize();
    const gl = canvas.getContext("webgl2");
    let app: Engine;
    if(gl instanceof WebGL2RenderingContext) {
      app = new Engine(canvas, gl);
      app.start();

      window.addEventListener("resize", () => {
        app.resize(window.innerWidth, window.innerHeight);
      })
    }
    else {
      throw new Error("Invalid gl context");
    }
  }
  else {
    throw new Error("Invalid canvas element");
  }
};

function resize() {
  const canvas = document.getElementById("game");
  if(canvas instanceof HTMLCanvasElement) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
}

window.onload = main;
window.onresize = resize;