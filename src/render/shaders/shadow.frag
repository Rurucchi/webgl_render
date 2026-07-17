#version 300 es
precision highp float;

out vec4 fragColor;

void main()
{
    fragColor = vec4(gl_FragCoord.z, gl_FragCoord.z, gl_FragCoord.z, 1.0);
}