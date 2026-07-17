# WebGL Sponza Renderer

A WebGL renderer built from scratch, GLTF loading, real-time lighting and a first-person camera system.

## Features

- GLTF scene loading
- Cook Torrance GGX lighting model | Blinn-Phong lighting model (has to be switched in the fragment shader)
- Camera system
- Raw WebGL

## Requirements:

- Node.js 25
- Web browser with WebGL2 support
- Keyboard and Mouse for controls

## Install

```bash
git clone https://github.com/Rurucchi/webgl_render.git
cd webgl_render
npm i
npm run dev
```

Open `http://localhost:9090` in a browser with WebGL support.

## Controls

| Key       | Action      |
| --------- | ----------- |
| `W A S D` | Move camera |
| `Mouse`   | Look around |

### Dependencies

https://github.com/toji/gl-matrix,
https://github.com/mori2003/jsimgui

### Credits

https://learnopengl.com for shader code.
https://github.com/gnikoloff/webgpu-sponza-demo for Sponza assets used.
@Xrhoys for some sample code used.
