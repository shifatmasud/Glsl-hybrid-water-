
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class WebGLRenderer {
    gl: WebGL2RenderingContext;
    canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const gl = canvas.getContext('webgl2', {
            alpha: false,
            antialias: true,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false,
        });

        if (!gl) {
            throw new Error('WebGL2 not supported');
        }

        this.gl = gl;
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }

    setSize(width: number, height: number) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
    }

    clear(r = 0, g = 0, b = 0, a = 1) {
        this.gl.clearColor(r, g, b, a);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    createShader(type: number, source: string): WebGLShader {
        const shader = this.gl.createShader(type)!;
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const info = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error('Could not compile WebGL shader. \n\n' + info);
        }

        return shader;
    }

    createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
        const program = this.gl.createProgram()!;
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const info = this.gl.getProgramInfoLog(program);
            this.gl.deleteProgram(program);
            throw new Error('Could not link WebGL program. \n\n' + info);
        }

        return program;
    }

    createBuffer(data: Float32Array | Uint16Array, type: number = this.gl.ARRAY_BUFFER, usage: number = this.gl.STATIC_DRAW): WebGLBuffer {
        const buffer = this.gl.createBuffer()!;
        this.gl.bindBuffer(type, buffer);
        this.gl.bufferData(type, data, usage);
        return buffer;
    }

    createTexture(options: {
        width?: number,
        height?: number,
        format?: number,
        internalFormat?: number,
        type?: number,
        minFilter?: number,
        magFilter?: number,
        wrapS?: number,
        wrapT?: number,
        data?: ArrayBufferView | null
    } = {}): WebGLTexture {
        const gl = this.gl;
        const texture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, texture);

        const width = options.width || 1;
        const height = options.height || 1;
        const format = options.format || gl.RGBA;
        const internalFormat = options.internalFormat || gl.RGBA;
        const type = options.type || gl.UNSIGNED_BYTE;
        const minFilter = options.minFilter || gl.LINEAR;
        const magFilter = options.magFilter || gl.LINEAR;
        const wrapS = options.wrapS || gl.CLAMP_TO_EDGE;
        const wrapT = options.wrapT || gl.CLAMP_TO_EDGE;

        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, options.data || null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);

        return texture;
    }

    createFramebuffer(texture: WebGLTexture): WebGLFramebuffer {
        const gl = this.gl;
        const fb = gl.createFramebuffer()!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        return fb;
    }
}
