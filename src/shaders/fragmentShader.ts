const fs: string = `#version 300 es
precision mediump float;

in vec2 o_tex;
in vec3 o_normal;
in vec3 o_tangent;
in vec3 o_worldPos;

struct Sun {
  vec3 dir;
  vec3 color;
};

layout(std140) uniform Light {
  Sun sun;
};

layout(std140) uniform Camera {
  mat4 view;
  mat4 projection;
  vec3 cameraPos;
};

uniform sampler2D uSampler;

out vec4 frag_color;

void main() {
  vec3 normal   = normalize(o_normal);
  vec3 lightDir = normalize(sun.dir);
  vec3 viewDir  = normalize(cameraPos - o_worldPos);
  vec3 halfway  = normalize(lightDir + viewDir);

  // Ambient
  float ambientStrength = 0.12;
  vec3 ambient = ambientStrength * sun.color;

  // Diffuse
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * sun.color;

  // Specular
  float shininess = 4.0;
  float spec = pow(max(dot(normal, halfway), 0.0), shininess);
  vec3 specular = 0.2 * spec * sun.color;  // 0.2 = specular strength

  // Bounce approximation
  vec3 bounceDir    = vec3(-sun.dir.x, -sun.dir.y, -sun.dir.z);
  float bounceDiff  = max(dot(normal, bounceDir), 0.0) * 0.12; // weak
  vec3 bounceColor  = vec3(0.8, 0.6, 0.4); // warm ground color
  vec3 bounce       = bounceDiff * bounceColor;

  vec4 texColor = texture(uSampler, o_tex);
  vec3 lighting = (ambient + diffuse + bounce + specular) * texColor.rgb;

  frag_color = vec4(lighting, texColor.a);
}
`;

export default fs;
