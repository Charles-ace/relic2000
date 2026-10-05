import * as THREE from 'three';
import { RELICS, getSealedMessageFromURL } from './data/relics.js';
import { DigScene } from './scene.js';
import { SedimentManager } from './sediment.js';
import { renderCertificateOnCanvas, downloadCertificateCanvas } from './certificate.js';

// Game States
const STATE_DIG = 'DIG_PIT';
const STATE_EXTRACTING = 'EXTRACTING';
const STATE_EXAM = 'EXAMINATION';

class RelicGame {
  constructor() {
    this.currentState = STATE_DIG;
    this.currentRelicIndex = 0;
    this.currentRelicGroup = null;
    this.isPointerDown = false;
    this.hasRevealedRelic = false;

    // Extraction transition variables
    this.transitionProgress = 0;
    this.transitionDuration = 1.2; // seconds
    this.transitionStartTime = 0;

    // DOM Elements
    this.container = document.getElementById('canvas-container');
    this.relicSelect = document.getElementById('relic-select');
    this.hudPrevFind = document.getElementById('hud-prev-find');
    this.hudNextFind = document.getElementById('hud-next-find');
    this.clearanceText = document.getElementById('clearance-text');
    this.pitHud = document.getElementById('pit-hud');
    this.brushHint = document.getElementById('brush-hint');
    this.extractBtn = document.getElementById('extract-btn');
    this.examPanel = document.getElementById('exam-panel');
    this.examTitle = document.getElementById('exam-title');
    this.examSpecimen = document.getElementById('exam-specimen');
    this.examProvenance = document.getElementById('exam-provenance');
    this.examFieldnote = document.getElementById('exam-fieldnote');
    this.examCloseBtn = document.getElementById('exam-close-btn');
    this.viewCertBtn = document.getElementById('view-cert-btn');
    this.nextRelicBtn = document.getElementById('next-relic-btn');
    this.hudCertBtn = document.getElementById('hud-cert-btn');
    this.certModal = document.getElementById('cert-modal');
    this.certCanvas = document.getElementById('cert-canvas');
    this.certCloseBtn = document.getElementById('cert-close-btn');
    this.certDownloadBtn = document.getElementById('cert-download-btn');
    this.brushCursor = document.getElementById('brush-cursor');

    // Sealed Message from URL Fragment (always handled safely via textContent / canvas)
    this.sealedMessage = getSealedMessageFromURL();
    window.addEventListener('hashchange', () => {
      this.sealedMessage = getSealedMessageFromURL();
      if (this.certModal && !this.certModal.classList.contains('hidden')) {
        this.openCertificate();
      }
    });

    // 1. Initialize Three.js Scene
    this.digScene = new DigScene(this.container);

    // 2. Initialize Sediment Layer Manager (512x512 mask)
    this.sediment = new SedimentManager(3.3);
    this.digScene.scene.add(this.sediment.mesh);

    // 3. Raycaster & Pointer
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    // 4. In-Memory Relic Cache for instantaneous find switching
    this.relicCache = new Map();

    // 5. Setup Input Listeners
    this.setupInputs();

    // 6. Load Initial Relic & Preload Remaining Relics
    this.loadRelic(this.currentRelicIndex).then(() => {
      this.preloadAllRelics();
    });

    // 7. Start Loop
    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  get prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  async preloadAllRelics() {
    for (let i = 0; i < RELICS.length; i++) {
      const relic = RELICS[i];
      if (!this.relicCache.has(relic.file)) {
        try {
          const modelGroup = await this.digScene.loadRelicGLB(relic.file);
          this.relicCache.set(relic.file, modelGroup);
        } catch (e) {
          console.warn(`[RelicGame] Preload failed for ${relic.file}:`, e);
        }
      }
    }
  }

  goToRelic(index) {
    if (this.certModal && !this.certModal.classList.contains('hidden')) {
      this.closeCertificate();
    }
    if (this.currentState === STATE_EXAM || this.currentState === STATE_EXTRACTING) {
      this.returnToPit();
    }
    this.loadRelic(index);
  }

  async loadRelic(index) {
    const relicData = RELICS[index];
    if (!relicData) return;

    this.currentRelicIndex = index;
    if (this.relicSelect && this.relicSelect.value !== String(index)) {
      this.relicSelect.value = index;
    }

    // If existing relic in scene, remove it
    if (this.currentRelicGroup) {
      this.digScene.scene.remove(this.currentRelicGroup);
      this.currentRelicGroup = null;
    }

    // Reset sediment layer for this find in the single dig pit
    this.sediment.resetMask();
    this.hasRevealedRelic = false;
    this.updateClearanceHUD(0);
    this.extractBtn.classList.add('hidden');
    this.brushHint.classList.remove('hidden');

    try {
      let modelGroup;
      if (this.relicCache.has(relicData.file)) {
        modelGroup = this.relicCache.get(relicData.file);
      } else {
        console.log(`[RelicGame] Loading compressed GLB via MeshoptDecoder: ${relicData.file}`);
        modelGroup = await this.digScene.loadRelicGLB(relicData.file);
        this.relicCache.set(relicData.file, modelGroup);
      }
      
      // Position relic buried in the pit bed under the sediment plane
      const [ox, oy, oz] = relicData.pitOffset || [0, -0.05, 0];
      modelGroup.position.set(ox, oy, oz);
      modelGroup.rotation.set(0, 0, 0);
      modelGroup.scale.setScalar(relicData.scale || 1.0);
      
      this.digScene.scene.add(modelGroup);
      this.currentRelicGroup = modelGroup;
      console.log(`[RelicGame] Relic ready in dig pit: ${relicData.name}`);
    } catch (err) {
      console.error(`[RelicGame] Failed to load GLB:`, err);
    }
  }

  setupInputs() {
    // Dropdown Relic Selector
    this.relicSelect.addEventListener('change', (e) => {
      this.goToRelic(parseInt(e.target.value, 10));
    });

    // HUD Stepper Navigation
    if (this.hudPrevFind) {
      this.hudPrevFind.addEventListener('click', () => {
        const prevIdx = (this.currentRelicIndex - 1 + RELICS.length) % RELICS.length;
        this.goToRelic(prevIdx);
      });
    }

    if (this.hudNextFind) {
      this.hudNextFind.addEventListener('click', () => {
        const nextIdx = (this.currentRelicIndex + 1) % RELICS.length;
        this.goToRelic(nextIdx);
      });
    }

    // Extract Button Click
    this.extractBtn.addEventListener('click', () => {
      this.startExtraction();
    });

    // Close Examination Button (Return to pit)
    this.examCloseBtn.addEventListener('click', () => {
      this.returnToPit();
    });

    // Next Relic Button from Examination Modal
    this.nextRelicBtn.addEventListener('click', () => {
      const nextIdx = (this.currentRelicIndex + 1) % RELICS.length;
      this.goToRelic(nextIdx);
    });

    // Certificate Action Triggers
    if (this.viewCertBtn) {
      this.viewCertBtn.addEventListener('click', () => {
        this.openCertificate();
      });
    }

    if (this.hudCertBtn) {
      this.hudCertBtn.addEventListener('click', () => {
        this.openCertificate();
      });
    }

    if (this.certCloseBtn) {
      this.certCloseBtn.addEventListener('click', () => {
        this.closeCertificate();
      });
    }

    if (this.certDownloadBtn) {
      this.certDownloadBtn.addEventListener('click', () => {
        this.downloadCertificate();
      });
    }

    // Keyboard ESC to leave certificate modal or examination
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.certModal && !this.certModal.classList.contains('hidden')) {
          this.closeCertificate();
          return;
        }
        if (this.currentState === STATE_EXAM) {
          this.returnToPit();
        }
      }
    });

    // Pointer Events for Brushing and Relic Click (Supports Mouse and Touch seamlessly)
    this.container.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', (e) => this.onPointerUp(e));
    window.addEventListener('pointercancel', (e) => this.onPointerUp(e));
  }

  openCertificate() {
    const relic = RELICS[this.currentRelicIndex];
    if (this.certCanvas) {
      renderCertificateOnCanvas(this.certCanvas, relic, this.sealedMessage);
    }
    if (this.certModal) {
      this.certModal.classList.remove('hidden');
      if (this.certCloseBtn) {
        this.certCloseBtn.focus();
      }
    }
  }

  closeCertificate() {
    if (this.certModal) {
      this.certModal.classList.add('hidden');
    }
    if (this.currentState === STATE_EXAM && this.viewCertBtn) {
      this.viewCertBtn.focus();
    } else if (this.hudCertBtn) {
      this.hudCertBtn.focus();
    }
  }

  downloadCertificate() {
    if (!this.certCanvas) return;
    const relic = RELICS[this.currentRelicIndex];
    const filename = `relic-dig-3026-${relic.id}-certificate.png`;
    downloadCertificateCanvas(this.certCanvas, filename);
  }

  updatePointerCoords(e) {
    const rect = this.container.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  onPointerDown(e) {
    if (this.currentState !== STATE_DIG) return;

    this.isPointerDown = true;
    this.updatePointerCoords(e);
    this.performBrushOrClick(true);
  }

  onPointerMove(e) {
    // Update custom brush cursor in DIG mode
    if (this.currentState === STATE_DIG) {
      this.brushCursor.style.display = 'block';
      this.brushCursor.style.left = `${e.clientX}px`;
      this.brushCursor.style.top = `${e.clientY}px`;
    } else {
      this.brushCursor.style.display = 'none';
    }

    if (!this.isPointerDown || this.currentState !== STATE_DIG) return;

    this.updatePointerCoords(e);
    this.performBrushOrClick(false);
  }

  onPointerUp(e) {
    this.isPointerDown = false;
  }

  performBrushOrClick(isInitialDown) {
    this.raycaster.setFromCamera(this.pointer, this.digScene.camera);

    // 1. Check if user clicked on revealed relic to extract it
    if (isInitialDown && this.hasRevealedRelic && this.currentRelicGroup) {
      const relicHits = this.raycaster.intersectObjects(this.currentRelicGroup.children, true);
      if (relicHits.length > 0) {
        this.startExtraction();
        return;
      }
    }

    // 2. Raycast to sediment plane for brushing
    const sedimentHits = this.raycaster.intersectObject(this.sediment.mesh);
    if (sedimentHits.length > 0) {
      const hit = sedimentHits[0];
      if (hit.uv) {
        // Brush erase stamp at UV coordinate (radius 32px on 512x512 canvas)
        this.sediment.brushAtUV(hit.uv.x, hit.uv.y, 32);

        const pct = this.sediment.getRevealedPercent();
        this.updateClearanceHUD(pct);

        if (!this.hasRevealedRelic && this.sediment.isSufficientlyRevealed()) {
          this.hasRevealedRelic = true;
          this.extractBtn.classList.remove('hidden');
          this.brushHint.classList.add('hidden');
        }
      }
    }
  }

  updateClearanceHUD(percent) {
    this.clearanceText.textContent = `${percent}%`;
  }

  startExtraction() {
    if (this.currentState === STATE_EXTRACTING || this.currentState === STATE_EXAM) return;

    this.currentState = STATE_EXTRACTING;
    this.brushCursor.style.display = 'none';
    this.extractBtn.classList.add('hidden');
    this.brushHint.classList.add('hidden');

    if (this.prefersReducedMotion) {
      // Instant transition
      this.finishExtraction();
      return;
    }

    // Start smooth lift animation
    this.transitionStartTime = performance.now();
    this.transitionProgress = 0;
  }

  finishExtraction() {
    this.currentState = STATE_EXAM;

    // Relic at examination center (elevated above modal card)
    if (this.currentRelicGroup) {
      this.currentRelicGroup.position.set(0, 1.05, 0);
    }

    // Examination camera position
    this.digScene.camera.position.set(0, 1.25, 2.3);
    this.digScene.controls.target.set(0, 1.05, 0);
    this.digScene.camera.lookAt(0, 1.05, 0);
    this.digScene.controls.enabled = true;

    // Populate examination modal with static relic metadata and field note
    const relic = RELICS[this.currentRelicIndex];
    this.examTitle.textContent = relic.name;
    this.examSpecimen.textContent = relic.specimenId;
    if (this.examProvenance) {
      this.examProvenance.textContent = relic.provenance;
    }
    this.examFieldnote.textContent = relic.fieldNote;

    this.examPanel.classList.remove('hidden');
    this.examCloseBtn.focus(); // Accessible keyboard focus
  }

  returnToPit() {
    this.currentState = STATE_DIG;
    this.examPanel.classList.add('hidden');
    this.digScene.controls.enabled = false;

    // Reset camera to pit view
    this.digScene.camera.position.copy(this.digScene.pitCameraPos);
    this.digScene.camera.lookAt(this.digScene.pitCameraTarget);

    // Return relic to buried position
    if (this.currentRelicGroup) {
      const relicData = RELICS[this.currentRelicIndex];
      const [ox, oy, oz] = relicData.pitOffset || [0, -0.05, 0];
      this.currentRelicGroup.position.set(ox, oy, oz);
      this.currentRelicGroup.rotation.set(0, 0, 0);
    }

    if (this.hasRevealedRelic) {
      this.extractBtn.classList.remove('hidden');
    } else {
      this.brushHint.classList.remove('hidden');
    }
  }

  animate(now) {
    requestAnimationFrame(this.animate);

    // Handle extraction animation lerp
    if (this.currentState === STATE_EXTRACTING) {
      const elapsed = (now - this.transitionStartTime) / 1000;
      const t = Math.min(1, elapsed / this.transitionDuration);
      
      // Smooth cubic ease-out: 1 - (1 - t)^3
      const ease = 1 - Math.pow(1 - t, 3);

      if (this.currentRelicGroup) {
        // Lift relic from pit Y to examination Y (1.05)
        const relicData = RELICS[this.currentRelicIndex];
        const startY = (relicData.pitOffset && relicData.pitOffset[1]) || -0.05;
        this.currentRelicGroup.position.y = THREE.MathUtils.lerp(startY, 1.05, ease);
        this.currentRelicGroup.rotation.y = ease * Math.PI * 0.4;
      }

      // Camera lerps toward examination view
      this.digScene.camera.position.lerpVectors(
        this.digScene.pitCameraPos,
        new THREE.Vector3(0, 1.25, 2.3),
        ease
      );
      this.digScene.camera.lookAt(0, 0.1 + (1.05 - 0.1) * ease, 0);

      if (t >= 1) {
        this.finishExtraction();
      }
    }

    // Render Scene
    this.digScene.render();
  }
}

// Boot game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const game = new RelicGame();
  if (import.meta.env.DEV) {
    window.__relicGame = game;
  }
});
