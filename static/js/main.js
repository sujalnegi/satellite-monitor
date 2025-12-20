import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const scene = new THREE.Scene();
window.scene = scene;
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 50000);
camera.position.set(150, 50, 150);

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
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
sunLight.position.set(10000, 0, 0);
scene.add(sunLight);



const earthGroup = new THREE.Group();
scene.add(earthGroup);

const textureLoader = new THREE.TextureLoader();

const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/');
loader.setDRACOLoader(dracoLoader);

loader.load(window.APP_CONFIG.assetsBaseUrl + 'sun.glb', (gltf) => {
    const sun = gltf.scene;
    sun.position.set(10000, 0, 0);
    sun.scale.set(50, 50, 50);
    scene.add(sun);
});

const assetsBase = window.APP_CONFIG.assetsBaseUrl;

let earthMesh;
const loadingStartTime = Date.now();
const LOADING_DURATION = 2000; 

function hideLoadingScreen() {
    const elapsed = Date.now() - loadingStartTime;
    const remaining = Math.max(0, LOADING_DURATION - elapsed);

    setTimeout(() => {
        const loadingElement = document.getElementById('loading');
        loadingElement.classList.add('fade-out');
        setTimeout(() => {
            loadingElement.style.display = 'none';
        }, 500);
    }, remaining);
}

function animateProgressBar() {
    const progressBar = document.getElementById('loadingProgressBar');
    const startTime = Date.now();

    function updateProgress() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, (elapsed / LOADING_DURATION) * 100);
        progressBar.style.width = progress + '%';

        if (progress < 100) {
            requestAnimationFrame(updateProgress);
        }
    }

    requestAnimationFrame(updateProgress);
}
animateProgressBar();

loader.load(window.APP_CONFIG.assetsBaseUrl + 'earth.glb', (gltf) => {
    hideLoadingScreen();
    const model = gltf.scene;
    earthMesh = model;

    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetDiameter = 100;

    if (maxDim > 0) {
        const scale = targetDiameter / maxDim;
        model.scale.set(scale, scale, scale);
    }

    earthGroup.add(model);
}, undefined, (err) => {
    console.error("Error loading earth model", err);
    hideLoadingScreen();
    setTimeout(() => {
        document.getElementById('loading').innerText = "Error loading earth. Check console.";
        document.getElementById('loading').style.display = 'block';
    }, LOADING_DURATION);
});



function createStarfield() {
    const starGeo = new THREE.BufferGeometry();
    const starCount = 5000;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        const r = 1000 + Math.random() * 2000;
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

function createNebula() {
    const nebulaGeo = new THREE.BufferGeometry();
    const nebulaCount = 3000;
    const positions = new Float32Array(nebulaCount * 3);
    const colors = new Float32Array(nebulaCount * 3);
    const sizes = new Float32Array(nebulaCount);

    const nebulaColors = [
        new THREE.Color(0x4a0e4e),
        new THREE.Color(0x1e3a8a),
        new THREE.Color(0x7c2d12),
        new THREE.Color(0x1e1b4b),
        new THREE.Color(0x581c87),
        new THREE.Color(0x0c4a6e)
    ];

    for (let i = 0; i < nebulaCount; i++) {
        const r = 2000 + Math.random() * 3000;
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);

        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);

        const color = nebulaColors[Math.floor(Math.random() * nebulaColors.length)];
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        sizes[i] = 50 + Math.random() * 150;
    }

    nebulaGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    nebulaGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    nebulaGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const nebulaMat = new THREE.PointsMaterial({
        size: 100,
        vertexColors: true,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
    });

    const nebula = new THREE.Points(nebulaGeo, nebulaMat);
    scene.add(nebula);
}
createNebula();



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
const satelliteRegistry = {};

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');
const infoPanel = document.getElementById('info-panel');
let lockedSatellite = null;
let selectionBox = null;
let lastLockedSatPos = null;
let viewMode = 'ORBIT';


const satelliteSelect = document.getElementById('satellite-select');

fetch(window.APP_CONFIG.satellitesDataUrl)
    .then(response => response.json())
    .then(data => {
        data.forEach((sat, index) => {
            createSatellite(sat, index);

            const option = document.createElement('option');
            option.value = index;
            option.innerText = sat.name;
            satelliteSelect.appendChild(option);
        });
    })
    .catch(err => console.error("Error loading satellite data", err));

satelliteSelect.addEventListener('change', (e) => {
    const selectedIndex = e.target.value;

    if (selectedIndex === "") {
        satelliteMeshes.forEach(mesh => mesh.visible = true);
        unlockSatellite();
    } else {
        const targetMesh = satelliteRegistry[selectedIndex];
        if (targetMesh) {
            if (lockedSatellite !== targetMesh) {
                lockOnSatellite(targetMesh);
            }
        }
    }
});
function getOrbitPoints(data, startTime) {
    if (!data.satrec) return [];

    let period = 100;
    if (data.satrec.no) {
        period = (2 * Math.PI) / data.satrec.no;
    }
    const duration = period * 1.05;
    const points = [];
    let step = period / 720;
    if (step < 0.5) step = 0.5;

    for (let i = 0; i <= duration; i += step) {
        const t = new Date(startTime.getTime() + i * 60000);
        const pv = satellite.propagate(data.satrec, t);

        if (pv.position && !isNaN(pv.position.x)) {
            const scale = SCENE_EARTH_RADIUS / EARTH_RADIUS_KM;
            const x = pv.position.x * scale;
            const y = pv.position.z * scale;
            const z = -pv.position.y * scale;
            points.push(new THREE.Vector3(x, y, z));
        }
    }
    return points;
}

function updateOrbitPath(data, time) {
    if (!data.orbitLine || !data.satrec) return;
    const points = getOrbitPoints(data, time);
    data.orbitLine.geometry.setFromPoints(points);
    data.lastOrbitUpdate = new Date(time.getTime());
}

function createOrbitPath(data) {
    if (!data.tle1 || !data.tle2) return;

    if (!data.satrec) {
        data.satrec = satellite.twoline2satrec(data.tle1, data.tle2);
    }

    const points = getOrbitPoints(data, new Date());
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0xeeeeee, opacity: 0.3, transparent: true });
    const line = new THREE.Line(geo, mat);

    data.orbitLine = line;
    data.lastOrbitUpdate = new Date();

    scene.add(line);
}

function createSatellite(data, index) {
    createOrbitPath(data);
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
        if (index !== undefined) satelliteRegistry[index] = model;

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
        if (index !== undefined) satelliteRegistry[index] = mesh;
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

function togglePlayPause() {
    isPaused = !isPaused;
    playPauseBtn.innerText = isPaused ? "Play" : "Pause";
    playPauseBtn.style.background = isPaused ? "#28a745" : "#4facfe";
}

playPauseBtn.addEventListener('click', togglePlayPause);

const keyState = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false
};

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
    }
    if (keyState.hasOwnProperty(e.code)) {
        keyState[e.code] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (keyState.hasOwnProperty(e.code)) {
        keyState[e.code] = false;
    }
});


function updateSatellites(delta) {
    if (!window.simTime) window.simTime = new Date();
    if (!isPaused) {
        window.simTime = new Date(window.simTime.getTime() + delta * 1000 * REAL_SEC_TO_SIM_SEC * timeScaleFactor);
    }

    const now = window.simTime;

    if (earthMesh) {
        const gmst = satellite.gstime(now);
        earthMesh.rotation.y = gmst;
    }





    if (moonMesh) {
        const moonPeriod = 2332800;

        const moonSpeed = (2 * Math.PI) / moonPeriod;

        if (!isPaused) {
            moonMesh.rotation.y += moonSpeed * delta * REAL_SEC_TO_SIM_SEC * timeScaleFactor;
        }

        const currentAngle = Math.atan2(moonMesh.position.z, moonMesh.position.x);
        let newAngle = currentAngle;

        if (!isPaused) {
            newAngle += moonSpeed * delta * REAL_SEC_TO_SIM_SEC * timeScaleFactor;
        }

        moonMesh.position.x = MOON_DISTANCE * Math.cos(newAngle);
        moonMesh.position.z = MOON_DISTANCE * Math.sin(newAngle);
    }

    satelliteMeshes.forEach(mesh => {
        const data = mesh.userData;

        if (data.tle1 && data.tle2) {
            if (!data.satrec) {
                data.satrec = satellite.twoline2satrec(data.tle1, data.tle2);
            }

            const positionAndVelocity = satellite.propagate(data.satrec, now);
            const positionEci = positionAndVelocity.position;

            if (positionEci) {
                const scale = SCENE_EARTH_RADIUS / EARTH_RADIUS_KM;

                const x = positionEci.x * scale;
                const y = positionEci.z * scale;
                const z = -positionEci.y * scale;
                mesh.position.set(x, y, z);

                const velocityEci = positionAndVelocity.velocity;
                const v = Math.sqrt(velocityEci.x * velocityEci.x + velocityEci.y * velocityEci.y + velocityEci.z * velocityEci.z);

                const r = Math.sqrt(positionEci.x * positionEci.x + positionEci.y * positionEci.y + positionEci.z * positionEci.z);
                data.altitude_km = (r - EARTH_RADIUS_KM).toFixed(1);

                if (lockedSatellite === mesh) {
                    document.getElementById('sat-radius').innerText = data.altitude_km + " km";
                    document.getElementById('sat-speed').innerText = v.toFixed(2) + " km/s";
                }
            }
        } else {
            const periodSeconds = data.period_minutes * 60;
            const angularSpeed = (2 * Math.PI) / periodSeconds;
            if (!data.angle) data.angle = 0;

            if (!isPaused) {
                data.angle += angularSpeed * delta * REAL_SEC_TO_SIM_SEC * timeScaleFactor;
            }

            const altitudeKm = data.altitude_km;
            const r = SCENE_EARTH_RADIUS * (1 + altitudeKm / EARTH_RADIUS_KM);

            const x = r * Math.cos(data.angle);
            const z = r * Math.sin(data.angle);
            const y = 0;

            const vector = new THREE.Vector3(x, y, z);
            const inclinationRad = THREE.MathUtils.degToRad(data.inclination);
            vector.applyAxisAngle(new THREE.Vector3(1, 0, 0), inclinationRad);

            mesh.position.copy(vector);
        }

        if (data.orbitLine && data.satrec) {
            const timeDiff = Math.abs(now.getTime() - data.lastOrbitUpdate.getTime());
            if (timeDiff > 90 * 60 * 1000) {
                updateOrbitPath(data, now);
            }
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
    if (event.target.closest('#satellite-selector-container') ||
        event.target.closest('#main-control-panel') ||
        event.target.closest('#info-panel') ||
        event.target.closest('#reset-view-btn') ||
        event.target.closest('#switch-view-btn') ||
        event.target.closest('#sat-message')) {
        return;
    }
    checkIntersection(true);
}

function checkIntersection(isClick = false) {
    raycaster.setFromCamera(mouse, camera);

    const objectsToCheck = [...satelliteMeshes];
    if (earthMesh) objectsToCheck.push(earthMesh);

    const intersects = raycaster.intersectObjects(objectsToCheck, true);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        let target = object;
        while (target) {
            if (target === earthMesh) break;
            if (target.userData && target.userData.isSatelliteRoot) break;
            target = target.parent;
        }

        if (target === earthMesh) {
            document.body.style.cursor = 'default';
            if (!isClick) {
                const tooltip = document.getElementById('tooltip');
                if (tooltip) tooltip.style.display = 'none';
            }
            return;
        }

        if (target && target.userData.isSatelliteRoot) {
            const data = target.userData;
            document.body.style.cursor = 'pointer';
            const tooltip = document.getElementById('tooltip');
            if (tooltip) tooltip.style.display = 'none';

            if (isClick) {
                if (lockedSatellite !== target) {
                    lockOnSatellite(target);
                }
            } else {
                if (!lockedSatellite) {
                    showInfoPanel(data);
                }
            }
        }
    } else {
        document.body.style.cursor = 'default';
        const tooltip = document.getElementById('tooltip');
        if (tooltip) tooltip.style.display = 'none';

        if (!lockedSatellite) {
            infoPanel.style.display = 'none';
        } else if (isClick) {
            unlockSatellite();
        }
    }
}

function playClickSound() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
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



function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    updateSatellites(delta);


    const rotateSpeed = 1.0 * delta;
    if (keyState.ArrowLeft) {
        const offset = new THREE.Vector3().copy(camera.position).sub(controls.target);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotateSpeed);
        camera.position.copy(controls.target).add(offset);
    }
    if (keyState.ArrowRight) {
        const offset = new THREE.Vector3().copy(camera.position).sub(controls.target);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotateSpeed);
        camera.position.copy(controls.target).add(offset);
    }
    if (keyState.ArrowUp || keyState.ArrowDown) {
        const offset = new THREE.Vector3().copy(camera.position).sub(controls.target);
        const yAxis = new THREE.Vector3(0, 1, 0);
        const phi = offset.angleTo(yAxis);
        const threshold = 0.1;
        if (keyState.ArrowUp && phi > threshold) {
            const right = new THREE.Vector3().crossVectors(offset, yAxis).normalize();
            if (right.lengthSq() > 0.0001) {
                offset.applyAxisAngle(right, rotateSpeed);
                camera.position.copy(controls.target).add(offset);
            }
        }
        if (keyState.ArrowDown && phi < Math.PI - threshold) {
            const right = new THREE.Vector3().crossVectors(offset, yAxis).normalize();
            if (right.lengthSq() > 0.0001) {
                offset.applyAxisAngle(right, -rotateSpeed);
                camera.position.copy(controls.target).add(offset);
            }
        }
    }


    if (lockedSatellite && lockedSatellite.position.lengthSq() > 0) {
        const currentSatPos = lockedSatellite.position.clone();

        if (lastLockedSatPos && lastLockedSatPos.lengthSq() > 0) {
            const startVec = lastLockedSatPos.clone().normalize();
            const endVec = currentSatPos.clone().normalize();

            const orbitRotation = new THREE.Quaternion().setFromUnitVectors(startVec, endVec);
            camera.position.applyQuaternion(orbitRotation);
        }

        if (!lastLockedSatPos) lastLockedSatPos = new THREE.Vector3();
        lastLockedSatPos.copy(currentSatPos);

        if (viewMode === 'ORBIT') {
        } else {
        }
        controls.target.copy(lockedSatellite.position);

        const msg = document.getElementById('sat-message');
        if (msg.style.display !== 'none' && !msg.classList.contains('fade-out')) {
            const tempV = new THREE.Vector3().copy(lockedSatellite.position);

            tempV.project(camera);

            const x = (tempV.x * .5 + .5) * window.innerWidth;
            const y = (tempV.y * -.5 + .5) * window.innerHeight;

            if (tempV.z < 1) {
                msg.style.left = `${x}px`;
                msg.style.top = `${y - 40}px`;
                msg.style.display = 'block';
            } else {
                msg.style.display = 'none';
            }
        }
    } else {
        lastLockedSatPos = null;
    }


    controls.update();
    renderer.render(scene, camera);
}

animate();




function lockOnSatellite(mesh, forceUpdate = false) {
    if (!mesh) return;

    if (lockedSatellite !== mesh || forceUpdate) {
        lockedSatellite = mesh;
        playClickSound();
        showInfoPanel(mesh.userData);
        const satPos = mesh.position.clone();
        const dist = satPos.length();

        const safeDist = dist * 1.2;

        const currentCamDist = camera.position.length();
        const targetDist = Math.max(currentCamDist, safeDist);

        const offset = satPos.clone().normalize().multiplyScalar(targetDist);

        if (viewMode === 'HORIZON') {
            const s = mesh.scale.x || 1.0;
            const closeDist = s * 50.0;
            const radial = satPos.clone().normalize();
            const up = new THREE.Vector3(0, 1, 0);
            let tangent = new THREE.Vector3().crossVectors(up, radial).normalize();
            if (tangent.lengthSq() < 0.1) tangent.set(1, 0, 0);
            const tiltVec = radial.clone().applyAxisAngle(tangent, Math.PI / 6);

            const viewPos = satPos.clone().add(tiltVec.multiplyScalar(closeDist));

            camera.position.copy(viewPos);
            controls.target.copy(mesh.position);
        } else {
            camera.position.copy(offset);
            controls.target.copy(mesh.position);
        }

        controls.update();

        document.getElementById('reset-view-btn').style.display = 'inline-block';
        document.getElementById('switch-view-btn').style.display = 'inline-block';

        const msg = document.getElementById('sat-message');
        msg.innerText = getSatelliteMessage(mesh.userData.name);
        msg.style.display = 'block';
        msg.classList.remove('fade-out');

        if (msg.dataset.timeoutId) clearTimeout(msg.dataset.timeoutId);

        const tid = setTimeout(() => {
            msg.classList.add('fade-out');
        }, 5000);
        msg.dataset.timeoutId = tid;

        satelliteMeshes.forEach(m => {
            m.visible = (m === mesh);
        });


        const select = document.getElementById('satellite-select');
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].text === mesh.userData.name) {
                select.selectedIndex = i;
                break;
            }
        }
    }
}

function getSatelliteMessage(name) {
    if (!name) return "Hey!! I am here";
    const n = name.toLowerCase();

    if (n.includes('sputnik')) return "I started it all... Beep beep!";
    if (n.includes('hubble')) return "Peering into the deep universe!";
    if (n.includes('iss') || n.includes('station')) return "Humans live inside me!";
    if (n.includes('voyager')) return "I am going very far away...";
    if (n.includes('gps')) return "Recalculating your route...";
    if (n.includes('starlink')) return "Providing internet from above!";
    if (n.includes('james webb')) return "Unfolding the cosmos history.";
    if (n.includes('telescope')) return "Watching the stars.";
    if (n.includes('goes')) return "Tracking storms and weather!";
    if (n.includes('aqua')) return "Observing Earth's water cycle.";
    if (n.includes('jason')) return "Mapping the ocean's surface height.";

    return "Hey!! I am here";
}



function unlockSatellite() {
    if (lockedSatellite) {
        playClickSound();
        lockedSatellite = null;
        lastLockedSatPos = null;
        infoPanel.style.display = 'none';
        document.getElementById('satellite-select').value = "";
        satelliteMeshes.forEach(mesh => mesh.visible = true);
        document.getElementById('reset-view-btn').style.display = 'none';
        document.getElementById('switch-view-btn').style.display = 'none';
        document.getElementById('sat-message').style.display = 'none';

        viewMode = 'ORBIT';

        controls.target.set(0, 0, 0);
        camera.position.set(150, 50, 150);
        controls.update();
    }
}

document.getElementById('reset-view-btn').addEventListener('click', () => {
    unlockSatellite();
});

document.getElementById('switch-view-btn').addEventListener('click', () => {
    if (!lockedSatellite) return;
    viewMode = (viewMode === 'ORBIT') ? 'HORIZON' : 'ORBIT';

    lockOnSatellite(lockedSatellite, true);
});

document.getElementById('download-view-btn').addEventListener('click', () => {
    try {
        const originalWidth = renderer.domElement.width;
        const originalHeight = renderer.domElement.height;
        const scaleFactor = 2;

        renderer.setSize(originalWidth * scaleFactor, originalHeight * scaleFactor, false);
        camera.aspect = originalWidth / originalHeight;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);

        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        link.download = `satellite-view-${timestamp}.png`;
        link.href = renderer.domElement.toDataURL('image/png');
        link.click();

        renderer.setSize(originalWidth, originalHeight, false);
        camera.updateProjectionMatrix();
    } catch (error) {
        console.error('Error downloading view:', error);
        alert('Failed to download view. Please try again.');
    }
}); 