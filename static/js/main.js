import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const scene = new THREE.Scene();
window.scene = scene; 
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.set(150, 50, 150);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 60;
controls.maxDistance = 1500;

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

const assetsBase = window.APP_CONFIG.assetsBaseUrl;

let earthMesh;

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

    const continentImg = document.getElementById('continent-img');
    const continentCanvas = document.getElementById('continent-canvas');
    const ctx = continentCanvas.getContext('2d', { willReadFrequently: true });

    if (continentImg.complete) {
        ctx.drawImage(continentImg, 0, 0, 2048, 1024);
    } else {
        continentImg.onload = () => {
            ctx.drawImage(continentImg, 0, 0, 2048, 1024);
        };
    }

}, undefined, (err) => {
    console.error("Error loading texture", err);
    document.getElementById('loading').innerText = "Error loading texture. Check console.";
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

const cloudGeo = new THREE.SphereGeometry(50.5, 64, 64);
const cloudMat = new THREE.MeshPhongMaterial({
    map: textureLoader.load(window.APP_CONFIG.cloudsTextureUrl),
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
});
const clouds = new THREE.Mesh(cloudGeo, cloudMat);
scene.add(clouds);

let moonMesh;
const MOON_DISTANCE = 250; 
const MOON_RADIUS = 13.5; 

loader.load(window.APP_CONFIG.assetsBaseUrl + 'moon.glb', (gltf) => {
    const model = gltf.scene;
    moonMesh = model;

    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);

    const targetDiameter = MOON_RADIUS * 2;
    const scale = (targetDiameter / maxDim);
    model.scale.set(scale, scale, scale);

    model.position.set(MOON_DISTANCE, 0, 0);

    model.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material.map) {
                child.material.roughness = 0.9;
            }
        }
    });

    scene.add(model);
}, undefined, (error) => {
    console.error("Error loading moon model", error);
    const geometry = new THREE.SphereGeometry(MOON_RADIUS, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: 0x888888 });
    moonMesh = new THREE.Mesh(geometry, material);
    moonMesh.position.set(MOON_DISTANCE, 0, 0);
    scene.add(moonMesh);
});




const satelliteMeshes = [];
const satellitesData = [];

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');
const infoPanel = document.getElementById('info-panel');
let lockedSatellite = null;
let selectionBox = null;

fetch(window.APP_CONFIG.satellitesDataUrl)
    .then(response => response.json())
    .then(data => {
        data.forEach(sat => {
            createSatellite(sat);
        });
    })
    .catch(err => console.error("Error loading satellite data", err));

function createSatellite(data) {
    const modelFile = data.modelFileName || 'satellite.glb';
    const modelUrl = assetsBase + modelFile;

    loader.load(modelUrl, (gltf) => {
        const model = gltf.scene;

        model.traverse((child) => {
            if (child.isMesh) {
                if (child.material.isMeshStandardMaterial) {
                    child.material.metalness = 0.1;
                    child.material.roughness = 0.8;
                }
            }
        });

        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetBaseSize = 250;
        const normalizationScale = (maxDim > 0) ? (targetBaseSize / maxDim) : 1.0;

        const globalScale = parseFloat(document.getElementById('scale-slider').value);
        const finalScale = globalScale * normalizationScale;
        model.scale.set(finalScale, finalScale, finalScale);

        model.userData = { ...data, angle: Math.random() * Math.PI * 2, isSatelliteRoot: true, baseScale: normalizationScale };
        scene.add(model);
        satelliteMeshes.push(model);
        satellitesData.push(data);

    }, undefined, (error) => {
        console.error(`Failed to load model ${modelUrl}:`, error);

        const geometry = new THREE.SphereGeometry(3.0, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const mesh = new THREE.Mesh(geometry, material);

    
        const globalScale = parseFloat(document.getElementById('scale-slider').value);
        mesh.userData = { ...data, angle: Math.random() * Math.PI * 2, isSatelliteRoot: true, baseScale: 40.0 }; 
        const s = globalScale * 40.0;
        mesh.scale.set(s, s, s);

        scene.add(mesh);
        satelliteMeshes.push(mesh);
        satellitesData.push(data);
    });
}


function zoomIn() {
    const direction = new THREE.Vector3().copy(camera.position).sub(controls.target).normalize();
    const distance = camera.position.distanceTo(controls.target);
    const newDistance = Math.max(controls.minDistance, distance - 20);

    camera.position.copy(controls.target).add(direction.multiplyScalar(newDistance));
    controls.update();
}

function zoomOut() {
    const direction = new THREE.Vector3().copy(camera.position).sub(controls.target).normalize();
    const distance = camera.position.distanceTo(controls.target);
    const newDistance = Math.min(controls.maxDistance, distance + 20);

    camera.position.copy(controls.target).add(direction.multiplyScalar(newDistance));
    controls.update();
}

document.getElementById('zoom-in').addEventListener('click', zoomIn);
document.getElementById('zoom-out').addEventListener('click', zoomOut);

const scaleSlider = document.getElementById('scale-slider');
const scaleValueDisplay = document.getElementById('scale-value');

scaleSlider.addEventListener('input', (e) => {
    const globalScale = parseFloat(e.target.value);
    scaleValueDisplay.innerText = globalScale.toFixed(3);

    satelliteMeshes.forEach(mesh => {
        const normalizationScale = mesh.userData.baseScale || 1.0;
        const finalScale = globalScale * normalizationScale;
        mesh.scale.set(finalScale, finalScale, finalScale);
    });
});

const clock = new THREE.Clock();
const REAL_SEC_TO_SIM_SEC = 3600; 
const EARTH_RADIUS_KM = 6371;
const SCENE_EARTH_RADIUS = 50;

let timeScaleFactor = 0.1;
const speedSlider = document.getElementById('speed-slider');
const speedValueDisplay = document.getElementById('speed-value');

speedSlider.addEventListener('input', (e) => {
    timeScaleFactor = parseFloat(e.target.value);
    speedValueDisplay.innerText = timeScaleFactor.toFixed(2) + "x";
});

let isPaused = false;
const playPauseBtn = document.getElementById('play-pause-btn');
playPauseBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    playPauseBtn.innerText = isPaused ? "Play" : "Pause";
    playPauseBtn.style.background = isPaused ? "#28a745" : "#4facfe";
});

function updateSatellites(delta) {
    if (isPaused) return;

    if (earthMesh) {
        const earthRotationSpeed = (2 * Math.PI) / 86400;
        earthMesh.rotation.y += earthRotationSpeed * delta * REAL_SEC_TO_SIM_SEC * timeScaleFactor;
    }

    if (clouds) {
        clouds.rotation.y += ((2 * Math.PI) / 86400) * 1.5 * delta * REAL_SEC_TO_SIM_SEC * timeScaleFactor;
    }

    if (moonMesh) {
        const moonPeriod = 2332800; // seconds
        const moonSpeed = (2 * Math.PI) / moonPeriod;
        const currentAngle = Math.atan2(moonMesh.position.z, moonMesh.position.x);
        const newAngle = currentAngle + moonSpeed * delta * REAL_SEC_TO_SIM_SEC * timeScaleFactor;

        moonMesh.position.x = MOON_DISTANCE * Math.cos(newAngle);
        moonMesh.position.z = MOON_DISTANCE * Math.sin(newAngle);

        moonMesh.rotation.y += moonSpeed * delta * REAL_SEC_TO_SIM_SEC * timeScaleFactor;
    }



    satelliteMeshes.forEach(mesh => {
        const data = mesh.userData;
        const periodSeconds = data.period_minutes * 60;
        const angularSpeed = (2 * Math.PI) / periodSeconds;
        data.angle += angularSpeed * delta * REAL_SEC_TO_SIM_SEC * timeScaleFactor;

        const altitudeKm = data.altitude_km;
        const r = SCENE_EARTH_RADIUS * (1 + altitudeKm / EARTH_RADIUS_KM);

        const x = r * Math.cos(data.angle);
        const z = r * Math.sin(data.angle);
        const y = 0;

        const vector = new THREE.Vector3(x, y, z);
        const inclinationRad = THREE.MathUtils.degToRad(data.inclination);
        vector.applyAxisAngle(new THREE.Vector3(1, 0, 0), inclinationRad);

        mesh.position.copy(vector);

        if (lockedSatellite === mesh) {
            document.getElementById('sat-radius').innerText = altitudeKm + " km";
        }
    });
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (!lockedSatellite) {
        checkIntersection();
    }
}

function onClick(event) {
    if (lockedSatellite) {
        lockedSatellite = null;
        infoPanel.style.display = 'none';
        checkIntersection(true);
    } else {
        checkIntersection(true);
    }
}

function checkIntersection(isClick = false) {
    raycaster.setFromCamera(mouse, camera);

    const objectsToCheck = [...satelliteMeshes];
    if (earthMesh) objectsToCheck.push(earthMesh);

    const intersects = raycaster.intersectObjects(objectsToCheck, true);

    if (intersects.length > 0) {
        const intersection = intersects[0];
        const object = intersection.object;

        if (object === earthMesh) {
            document.body.style.cursor = 'default';

            if (!isClick) {
                const uv = intersection.uv;
                const continent = getContinentAtUV(uv);
                if (continent) {
                    showTooltip(event.clientX, event.clientY, continent);
                } else {
                    tooltip.style.display = 'none';
                }
            } else {
                if (lockedSatellite) {
                    lockedSatellite = null;
                    if (selectionBox) {
                        scene.remove(selectionBox);
                        selectionBox = null;
                    }
                    infoPanel.style.display = 'none';
                    checkIntersection(false);
                }
            }
        } else {
            let target = object;
            while (target && !target.userData.isSatelliteRoot && target.parent) {
                target = target.parent;
            }

            if (target && !target.userData.isSatelliteRoot) {
                target = object;
            }

            const data = target.userData;
            document.body.style.cursor = 'pointer';
            tooltip.style.display = 'none';

            if (isClick) {
                lockedSatellite = target;

                if (selectionBox) scene.remove(selectionBox);
                selectionBox = new THREE.BoxHelper(lockedSatellite, 0x4facfe); 
                scene.add(selectionBox);

                showInfoPanel(data);
            } else {
                if (!lockedSatellite) {
                    showInfoPanel(data);
                }
            }
        }
    } else {
        document.body.style.cursor = 'default';
        tooltip.style.display = 'none';

        if (!lockedSatellite) {
            infoPanel.style.display = 'none';
        } else if (isClick) {
            lockedSatellite = null;
            if (selectionBox) {
                scene.remove(selectionBox);
                selectionBox = null;
            }
            infoPanel.style.display = 'none';
        }
    }
}

function showInfoPanel(data) {
    infoPanel.style.display = 'block';
    document.getElementById('sat-name').innerText = data.name || "Unknown";
    document.getElementById('sat-agency').innerText = data.agency || "N/A";
    document.getElementById('sat-launch').innerText = data.launch || "N/A";
    document.getElementById('sat-radius').innerText = (data.altitude_km ? data.altitude_km + " km" : "N/A");
    document.getElementById('sat-inclination').innerText = (data.inclination ? data.inclination + "°" : "N/A");
    document.getElementById('sat-period').innerText = (data.period_minutes ? data.period_minutes + " min" : "N/A");

    if (data.altitude_km) {
        const r = 6371 + data.altitude_km;
        const v = Math.sqrt(398600 / r); 
        document.getElementById('sat-speed').innerText = v.toFixed(2) + " km/s";
    } else {
        document.getElementById('sat-speed').innerText = "N/A";
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('click', onClick, false);
window.addEventListener('resize', onWindowResize, false);

function getContinentAtUV(uv) {
    const canvas = document.getElementById('continent-canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const x = Math.floor(uv.x * canvas.width);
    const y = Math.floor((1 - uv.y) * canvas.height);

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];

    const THRESHOLD_HIGH = 150;
    const THRESHOLD_LOW = 100;

    const isRed = r > THRESHOLD_HIGH;
    const isGreen = g > THRESHOLD_HIGH;
    const isBlue = b > THRESHOLD_HIGH;

    if (isRed && isGreen && isBlue) return "Antarctica";
    if (isRed && isGreen && !isBlue) return "Africa"; 
    if (isRed && !isGreen && isBlue) return "Asia";   
    if (!isRed && isGreen && isBlue) return "Oceania"; 
    if (isRed && !isGreen && !isBlue) return "North America";
    if (!isRed && isGreen && !isBlue) return "South America";
    if (!isRed && !isGreen && isBlue) return "Europe";

    return null; 
}

function showTooltip(x, y, text) {
    const tooltip = document.getElementById('tooltip');
    tooltip.style.left = x + 15 + 'px';
    tooltip.style.top = y + 15 + 'px';
    tooltip.innerText = text;
    tooltip.style.display = 'block';
}   

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    updateSatellites(delta);
    controls.update();
    renderer.render(scene, camera);
}

animate();
