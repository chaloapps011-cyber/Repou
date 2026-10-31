
import * as THREE from 'three';

import { createWorld } from './world.js';
import { CollisionSystem } from './collision.js';
import { Player } from './player.js';
import { MobileControls } from './mobile-controls.js';

const container = document.getElementById('game-container');

// SCENE
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
scene.add(
    new THREE.HemisphereLight(0xc5d5df, 0x353b32, 2)
);

const sun = new THREE.DirectionalLight(0xffe2bd, 3);
sun.position.set(-30, 50, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

// TERRAIN
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

// COLLISION
const collision = new CollisionSystem();

// PLAYER
const mobileControls = new MobileControls();

const player = new Player(
    camera,
    collision,
    mobileControls
);

// GAME LOOP
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);

    player.update(delta);

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

// LOADING
document.getElementById('loading').style.display = 'none';

console.log('PROJECT ZERO INITIALIZED');
