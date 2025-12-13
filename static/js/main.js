import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const scene = new THREE.Scene();
window.scene = scene;
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 50000);
camera.position.set(150, 50, 150);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);
const hemiLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1.5);
scene.add(hemiLight);
const sunLight = new THREE.DirectionalLight(0xffffff, 2);
sunLight.position.set(100, 50, 100);
scene.add(sunLight);

const textureLoader = new THREE.TextureLoader();
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/');
loader.setDRACOLoader(dracoLoader);

let earthMesh;
const earthGroup = new THREE.Group();
scene.add(earthGroup);

textureLoader.load(window.APP_CONFIG.earthTextureUrl, (texture) => {
    document.getElementById('loading').style.display = 'none';
    const geometry = new THREE.SphereGeometry(50, 64, 64);
    const material = new THREE.MeshPhongMaterial({ map: texture, specular: 0x333333, shininess: 5 });
    earthMesh = new THREE.Mesh(geometry, material);
    earthGroup.add(earthMesh);
});

function createStarfield() {
    const starGeo = new THREE.BufferGeometry();
    const starCount = 5000;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
        const r = 1000 + Math.random() * 2000;
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, transparent: true, opacity: 0.8 })));
}
createStarfield();

const satelliteMeshes = [];
const assetsBase = window.APP_CONFIG.assetsBaseUrl;

fetch(window.APP_CONFIG.satellitesDataUrl)
    .then(response => response.json())
    .then(data => {
        data.forEach(sat => createSatellite(sat));
    })
    .catch(err => console.error("Error loading data", err));

function createSatellite(data) {
    const geometry = new THREE.SphereGeometry(1.0, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(Math.random() * 100, Math.random() * 100, Math.random() * 100);
    mesh.userData = { ...data };

    scene.add(mesh);
    satelliteMeshes.push(mesh);
}

function zoomIn() {
    const direction = new THREE.Vector3().copy(camera.position).sub(controls.target).normalize();
    const distance = camera.position.distanceTo(controls.target);
    const newDistance = Math.max(controls.minDistance, distance - 20);
    camera.position.copy(controls.target).add(direction.multiplyScalar(newDistance));
}
function zoomOut() {
    const direction = new THREE.Vector3().copy(camera.position).sub(controls.target).normalize();
    const distance = camera.position.distanceTo(controls.target);
    const newDistance = Math.min(controls.maxDistance, distance + 20);
    camera.position.copy(controls.target).add(direction.multiplyScalar(newDistance));
}
document.getElementById('zoom-in').addEventListener('click', zoomIn);
document.getElementById('zoom-out').addEventListener('click', zoomOut);

let timeScaleFactor = 0.1;
document.getElementById('speed-slider').addEventListener('input', (e) => {
    timeScaleFactor = parseFloat(e.target.value);
});

let isPaused = false;
document.getElementById('play-pause-btn').addEventListener('click', () => {
    isPaused = !isPaused;
    document.getElementById('play-pause-btn').innerText = isPaused ? "Play" : "Pause";
});

const clock = new THREE.Clock(); 

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (!isPaused && earthMesh) {
        earthMesh.rotation.y += 0.05 * delta * timeScaleFactor;
    }

    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
