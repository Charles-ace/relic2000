# Relic Dig 3026

> An archaeological browser game where a future researcher in the year 3026 brushes sediment off real 3D relics from the 2020s, reads field reports that confidently misinterpret each find, and uncovers a sealed message from the past.

---

### Navigation & Key Links

[**📖 Architecture & Specs**](docs/ARCHITECTURE.md) &nbsp;|&nbsp;
[**🏺 3D Asset Provenance**](docs/PROVENANCE.md) &nbsp;|&nbsp;
[**🔬 Reality Audit (Real vs. Mocked)**](REAL_VS_MOCKED.md) &nbsp;|&nbsp;
[**🖼 Evidence & Screenshots**](evidence/) &nbsp;|&nbsp;
[**⚙ Run Locally**](#run-locally)

---

## The Problem

Most web-based "excavation" games fake discovery. They use arbitrary progress bars, click counters, or timers that suddenly reveal a pre-baked 3D model with an explosion of particle effects. The physical feeling of unearthing an artifact—carefully removing dirt stroke by stroke, spotting a familiar silhouette under the earth, and hoisting it up for study—is replaced with an abstract clicker mechanic.

Furthermore, future-archaeology sci-fi often treats humanity's artifacts as either forgotten apocalyptic ruins or advanced sci-fi treasures. It rarely captures the comedic tragedy of future scholars studying everyday consumer plastic and aluminium with complete academic solemnity.

---

## What It Does

**Relic Dig 3026** puts the player in the boots of an expedition field researcher in **Earth Sector 7** during the 31st century:

1. **Physical Sediment Excavation**: The player uses an archaeological brush across a stone pit bed. A real-time 512×512 alpha mask erases the sediment layer beneath the brush cursor, uncovering buried 3D relics.
2. **Relic Extraction**: Once sufficient surface area is cleared, the relic lifts up out of the stratum with a smooth cubic ease-out animation into an elevated examination chamber.
3. **Full 3D Examination**: The player inspects the relic with free rotation and zoom controls, examining weathered textures, dents, and calcified buttons under physically-based lighting.
4. **Authored 3026 Field Reports**: Each specimen is paired with an expedition report that misinterprets mundane 21st-century tech (wired earbuds classified as subcutaneous neural implants; a crushed soda can classified as a single-use laboratory pressure vessel).
5. **Sealed Message & Discovery Certificate**: The final find reveals a sealed message left behind for the future. The game client-side generates an archival 1200×800 discovery certificate with survey grid datum lines and expedition verification seals, exportable directly as a PNG.

---

## Why This Is Different

* **Genuine Physical Excavation**: No progress bars. The sediment is an actual textured plane whose transparency is cleared via canvas raycasting. You see the relic because the sediment physically ceased to exist at those coordinates.
* **100% Real 3D Assets**: Five custom, unbranded relics generated with **Tripo v3.1** and compressed for real-time mobile/desktop rendering.
* **Zero Runtime Dependencies**: No backend, no database, no runtime LLM, no external CDNs, and zero third-party network requests. Total deployed payload is **3.32 MB**.
* **Zero-Trust URL Fragment Messaging**: Custom sealed messages can be passed directly via the URL fragment (`#message=...`), fully parsed client-side and sanitized against XSS (zero `innerHTML` usage).

---

## 3D Relics & Tripo Provenance

Every relic in the dig pit was generated using **Tripo v3.1** (Text-to-3D) and optimized with `gltf-transform`:

| Specimen | Name | Tripo Task ID | Raw Size | Deployed Size | Triangles | Compression |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SPEC-3026-01` | Wired Earbuds | `6f2a0c8b-0cf4-433c-8f80-f4c51d03a862` | 44.1 MB | 615.5 KB | 43,200 | 1024px WebP + Meshopt |
| `SPEC-3026-02` | Aluminium Can | `bcf2bf0e-eac7-4488-b2f3-ff4ea73a7171` | 43.8 MB | 734.3 KB | 55,104 | 1024px WebP + Meshopt |
| `SPEC-3026-03` | Glass Slab Tablet | `c56073a6-c5fd-4f66-bc1d-9afd01d53cf6` | 46.2 MB | 619.0 KB | 47,676 | 1024px WebP + Meshopt |
| `SPEC-3026-04` | TV Remote | `2da76341-a08e-402a-b967-d3003ee9320e` | 45.7 MB | 448.8 KB | 39,500 | 1024px WebP + Meshopt |
| `SPEC-3026-05` | Game Controller | `bf6491ba-40af-42ca-aec8-fcf2aac19173` | 43.9 MB | 368.2 KB | 36,962 | 1024px WebP + Meshopt |

*Total 3D asset payload is **2.72 MB** (98.8% reduction from raw ~224 MB models, well under the 10 MB budget).*  
*Full prompt and parameter documentation is available in [docs/PROVENANCE.md](docs/PROVENANCE.md).*

---

## How It Works

```text
User Input (Mouse / Touch Drag)
      │
      ▼
Raycaster intersects Sediment Plane UVs
      │
      ▼
512×512 HTML5 Alpha Mask Canvas draws radial erase
      │
      ├──> texture.needsUpdate = true (only on pixel state change)
      └──> calculate revealed % (activates extraction at >= 25%)
      │
      ▼
Extract Relic -> 1.2s Cubic Ease-out Lift Lerp (or instant if prefers-reduced-motion)
      │
      ▼
Examination Mode: OrbitControls enabled, Polar angles clamped [0.15, 0.78π]
      │
      ▼
Load Authored Field Report + Safe URL Hash Message
      │
      ▼
Client-Side Dig Certificate: 1200×800 Canvas with Astronomical Seals -> Instant PNG Download
```

For comprehensive technical explanations of the render pipeline, PMREM lighting, and canvas optimization, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Key Technical Decisions

1. **In-Memory 512×512 Canvas Alpha Mask over Custom Fragment Shaders**:
   Using an offscreen canvas as a `THREE.CanvasTexture` allows standard Three.js PBR materials to handle all shadow receiving and ambient lighting naturally, while keeping code maintainable and portable across WebGL1 and WebGL2.
2. **GPU Upload Discipline**:
   Marking canvas textures dirty (`needsUpdate = true`) on every frame creates micro-stutters on mobile. In this engine, `needsUpdate` is flagged strictly when a pointer movement changes pixel transparency.
3. **PMREMGenerator & RoomEnvironment for Metal Reflections**:
   Standard Three.js directional lights make metallic models (such as the crushed aluminium can) render almost completely black due to lack of environment reflection. We generate an in-memory radiance map via `PMREMGenerator(renderer).fromScene(new RoomEnvironment())`, achieving high-fidelity metal reflections without downloading heavy external `.hdr` skyboxes.
4. **URL Fragment for Zero-Backend Gifting**:
   Rather than requiring a database or backend server to allow users to customize their sealed gift message, the application parses `window.location.hash`. Messages are shared via link, rendered strictly via `.textContent` and `.fillText()`, guaranteeing zero XSS vulnerability.

---

## Verifiable Evidence & Audit Results

Every performance and security claim is backed by automated tests:

| Metric | Target | Verified Value | Evidence |
| :--- | :--- | :--- | :--- |
| **Total Deployed Payload** | ≤ 15.0 MB | **3.32 MB** (3,479,903 bytes) | `dist/` directory audit |
| **3D Asset Payload** | ≤ 10.0 MB | **2.72 MB** (2,852,752 bytes) | [`docs/PROVENANCE.md`](docs/PROVENANCE.md) |
| **External Runtime Requests**| 0 | **0** (strictly localhost / blob) | [`evidence/qa-audit-report.json`](evidence/qa-audit-report.json) |
| **XSS Vulnerability Checks** | 0 exploitable | **0** (`innerHTML` occurrences: 0) | Automated Playwright test |
| **Mobile Responsiveness** | No overflow | **390×844 Verified** | [`evidence/screenshots/mobile_dig_pit.png`](evidence/screenshots/mobile_dig_pit.png) |
| **Accessibility & Motion** | Reduced motion | **Skip lerp verified** | [`evidence/qa-audit-report.json`](evidence/qa-audit-report.json) |

Visual inspection records are archived in [`evidence/screenshots/`](evidence/screenshots/):
* Examination View: [`evidence/screenshots/examination_view.png`](evidence/screenshots/examination_view.png)
* Certificate Modal: [`evidence/screenshots/certificate_modal.png`](evidence/screenshots/certificate_modal.png)
* Exported 1200×800 Certificate: [`evidence/screenshots/exported_certificate.png`](evidence/screenshots/exported_certificate.png)
* Mobile Screenshots: [`evidence/screenshots/mobile_dig_pit.png`](evidence/screenshots/mobile_dig_pit.png), [`evidence/screenshots/mobile_examination.png`](evidence/screenshots/mobile_examination.png)

---

## Hackathon Alignment

### Tripothon S1 Track Mapping

| Track / Criterion | Alignment & Implementation |
| :--- | :--- |
| **Direction Track: Game** | Complete interactive excavation core loop: physical brush reveal, 3D relic examination, authored satirical field reports, sealed past messages, and exportable certificates. |
| **Tripo Tool Track** | All five game relics are genuine 3D assets generated using Tripo v3.1 Text-to-3D, integrated directly into a production WebGL environment using MeshoptDecoder. |
| **Technical Depth** | Custom 512×512 alpha masking engine, PMREM specular reflection generation, sub-3.5MB total build optimization, responsive mobile layout, and zero-trust fragment sanitization. |
| **Scope Discipline** | Zero unnecessary bloat: no backends, no database dependencies, no runtime LLMs, and zero external tracking. Focused entirely on responsive, high-framerate gameplay. |

---

## Tech Stack

* **Rendering Engine**: Three.js (r160)
* **Mesh Compression**: Meshopt Decoder (`three/examples/jsm/libs/meshopt_decoder.module.js`)
* **Asset Loading**: GLTFLoader (`three/examples/jsm/loaders/GLTFLoader.js`)
* **Environment**: RoomEnvironment + PMREMGenerator
* **Controls**: OrbitControls (`three/examples/jsm/controls/OrbitControls.js`)
* **Build Tooling**: Vite 5
* **Automation & Testing**: Playwright (Headless WebGL testing)

---

## Run Locally

### Prerequisites
* Node.js (v18+)
* npm

### Setup
```bash
git clone https://github.com/Enoch208/relic2000.git
cd relic2000
npm install
```

### Development
```bash
npm run dev
```
Open `http://localhost:5173/` in your browser.

### Production Build & Preview
```bash
npm run build
npm run preview
```

### Environment Variables
* **None required**. The application is 100% static and client-side. Zero API keys or secrets are used at runtime.

---

## Project Structure

```text
relic2000/
├── README.md               # Judge landing page & project specification
├── REAL_VS_MOCKED.md       # Tamper-evident implementation reality audit
├── LICENSE                 # MIT License
├── index.html              # Single-page application entrypoint
├── package.json            # Minimal dependencies (three, vite)
├── vite.config.js          # Static bundler configuration
├── src/                    # Application source code
│   ├── main.js             # Core game state manager & input controller
│   ├── scene.js            # Three.js scene, camera, lights & PMREM environment
│   ├── sediment.js         # 512×512 alpha-mask canvas manager & brush erasure
│   ├── certificate.js      # 1200×800 Discovery Certificate 2D canvas generator
│   ├── style.css           # Responsive layout, accessibility focus rings, animations
│   └── data/
│       └── relics.js       # Static relic metadata, authored field notes, fragment parser
├── public/
│   └── assets/             # Compressed Tripo 3D models (*.glb)
├── docs/                   # Deep-dive technical documentation
│   ├── ARCHITECTURE.md     # In-depth architectural & rendering breakdown
│   └── PROVENANCE.md       # Tripo 3D generation prompts, tasks & compression specs
├── evidence/               # Reproducible test reports & visual assets
│   ├── qa-audit-report.json# Automated Playwright test run results
│   └── screenshots/        # High-resolution verification captures
└── scripts/                # Verification utilities
    ├── verify.py           # Automated end-to-end Playwright test suite
    └── secret-scan.py      # Pre-deployment credential & secret scanner
```

---

## Limitations & Honest Boundaries

* **Single Dig Pit Site**: The game focuses on a single archaeological dig pit in Earth Sector 7. There are no procedural infinite landscapes or multiple biomes.
* **Pre-Baked 3D Assets**: Relics were generated through Tripo v3.1 during development and shipped as static GLBs. They are not generated at runtime on demand.
* **Deterministic Field Notes**: All field notes were authored by human writers to achieve specific satirical tone; they are not generated via runtime LLM.
* **Static Client-Side Gifting**: The sealed message is stored directly in the URL hash. If the URL exceeds browser hash length limits (~2,000 characters), it will be truncated.

---

## Verification & Reproducibility

Anyone with Node.js and Python can independently verify all claims:

1. **Verify Secret & Credential Hygiene**:
   ```bash
   python scripts/secret-scan.py
   ```
2. **Run End-to-End Core-Loop & Network Verification**:
   ```bash
   npm run dev &
   python scripts/verify.py http://localhost:5173/
   ```
3. **Verify Production Build Payload**:
   ```bash
   npm run build
   ```

---

## License

This project is open-source under the [MIT License](LICENSE).
3D relic models were generated using Tripo AI and are distributed under the project's open-source terms.
