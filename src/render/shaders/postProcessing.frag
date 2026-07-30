#version 300 es
precision highp float;

uniform sampler2D uRenderFrame;

in vec2 o_uv;

out vec4 frag_color;

void main() {
    vec4 texel = texture(uRenderFrame, o_uv);
    vec3 color = texel.rgb;

    // HDR tonemaping
    color = color / (color + vec3(1.0));

    // gamma correction
    color = pow(color, vec3(1.0 / 2.2));

    frag_color = vec4(color, 1.0);
}