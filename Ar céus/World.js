
import * as THREE from 'three';

export function createWorld(scene) {

    const concrete = new THREE.MeshStandardMaterial({
        color: 0x62645e,
        roughness: 0.95
    });

    const metal = new THREE.MeshStandardMaterial({
        color: 0x454d50,
        roughness: 0.75,
        metalness: 0.35
    });

    const vegetation = new THREE.MeshStandardMaterial({
        color: 0x394c31,
        roughness: 1
    });

    function box(x, y, z, w, h, d, material) {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            material
        );

        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        return mesh;
    }

    // PERÍMETRO
    box(-75, 3, 0, 2, 6, 150, concrete);
    box(75, 3, 0, 2, 6, 150, concrete);
    box(0, 3, -75, 150, 6, 2, concrete);
    box(0, 3, 75, 150, 6, 2, concrete);

    // BARRICADAS
    for (let i = 0; i < 12; i++) {
        box(-45 + i * 8, 0.8, 18, 3, 1.6, 1.2, concrete);
    }

    // BARRIS
    const barrelGeometry = new THREE.CylinderGeometry(
        0.55, 0.55, 1.5, 16
    );

    for (let i = 0; i < 18; i++) {
        const barrel = new THREE.Mesh(barrelGeometry, metal);

        barrel.position.set(
            Math.random() * 100 - 50,
            0.75,
            Math.random() * 100 - 50
        );

        barrel.castShadow = true;
        scene.add(barrel);
    }

    // ÁRVORES
    function createTree(x, z, scale = 1) {

        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.25 * scale,
                0.4 * scale,
                4 * scale,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x51402d
            })
        );

        trunk.position.set(x, 2 * scale, z);
        trunk.castShadow = true;
        scene.add(trunk);

        const leaves = new THREE.Mesh(
            new THREE.ConeGeometry(
                2.5 * scale,
                7 * scale,
                8
            ),
            vegetation
        );

        leaves.position.set(x, 6 * scale, z);
        leaves.castShadow = true;
        scene.add(leaves);
    }

    for (let i = 0; i < 35; i++) {
        const x = Math.random() * 130 - 65;
        const z = Math.random() * 130 - 65;

        if (Math.abs(x) < 22 && Math.abs(z) < 25) {
            continue;
        }

        createTree(x, z, 0.6 + Math.random() * 0.8);
    }

    // TORRES DE OBSERVAÇÃO
    function watchTower(x, z) {
        const towerMetal = new THREE.MeshStandardMaterial({
            color: 0x343b3d,
            metalness: 0.5,
            roughness: 0.7
        });

        box(x, 4, z, 0.5, 8, 0.5, towerMetal);
        box(x + 3, 4, z, 0.5, 8, 0.5, towerMetal);
        box(x, 8, z, 7, 0.4, 5, towerMetal);
        box(x + 3, 10, z, 0.5, 4, 0.5, towerMetal);
        box(x, 12, z, 7, 0.5, 5, towerMetal);
    }

    watchTower(-60, -50);
    watchTower(60, 50);

    // CAIXAS DE MADEIRA
    const wood = new THREE.MeshStandardMaterial({
        color: 0x66513b,
        roughness: 1
    });

    for (let i = 0; i < 15; i++) {
        box(
            Math.random() * 90 - 45,
            0.8,
            Math.random() * 90 - 45,
            2,
            1.6,
            2,
            wood
        );
    }

    console.log('ABANDONED SECTOR: WORLD LOADED');
}
