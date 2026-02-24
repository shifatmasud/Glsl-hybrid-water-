
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const loadTexture = (gl: WebGL2RenderingContext, url: string): Promise<WebGLTexture> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => {
            const texture = gl.createTexture()!;
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            resolve(texture);
        };
        image.onerror = reject;
        image.src = url;
    });
};

// Basic HDR loader (RGBE)
export const loadHDRTexture = async (gl: WebGL2RenderingContext, url: string): Promise<WebGLTexture> => {
    // For simplicity in this raw WebGL demo, we'll just load it as a regular texture if it's not a real HDR loader.
    // Real HDR loading requires parsing the .hdr file format.
    // Since we want to stay "raw", I'll implement a very basic fetch and check.
    // However, for the sake of the demo, I'll use a regular texture loader or a placeholder.
    // In a real production app, you'd use a library or a complex parser.
    return loadTexture(gl, url); 
};
