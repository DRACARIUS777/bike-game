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

//////////////////

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

//////////////////////
// BASIC SETUP
//////////////////////

const scene = new THREE.Scene();
const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
const skyMaterial = new THREE.MeshBasicMaterial({
    color: 0x87CEEB,
    side: THREE.BackSide
});
const sky = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(sky);
scene.fog = new THREE.Fog(0x0a0f2a, 20, 200);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

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

let baseSpawnDelay = 2000;
let trafficSpawnDelay = 2500;

let obstacleInterval;
let trafficInterval;
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

    } else {

        nitroGain.gain.setTargetAtTime(
            0,
            audioContext.currentTime,
            0.2
        );

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

//MOUNTAIN CREATION

for (let i = 0; i < 20; i++) {

    const geometry = new THREE.ConeGeometry(5 + Math.random() * 5, 15, 4);
    const material = new THREE.MeshStandardMaterial({ color: 0x556b2f });
    const mountain = new THREE.Mesh(geometry, material);

    // Force mountains outside road area
    const side = Math.random() < 0.5 ? -1 : 1;

    mountain.position.set(
        side * (30 + Math.random() * 80), // far from road
        7,
        -Math.random() * 300
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

    const geometry = new THREE.BoxGeometry(1.8, 1, 3.5);

    const material = new THREE.MeshStandardMaterial({
        color: 0x3399ff   // blue
    });

    const car = new THREE.Mesh(geometry, material);   // ⭐ MISSING LINE

    car.castShadow = true;
    car.receiveShadow = true;

    car.position.x = trafficLanes[Math.floor(Math.random() * trafficLanes.length)];
    car.position.y = 0.5;
    car.position.z = -60 - Math.random() * 100;

    scene.add(car);
    traffic.push(car);
}

setInterval(createTrafficCar, 2000);
////////////////

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.toneMappingExposure = 1.2;
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



//////////////////////
// BIKE (BLOCK STYLE)
//////////////////////

const bike = new THREE.Group();

// Body
const bodyGeometry = new THREE.BoxGeometry(1, 0.5, 2);
const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
body.position.y = 0.75;
body.castShadow = true;
bike.add(body);

// Front wheel
const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.5, 16);
const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
frontWheel.rotation.z = Math.PI / 2;
frontWheel.position.set(0, 0.4, -0.9);
frontWheel.castShadow = true;
bike.add(frontWheel);

// Back wheel
const backWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
backWheel.rotation.z = Math.PI / 2;
backWheel.position.set(0, 0.4, 0.9);
backWheel.castShadow = true;
bike.add(backWheel);



const tronMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
    depthWrite: false
});

const streakCount = 150;
const streakGeo = new THREE.BufferGeometry();
const streakPositions = new Float32Array(streakCount * 3);

streakGeo.setAttribute(
    'position',
    new THREE.BufferAttribute(streakPositions, 3)
);

const streakMat = new THREE.PointsMaterial({
    color: 0x00ffff,
    size: 0.1,
    transparent: true,
    opacity: 0.8
});

const streaks = new THREE.Points(streakGeo, streakMat);
scene.add(streaks);
streaks.visible = false;




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

camera.position.set(0, 5, 10);

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
window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
    if (e.key === "Shift") nitroActive = false;
});

//////////////////////
// OBSTACLES
//////////////////////

const obstacles = [];

function spawnObstacle() {

    // 4 lane positions (must match bike lanes)
    const lanes = [-4.5, -1.5, 1.5, 4.5];

    // Different obstacle shapes
    const shapes = [
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.CylinderGeometry(1, 1, 2, 16),
        new THREE.ConeGeometry(1.2, 2, 6)
    ];

    const geometry = shapes[Math.floor(Math.random() * shapes.length)];
    const material = new THREE.MeshStandardMaterial({ color: 0xff4444 });

    const obstacle = new THREE.Mesh(geometry, material);

    // Snap to random lane
    obstacle.position.x = lanes[Math.floor(Math.random() * lanes.length)];

    obstacle.position.y = 1;     // Lift above ground
    obstacle.position.z = -120;  // Spawn far ahead

    obstacle.castShadow = true;

    scene.add(obstacle);
    obstacles.push(obstacle);
}
function startSpawning() {

    clearInterval(obstacleInterval);
    clearInterval(trafficInterval);

    obstacleInterval = setInterval(() => {

        spawnObstacle();

    }, baseSpawnDelay / difficulty);

    trafficInterval = setInterval(() => {

        createTrafficCar();

    }, trafficSpawnDelay / difficulty);

}

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
    roadTexture.offset.y -= currentSpeed * 0.02;


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

    //spawn rate
    if (Math.floor(score) % 100 === 0) {
        startSpawning();
    }


    // Dynamic FOV
    camera.fov = 75 + currentSpeed * 5;
    camera.updateProjectionMatrix();

    // Move Road
    roadSegments.forEach(segment => {
        segment.position.z += currentSpeed;

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

        car.position.z += currentSpeed * 0.8;

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

        obstacle.position.z += currentSpeed;

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

    // Camera follow
    camera.position.x += (bike.position.x - camera.position.x) * 0.1;

    camera.lookAt(
        bike.position.x,
        bike.position.y,
        bike.position.z - 5
    );

    //CONTROLS popoff
    const controlsPopup = document.getElementById("controlsPopup");

    // Hide after 3 seconds
    setTimeout(() => {
        controlsPopup.classList.add("hidden");
    }, 2000);

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

    renderer.render(scene, camera);
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