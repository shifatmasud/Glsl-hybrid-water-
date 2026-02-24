
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef, useEffect } from 'react';
import { WaterConfig } from '../../../types/index.tsx';
import { WebGLRenderer } from '../../../services/webglRenderer.ts';
import { Camera } from '../../../services/camera.ts';
import { OrbitControls } from '../../../services/orbitControls.ts';
import { createPlaneGeometry } from '../../../services/geometry.ts';
import { loadTexture } from '../../../services/textureLoader.ts';
import { mat4 } from '../../../services/math.ts';

import { rippleVertexShaderRaw, rippleFragmentShaderRaw } from './shaders/raw/ripple.ts';
import { waterVertexShaderRaw, waterFragmentShaderRaw } from './shaders/raw/water.ts';
import { terrainVertexShaderRaw, terrainFragmentShaderRaw } from './shaders/raw/terrain.ts';
import { SceneController } from '../../App/MetaPrototype.tsx';

interface WaterSceneProps {
  config: WaterConfig;
  isSplitView: boolean;
  initialCameraState?: { position: [number, number, number], target: [number, number, number] } | null;
  sceneController?: React.MutableRefObject<Partial<SceneController>>;
  mouseHoverEnabled?: boolean;
}

const WaterScene: React.FC<WaterSceneProps> = ({ config, initialCameraState, sceneController, isSplitView }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameIdRef = useRef<number>(0);
  
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const renderer = new WebGLRenderer(canvas);
    rendererRef.current = renderer;
    const gl = renderer.gl;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    renderer.setSize(width, height);

    const camera = new Camera();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, canvas);
    controlsRef.current = controls;

    // --- Scene Controller Setup ---
    if (sceneController) {
        sceneController.current.addDiscreteImpact = () => {
            // In raw WebGL, we'd need to pass this to the ripple shader
            // For now, let's just log it or implement a simple version
            console.log('Discrete impact requested');
        };
        
        sceneController.current.extractPalette = async () => {
            // Simple palette extraction placeholder
            return {
                colorDeep: '#05101a',
                colorShallow: '#4d80b3'
            };
        };
    }

    // --- SHADERS ---
    const rippleProgram = renderer.createProgram(
        renderer.createShader(gl.VERTEX_SHADER, rippleVertexShaderRaw),
        renderer.createShader(gl.FRAGMENT_SHADER, rippleFragmentShaderRaw)
    );

    const waterProgram = renderer.createProgram(
        renderer.createShader(gl.VERTEX_SHADER, waterVertexShaderRaw),
        renderer.createShader(gl.FRAGMENT_SHADER, waterFragmentShaderRaw)
    );

    const terrainProgram = renderer.createProgram(
        renderer.createShader(gl.VERTEX_SHADER, terrainVertexShaderRaw),
        renderer.createShader(gl.FRAGMENT_SHADER, terrainFragmentShaderRaw)
    );

    // --- GEOMETRIES ---
    const quadGeo = createPlaneGeometry(2, 2, 1, 1);
    const waterGeo = createPlaneGeometry(400, 400, 128, 128);
    const terrainGeo = createPlaneGeometry(1000, 1000, 64, 64);

    const createVAO = (geo: any, program: WebGLProgram) => {
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        const posBuffer = renderer.createBuffer(geo.positions);
        const posLoc = gl.getAttribLocation(program, 'position');
        if (posLoc !== -1) {
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
        }

        const uvBuffer = renderer.createBuffer(geo.uvs);
        const uvLoc = gl.getAttribLocation(program, 'uv');
        if (uvLoc !== -1) {
            gl.enableVertexAttribArray(uvLoc);
            gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);
        }

        const indexBuffer = renderer.createBuffer(geo.indices, gl.ELEMENT_ARRAY_BUFFER);
        
        gl.bindVertexArray(null);
        return { vao, indexCount: geo.indices.length };
    };

    const rippleVAO = createVAO(quadGeo, rippleProgram);
    const waterVAO = createVAO(waterGeo, waterProgram);
    const terrainVAO = createVAO(terrainGeo, terrainProgram);

    // --- TEXTURES & FRAMEBUFFERS ---
    const simSize = 512;
    const simTexA = renderer.createTexture({
        width: simSize, height: simSize,
        internalFormat: gl.RG32F, format: gl.RG, type: gl.FLOAT,
        minFilter: gl.NEAREST, magFilter: gl.NEAREST
    });
    const simTexB = renderer.createTexture({
        width: simSize, height: simSize,
        internalFormat: gl.RG32F, format: gl.RG, type: gl.FLOAT,
        minFilter: gl.NEAREST, magFilter: gl.NEAREST
    });
    const fbA = renderer.createFramebuffer(simTexA);
    const fbB = renderer.createFramebuffer(simTexB);

    let currentFB = fbA;
    let nextFB = fbB;
    let currentTex = simTexA;

    // Load static textures
    let sandTex: WebGLTexture | null = null;
    loadTexture(gl, '/placeholder-sand.jpg').then(tex => sandTex = tex);

    const startTime = performance.now();

    const animate = () => {
        const time = (performance.now() - startTime) / 1000;
        const currentConfig = configRef.current;

        // 1. Ripple Simulation Step
        gl.useProgram(rippleProgram);
        gl.bindFramebuffer(gl.FRAMEBUFFER, nextFB);
        gl.viewport(0, 0, simSize, simSize);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, currentTex);
        gl.uniform1i(gl.getUniformLocation(rippleProgram, 'tDiffuse'), 0);
        gl.uniform2f(gl.getUniformLocation(rippleProgram, 'uResolution'), simSize, simSize);
        gl.uniform1f(gl.getUniformLocation(rippleProgram, 'uDamping'), currentConfig.rippleDamping);
        gl.uniform1f(gl.getUniformLocation(rippleProgram, 'uStrength'), currentConfig.rippleStrength);
        gl.uniform1f(gl.getUniformLocation(rippleProgram, 'uRadius'), currentConfig.rippleRadius);
        
        gl.bindVertexArray(rippleVAO.vao);
        gl.drawElements(gl.TRIANGLES, rippleVAO.indexCount, gl.UNSIGNED_SHORT, 0);

        // Swap
        [currentFB, nextFB] = [nextFB, currentFB];
        currentTex = (currentFB === fbA) ? simTexA : simTexB;

        // 2. Main Render
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        renderer.setSize(containerRef.current!.clientWidth, containerRef.current!.clientHeight);
        renderer.clear(0.1, 0.1, 0.15, 1);

        const modelMat = mat4.create();
        const viewMat = camera.viewMatrix;
        const projMat = camera.projectionMatrix;

        // Draw Terrain
        gl.useProgram(terrainProgram);
        gl.uniformMatrix4fv(gl.getUniformLocation(terrainProgram, 'modelMatrix'), false, modelMat);
        gl.uniformMatrix4fv(gl.getUniformLocation(terrainProgram, 'viewMatrix'), false, viewMat);
        gl.uniformMatrix4fv(gl.getUniformLocation(terrainProgram, 'projectionMatrix'), false, projMat);
        gl.uniform3f(gl.getUniformLocation(terrainProgram, 'uColorDeep'), 0.1, 0.2, 0.3);
        gl.uniform3f(gl.getUniformLocation(terrainProgram, 'uColorShallow'), 0.4, 0.6, 0.8);
        
        gl.bindVertexArray(terrainVAO.vao);
        gl.drawElements(gl.TRIANGLES, terrainVAO.indexCount, gl.UNSIGNED_SHORT, 0);

        // Draw Water
        gl.useProgram(waterProgram);
        gl.uniformMatrix4fv(gl.getUniformLocation(waterProgram, 'modelMatrix'), false, modelMat);
        gl.uniformMatrix4fv(gl.getUniformLocation(waterProgram, 'viewMatrix'), false, viewMat);
        gl.uniformMatrix4fv(gl.getUniformLocation(waterProgram, 'projectionMatrix'), false, projMat);
        gl.uniform1f(gl.getUniformLocation(waterProgram, 'uTime'), time);
        gl.uniform1f(gl.getUniformLocation(waterProgram, 'uWaveHeight'), currentConfig.waveHeight);
        gl.uniform1f(gl.getUniformLocation(waterProgram, 'uWaveSpeed'), currentConfig.waveSpeed);
        gl.uniform1f(gl.getUniformLocation(waterProgram, 'uWaveScale'), currentConfig.waveScale);
        gl.uniform1i(gl.getUniformLocation(waterProgram, 'uNoiseType'), 0);
        gl.uniform3f(gl.getUniformLocation(waterProgram, 'uColorDeep'), 0.05, 0.15, 0.25);
        gl.uniform3f(gl.getUniformLocation(waterProgram, 'uColorShallow'), 0.3, 0.5, 0.7);
        gl.uniform1f(gl.getUniformLocation(waterProgram, 'uTransparency'), currentConfig.transparency);
        gl.uniform3f(gl.getUniformLocation(waterProgram, 'uSunPosition'), 50, 100, -100);
        gl.uniform1f(gl.getUniformLocation(waterProgram, 'uSunIntensity'), currentConfig.sunIntensity);
        gl.uniform1f(gl.getUniformLocation(waterProgram, 'uRippleNormalIntensity'), currentConfig.rippleNormalIntensity);
        gl.uniform2f(gl.getUniformLocation(waterProgram, 'uResolution'), simSize, simSize);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, currentTex);
        gl.uniform1i(gl.getUniformLocation(waterProgram, 'tRipple'), 0);

        gl.bindVertexArray(waterVAO.vao);
        gl.drawElements(gl.TRIANGLES, waterVAO.indexCount, gl.UNSIGNED_SHORT, 0);

        frameIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
        if (!containerRef.current) return;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
        cancelAnimationFrame(frameIdRef.current);
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-black">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export default WaterScene;
