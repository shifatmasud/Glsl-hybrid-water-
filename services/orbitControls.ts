
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Camera } from './camera.ts';

export class OrbitControls {
    camera: Camera;
    element: HTMLElement;
    
    phi: number = Math.PI / 4;
    theta: number = Math.PI / 4;
    radius: number = 200;
    
    isMouseDown: boolean = false;
    lastMouseX: number = 0;
    lastMouseY: number = 0;

    constructor(camera: Camera, element: HTMLElement) {
        this.camera = camera;
        this.element = element;
        
        this.element.addEventListener('mousedown', this.onMouseDown.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.element.addEventListener('wheel', this.onWheel.bind(this));
        
        this.update();
    }

    onMouseDown(e: MouseEvent) {
        this.isMouseDown = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }

    onMouseMove(e: MouseEvent) {
        if (!this.isMouseDown) return;
        
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        
        this.theta -= dx * 0.01;
        this.phi -= dy * 0.01;
        
        this.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.phi));
        
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        
        this.update();
    }

    onMouseUp() {
        this.isMouseDown = false;
    }

    onWheel(e: WheelEvent) {
        this.radius += e.deltaY * 0.1;
        this.radius = Math.max(10, Math.min(1000, this.radius));
        this.update();
    }

    update() {
        const x = this.radius * Math.sin(this.phi) * Math.cos(this.theta);
        const y = this.radius * Math.cos(this.phi);
        const z = this.radius * Math.sin(this.phi) * Math.sin(this.theta);
        
        this.camera.position = [x, y, z];
        this.camera.updateViewMatrix();
    }
}
