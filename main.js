import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

//ROAD TEXTURE
function createNeonRoadTexture() {

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 1024;

    const ctx = canvas.getContext('2d');

    // Asphalt base
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Center neon lines
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 6;
    ctx.setLineDash([40, 30]);

    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    // Edge glow
    ctx.strokeStyle = "#ff00ff";
    ctx.lineWidth = 4;
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(10, canvas.height);
    ctx.moveTo(canvas.width - 10, 0);
    ctx.lineTo(canvas.width - 10, canvas.height);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 10);

    return texture;
}
const roadTexture = createNeonRoadTexture();

// =======================
// DAY NIGHT SYSTEM
// =======================

let timeOfDay =
    Number(localStorage.getItem("timeOfDay")) || 0;

const dayDuration = 120;   // seconds per full cycle

const neonMaterials = new Set();

function registerNeon(mat) {
    if (mat && mat.emissive) neonMaterials.add(mat);
}

const daySky = new THREE.Color(0x87ceeb);
const nightSky = new THREE.Color(0x050510);

const dayFog = new THREE.Color(0x87ceeb);
const nightFog = new THREE.Color(0x0a0f2a);

//////////

const bestScoreElement = document.getElementById("bestScore");

let bestScore = localStorage.getItem("bestScore") || 0;
bestScore = Number(bestScore);

bestScoreElement.textContent = bestScore;


//GRASS TEXTURE
function createNeonGrassTexture() {

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;

    const ctx = canvas.getContext('2d');

    // Dark base
    ctx.fillStyle = "#02040a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 2;

    const grid = 32;

    for (let i = 0; i < canvas.width; i += grid) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }

    for (let j = 0; j < canvas.height; j += grid) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(canvas.width, j);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);

    return texture;
}

const grassTexture = createNeonGrassTexture();

//TREE TEXTURE
function createTree(x, z) {

    const group = new THREE.Group();

    const glowMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffcc,
        emissive: 0x00ffcc,
        emissiveIntensity: 1.5
    });

    const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0xff00ff,
        emissive: 0xff00ff,
        emissiveIntensity: 1
    });

    // Trunk
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.3, 2),
        trunkMaterial
    );

    trunk.position.y = 1;

    // Neon pyramid leaves
    const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(1.5, 3, 4),
        glowMaterial
    );

    leaves.position.y = 3;

    group.add(trunk);
    group.add(leaves);

    group.position.set(x, 0, z);

    scene.add(group);

    trees.push({ mesh: group });
}

///GAMEOVER

function gameOver() {
    isGameOver = true;

    const finalScore = Math.floor(score);

    finalScoreElement.textContent =
        "Final Score: " + finalScore;

    // SAVE BEST SCORE
    if (finalScore > bestScore) {
        bestScore = finalScore;
        localStorage.setItem("bestScore", bestScore);
    }

    bestScoreElement.textContent = bestScore;

    document.getElementById("gameOver").style.display = "flex";
}

////////////////
//SCREEN SCROLL
///////////////////
document.body.addEventListener(
    "touchmove",
    e => e.preventDefault(),
    { passive: false }
);


//////////////////////
// BASIC SETUP
//////////////////////
//SCENE CREATION
const scene = new THREE.Scene();
const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
const skyMaterial = new THREE.MeshBasicMaterial({
    color: daySky,
    side: THREE.BackSide
});
const sky = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(sky);
scene.fog = new THREE.Fog(dayFog, 20, 200);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);


// =======================
// HORIZON GLOW
// =======================

const horizonGeo = new THREE.RingGeometry(120, 260, 64);

const horizonMat = new THREE.MeshBasicMaterial({
    color: 0xff00ff,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false
});

const horizonGlow = new THREE.Mesh(horizonGeo, horizonMat);

horizonGlow.rotation.x = -Math.PI / 2;
horizonGlow.position.y = -2;

scene.add(horizonGlow);

//SUN CREATION
const sunGeometry = new THREE.CircleGeometry(20, 64);
const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0080
});

const synthSun = new THREE.Mesh(sunGeometry, sunMaterial);
synthSun.position.set(0, 40, -200);

scene.add(synthSun);
const stripeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

for (let i = 0; i < 5; i++) {

    const points = [
        new THREE.Vector3(-20, 40 - i * 3, -199),
        new THREE.Vector3(20, 40 - i * 3, -199)
    ];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, stripeMaterial);

    scene.add(line);
}
//

const mountains = [];
const trees = [];

const traffic = [];
const trafficLanes = [-4.5, -1.5, 1.5, 4.5];

//Audio
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

let engineOsc;
let engineGain;
let engineFilter;

let nitroOsc;
let nitroGain;
///////
let difficulty = 1;
let maxDifficulty = 10;

let baseSpawnDelay = 1800;
let trafficSpawnDelay = 2200;
/////////

function initAudio() {

    // ENGINE SOUND
    engineOsc = audioContext.createOscillator();
    engineGain = audioContext.createGain();
    engineFilter = audioContext.createBiquadFilter();

    engineOsc.type = "sawtooth";

    engineFilter.type = "lowpass";
    engineFilter.frequency.value = 600;

    engineGain.gain.value = 0.05;

    engineOsc.connect(engineFilter);
    engineFilter.connect(engineGain);
    engineGain.connect(audioContext.destination);

    engineOsc.start();

    nitroOsc = audioContext.createOscillator();
    nitroGain = audioContext.createGain();

    nitroOsc.type = "sawtooth";
    nitroGain.gain.value = 0;

    nitroOsc.connect(nitroGain);
    nitroGain.connect(audioContext.destination);

    nitroOsc.start();

    // NITRO SOUND LAYER
    if (nitroActive) {

        nitroGain.gain.setTargetAtTime(
            0.08,
            audioContext.currentTime,
            0.1
        );

        nitroOsc.frequency.setTargetAtTime(
            200 + currentSpeed * 200,
            audioContext.currentTime,
            0.1
        );
        tank.material.emissive.set(0xff2200);

    } else {

        nitroGain.gain.setTargetAtTime(
            0,
            audioContext.currentTime,
            0.2
        );
        tank.material.emissive.set(0x000000);

    }
    ///////
}
window.addEventListener("click", () => {

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    if (!engineOsc) {
        initAudio();
    }

});

//ROAD MATERIAL
const roadMaterial = new THREE.MeshStandardMaterial({
    map: roadTexture,
    emissive: 0x111111,
    roughness: 0.6
});
registerNeon(roadMaterial);

// ======================
// NEON MOUNTAINS
// ======================

for (let i = 0; i < 20; i++) {

    const geometry = new THREE.ConeGeometry(
        8 + Math.random() * 6,
        18,
        4
    );

    const material = new THREE.MeshStandardMaterial({
        color: 0x220044,
        emissive: 0xff00ff,
        emissiveIntensity: 0.4,
        wireframe: true
    });
    registerNeon(roadMaterial);
    material.emissiveIntensity = 1.8;
    const mountain = new THREE.Mesh(geometry, material);

    const side = Math.random() < 0.5 ? -1 : 1;

    mountain.position.set(
        side * (35 + Math.random() * 80),
        9,
        -Math.random() * 400
    );

    scene.add(mountain);
    mountains.push(mountain);

}

//SPAWN TREES
for (let i = 0; i < 40; i++) {

    const z = -Math.random() * 400;

    const side = Math.random() < 0.5 ? -1 : 1;
    const x = side * (20 + Math.random() * 50);

    createTree(x, z);
}
// TRAFFIC CAR
function createTrafficCar() {

    const carGroup = new THREE.Group();

    // ---------- BODY ----------
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 1, 3.5),
        new THREE.MeshStandardMaterial({ color: 0x3399ff })
    );
    body.position.y = 0.75;
    carGroup.add(body);

    // ---------- CABIN ----------
    const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.7, 1.8),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    cabin.position.set(0, 1.3, -0.2);
    carGroup.add(cabin);

    // ---------- WHEELS ----------
    function createWheel(x, z) {
        const wheel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.4, 0.4, 16),
            new THREE.MeshStandardMaterial({ color: 0x222222 })
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.4, z);
        return wheel;
    }

    carGroup.add(createWheel(-0.9, 1.2));
    carGroup.add(createWheel(0.9, 1.2));
    carGroup.add(createWheel(-0.9, -1.2));
    carGroup.add(createWheel(0.9, -1.2));


    // ============================
    // ADVANCED SAFE SPAWN LOGIC
    // ============================

    const SAFE_DISTANCE = 40;   // distance in front of bike

    let laneIndex;
    let spawnZ;

    let attempts = 0;

    do {

        laneIndex =
            Math.floor(Math.random() * trafficLanes.length);

        spawnZ = -60 - Math.random() * 120;

        attempts++;

        // Safety break (prevents infinite loop)
        if (attempts > 10) break;

    } while (
        laneIndex === currentLane &&
        Math.abs(spawnZ - bike.position.z) < SAFE_DISTANCE
    );


    carGroup.position.x = trafficLanes[laneIndex];
    carGroup.position.y = 0;
    carGroup.position.z = spawnZ;


    scene.add(carGroup);
    traffic.push(carGroup);
}
////////////////

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.toneMappingExposure = 1.2;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
let isGameOver = false;
const gameOverScreen = document.getElementById("gameOver");
let shakeIntensity = 0;
let crashParticles = null;
let boostActive = false;

const lanes = [-4.5, -1.5, 1.5, 4.5];
let currentLane = 1;

//////////////////////
// LIGHTING
//////////////////////

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
scene.add(directionalLight);



// ======================
// BIKE MODEL (CLEAN)
// ======================

const bike = new THREE.Group();

const black = new THREE.MeshStandardMaterial({ color: 0x111111 });
const metal = new THREE.MeshStandardMaterial({ color: 0x888888 });
const red = new THREE.MeshStandardMaterial({ color: 0xff0000 });


// ---------- WHEEL FUNCTION ----------
function createWheel() {

    const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.35, 24),
        black
    );

    // Axle left-right (motorcycle orientation)
    wheel.rotation.z = Math.PI / 2;

    wheel.castShadow = true;
    wheel.receiveShadow = true;

    return wheel;
}


// ---------- WHEELS ----------
const frontWheel = createWheel();
frontWheel.position.set(0, 0.5, -1.6);

const backWheel = createWheel();
backWheel.position.set(0, 0.5, 1.6);

bike.add(frontWheel);
bike.add(backWheel);


// ---------- FRAME ----------
const frame = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 2.6),
    metal
);
frame.position.y = 1.0;
bike.add(frame);


// ---------- ENGINE BLOCK ----------
const engine = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.7, 1.0),
    black
);
engine.position.set(0, 0.9, 0.3);
bike.add(engine);


// ---------- FUEL TANK ----------
const tank = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.5, 1.2, 24),
    red
);
tank.rotation.z = Math.PI / 2;
tank.position.set(0, 1.25, -0.1);
bike.add(tank);


// ---------- SEAT ----------
const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.2, 1.1),
    black
);
seat.position.set(0, 1.2, 0.9);
bike.add(seat);


// ---------- FRONT FORK ----------
const forkMat = metal;

const fork1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 1.4, 12),
    forkMat
);
fork1.position.set(-0.25, 1.0, -1.3);
fork1.rotation.x = Math.PI / 6;

const fork2 = fork1.clone();
fork2.position.x = 0.25;

bike.add(fork1);
bike.add(fork2);


// ---------- HANDLEBAR ----------
const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 1.3, 12),
    metal
);
handle.rotation.z = Math.PI / 2;
handle.position.set(0, 1.5, -1.3);
bike.add(handle);


// ---------- HEADLIGHT ----------
const headlight = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 16),
    new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 1.5
    })
);
headlight.position.set(0, 1.3, -1.9);
bike.add(headlight);
registerNeon(headlight.material);


// ---------- TAIL LIGHT ----------
const tailLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.1, 0.2),
    new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 2
    })
);
tailLight.position.set(0, 1.2, 1.9);
bike.add(tailLight);

registerNeon(tailLight.material);


// ---------- EXHAUST ----------
const exhaust = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.9, 12),
    metal
);

// Horizontal pipe
exhaust.rotation.z = Math.PI / 2;

// Move closer to bike body and slightly lower
exhaust.position.set(-0.22, 0.95, 1.1);

bike.add(exhaust);


// ---------- POSITION ----------
bike.position.y = -0.2;

scene.add(bike);

//////////////////////
// ROAD
//////////////////////

const roadSegments = [];
const segmentLength = 50;
const totalSegments = 10;

for (let i = 0; i < totalSegments; i++) {

    const roadGeometry = new THREE.PlaneGeometry(10, segmentLength);
    const road = new THREE.Mesh(roadGeometry, roadMaterial);

    road.rotation.x = -Math.PI / 2;
    road.position.z = -i * segmentLength;

    scene.add(road);
    roadSegments.push(road);
}

//TREES
for (let i = 0; i < 40; i++) {

    const z = -Math.random() * 400;

    const side = Math.random() < 0.5 ? -1 : 1;
    const x = side * (25 + Math.random() * 40);

    createTree(x, z);
}

//TERRAIN
function addTerrainNoise(geometry) {

    const pos = geometry.attributes.position;

    for (let i = 0; i < pos.count; i++) {
        const y = (Math.random() - 0.5) * 0.3;
        pos.setY(i, y);
    }

    pos.needsUpdate = true;
}


//ROAD
for (let i = 0; i < totalSegments; i++) {
    const roadGeometry = new THREE.PlaneGeometry(10, segmentLength);
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.z = -i * segmentLength;
    road.receiveShadow = true;

    //GRASS
    const grassMaterial = new THREE.MeshStandardMaterial({
        map: grassTexture,
        emissive: 0x003322,
        side: THREE.DoubleSide
    });

    // LEFT GRASS
    const leftGrass = new THREE.Mesh(
        new THREE.PlaneGeometry(200, segmentLength),
        grassMaterial
    );

    leftGrass.position.set(-105, -0.05, 0);   // half width offset
    road.add(leftGrass);


    // RIGHT GRASS
    const rightGrass = new THREE.Mesh(
        new THREE.PlaneGeometry(200, segmentLength),
        grassMaterial
    );

    rightGrass.position.set(105, -0.05, 0);
    road.add(rightGrass);

    // Lane marking
    const lineGeometry = new THREE.PlaneGeometry(0.3, segmentLength);
    const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const centerLine = new THREE.Mesh(lineGeometry, lineMaterial);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.y = 0.01;
    road.add(centerLine);
    // Left neon strip
    const edgeGeometry = new THREE.PlaneGeometry(0.2, segmentLength);
    const edgeMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff
    });

    const leftEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    leftEdge.rotation.x = -Math.PI / 2;
    leftEdge.position.set(-5, 0.02, 0);
    road.add(leftEdge);

    // Right neon strip
    const rightEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    rightEdge.rotation.x = -Math.PI / 2;
    rightEdge.position.set(5, 0.02, 0);
    road.add(rightEdge);

    scene.add(road);
    roadSegments.push(road);
}

//////////////////////
// CAMERA POSITION
//////////////////////
// Smooth follow X
camera.position.x += (bike.position.x - camera.position.x) * 0.12;

// Fixed chase height and distance
camera.position.y = 5.5;
camera.position.z = bike.position.z + 10;

// Look slightly ahead of bike
camera.lookAt(
    bike.position.x,
    bike.position.y + 0.5,
    bike.position.z - 12
);

//////////////////////
// CONTROLS
//////////////////////

const keys = {};
window.addEventListener("keydown", (e) => {

    keys[e.key] = true;

    if (e.key === "Shift") nitroActive = true; {
        camera.position.x += (Math.random() - 0.5) * 0.1;
        camera.position.y += (Math.random() - 0.5) * 0.1;
    }

    if (e.key === "ArrowLeft" && currentLane > 0) {
        currentLane--;
    }

    if (e.key === "ArrowRight" && currentLane < lanes.length - 1) {
        currentLane++;
    }

});

// ======================
// SWIPE CONTROLS (MULTI-TOUCH SAFE)
// ======================

let swipeTouchId = null;
let startX = 0;

window.addEventListener("touchstart", (e) => {

    for (let touch of e.changedTouches) {

        // Ignore touches on nitro button
        if (touch.target === nitroBtn) continue;

        swipeTouchId = touch.identifier;
        startX = touch.clientX;
    }

}, { passive: true });


window.addEventListener("touchend", (e) => {

    for (let touch of e.changedTouches) {

        if (touch.identifier !== swipeTouchId) continue;

        const dx = touch.clientX - startX;

        const SWIPE_THRESHOLD = 40;

        if (dx > SWIPE_THRESHOLD && currentLane < lanes.length - 1) {
            currentLane++;
        }

        if (dx < -SWIPE_THRESHOLD && currentLane > 0) {
            currentLane--;
        }

        swipeTouchId = null;
    }

}, { passive: true });

///////////////////////
const nitroBtn = document.getElementById("nitroBtn");
window.addEventListener("DOMContentLoaded", () => {

    if (!("ontouchstart" in window)) {
        document.getElementById("mobileControls").style.display = "none";
    }

});

nitroBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    nitroActive = true;
}, { passive: false });

nitroBtn.addEventListener("touchend", () => {
    nitroActive = false;
});


window.addEventListener("touchend", (e) => {

    const touch = e.changedTouches[0];

    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;

    // Ignore vertical swipes
    if (Math.abs(dx) < Math.abs(dy)) return;

    const SWIPE_THRESHOLD = 40;

    if (dx > SWIPE_THRESHOLD && currentLane < lanes.length - 1) {
        currentLane++;
    }

    if (dx < -SWIPE_THRESHOLD && currentLane > 0) {
        currentLane--;
    }

}, { passive: true });

/////////////////
window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
    if (e.key === "Shift") nitroActive = false;
});

//////////////////////
// OBSTACLES
//////////////////////

const obstacles = [];

function spawnObstacle() {

    const laneIndex = Math.floor(Math.random() * lanes.length);
    const xPos = lanes[laneIndex];

    const type = Math.floor(Math.random() * 3);

    let obstacle;

    // Traffic cone
    if (type === 0) {
        const cone = new THREE.Group();

        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 0.8, 0.2, 16),
            new THREE.MeshStandardMaterial({ color: 0xff6600 })
        );

        const body = new THREE.Mesh(
            new THREE.ConeGeometry(0.5, 1.5, 16),
            new THREE.MeshStandardMaterial({ color: 0xff3300 })
        );
        body.position.y = 0.85;

        cone.add(base);
        cone.add(body);

        obstacle = cone;
    }

    // Road barrier
    else if (type === 1) {
        obstacle = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 1.2, 1),
            new THREE.MeshStandardMaterial({ color: 0xff4444 })
        );
        obstacle.position.y = 0.6;
    }

    // Oil barrel
    else {
        obstacle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.7, 0.7, 1.5, 20),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        obstacle.position.y = 0.75;
    }

    obstacle.position.x = xPos;
    obstacle.position.z = -120;
    obstacle.castShadow = true;

    scene.add(obstacle);
    obstacles.push(obstacle);
}

//
let obstacleTimer = 0;
let trafficTimer = 0;

function updateSpawning(delta, currentSpeed) {

    const obstacleRate =
        1.8 / difficulty;   // seconds between obstacles

    const trafficRate =
        2.3 / difficulty;   // seconds between traffic

    obstacleTimer += delta;
    trafficTimer += delta;

    if (obstacleTimer > obstacleRate) {
        spawnObstacle();
        obstacleTimer = 0;
    }

    if (trafficTimer > trafficRate) {
        createTrafficCar();
        trafficTimer = 0;
    }
}

setTimeout(() => {
    document.getElementById("controlsHUD").style.opacity = "0.4";
}, 4000);

//////////////////////
// GAME VARIABLES
//////////////////////

let speed = 0.8;
const maxSpeed = 5;
let score = 0;
const scoreElement = document.getElementById("score");
const finalScoreElement = document.getElementById("finalScore"); // ADD THIS
let nitro = 100;
let maxNitro = 100;

let nitroActive = false;
let nitroRecharging = false;

let nitroCooldown = 0;
let multiplier = 1;
const nitroMultiplier = 2;

//////////////////////
// ANIMATION LOOP
//////////////////////

const clock = new THREE.Clock();
function animate() {

    requestAnimationFrame(animate);

    if (isGameOver) {
        renderer.render(scene, camera);
        return;
    }

    const delta = clock.getDelta();
    // =======================
    // DAY NIGHT UPDATE
    // =======================

    timeOfDay += delta / dayDuration;
    if (timeOfDay > 1) timeOfDay -= 1;

    // Save periodically (not every frame)
    if (Math.floor(performance.now()) % 2000 < 16) {
        localStorage.setItem("timeOfDay", timeOfDay);
    }

    const t = Math.sin(timeOfDay * Math.PI * 2) * 0.5 + 0.5;

    // Sky
    sky.material.color.lerpColors(daySky, nightSky, t);

    // Fog
    scene.fog.color.lerpColors(dayFog, nightFog, t);

    // Lighting
    ambientLight.intensity = 0.6 + (1 - t) * 0.6;
    directionalLight.intensity = 0.4 + (1 - t) * 0.8;

    // Neon intensity
    const neonBoost = 0.6 + Math.pow(t, 2) * 2.2;

    for (let mat of neonMaterials) {
        mat.emissiveIntensity = neonBoost;
    }

    //////////////////////////
    //SUN
    const sunAngle = timeOfDay * Math.PI * 2;

    synthSun.position.y = 40 * Math.sin(sunAngle);
    synthSun.position.z = -200 + 50 * Math.cos(sunAngle);

    multiplier = nitroActive ? nitroMultiplier : 1;

    // Speed increase
    if (speed < maxSpeed) {
        speed += delta * 0.02;
    }

    let currentSpeed = speed + difficulty * 0.3;

    if (nitroActive && nitro > 0 && !nitroRecharging) {

        currentSpeed = speed * 2.5;

        nitro -= delta * 40;

        if (nitro <= 0) {
            nitro = 0;
            nitroRecharging = true;
            nitroCooldown = 2; // seconds before recharge starts
        }

    } else {

        if (nitroRecharging) {

            nitroCooldown -= delta;

            if (nitroCooldown <= 0) {
                nitroRecharging = false;
            }

        } else if (nitro < maxNitro) {

            nitro += delta * 20;
            if (nitro > maxNitro) nitro = maxNitro;

        }

    }
    const nitroBar = document.getElementById("nitroBar");
    nitroBar.style.width = (nitro / maxNitro * 100) + "%";

    roadTexture.offset.y -= currentSpeed * 0.03;



    ///////////////
    difficulty = 1 + score / 600;   // increases over time

    if (difficulty > maxDifficulty) difficulty = maxDifficulty;

    //SOUND
    if (engineOsc) {

        const targetFreq = 80 + currentSpeed * 120;

        engineOsc.frequency.setTargetAtTime(
            targetFreq,
            audioContext.currentTime,
            0.1
        );

        engineFilter.frequency.setTargetAtTime(
            400 + currentSpeed * 900,
            audioContext.currentTime,
            0.1
        );

    }
    //SPAWNING
    updateSpawning(delta, currentSpeed);

    // Dynamic FOV
    camera.fov = 75 + currentSpeed * 5;
    camera.updateProjectionMatrix();

    // Move Road
    roadSegments.forEach(segment => {
        segment.position.z += currentSpeed * 1.2;

        if (segment.position.z > camera.position.z + segmentLength) {
            segment.position.z -= segmentLength * totalSegments;
        }
    });

    //MOVE TREES
    trees.forEach(tree => {

        tree.mesh.position.z += currentSpeed;

        if (tree.mesh.position.z > 20) {

            const newZ = -400 - Math.random() * 200;

            const side = Math.random() < 0.5 ? -1 : 1;
            const newX = side * (20 + Math.random() * 50);

            tree.mesh.position.set(newX, 0, newZ);
        }
    });

    // Mountains
    mountains.forEach(mountain => {
        mountain.position.z += currentSpeed * 0.2;

        if (mountain.position.z > 50) {
            mountain.position.z = -300;
            const side = Math.random() < 0.5 ? -1 : 1;
            mountain.position.x = side * (30 + Math.random() * 80);
        }
    });

    //TRAFFIC CAR
    traffic.forEach((car, index) => {

        car.position.z += currentSpeed * 1.1;

        car.children.forEach(child => {
            if (child.geometry && child.geometry.type === "CylinderGeometry") {
                child.rotation.x += currentSpeed * 0.2;
            }
        });

        const bikeBox = new THREE.Box3().setFromObject(bike);
        const carBox = new THREE.Box3().setFromObject(car);

        if (bikeBox.intersectsBox(carBox)) {
            gameOver();
        }

        if (car.position.z > 20) {
            scene.remove(car);
            traffic.splice(index, 1);
        }
    });

    // Obstacles
    obstacles.forEach((obstacle, index) => {

        obstacle.position.z += currentSpeed * 1.15;

        const bikeBox = new THREE.Box3().setFromObject(bike);
        const obstacleBox = new THREE.Box3().setFromObject(obstacle);

        if (bikeBox.intersectsBox(obstacleBox)) {
            gameOver();
        }

        if (obstacle.position.z > 20) {
            scene.remove(obstacle);
            obstacles.splice(index, 1);
        }
    });

    // Lane snap movement
    bike.position.x += (lanes[currentLane] - bike.position.x) * 0.2;
    const targetLean =
        (lanes[currentLane] - bike.position.x) * -0.1;

    bike.rotation.z += (targetLean - bike.rotation.z) * 0.1;
    const speedShake = currentSpeed * 0.02;
    // Camera follow
    camera.position.x += (bike.position.x - camera.position.x) * 0.1;

    camera.lookAt(
        bike.position.x,
        bike.position.y,
        bike.position.z - 5
    );
    // Score
    score += delta * 5 * multiplier * (1 + difficulty * 0.5);
    const displayScore = Math.floor(score);

    scoreElement.textContent =
        displayScore + " | Lv " + difficulty.toFixed(1);
    // Screen shake
    if (shakeIntensity > 0) {
        camera.position.x += (Math.random() - 0.5) * shakeIntensity;
        camera.position.y += (Math.random() - 0.5) * shakeIntensity;
        shakeIntensity *= 0.9;
    }
    // CAMERA MICRO SHAKE (controlled)
    const camShake = Math.min(currentSpeed * 0.003, 0.015);

    camera.position.y += Math.sin(performance.now() * 0.01) * camShake;
    camera.position.x += (Math.random() - 0.5) * camShake * 0.2;

    renderer.render(scene, camera);

    // =======================
    // HORIZON COLOR SHIFT
    // =======================

    const horizonColor = new THREE.Color();

    const sunsetColor = new THREE.Color(0xff4fd8);
    const nightColor = new THREE.Color(0x4400ff);

    horizonColor.lerpColors(sunsetColor, nightColor, t);

    horizonMat.color.copy(horizonColor);

    // stronger at night
    horizonMat.opacity = 0.2 + t * 0.6;
}
function createCrashEffect(position) {

    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = [];

    for (let i = 0; i < particleCount; i++) {

        positions.push(
            position.x,
            position.y,
            position.z
        );
    }

    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
    );

    const material = new THREE.PointsMaterial({
        color: 0xffaa00,
        size: 0.3
    });

    crashParticles = new THREE.Points(geometry, material);
    scene.add(crashParticles);
}

function playCrashSound() {

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = "sawtooth";
    osc.frequency.value = 120;

    gain.gain.value = 0.2;

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start();

    osc.frequency.exponentialRampToValueAtTime(
        40,
        audioContext.currentTime + 0.4
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.4
    );

    osc.stop(audioContext.currentTime + 0.4);
}

//////////////////////
// RESIZE HANDLING
//////////////////////

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

});
animate();

//////////////////////
// START OVERLAY
/////////////////////

const startOverlay = document.getElementById("startOverlay");
const startText = document.getElementById("startText");

async function startSequence() {

    await wait(800);
    startText.textContent = "SET";

    await wait(800);
    startText.textContent = "GO";

    await wait(600);

    startOverlay.classList.add("hidden");
}

function wait(ms) {
    return new Promise(res => setTimeout(res, ms));
}

startSequence();