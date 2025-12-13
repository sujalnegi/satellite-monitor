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
controls.minDistance = 60;
controls.maxDistance = 20000;

const ambientLight = new THREE.AmbientLight(0x404040, 2); 
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1.5);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 2);
sunLight.position.set(100, 50, 100);
scene.add(sunLight);

const earthGroup = new THREE.Group();
scene.add(earthGroup);

const textureLoader = new THREE.TextureLoader();
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/');
loader.setDRACOLoader(dracoLoader);

let earthMesh;

document.getElementById('loading').style.display = 'block';

textureLoader.load(window.APP_CONFIG.earthTextureUrl, (texture) => {
    document.getElementById('loading').style.display = 'none';
    const geometry = new THREE.SphereGeometry(50, 64, 64);
    const material = new THREE.MeshPhongMaterial({
        map: texture,
        specular: new THREE.Color(0x333333),
        shininess: 5
    });
    earthMesh = new THREE.Mesh(geometry, material);
    earthGroup.add(earthMesh);
}, undefined, (err) => {
    console.error("Error loading texture", err);
    document.getElementById('loading').innerText = "Error loading texture.";
});

function createStarfield() {
    const starGeo = new THREE.BufferGeometry();
    const starCount = 5000;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        const r = 1000 + Math.random() * 2000; // Far away
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);

        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.5,
        transparent: true,
        opacity: 0.8
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);
}
createStarfield();

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize, false);

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
