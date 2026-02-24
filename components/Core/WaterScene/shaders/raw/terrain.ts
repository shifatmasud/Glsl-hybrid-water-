
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { commonShaderUtils } from '../common.ts';

export const terrainVertexShaderRaw = `#version 300 es
layout(location = 0) in vec3 position;
layout(location = 1) in vec2 uv;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

out vec2 vUv;
out vec3 vWorldPos;

void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const terrainFragmentShaderRaw = `#version 300 es
precision highp float;

uniform vec3 uColorDeep;
uniform vec3 uColorShallow;
uniform sampler2D tSand;
uniform float uTime;

in vec2 vUv;
in vec3 vWorldPos;
out vec4 fragColor;

void main() {
    vec3 sand = texture(tSand, vUv * 10.0).rgb;
    vec3 color = mix(uColorDeep, uColorShallow, 0.5) * sand;
    fragColor = vec4(color, 1.0);
}
`;
