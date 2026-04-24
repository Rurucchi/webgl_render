# 🎮 WebGL Renderer

![WebGL](https://img.shields.io/badge/WebGL-2.0-blue)
![GLTF](https://img.shields.io/badge/Scene-GLTF%20Sponza-green)
![Lighting](https://img.shields.io/badge/Lighting-Blinn--Phong-amber)

A WebGL renderer built from scratch, featuring the classic Sponza scene loaded via GLTF, real-time Blinn-Phong lighting, and an interactive first-person camera system.

## Features

- **GLTF scene loading** — parses and renders the Sponza atrium scene with full mesh and material support
- **Blinn-Phong lighting** — per-fragment shading with ambient, diffuse, and specular components
- **Camera system** — mouse-look and keyboard-driven movement for real-time scene exploration
- **Raw WebGL** — no rendering engine dependencies; built directly on the WebGL API

## Getting Started

```bash
git clone https://github.com/Rurucchi/webgl_render.git
cd webgl_render
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
