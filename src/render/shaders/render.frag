#version 300 es
precision highp float;

#define PI 3.14159265
#define alphaCutoff 0.5 // This should not be hardcoded.

// vertex shader input
in vec2 o_tex;
in vec3 o_normal;
in vec4 o_tangent;
in vec3 o_worldPos;
in vec4 o_fragPosLightSpace;

layout(std140) uniform uSun {
  vec3 sunDir;
  vec3 sunColor;
};

layout(std140) uniform Camera {
  mat4 playerView;
  mat4 playerProjection;
  vec3 playerCameraPos;
  mat4 shadowView;
  mat4 shadowProjection;
  vec3 shadowCameraPos;
};

// textures
uniform sampler2D uTex;
uniform sampler2D uNormal;
uniform sampler2D uMetallicRoughness;
uniform sampler2D uShadowMap;

// alpha mode
uniform bool uUseAlphaMask;      // true = BLEND, false = OPAQUE or MASK

out vec4 frag_color;

// ----------------------------------------------------------------------------
vec3 getNormalFromMap()
{
    vec3 tangentNormal = texture(uNormal, o_tex).xyz * 2.0 - 1.0;

    vec3 Q1  = dFdx(o_worldPos);
    vec3 Q2  = dFdy(o_worldPos);
    vec2 st1 = dFdx(o_tex);
    vec2 st2 = dFdy(o_tex);

    vec3 N   = normalize(o_normal);
    vec3 T  = normalize(Q1*st2.t - Q2*st1.t);
    vec3 B  = -normalize(cross(N, T));
    mat3 TBN = mat3(T, B, N);

    return normalize(TBN * tangentNormal);
}

// ----------------------------------------------------------------------------
float DistributionGGX(vec3 N, vec3 H, float roughness)
{
    float a = roughness*roughness;
    float a2 = a*a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH*NdotH;

    float nom   = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return nom / denom;
}
// ----------------------------------------------------------------------------
float GeometrySchlickGGX(float NdotV, float roughness)
{
    float r = (roughness + 1.0);
    float k = (r*r) / 8.0;

    float nom   = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return nom / denom;
}
// ----------------------------------------------------------------------------
float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness)
{
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}

// ----------------------------------------------------------------------------
vec3 fresnelSchlick(float cosTheta, vec3 F0)
{
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// ----------------------------------------------------------------------------
vec3 BRDF_GGX(
    vec3 albedo,
    float metallic,
    float roughness,
    vec3 N,
    vec3 V,
    vec3 L,
    vec3 radiance
)
{

    vec3 H = normalize(V + L);

    vec3 F0 = vec3(0.04);
    F0 = mix(F0, albedo, metallic);

    float NDF =
        DistributionGGX(N, H, roughness);

    float G =
        GeometrySmith(N, V, L, roughness);

    vec3 F =
        fresnelSchlick(
            max(dot(H, V), 0.0),
            F0
        );

    vec3 numerator =
        NDF * G * F;

    float denominator =
        4.0 *
        max(dot(N, V), 0.0) *
        max(dot(N, L), 0.0) +
        0.0001;

    vec3 specular =
        numerator / denominator;

    vec3 kS = F;

    vec3 kD = vec3(1.0) - kS;

    kD *= 1.0 - metallic;

    float NdotL =
        max(dot(N, L), 0.0);

    return
        (kD * albedo / PI + specular) *
        (radiance * 3.5) *
        NdotL;
}

// ----------------------------------------------------------------------------
vec3 blinnPhong(vec3 normal, vec3 lightDir, vec3 viewDir, vec3 halfway, vec4 texColor) {
  // Ambient
  float ambientStrength = 0.1;
  vec3 ambient = ambientStrength * sunColor;

  // Diffuse
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * sunColor;

  // Specular
  float shininess = 4.0;
  float spec = pow(max(dot(normal, halfway), 0.0), shininess);
  vec3 specular = 0.2 * spec * sunColor;  // 0.2 = specular strength

  // Bounce approximation
  vec3 bounceDir    = vec3(-sunDir.x, -sunDir.y, -sunDir.z);
  float bounceDiff  = max(dot(normal, bounceDir), 0.0) * 0.1; // weak
  vec3 bounceColor  = vec3(0.8, 0.6, 0.4); // warm ground color
  vec3 bounce       = bounceDiff * bounceColor;

  vec3 lighting = (ambient + diffuse + bounce + specular) * texColor.rgb;

  return lighting;
}

// ----------------------------------------------------------------------------
// This is hardcoded and should be changed,
vec3 ambientLight(vec3 N, vec3 albedo, float metallic) {
  vec3 skyColor    = vec3(0.3, 0.35, 0.5);
  vec3 groundColor = vec3(0.15, 0.12, 0.1);

  float hemi = N.y * 0.5 + 0.5;

  vec3 ambientLight = mix(groundColor, skyColor, hemi);

  vec3 ambient = ambientLight * albedo * (1.0 - metallic) * 0.15;

  return ambient;
}

// ----------------------------------------------------------------------------
float ShadowCalculation(vec4 fragPosLightSpace)
{
    // Perspective divide (works for orthographic too, since w == 1)
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;

    // Convert from NDC [-1,1] to texture coordinates [0,1]
    projCoords = projCoords * 0.5 + 0.5;

    // Outside the shadow map?
    if (projCoords.x < 0.0 || projCoords.x > 1.0 ||
        projCoords.y < 0.0 || projCoords.y > 1.0 ||
        projCoords.z > 1.0)
    {
        return 0.0;
    }

    float closestDepth = texture(uShadowMap, projCoords.xy).r;
    float currentDepth = projCoords.z;

    // Simple constant bias
    float bias = 0.001;

    return currentDepth - bias > closestDepth ? 1.0 : 0.0;
}


// ----------------------------------------------------------------------------
// TODO: unify models props.
void main() { 

  vec3 F0 = vec3(0.04);

  vec3 normal   = normalize(o_normal);
  vec3 lightDir = normalize(sunDir);
  vec3 viewDir  = normalize(playerCameraPos - o_worldPos);
  vec3 halfway  = normalize(lightDir + viewDir);
  vec4 texColor = texture(uTex, o_tex);
  vec3 normalDir = texture(uNormal, o_tex).xyz;
  vec4 metallicRoughness = texture(uMetallicRoughness, o_tex);
  float roughness = metallicRoughness.g;
  float metallic  = metallicRoughness.b;

  if (uUseAlphaMask && texColor.a < alphaCutoff) {
    discard;
    return;
  }

  // Material decoding for PBR.
  vec3 albedo = pow(texture(uTex, o_tex).rgb, vec3(2.2));
  vec4 mr = texture(uMetallicRoughness, o_tex);
  roughness = max(roughness, 0.04); // Safety to avoid extreme brightness.
  vec3 N = getNormalFromMap();
  vec3 V = normalize(playerCameraPos - o_worldPos);
  vec3 radiance = sunColor;

  vec3 lighting = BRDF_GGX(
      albedo,
      metallic,
      roughness,
      N,
      V,
      lightDir,
      radiance
  );

// ambient light as GI is not implemented
  vec3 ambient = ambientLight(N, albedo, metallic);

  vec3 tangentNormal = texture(uNormal, o_tex).xyz;

  float shadow = ShadowCalculation(o_fragPosLightSpace);

  // vec3 lighting = blinnPhong(normal, lightDir, viewDir, halfway, texColor);

  vec3 color = ambient + (1.0 - shadow) * lighting;

  // HDR tonemaping
  color = color / (color + vec3(1.0));

  // gamma correction
  color = pow(color, vec3(1.0 / 2.2));

  frag_color = vec4(color, texColor.a);

// frag_color = vec4(texture(uNormal, o_tex));
// frag_color = vec4(texture(uMetallicRoughness, o_tex));
  return;
}