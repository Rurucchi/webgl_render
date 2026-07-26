#version 300 es
precision highp float;

layout(location = 0) in vec3 i_pos;

out vec3 o_tex;

layout(std140) uniform Camera {
  mat4 view;
  mat4 projection;
  vec3 cameraPos;
};

void main()
{
  o_tex = i_pos;
  mat3 rot = mat3(view);
  vec4 pos = projection * vec4(rot * i_pos, 1.0);
  gl_Position = pos.xyww;
}  