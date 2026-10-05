# Architecture & Technical Specifications: Relic Dig 3026

## 1. System Overview

**Relic Dig 3026** is a static client-side 3D web application built with **Three.js** and **Vite**. The runtime operates under strict constraints:
* **Zero runtime network requests**: All scripts, stylesheets, shaders, and 3D meshes are bundled locally.
* **Zero external APIs or LLMs**: All archaeological narratives and field notes are authored static strings.
* **Zero server-side dependencies**: Pure static files hostable on any static web server, GitHub Pages, or edge CDN.

```text
+-----------------------------------------------------------------------------------+
|                                  BROWSER CLIENT                                   |
|                                                                                   |
|  +------------------------+  Pointer Events   +--------------------------------+  |
|  |     WebGL Viewport     | <================ |         Input Manager          |  |
|  |       (Three.js)       |                   | (Mouse, Touch, Focus, Keyboard)|  |
|  +------------------------+                   +--------------------------------+  |
|              ^                                                 |                  |
|              | Alpha Mask Texture                              | Event Triggers   |
|              v                                                 v                  |
|  +------------------------+                   +--------------------------------+  |
|  |    Sediment Manager    |                   |           Game State           |  |
|  |  (512x512 Canvas2D)    |                   |   [DIG_PIT] -> [EXAMINATION]   |  |
|  +------------------------+                   +--------------------------------+  |
|              |                                                 |                  |
|              | Clearance %                                     | Active Relic     |
|              v                                                 v                  |
|  +------------------------+                   +--------------------------------+  |
|  |     HUD & Controls     | <---------------- |      Static Relic Database     |  |
|  | (Clearance, Stepper)   |                   |      (RELICS, Provenance)      |  |
|  +------------------------+                   +--------------------------------+  |
|                                                                |                  |
|                                                                v                  |
|                                               +--------------------------------+  |
|                                               |     Dig Certificate Engine     |  |
|                                               |  (1200x800 Canvas PNG Export)  |  |
|                                               +--------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Technical Components

### A. Real Sediment Brush Erasure (512×512 Alpha Mask)
* **Mechanic**: The dig bed is covered by a sediment plane mesh (`THREE.PlaneGeometry`).
* **Material**: `THREE.MeshStandardMaterial` configured with `transparent: true`. Its `alphaMap` is backed by an in-memory 512×512 HTML5 canvas (`THREE.CanvasTexture`).
* **Brush Stroke**: When a user drags a pointer over the pit, a Three.js `Raycaster` calculates the UV coordinate `(u, v)` of the intersection on the sediment plane.
* **GPU Upload Discipline**: `ctx.arc()` stamps a radial erasing gradient (`destination-out`). To preserve 60 FPS performance, `texture.needsUpdate = true` is set **only when a pointer stroke actually modifies pixels**, avoiding redundant GPU texture re-uploads every frame.
* **Clearance Metric**: Sample points across the canvas determine the percentage of cleared sediment (`getRevealedPercent()`). Once clearance reaches the threshold (≥ 25%), the extraction button activates.

### B. Relic Extraction & Motion
* **Pit Alignment**: Each relic is positioned at `y = -0.05` to `-0.08`, physically nestled inside the stone pit floor beneath the sediment plane.
* **Extraction Transition**: When triggered, the game transitions from `DIG_PIT` to `EXTRACTING`. A cubic ease-out curve (`1 - (1 - t)^3`) lifts the relic mesh from its buried Y coordinate to examination altitude `y = 1.05` over 1.2 seconds, simultaneously lerping the camera.
* **Reduced Motion Compliance**: When `window.matchMedia('(prefers-reduced-motion: reduce)')` is active, the 1.2s animation is skipped immediately via `finishExtraction()`, providing instantaneous examination while retaining all functional feedback.

### C. Specular Lighting & PBR Metalness
* **Metallic Challenge**: 3D scans of metal objects (such as the crushed aluminium soda can) appear black or flat grey when lit only by basic ambient lights because PBR metallic surfaces require high-dynamic-range reflections.
* **Solution**: The scene integrates Three.js `RoomEnvironment` pre-filtered through `PMREMGenerator` (`pmremGenerator.fromScene(roomEnv).texture`). This produces realistic specular roughness and reflections on the aluminium can and tablet glass without downloading external HDR files.

### D. 3D Inspection & OrbitControls
* **Scoped Controls**: `OrbitControls` are disabled during digging so dragging erases sediment rather than rotating the world. They are enabled only upon entering `EXAMINATION` mode.
* **Polar Angle Clamping**: `controls.minPolarAngle = 0.15` and `controls.maxPolarAngle = 0.78 * Math.PI`. This guarantees the player can rotate and inspect the relic from any angle while preventing the camera from clipping below the stone pit bed.

### E. Client-Side Dig Certificate Generation
* **Render Pipeline**: A dedicated 1200×800 offscreen canvas draws an archaeological certificate with obsidian stratigraphy, survey grids, corner datum crosshairs, specimen provenance, authored field reports, and the sealed message.
* **Zero Server Overhead**: The certificate is generated instantaneously in-browser using pure 2D Canvas primitives. Clicking "Download Certificate (.PNG)" converts the canvas via `toDataURL('image/png')` and triggers an immediate local browser download.

### F. URL Fragment & XSS Immunity
* **Mechanism**: The sealed message is read from `window.location.hash` (supporting `#message=...`, `#key=val&message=...`, or raw `#...`).
* **Input Safety**: All fragment data is treated as untrusted user input. Text is written strictly to the DOM using `.textContent` and to the canvas using `.fillText()`. There are **0 occurrences of `innerHTML`, `outerHTML`, or `eval`** across the codebase. Malformed fragments, script tags, and HTML payloads are neutralized as raw literal text.
