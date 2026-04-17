const fs: string = `#version 300 es
precision mediump float;

in vec2 o_tex;
in vec3 o_normal;
// in vec4 o_color;

out vec4 frag_color;

void main() {
  frag_color = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

export default fs;
