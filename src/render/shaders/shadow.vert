#version 300 es
precision highp float;

layout(location = 0) in vec3 i_pos;

layout(std140) uniform shadowCamera {
  mat4 view;
  mat4 projection;
  vec3 cameraPos;
};

void main() {
  gl_Position = projection * view * vec4(i_pos, 1.0);
}
