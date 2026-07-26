#version 300 es
precision highp float;

uniform sampler2D uRenderFrame;

in vec2 o_uv;

out vec4 frag_color;

void main() {
    float color = texture(uRenderFrame, o_uv);
    frag_color = vec4(color, 1.0);
}