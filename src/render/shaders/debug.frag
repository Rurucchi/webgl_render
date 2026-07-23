#version 300 es
precision highp float;

uniform sampler2D uShadowMap;

in vec2 o_uv;

out vec4 frag_color;

void main() {
    float depth = texture(uShadowMap, o_uv).r;
    frag_color = vec4(vec3(depth), 1.0);
}