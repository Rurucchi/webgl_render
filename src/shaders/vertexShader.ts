const vs: string = `#version 300 es
precision mediump float;

in vec3 i_pos;
in vec3 i_normal;
in vec3 i_tangent;
in vec2 i_tex;

out vec2 o_tex;
out vec3 o_normal;
// out vec4 o_color;

layout(std140) uniform Camera {
  mat4 view;
  mat4 projection;
  vec3 cameraPos;
};

void main() {
  gl_Position = projection * view * vec4(i_pos, 1.0);
  o_tex    = i_tex;
  o_normal = i_normal;
  // o_color  = 1.0;
}
`;

export default vs;
