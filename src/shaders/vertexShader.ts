const vs: string = `#version 300 es
precision mediump float;

in vec3 i_pos;
in vec4 i_color;

out vec4 o_color;

layout(std140) uniform Camera {
  mat4 view;
  mat4 projection;
  vec3 cameraPos;
};

void main()
{
  o_color = i_color;
  gl_Position = vec4(i_pos, 1.0);
}
`;

export default vs;
