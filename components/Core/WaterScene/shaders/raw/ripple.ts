
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const rippleVertexShaderRaw = `#version 300 es
in vec3 position;
in vec2 uv;
out vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
`;

export const rippleFragmentShaderRaw = `#version 300 es
precision highp float;
uniform sampler2D tDiffuse;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uStrength;
uniform float uRadius;
uniform float uDamping;
uniform float uSpeed;
uniform float uViscosity;
uniform bool uMouseDown;

#define MAX_IMPACTS 10
uniform vec3 uImpacts[MAX_IMPACTS];
uniform int uImpactCount;
uniform bool uGentleImpact;

in vec2 vUv;
out vec4 fragColor;

void main() {
    vec2 uv = vUv;
    vec2 e = 1.0 / uResolution;

    float p = texture(tDiffuse, uv).r;
    float p_left = texture(tDiffuse, uv - vec2(e.x, 0.0)).r;
    float p_right = texture(tDiffuse, uv + vec2(e.x, 0.0)).r;
    float p_up = texture(tDiffuse, uv + vec2(0.0, e.y)).r;
    float p_down = texture(tDiffuse, uv - vec2(0.0, e.y)).r;

    // Wave equation
    float velocity = (p_left + p_right + p_up + p_down) * 0.5 - texture(tDiffuse, uv).g;
    velocity *= uDamping;

    float height = velocity;

    // Mouse Interaction
    if (uMouseDown) {
        float dist = distance(uv, uMouse);
        if (dist < uRadius) {
            height += (1.0 - dist / uRadius) * uStrength;
        }
    }

    // Discrete Impacts
    for (int i = 0; i < MAX_IMPACTS; i++) {
        if (i >= uImpactCount) break;
        float dist = distance(uv, uImpacts[i].xy);
        if (dist < uRadius) {
            height += (1.0 - dist / uRadius) * uImpacts[i].z;
        }
    }

    fragColor = vec4(height, p, 0.0, 1.0);
}
`;
