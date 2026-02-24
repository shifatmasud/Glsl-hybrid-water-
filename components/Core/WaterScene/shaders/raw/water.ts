
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { commonShaderUtils } from '../common.ts';

export const waterVertexShaderRaw = `#version 300 es
#define MAX_IMPACTS 10

layout(location = 0) in vec3 position;
layout(location = 1) in vec2 uv;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform float uTime;
uniform sampler2D tRipple;
uniform float uRippleNormalIntensity;
uniform vec2 uResolution;

// Procedural Wave Uniforms
uniform float uWaveHeight;
uniform float uWaveSpeed;
uniform float uWaveScale;
uniform int uNoiseType;

out vec3 vWorldPos;
out vec3 vViewPosition;
out vec3 vNormal;
out float vElevation;
out vec2 vUv;

${commonShaderUtils.replace(/varying/g, 'out').replace(/attribute/g, 'in').replace(/texture2D/g, 'texture')}

float getProceduralNoiseHeight(int noiseType, vec2 p, float speed, float height) {
    vec2 pos = p + vec2(uTime * speed * 0.5, uTime * speed * 0.5 * 0.4);
    if (noiseType == 0) return simplex_fbm(pos, 2, 0.5, 2.0) * height;
    if (noiseType == 1) return perlin_fbm(pos, 2, 0.5, 2.0) * height;
    if (noiseType == 2) return (voronoi(pos * 0.5, uTime * speed) * 2.0 - 1.0) * height;
    return 0.0;
}

float getBlendedWaveHeight(vec2 p) {
    return getProceduralNoiseHeight(uNoiseType, p * uWaveScale * 0.02, uWaveSpeed, uWaveHeight * 10.0);
}

vec3 calculateTotalNormal(vec2 pos, vec2 uv) {
    float e = 0.5;
    vec2 texelSize = 1.0 / uResolution;
    float r_val = texture(tRipple, uv).r;
    float r_x_val = texture(tRipple, uv + vec2(texelSize.x, 0.0)).r;
    float r_z_val = texture(tRipple, uv + vec2(0.0, texelSize.y)).r;
    
    float h_base = getBlendedWaveHeight(pos);
    float h_base_x = getBlendedWaveHeight(pos + vec2(e, 0.0));
    float h_base_z = getBlendedWaveHeight(pos + vec2(0.0, e));
    
    float h = h_base + r_val * uRippleNormalIntensity;
    float hx = h_base_x + r_x_val * uRippleNormalIntensity;
    float hz = h_base_z + r_z_val * uRippleNormalIntensity;
    
    vec3 v1 = vec3(e, hx - h, 0.0);
    vec3 v2 = vec3(0.0, hz - h, e);
    return normalize(cross(v2, v1));
}

void main() {
    vUv = uv;
    vec3 pos = position;
    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    
    float ripple_height = texture(tRipple, uv).r;
    float main_displacement = getBlendedWaveHeight(worldPosition.xz);
    
    float total_displacement = main_displacement + ripple_height * 5.0;
    pos.y += total_displacement;

    vElevation = pos.y;
    vec4 finalWorldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = finalWorldPos.xyz;
    vNormal = calculateTotalNormal(worldPosition.xz, uv);
    
    vec4 mvPosition = viewMatrix * finalWorldPos;
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
}
`;

export const waterFragmentShaderRaw = `#version 300 es
precision highp float;

uniform vec3 uColorDeep;
uniform vec3 uColorShallow;
uniform float uTransparency;
uniform float uRoughness;
uniform vec3 uSunPosition;
uniform float uSunIntensity;
uniform sampler2D tSky;

in vec3 vWorldPos;
in vec3 vViewPosition;
in vec3 vNormal;
in float vElevation;
in vec2 vUv;

out vec4 fragColor;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    vec3 sunDir = normalize(uSunPosition);
    
    // Simple lighting
    float diffuse = max(dot(normal, sunDir), 0.0);
    vec3 reflectDir = reflect(-sunDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0) * uSunIntensity;
    
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 5.0);
    
    vec3 color = mix(uColorDeep, uColorShallow, smoothstep(-10.0, 10.0, vElevation));
    color += spec;
    
    fragColor = vec4(color, uTransparency);
}
`;
