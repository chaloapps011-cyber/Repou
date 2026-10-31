
import * as THREE from 'three';

const container = document.getElementById('game-container');

// CENA
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x89979b);
scene.fog = new THREE.Fog(0x89979b, 35, 180);

// CÂMERA FPS
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    500
);

camera.position.set(0, 1.7, 12);

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

// CONSTRUTOR DE OBJETOS
function createBuilding(x, z, width, height, depth, color) {
    const building = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial({
            color,
            roughness: 0.9
        })
    );

    building.position.set(x, height / 2, z);
    building.castShadow = true;
    building.receiveShadow = true;

    scene.add(building);
}

// GALPÕES
createBuilding(-32, -25, 25, 15, 35, 0x626762);
createBuilding(32, -40, 30, 19, 45, 0x555c60);
createBuilding(-35, 35, 35, 17, 25, 0x4e5651);

// CONTÊINERES
function createContainer(x, z, color) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(8, 3, 3),
        new THREE.MeshStandardMaterial({
            color,
            roughness: 0.85,
            metalness: 0.3
        })
    );

    mesh.position.set(x, 1.5, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
}

createContainer(-14, -8, 0x46545c);
createContainer(17, 12, 0x665044);
createContainer(15, -20, 0x485c50);
createContainer(-20, 25, 0x555b60);

// POSTES
for (let i = -4; i <= 4; i++) {
    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.18, 7),
        new THREE.MeshStandardMaterial({ color: 0x292d2e })
    );

    pole.position.set(21, 3.5, i * 22);
    scene.add(pole);
}

// CONTROLES DE VISUALIZAÇÃO
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

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;

    yaw -= dx * 0.003;
    pitch -= dy * 0.003;

    pitch = Math.max(-1.4, Math.min(1.4, pitch));

    lastX = e.clientX;
    lastY = e.clientY;

    camera.rotation.order = 'YXZ';
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
