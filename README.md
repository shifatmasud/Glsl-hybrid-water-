# Advanced Hybrid Water Simulation (Raw WebGL2)

Refactored the entire 3D rendering pipeline from Three.js to raw WebGL2 and GLSL. This provides lower-level control over the rendering process, improved performance, and a custom-built simulation engine.

## Architecture (IPO)
- **Input**: User interaction (mouse/touch), configuration toggles (Ripple Damping, Strength, Radius).
- **Process**: Custom WebGL2 renderer, vertex/fragment shaders for water surface and terrain, ping-pong framebuffer simulation for ripple physics.
- **Output**: Real-time 3D water surface with dynamic ripples and procedural waves rendered directly via WebGL2.

## Action List
1. Implemented custom `WebGLRenderer`, `Camera`, and `OrbitControls` services.
2. Migrated Three.js shaders to raw GLSL ES 3.00 (WebGL2).
3. Replaced Three.js scene management with a custom rendering loop.
4. Implemented GPGPU ripple simulation using raw WebGL2 framebuffers.
5. Optimized geometry generation and buffer management.
