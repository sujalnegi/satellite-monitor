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

const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
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
const satelliteRegistry = {}; // Map index -> mesh

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');
const infoPanel = document.getElementById('info-panel');
let lockedSatellite = null;
let selectionBox = null;
let lastLockedSatPos = null;

const satelliteSelect = document.getElementById('satellite-select');

fetch(window.APP_CONFIG.satellitesDataUrl)
    .then(response => response.json())
    .then(data => {
        data.forEach((sat, index) => {
            createSatellite(sat, index);

            // Populate Dropdown
            const option = document.createElement('option');
            option.value = index; // Use index to map back to meshes later
            option.innerText = sat.name;
            satelliteSelect.appendChild(option);
        });
    })
    .catch(err => console.error("Error loading satellite data", err));

// Dropdown Event Listener
satelliteSelect.addEventListener('change', (e) => {
    const selectedIndex = e.target.value;

    if (selectedIndex === "") {
        // None selected (unlock)
        satelliteMeshes.forEach(mesh => mesh.visible = true); // Show all
        unlockSatellite();
    } else {

        // Look up by index from registry (robust against name duplicates/async timing)
        const targetMesh = satelliteRegistry[selectedIndex];

        if (targetMesh) {
            // Select it (lockOnSatellite handles visibility and UI sync)
            if (lockedSatellite !== targetMesh) {
                lockOnSatellite(targetMesh);
            }
        }
    }
});

function createSatellite(data, index) {
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
        mesh.userData = { ...data, angle: Math.random() * Math.PI * 2, isSatelliteRoot: true, baseScale: 40.0 }; // 40 * 0.01 * 6 = 2.4 size
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

// Keyboard Controls
const keyState = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false
};

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault(); // Prevent scrolling
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
    if (isPaused) return;

    // Simulation time accumulator
    // We need a base time + total elapsed simulated time
    if (!window.simTime) window.simTime = new Date();

    // Increment Sim Time
    // delta is in seconds. 
    // REAL_SEC_TO_SIM_SEC = 3600 (1 real sec = 1 hour sim)
    // timeScaleFactor is slider (0.1 default)
    // We add milliseconds to the date
    window.simTime = new Date(window.simTime.getTime() + delta * 1000 * REAL_SEC_TO_SIM_SEC * timeScaleFactor);

    // Current Sim Date
    const now = window.simTime;

    // Earth Rotation
    if (earthMesh) {
        // GST rotation approx
        // Earth rotates 360 deg in 24 hours (86400s) = 2PI radians
        // We accumulate rotation based on the SAME time step
        const earthRotationSpeed = (2 * Math.PI) / 86400;
        // Total Seconds Passed in this frame = delta * REAL_SEC_TO_SIM_SEC * timeScaleFactor
        earthMesh.rotation.y += earthRotationSpeed * delta * REAL_SEC_TO_SIM_SEC * timeScaleFactor;
    }

    if (clouds) {
        clouds.rotation.y += ((2 * Math.PI) / 86400) * 1.5 * delta * REAL_SEC_TO_SIM_SEC * timeScaleFactor;
    }

    if (moonMesh) {
        // Simplified Moon calc still valid for visual, or could use proper ephemeris (overkill)
        const moonPeriod = 2332800; // seconds
        const moonSpeed = (2 * Math.PI) / moonPeriod;
        // Keep simple circular for Moon as no TLE
        moonMesh.rotation.y += moonSpeed * delta * REAL_SEC_TO_SIM_SEC * timeScaleFactor;

        // Circular orbit update
        const currentAngle = Math.atan2(moonMesh.position.z, moonMesh.position.x);
        const newAngle = currentAngle + moonSpeed * delta * REAL_SEC_TO_SIM_SEC * timeScaleFactor;
        moonMesh.position.x = MOON_DISTANCE * Math.cos(newAngle);
        moonMesh.position.z = MOON_DISTANCE * Math.sin(newAngle);
    }

    satelliteMeshes.forEach(mesh => {
        const data = mesh.userData;

        if (data.tle1 && data.tle2) {
            // Initialize SatRec if not exists
            if (!data.satrec) {
                data.satrec = satellite.twoline2satrec(data.tle1, data.tle2);
            }

            const positionAndVelocity = satellite.propagate(data.satrec, now);
            const positionEci = positionAndVelocity.position;

            if (positionEci) { // positionEci is in km
                // Convert ECI to Game Coordinates
                // Three.js Scene: Y is Up (North). X/Z is Equator.
                // ECI: Z is North. X is Vernal Equinox.
                // Mapping: ECI X -> Three X, ECI Y -> Three Z, ECI Z -> Three Y
                // Scale km to scene units
                const scale = SCENE_EARTH_RADIUS / EARTH_RADIUS_KM; // 50 / 6371

                // Note: ECI is inertial. Earth Mesh is rotating.
                // If we plot ECI directly, the satellite moves correctly relative to stars.
                // But we need to ensure Earth Texture is oriented correctly to GMST if we want "Ground Track" to be accurate.
                // Currently Earth is just spinning.
                // For "Exact Path in Real Life" relative to ground features, we need Earth Rotation to match GMST.

                // Let's assume EarthMesh rotation.y = 0 aligns with GMST 0 (Vernal Equinox).
                // Actually simple approximation:

                const x = positionEci.x * scale;
                const y = positionEci.z * scale; // Z becomes Y (Up)
                const z = -positionEci.y * scale; // Y becomes -Z (Right Hand Rule check)

                // Swap Y and Z for Three.js (Y-up)
                // ECI X -> X 
                // ECI Y -> -Z 
                // ECI Z -> Y 

                mesh.position.set(x, y, z);

                // Update basic data for display (Speed/Alt) based on TLE calc
                const velocityEci = positionAndVelocity.velocity;
                const v = Math.sqrt(velocityEci.x * velocityEci.x + velocityEci.y * velocityEci.y + velocityEci.z * velocityEci.z);

                // Update Altitude (Approx) based on current radius
                const r = Math.sqrt(positionEci.x * positionEci.x + positionEci.y * positionEci.y + positionEci.z * positionEci.z);
                data.altitude_km = (r - EARTH_RADIUS_KM).toFixed(1);

                if (lockedSatellite === mesh) {
                    document.getElementById('sat-radius').innerText = data.altitude_km + " km";
                    document.getElementById('sat-speed').innerText = v.toFixed(2) + " km/s";
                }
            }
        } else {
            // Fallback for no TLE (Legacy circular)
            const periodSeconds = data.period_minutes * 60;
            const angularSpeed = (2 * Math.PI) / periodSeconds;
            if (!data.angle) data.angle = 0;
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
                lockOnSatellite(target);
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
    if (isRed && isGreen && !isBlue) return "Africa"; // Yellow
    if (isRed && !isGreen && isBlue) return "Asia";   // Magenta
    if (!isRed && isGreen && isBlue) return "Oceania"; // Cyan
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

    // Keyboard rotation
    const rotateSpeed = 1.0 * delta; // Radians per second roughly, adjustable
    if (keyState.ArrowLeft) {
        // Rotate camera left around center (orbit)
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
        // Angle from the Y-axis (North Pole). Range: 0 to PI.
        const phi = offset.angleTo(yAxis);
        const threshold = 0.1; // Avoid exact pole (singularity)

        if (keyState.ArrowUp && phi > threshold) {
            // Check if rotation would cross the threshold
            // Better yet, just protect the cross product and clamp
            const right = new THREE.Vector3().crossVectors(offset, yAxis).normalize();
            // Only rotate if 'right' is valid (though threshold check above handles most cases)
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
        // Soft Lock: Rotate camera with the satellite's orbit
        const currentSatPos = lockedSatellite.position.clone();

        if (lastLockedSatPos && lastLockedSatPos.lengthSq() > 0) {
            // Calculate rotation of satellite from last frame
            const startVec = lastLockedSatPos.clone().normalize();
            const endVec = currentSatPos.clone().normalize();

            // Quaternion representing the orbital rotation this frame
            const orbitRotation = new THREE.Quaternion().setFromUnitVectors(startVec, endVec);

            // Apply this rotation to the camera's position
            camera.position.applyQuaternion(orbitRotation);
        }

        // Update history
        if (!lastLockedSatPos) lastLockedSatPos = new THREE.Vector3();
        lastLockedSatPos.copy(currentSatPos);

        // Ensure we are centering Earth for the POV
        controls.target.set(0, 0, 0);

        // Update Message Position (Follow Satellite)
        const msg = document.getElementById('sat-message');
        if (msg.style.display !== 'none' && !msg.classList.contains('fade-out')) {
            const tempV = new THREE.Vector3().copy(lockedSatellite.position);

            // Project to 2D screen space
            tempV.project(camera);

            const x = (tempV.x * .5 + .5) * window.innerWidth;
            const y = (tempV.y * -.5 + .5) * window.innerHeight;

            // Only show if in front of camera (z < 1)
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




function lockOnSatellite(mesh) {
    if (!mesh) return;

    // If different from current, update
    if (lockedSatellite !== mesh) {
        lockedSatellite = mesh;
        playClickSound();
        showInfoPanel(mesh.userData);

        // POV Mode: Satellite Looking at Earth
        // 1. Move Camera slightly "above" the satellite (further from Earth center)
        // 2. Look at Earth

        const satPos = mesh.position.clone();
        const dist = satPos.length();

        // Calculate safe viewing distance (at least 1.2x satellite radius)
        const safeDist = dist * 1.2;

        // Current camera distance
        const currentCamDist = camera.position.length();

        // Target distance: Don't zoom IN if we are already far enough out.
        // Only zoom OUT if we are too close.
        const targetDist = Math.max(currentCamDist, safeDist);

        // Position camera along the satellite-to-earth vector, at the target distance
        const offset = satPos.clone().normalize().multiplyScalar(targetDist);

        camera.position.copy(offset);
        controls.target.set(0, 0, 0);
        controls.update();

        document.getElementById('reset-view-btn').style.display = 'inline-block';

        const msg = document.getElementById('sat-message');
        msg.innerText = getSatelliteMessage(mesh.userData.name);
        msg.style.display = 'block';
        msg.classList.remove('fade-out');

        // Clear previous timeout if any
        if (msg.dataset.timeoutId) clearTimeout(msg.dataset.timeoutId);

        // Fade out after 5 seconds
        const tid = setTimeout(() => {
            msg.classList.add('fade-out');
        }, 5000);
        msg.dataset.timeoutId = tid;

        // --- NEW: Unify "Act Same" Behavior ---

        // 1. Hide Others
        satelliteMeshes.forEach(m => {
            m.visible = (m === mesh);
        });

        // 2. Sync Dropdown (if not already set)
        const select = document.getElementById('satellite-select');
        // Find option with matching text
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

    return "Hey!! I am here";
}



function unlockSatellite() {
    if (lockedSatellite) {
        playClickSound();
        lockedSatellite = null;
        lastLockedSatPos = null;
        infoPanel.style.display = 'none';

        // Reset dropdown
        document.getElementById('satellite-select').value = "";
        satelliteMeshes.forEach(mesh => mesh.visible = true);
        document.getElementById('reset-view-btn').style.display = 'none';
        document.getElementById('sat-message').style.display = 'none';

        // Reset view
        controls.target.set(0, 0, 0);
        camera.position.set(150, 50, 150);
        controls.update();
    }
}

document.getElementById('reset-view-btn').addEventListener('click', () => {
    unlockSatellite();
});
