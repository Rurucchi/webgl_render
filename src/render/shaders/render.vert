#version 300 es
precision highp float;

layout(location = 0) in vec3 i_pos;
layout(location = 1) in vec3 i_normal;
layout(location = 2) in vec4 i_tangent;
layout(location = 3) in vec2 i_tex;

out vec2 o_tex;
out vec3 o_normal;
out vec4 o_tangent;
out vec3 o_worldPos; 
out vec4 o_fragPosLightSpace;

// This should be changed.
layout(std140) uniform Camera {
  mat4 playerView;
  mat4 playerProjection;
  vec3 playerCameraPos;
  mat4 shadowView;
  mat4 shadowProjection;
  vec3 shadowCameraPos;
};

void main() {
  gl_Position = playerProjection * playerView * vec4(i_pos, 1.0);
  o_tex    = i_tex;
  o_normal = i_normal;
  o_worldPos = i_pos;
  o_fragPosLightSpace = shadowProjection * shadowView * vec4(i_pos, 1.0);
}
