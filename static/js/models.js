import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const modelsGrid = document.getElementById('modelsGrid');

function createModelCard(modelData) {
    const card = document.createElement('div');
    card.className = 'model-card';
    card.dataset.category = modelData.category;

    const preview = document.createElement('div');
    preview.className = 'model-preview';
    preview.innerHTML = '<div class="loading-placeholder"></div>';

    const info = document.createElement('div');
    info.className = 'model-info';

    const name = document.createElement('h3');
    name.className = 'model-name';
    name.textContent = modelData.name;

    const description = document.createElement('p');
    description.className = 'model-description';
    description.textContent = modelData.description;

    info.appendChild(name);
    info.appendChild(description);

    card.appendChild(preview);
    card.appendChild(info);

    load3DModel(preview, modelData.file);

    return card;
}

function load3DModel(container, filename) {``
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0x4facfe, 1.5);
    directionalLight1.position.set(5, 5, 5);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0x00f2fe, 1);
    directionalLight2.position.set(-5, -5, -5);
    scene.add(directionalLight2);

    const modelPath = window.ASSETS_BASE_PATH + filename;
    loader.load(
        modelPath,
        (gltf) => {
            const model = gltf.scene;

            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2 / maxDim;

            model.position.sub(center);
            model.scale.multiplyScalar(scale);

            scene.add(model);

            container.innerHTML = '';
            container.appendChild(renderer.domElement);

            function animate() {
                requestAnimationFrame(animate);
                model.rotation.y += 0.005;
                renderer.render(scene, camera);
            }
            animate();
        },
        undefined,
        (error) => {
            console.error('Error loading model:', error);
            container.innerHTML = '<div style="color: rgba(255,255,255,0.5); font-size: 0.9rem;">Model unavailable</div>';
        }
    );
}
modelsData.forEach(modelData => {
    const card = createModelCard(modelData);
    modelsGrid.appendChild(card);
}

);