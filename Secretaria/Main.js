import * as THREE from 'three';

// ======================================
// MODULES
// ======================================

import { createWorld } from './World.js';
import { CollisionSystem } from './Collision.js';
import { Player } from './Player.js';
import { MobileControls } from './Mobile-controls.js';
import { Weapon } from './Weapon.js';
import { EnemySystem } from './Enemies.js';
import { HealthSystem } from './Health.js';
import { EnemyAI } from './Ai.js';
import { AmmoSystem } from './Ammo.js';
import { ShootingSystem } from './Shooting.js';
import { AudioSystem } from './Audio.js';
import { ObjectiveSystem } from './Objectives.js';
import { WaveSystem } from './Waves.js';
import { SecondMain } from './Secondmain.js';
import { ReferenceCG } from './ReferenceCG.js';
import Mode from './Mode.js';

// ======================================
// CONFIGURATION
// ======================================

const CONFIG = {
    name: 'PROJECT: ZERO',
    map: 'ABANDONED SECTOR',
    shadows: true
};

// ======================================
// SCENE
// ======================================

const container = document.getElementById('game-container');

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x89979b);
scene.fog = new THREE.Fog(0x89979b, 35, 180);

// ======================================
// CAMERA
// ======================================

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    500
);

camera.position.set(0, 1.7, 12);

// ======================================
// RENDERER
// ======================================

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance'
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = CONFIG.shadows;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

container.appendChild(renderer.domElement);

// ======================================
// LIGHTING
// ======================================

const ambient = new THREE.HemisphereLight(
    0xc5d5df,
    0x353b32,
    2
);

scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffe2bd, 3);

sun.position.set(-30, 50, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);

scene.add(sun);

// ======================================
// ENVIRONMENT
// ======================================

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(250, 250),
    new THREE.MeshStandardMaterial({
        color: 0x55594b,
        roughness: 1
    })
);

ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;

scene.add(ground);

const road = new THREE.Mesh(
    new THREE.PlaneGeometry(35, 250),
    new THREE.MeshStandardMaterial({
        color: 0x343638,
        roughness: 0.95
    })
);

road.rotation.x = -Math.PI / 2;
road.position.y = 0.02;

scene.add(road);

// ======================================
// COLLISION
// ======================================

const collision = new CollisionSystem();

createWorld(scene, collision);

// ======================================
// PLAYER
// ======================================

const mobileControls = new MobileControls();

const player = new Player(
    camera,
    collision,
    mobileControls
);

// ======================================
// WEAPON
// ======================================

const weapon = new Weapon(camera, scene);

// ======================================
// ENEMIES
// ======================================

const enemies = new EnemySystem(scene, collision);

// ======================================
// HEALTH
// ======================================

const health = new HealthSystem(100);

// ======================================
// AI
// ======================================

const ai = new EnemyAI(
    enemies,
    player,
    health,
    collision
);

// ======================================
// AMMO
// ======================================

const ammo = new AmmoSystem();

// ======================================
// SHOOTING
// ======================================

const shooting = new ShootingSystem(
    camera,
    weapon,
    ammo,
    enemies
);

// ======================================
// AUDIO
// ======================================

const audio = new AudioSystem();

// ======================================
// OBJECTIVES
// ======================================

const objectives = new ObjectiveSystem();

objectives.complete(1);

// ======================================
// WAVES
// ======================================

const waves = new WaveSystem(enemies);

// ======================================
// SECOND MAIN
// ======================================

const secondMain = new SecondMain({
    scene,
    camera,
    renderer,
    player,
    enemies,
    health,
    waves
});

secondMain.menu.classList.add('pz-hidden');

// ======================================
// REFERENCE CG
// ======================================

const referenceCG = new ReferenceCG({
    scene,
    camera,
    renderer
});

// ======================================
// MODE SYSTEM
// ======================================

const modeSystem = new Mode({
    scene,
    camera,
    renderer,
    player,
    enemies,
    health,
    ammo,
    onModeChange: mode => {
        console.log('MODE SYSTEM:', mode || 'INACTIVE');
    }
});

// O ReferenceCG permanece responsável pelo menu.
// O menu duplicado do Mode fica oculto.
modeSystem.menu.style.display = 'none';

// ======================================
// GAME STATE
// ======================================

let currentMode = null;
let gameStarted = false;

// ======================================
// MODE EVENTS
// ======================================

window.addEventListener('referencecg:sandboxstart', () => {
    currentMode = 'SANDBOX';
    gameStarted = true;

    modeSystem.active = false;
    modeSystem.mode = null;
    modeSystem.paused = false;

    secondMain.started = true;
    secondMain.paused = false;

    console.log('SANDBOX MODE INITIALIZED');
});

window.addEventListener('referencecg:sandboxexit', () => {
    gameStarted = false;
    secondMain.started = false;

    modeSystem.active = false;
    modeSystem.paused = false;
    modeSystem.mode = null;
    modeSystem.hud.style.display = 'none';

    mobileControls.sprinting = false;

    console.log('SANDBOX MODE CLOSED');
});

window.addEventListener('referencecg:modechange', event => {
    currentMode = event.detail.mode;

    if (currentMode === 'SANDBOX') {
        modeSystem.active = false;
        modeSystem.mode = null;
        modeSystem.paused = false;
        modeSystem.hud.style.display = 'none';
    } else {
        modeSystem.startMode(currentMode);
    }

    gameStarted = true;
    secondMain.started = true;
    secondMain.paused = false;

    console.log('SELECTED MODE:', currentMode);
});

// ======================================
// ACTIONS
// ======================================

function fire() {
    if (!gameStarted) return;
    if (secondMain.paused || secondMain.finished) return;
    if (!health.alive) return;
    if (ammo.magazine <= 0 || ammo.reloading) return;

    shooting.shoot();
    audio.gunshot();
}

function reload() {
    if (!gameStarted) return;
    if (secondMain.paused || secondMain.finished) return;
    if (!health.alive) return;
    if (ammo.reloading || ammo.magazine >= ammo.magazineSize) return;

    shooting.reload();
    audio.reload();
}

// ======================================
// MOBILE BUTTONS
// ======================================

const fireButton = document.querySelector('.action-button');
const sprintButton = document.querySelector('.sprint-button');

if (fireButton) {
    fireButton.addEventListener('pointerdown', event => {
        event.preventDefault();
        fire();
    });
}

if (sprintButton) {
    sprintButton.addEventListener('pointerdown', () => {
        if (gameStarted && !secondMain.paused) {
            mobileControls.sprinting = true;
        }
    });

    const stopSprint = () => {
        mobileControls.sprinting = false;
    };

    sprintButton.addEventListener('pointerup', stopSprint);
    sprintButton.addEventListener('pointercancel', stopSprint);
    sprintButton.addEventListener('lostpointercapture', stopSprint);
}

// ======================================
// KEYBOARD
// ======================================

window.addEventListener('keydown', event => {
    if (event.code === 'KeyR') reload();
    if (event.code === 'Space') fire();
});

// ======================================
// DESKTOP SHOOTING
// ======================================

renderer.domElement.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse') {
        fire();
    }
});

// ======================================
// GAME LOOP
// ======================================

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);

    if (
        gameStarted &&
        !secondMain.paused &&
        !secondMain.finished
    ) {
        player.update(delta);

        if (currentMode === 'SANDBOX') {
            referenceCG.update(delta);
        } else {
            modeSystem.update(delta);
        }

        secondMain.update(delta, clock.elapsedTime);
    }

    renderer.render(scene, camera);
}

animate();

// ======================================
// CLEANUP
// ======================================

window.addEventListener('pagehide', () => {
    modeSystem.destroy();
}, { once: true });

// ======================================
// RESIZE
// ======================================

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
});

// ======================================
// INITIALIZATION
// ======================================

document.getElementById('loading').style.display = 'none';

console.log('PROJECT ZERO INITIALIZED');
console.log('REFERENCE CG CONNECTED');
console.log('MODE SYSTEM CONNECTED');
console.log('SANDBOX SYSTEM READY');
