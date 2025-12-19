import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const modelsData = {
    'ISS': { file: 'iss.glb', scale: 0.01, name: 'International Space Station' },
    'Hubble': { file: 'hubble.glb', scale: 0.5, name: 'Hubble Space Telescope' },
    'Jason-3': { file: 'Jason_3.glb', scale: 0.3, name: 'Jason-3 Satellite' },
    'Aqua': { file: 'aqua.glb', scale: 0.3, name: 'Aqua Satellite' },
    'GOES': { file: 'goes.glb', scale: 0.3, name: 'GOES Satellite' },
    'Sputnik 1': { file: 'sputnik_1.glb', scale: 1, name: 'Sputnik 1' },
    'Earth': { file: 'earth.glb', scale: 1, name: 'Earth' },
    'Moon': { file: 'moon.glb', scale: 1, name: 'Moon' },
    'Sun': { file: 'sun.glb', scale: 1, name: 'Sun' },
    'UFO': { file: 'ufo.glb', scale: 1, name: 'UFO' }
};

class ModelViewer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;
        this.modelName = window.MODEL_NAME;
        this.container = document.getElementById('canvas-container');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.errorMessage = document.getElementById('errorMessage');

        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(5, 3, 5);
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        this.container.appendChild(this.renderer.domElement);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 20;
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 0;

        this.setupLights();

        this.loadModel();

        window.addEventListener('resize', () => this.onWindowResize());

        this.animate();
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
        mainLight.position.set(5, 5, 5);
        this.scene.add(mainLight);

        const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
        fillLight.position.set(-5, 3, -5);
        this.scene.add(fillLight);

        const backLight = new THREE.DirectionalLight(0xffffff, 0.4);
        backLight.position.set(0, 5, -5);
        this.scene.add(backLight);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
        this.scene.add(hemiLight);
    }

    loadModel() {
        const modelInfo = modelsData[this.modelName];

        if (!modelInfo) {
            this.showError('Model not found');
            return;
        }

        document.getElementById('modelTitle').textContent = modelInfo.name;

        const loader = new GLTFLoader();
        const modelPath = `/static/assets/${modelInfo.file}`;

        loader.load(
            modelPath,
            (gltf) => {
                this.model = gltf.scene;

                this.model.scale.setScalar(modelInfo.scale);

                const box = new THREE.Box3().setFromObject(this.model);
                const center = box.getCenter(new THREE.Vector3());
                this.model.position.sub(center);

                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const fov = this.camera.fov * (Math.PI / 180);
                let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
                cameraZ *= 2.5; 

                this.camera.position.set(cameraZ, cameraZ * 0.6, cameraZ);
                this.camera.lookAt(0, 0, 0);
                this.controls.target.set(0, 0, 0);
                this.controls.update();
                this.scene.add(this.model);
                this.loadingOverlay.style.display = 'none';
            },
            (progress) => {
                const percent = (progress.loaded / progress.total) * 100;
                console.log(`Loading: ${percent.toFixed(2)}%`);
            },
            (error) => {
                console.error('Error loading model:', error);
                this.showError('Failed to load 3D model');
            }
        );
    }

    showError(message) {
        this.loadingOverlay.style.display = 'none';
        this.errorMessage.style.display = 'block';
        this.errorMessage.querySelector('p').textContent = message;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();

        this.renderer.render(this.scene, this.camera);
    }
}
document.addEventListener('DOMContentLoaded', () => {
    new ModelViewer();
});
