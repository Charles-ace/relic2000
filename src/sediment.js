import * as THREE from 'three';

/**
 * SedimentManager: Controls the 512x512 brush mask canvas and sediment layer.
 * Only flags the texture for GPU upload when a stroke actually modifies it.
 */
export class SedimentManager {
  constructor(size = 3.2) {
    this.size = size;
    this.maskResolution = 512;
    this.revealedRatio = 0.0;
    this.revealThreshold = 0.35; // 35% of central dig area cleared
    this.isDirty = false;

    // 1. Create 512x512 Brush Mask Canvas
    this.maskCanvas = document.createElement('canvas');
    this.maskCanvas.width = this.maskResolution;
    this.maskCanvas.height = this.maskResolution;
    this.maskCtx = this.maskCanvas.getContext('2d', { willReadFrequently: true });

    // Fill with solid white (opaque sediment)
    this.resetMask();

    // 2. Create Three.js CanvasTexture for Alpha Mask
    this.maskTexture = new THREE.CanvasTexture(this.maskCanvas);
    this.maskTexture.generateMipmaps = false;
    this.maskTexture.minFilter = THREE.LinearFilter;
    this.maskTexture.magFilter = THREE.LinearFilter;

    // 3. Procedural Earth/Sediment Diffuse Texture
    this.diffuseTexture = this.generateSedimentTexture();

    // 4. Create Sediment Plane Mesh
    const geometry = new THREE.PlaneGeometry(this.size, this.size, 48, 48);
    // Rotate plane to lie flat (XZ plane, facing up)
    geometry.rotateX(-Math.PI / 2);

    this.material = new THREE.MeshStandardMaterial({
      map: this.diffuseTexture,
      alphaMap: this.maskTexture,
      transparent: true,
      alphaTest: 0.05,
      roughness: 0.96,
      metalness: 0.02,
      depthWrite: true,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.y = 0.02; // Sits just over pit bedrock
    this.mesh.name = "SedimentLayer";
  }

  resetMask() {
    this.maskCtx.fillStyle = '#ffffff';
    this.maskCtx.fillRect(0, 0, this.maskResolution, this.maskResolution);
    if (this.maskTexture) {
      this.maskTexture.needsUpdate = true;
    }
    this.revealedRatio = 0.0;
    this.isDirty = false;
  }

  generateSedimentTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base earth/shale color
    ctx.fillStyle = '#3a342c';
    ctx.fillRect(0, 0, 1024, 1024);

    // Multi-layered noise & strata bands
    for (let i = 0; i < 60000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const r = Math.random() * 2.5 + 0.5;
      const shade = Math.floor(45 + Math.random() * 55);
      const colorSpread = Math.floor(Math.random() * 15);
      ctx.fillStyle = `rgb(${shade + colorSpread}, ${shade}, ${shade - 10})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mineral specks and pebbles
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const r = Math.random() * 4 + 1.5;
      const grey = Math.floor(80 + Math.random() * 50);
      ctx.fillStyle = `rgb(${grey}, ${grey - 5}, ${grey - 10})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Strata cracks and fissures
    ctx.strokeStyle = 'rgba(25, 20, 16, 0.4)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      let sx = Math.random() * 1024;
      let sy = Math.random() * 1024;
      ctx.moveTo(sx, sy);
      for (let j = 0; j < 5; j++) {
        sx += (Math.random() - 0.5) * 80;
        sy += (Math.random() - 0.5) * 80;
        ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }

  /**
   * Brush stamp at UV coordinate (0..1, 0..1).
   * Only flags maskTexture.needsUpdate = true when pixels change.
   */
  brushAtUV(u, v, radius = 28) {
    if (u < 0 || u > 1 || v < 0 || v > 1) return false;

    // Convert UV to 512x512 canvas coordinates
    // Three.js UV has (0,0) at bottom-left, canvas has (0,0) at top-left
    const cx = Math.floor(u * this.maskResolution);
    const cy = Math.floor((1 - v) * this.maskResolution);

    this.maskCtx.save();
    this.maskCtx.globalCompositeOperation = 'destination-out';

    const grad = this.maskCtx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
    grad.addColorStop(0.65, 'rgba(0, 0, 0, 0.9)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    this.maskCtx.fillStyle = grad;
    this.maskCtx.beginPath();
    this.maskCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.maskCtx.fill();
    this.maskCtx.restore();

    // Mark dirty for GPU texture upload
    this.isDirty = true;
    this.maskTexture.needsUpdate = true;

    // Compute updated revealed percentage in central dig zone
    this.updateRevealedRatio();

    return true;
  }

  /**
   * Samples a 32x32 grid across the central area (20% to 80% of width and height)
   * to determine the percentage of cleared sediment over the buried relic.
   */
  updateRevealedRatio() {
    const gridRes = 32;
    const startIdx = Math.floor(this.maskResolution * 0.22);
    const endIdx = Math.floor(this.maskResolution * 0.78);
    const step = (endIdx - startIdx) / gridRes;

    const imgData = this.maskCtx.getImageData(startIdx, startIdx, endIdx - startIdx, endIdx - startIdx).data;
    const totalPixels = gridRes * gridRes;
    let clearedCount = 0;

    const w = endIdx - startIdx;
    for (let gy = 0; gy < gridRes; gy++) {
      for (let gx = 0; gx < gridRes; gx++) {
        const px = Math.floor(gx * step);
        const py = Math.floor(gy * step);
        const idx = (py * w + px) * 4;
        const alpha = imgData[idx + 3]; // 0 is completely erased, 255 is untouched
        if (alpha < 64) {
          clearedCount++;
        }
      }
    }

    this.revealedRatio = clearedCount / totalPixels;
  }

  isSufficientlyRevealed() {
    return this.revealedRatio >= this.revealThreshold;
  }

  getRevealedPercent() {
    return Math.min(100, Math.round(this.revealedRatio * 100));
  }
}
