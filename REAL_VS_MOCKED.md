# REAL vs. MOCKED & NOT USED: Relic Dig 3026

This document provides a factual, tamper-evident audit of what is genuinely implemented and executed in **Relic Dig 3026** versus what is intentionally not present or not used.

---

## 1. REAL (Genuinely Implemented & Executed)

* **Five Relic Meshes Generated via Tripo**:
  All five 3D relics are genuine outputs from the Tripo v3.1 API pipeline, compressed via `gltf-transform` (meshopt, 1024px WebP, 36k–55k triangles) and shipped directly as static GLB assets in `/assets/`:
  1. `earbuds_v2.glb` (615.5 KB, 43,200 triangles) — Specimen `SPEC-3026-01` (Tripo Task `6f2a0c8b-0cf4-433c-8f80-f4c51d03a862`)
  2. `crushed_can_fossil.glb` (734.3 KB, 55,104 triangles) — Specimen `SPEC-3026-02` (Tripo Task `bcf2bf0e-eac7-4488-b2f3-ff4ea73a7171`)
  3. `tablet_v1.glb` (619.0 KB, 47,676 triangles) — Specimen `SPEC-3026-03` (Tripo Task `c56073a6-c5fd-4f66-bc1d-9afd01d53cf6`)
  4. `remote_v1.glb` (448.8 KB, 39,500 triangles) — Specimen `SPEC-3026-04` (Tripo Task `2da76341-a08e-402a-b967-d3003ee9320e`)
  5. `controller_v1.glb` (368.2 KB, 36,962 triangles) — Specimen `SPEC-3026-05` (Tripo Task `bf6491ba-40af-42ca-aec8-fcf2aac19173`)
* **Three.js 3D Rendering & Lighting**:
  Fully client-side Three.js WebGL scene with RoomEnvironment PMREM reflections so metallic materials (notably the aluminium can) render realistically with physical roughness/metalness rather than dark/flat shading.
* **Real Sediment Brush Erasure**:
  Interactive 512×512 HTML5 canvas alpha mask (`THREE.CanvasTexture`) applied directly over the sediment plane mesh. Dragging a mouse or touch stroke erases sediment dynamically under the brush cursor; the GPU texture upload flag is set only when pixels actually change.
* **Real Relic Extraction**:
  When sediment clearance reaches threshold (or when clicking an uncovered relic), the buried model lifts up with a 1.2s cubic ease-out lerp into elevated inspection space (instantaneous under `prefers-reduced-motion`).
* **Real Rotation & Zoom Inspection**:
  OrbitControls enabled specifically during examination view, allowing full 360° mouse/touch rotation and scroll/pinch zooming with clamped polar angles to prevent ground clipping.
* **Static Authored Field Notes**:
  Authored 3026 archaeological field reports embedded in client-side static data ([`src/data/relics.js`](file:///c:/Builds/relic2000/src/data/relics.js)), rendered with zero `innerHTML` usage.
* **URL-Fragment Sealed Message**:
  Reads custom message payload directly from `window.location.hash` (e.g. `#message=...`), falls back to the static default message, treats all hash input as untrusted, and escapes it completely via DOM `.textContent` and Canvas text rendering.
* **Client-Side Certificate Generation & PNG Export**:
  Standalone 1200×800 HTML5 canvas rendered directly in-browser with datum crosshairs, archaeological seals, recovery metadata, and an instant client-side `.png` download trigger.

---

## 2. NOT PRESENT / NOT USED (Intentionally Excluded)

* **Runtime Tripo API**: No network calls are made to Tripo at runtime. Tripo was used strictly during the asset creation phase (Section 7A), and assets are served statically.
* **Runtime LLM / AI Generation**: All field notes and archaeological copy are authored static strings. No runtime LLMs, OpenAI, Anthropic, or external inference APIs are invoked.
* **Backend / Server-Side Code**: Pure static frontend application (`Vite` static build). No Node server, Python backend, or serverless functions required.
* **Database**: No SQL, NoSQL, Firestore, or cloud database storage.
* **Accounts / Authentication**: No user login, OAuth, passwords, sessions, or registration.
* **Uploads**: No user file uploads or remote image transfers.
* **Speech / Voice Synthesis**: No text-to-speech, Web Audio synthesis, or external voice APIs.
* **Procedural Terrain**: Single fixed excavation dig pit model. No infinite or procedural landscape generation.
* **Multiple Biomes / Dig Sites**: Single focused Earth Sector 7 pit container.
* **Scoring / Timers**: No countdown clocks, high score leaderboards, or artificial pressure mechanics. Focus remains strictly on archaeological excavation and discovery.

---

## 3. Telemetry & Dependency Integrity

* **External Runtime Network Requests**: **0** (interception audit confirmed zero third-party calls).
* **Console Errors**: **0**.
* **Total Deployed Payload**: **3.32 MB** (entire production bundle in `dist/`, including all five GLB 3D models).
