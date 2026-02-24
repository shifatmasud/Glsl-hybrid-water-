
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { mat4, Mat4, Vec3 } from './math.ts';

export class Camera {
    projectionMatrix: Mat4 = mat4.create();
    viewMatrix: Mat4 = mat4.create();
    position: Vec3 = [0, 45, 160];
    target: Vec3 = [0, 0, 0];
    up: Vec3 = [0, 1, 0];
    fov: number = 50 * Math.PI / 180;
    aspect: number = 1;
    near: number = 0.1;
    far: number = 4000;

    constructor() {
        this.updateProjectionMatrix();
        this.updateViewMatrix();
    }

    updateProjectionMatrix() {
        mat4.perspective(this.projectionMatrix, this.fov, this.aspect, this.near, this.far);
    }

    updateViewMatrix() {
        mat4.lookAt(this.viewMatrix, this.position, this.target, this.up);
    }
}
