import * as THREE from 'three';

import { createWorld } from './world.js';
import { CollisionSystem } from './collision.js';
import { Player } from './player.js';
import { MobileControls } from './mobile-controls.js';
import { Weapon } from './weapon.js';
import { EnemySystem } from './enemies.js';
import { HealthSystem } from './health.js';
import { EnemyAI } from './ai.js';
import { AmmoSystem } from './ammo.js';
import { ShootingSystem } from './shooting.js';
import { AudioSystem } from './audio.js';
import { ObjectiveSystem } from './objectives.js';

// SCENE
const container = document.getElementById('game-container');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x89979b);
scene.fog = new THREE.Fog(0x89979b, 35, 180);

// CAMERA
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    500
);

camera.position.set(0, 1.7, 12);

// RENDERER
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance'
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

container.appendChild(renderer.domElement);

// LIGHTING
scene.add(new THREE.HemisphereLight(0xc5d5df, 0x353b32, 2));

const sun = new THREE.DirectionalLight(0xffe2bd, 3);
sun.position.set(-30, 50, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

// GROUND
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

// ROAD
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

// WORLD
createWorld(scene);

// SYSTEMS
const collision = new CollisionSystem();
const mobileControls = new MobileControls();
const player = new Player(camera, collision, mobileControls);

const weapon = new Weapon(camera, scene);
const enemies = new EnemySystem(scene);
const health = new HealthSystem();
const ai = new EnemyAI(enemies, player, health);
const ammo = new AmmoSystem();
const audio = new AudioSystem();

const shooting = new ShootingSystem(
    camera,
    weapon,
    ammo,
    enemies
);

const objectives = new ObjectiveSystem();

objectives.complete(1);

// SHOOTING
function fire() {
    if (health.alive && ammo.magazine > 0 && !ammo.reloading) {
        shooting.shoot();
        audio.gunshot();
    }
}

// RELOAD
function reload() {
    if (!health.alive) return;

    if (!ammo.reloading && ammo.magazine < ammo.magazineSize) {
        shooting.reload();
        audio.reload();
    }
}

// MOBILE BUTTONS
const fireButton = document.querySelector('.action-button');
const sprintButton = document.querySelector('.sprint-button');

fireButton?.addEventListener('pointerdown', fire);

sprintButton?.addEventListener('pointerdown', () => {
    mobileControls.sprinting = true;
});

sprintButton?.addEventListener('pointerup', () => {
    mobileControls.sprinting = false;
});

sprintButton?.addEventListener('pointercancel', () => {
    mobileControls.sprinting = false;
});

// KEYBOARD
window.addEventListener('keydown', event => {
    if (event.code === 'KeyR') reload();
    if (event.code === 'Space') fire();
});

// DESKTOP SHOOTING
renderer.domElement.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse') fire();
});

// GAME LOOP
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);

    if (health.alive) {
        player.update(delta);
        ai.update(delta);
        objectives.checkEnemies(enemies);
    }

    renderer.render(scene, camera);
}

animate();

// RESIZE
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
});

document.getElementById('loading').style.display = 'none';

console.log('PROJECT: ZERO INITIALIZED');
console.log('ABANDONED SECTOR LOADED');
