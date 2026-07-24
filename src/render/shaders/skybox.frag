#version 300 es
precision highp float;

in vec3 o_tex;
out vec4 frag_color;

uniform samplerCube uSkybox;

void main() {
    frag_color = texture(uSkybox, o_tex);
}