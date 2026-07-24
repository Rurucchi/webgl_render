#version 300 es
precision highp float;

layout(location = 0) in vec2 i_pos;

out vec2 o_uv;

layout(std140) uniform Camera {
  mat4 view;
  mat4 projection;
  vec3 cameraPos;
};

void main()
{
    o_uv = i_pos;
    gl_Position = projection * view * vec4(i_pos, 1.0);
}  