import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class DigScene {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.width = canvasContainer.clientWidth;
    this.height = canvasContainer.clientHeight;

    // 1. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 2. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x131317);

    // 3. RoomEnvironment for PBR Specular Reflections (ensures metallic relics reflect properly)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    this.scene.environment = pmremGenerator.fromScene(roomEnv).texture;

    // 4. Cameras
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
    this.pitCameraPos = new THREE.Vector3(0, 3.6, 2.7);
    this.pitCameraTarget = new THREE.Vector3(0, 0, 0.1);
    this.camera.position.copy(this.pitCameraPos);
    this.camera.lookAt(this.pitCameraTarget);

    // 5. Lighting
    this.setupLighting();

    // 6. Dig Pit Geometry (Trench, walls, survey markers)
    this.setupDigPit();

    // 7. GLTF Loader with MeshoptDecoder
    this.loader = new GLTFLoader();
    this.loader.setMeshoptDecoder(MeshoptDecoder);

    // 8. OrbitControls (active in examination view)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 0.8;
    this.controls.maxDistance = 4.2;
    this.controls.minPolarAngle = 0.15;
    this.controls.maxPolarAngle = Math.PI * 0.78; // Restrict view from clipping through floor
    this.controls.enabled = false; // Disabled during brushing

    // Handle Window Resize
    window.addEventListener('resize', () => this.onResize());
  }

  setupLighting() {
    const ambient = new THREE.AmbientLight(0xf2e8dc, 0.75);
    this.scene.add(ambient);

    // Key archeological survey lamp
    this.keyLight = new THREE.DirectionalLight(0xfff7ea, 1.8);
    this.keyLight.position.set(3.5, 6.0, 4.0);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.scene.add(this.keyLight);

    // Fill rim light
    this.fillLight = new THREE.DirectionalLight(0xa5c2e8, 0.9);
    this.fillLight.position.set(-4.0, -1.0, -3.5);
    this.scene.add(this.fillLight);

    // Subtle overhead work lamp
    this.pointLight = new THREE.PointLight(0xffebcd, 0.6, 8);
    this.pointLight.position.set(0, 2.5, 0);
    this.scene.add(this.pointLight);
  }

  setupDigPit() {
    // 1. Excavation Trench Walls & Bedrock Floor
    const pitGeo = new THREE.BoxGeometry(3.6, 1.2, 3.6);
    
    // Invert pit normals so we are inside the pit or construct floor and walls
    const floorGeo = new THREE.PlaneGeometry(3.4, 3.4);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x221e1a,
      roughness: 0.98,
      metalness: 0.02
    });
    this.pitFloor = new THREE.Mesh(floorGeo, floorMat);
    this.pitFloor.position.y = -0.15; // Slightly below sediment plane
    this.scene.add(this.pitFloor);

    // 2. Surrounding Trench Walls (Rock strata / excavation soil cut)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x2a2520,
      roughness: 0.95,
      metalness: 0.05
    });

    const wallThickness = 0.4;
    const wallHeight = 0.9;
    const trenchSize = 3.4;

    const createWall = (x, z, w, d) => {
      const g = new THREE.BoxGeometry(w, wallHeight, d);
      const m = new THREE.Mesh(g, wallMat);
      m.position.set(x, wallHeight / 2 - 0.15, z);
      this.scene.add(m);
      return m;
    };

    // 4 Trench perimeter walls
    createWall(0, (trenchSize + wallThickness) / 2, trenchSize + wallThickness * 2, wallThickness); // South
    createWall(0, -(trenchSize + wallThickness) / 2, trenchSize + wallThickness * 2, wallThickness); // North
    createWall((trenchSize + wallThickness) / 2, 0, wallThickness, trenchSize); // East
    createWall(-(trenchSize + wallThickness) / 2, 0, wallThickness, trenchSize); // West

    // 3. Archeological Datum Pegs & Survey Grid Lines
    const pegMat = new THREE.MeshStandardMaterial({ color: 0xc87d32, roughness: 0.6 });
    const pegGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8);
    const pegCorners = [
      [-1.5, -1.5], [1.5, -1.5], [1.5, 1.5], [-1.5, 1.5]
    ];
    pegCorners.forEach(([px, pz]) => {
      const peg = new THREE.Mesh(pegGeo, pegMat);
      peg.position.set(px, 0.15, pz);
      this.scene.add(peg);
    });

    // Datum Grid Strings
    const lineMat = new THREE.LineBasicMaterial({ color: 0xd4a373, transparent: true, opacity: 0.45 });
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.5, 0.28, -1.5),
      new THREE.Vector3(1.5, 0.28, -1.5),
      new THREE.Vector3(1.5, 0.28, 1.5),
      new THREE.Vector3(-1.5, 0.28, 1.5),
      new THREE.Vector3(-1.5, 0.28, -1.5)
    ]);
    const gridLines = new THREE.Line(lineGeo, lineMat);
    this.scene.add(gridLines);
  }

  loadRelicGLB(url) {
    return new Promise((resolve, reject) => {
      this.loader.load(url, (gltf) => {
        const root = gltf.scene;
        
        // Compute bounding box and center
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        // Normalize scale to fit neatly within 1.6m bounding area in the pit
        const targetDim = 1.45;
        const normScale = targetDim / (maxDim || 1.0);
        root.scale.setScalar(normScale);
        
        // Center the geometry around its local origin
        root.position.sub(center.multiplyScalar(normScale));

        // Group wrapper for easy scene manipulation
        const wrapper = new THREE.Group();
        wrapper.add(root);
        wrapper.userData = { maxDim: maxDim * normScale, originalCenter: center };

        resolve(wrapper);
      }, undefined, (err) => {
        reject(err);
      });
    });
  }

  onResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  render() {
    if (this.controls.enabled) {
      this.controls.update();
    }
    this.renderer.render(this.scene, this.camera);
  }
}
