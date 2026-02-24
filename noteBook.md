# Development Notebook

## 2026-02-21
- Implemented Debug Normals toggle.
- Normal map colors set to purplish-blue (tangent space mapping).
- Added smooth normal map scroll using noise-based flow distortion.
- Refined impact waves with a "Gentle" mode using squared falloff.

## 2026-02-22
- Refactored entire 3D scene from Three.js to raw WebGL2.
- Created custom `WebGLRenderer`, `Camera`, and `OrbitControls` services.
- Migrated all shaders to raw GLSL ES 3.00.
- Implemented GPGPU ripple simulation using ping-pong framebuffers.
- Removed Three.js dependency from core rendering pipeline.
