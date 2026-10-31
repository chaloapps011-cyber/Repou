
import * as THREE from 'three';
import { createWorld } from './world.js';

const container = document.getElementById('game-container');

// CENA
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x89979b);
scene.fog = new THREE.Fog(0x89979b, 35, 180);

// CÂMERA
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    500
);

camera.position.set(0, 1.7, 12);
camera.rotation.order = 'YXZ';

// RENDERIZADOR
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

// ILUMINAÇÃO
scene.add(new THREE.HemisphereLight(0xc5d5df, 0x353b32, 2));

const sun = new THREE.DirectionalLight(0xffe2bd, 3);
sun.position.set(-30, 50, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

// TERRENO
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

// ESTRADA
const road = new THREE.Mesh(
    new THREE.PlaneGeometry(35, 250),
    new THREE.MeshStandardMaterial({
        color: 0x343638,
        roughness: 0.95
    })
);

road.rotation.x = -Math.PI / 2;
road.position.y = 0.02;
road.receiveShadow = true;
scene.add(road);

// CARREGAR MUNDO
createWorld(scene);

// CONTROLES DE OLHAR
let yaw = 0;
let pitch = 0;
let dragging = false;
let lastX = 0;
let lastY = 0;

renderer.domElement.addEventListener('pointerdown', e => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
});

window.addEventListener('pointerup', () => {
    dragging = false;
});

window.addEventListener('pointermove', e => {
    if (!dragging) return;

    yaw -= (e.clientX - lastX) * 0.003;
    pitch -= (e.clientY - lastY) * 0.003;

    pitch = Math.max(-1.4, Math.min(1.4, pitch));

    lastX = e.clientX;
    lastY = e.clientY;

    camera.rotation.set(pitch, yaw, 0);
});

// REDIMENSIONAMENTO
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ANIMAÇÃO
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();

document.getElementById('loading').style.display = 'none';
