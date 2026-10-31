import * as THREE from 'three';

export function createWorld(scene, collision) {
    const materials = {
        concrete: new THREE.MeshStandardMaterial({
            color: 0x555957,
            roughness: 0.95
        }),
        metal: new THREE.MeshStandardMaterial({
            color: 0x30383a,
            metalness: 0.65,
            roughness: 0.7
        }),
        wood: new THREE.MeshStandardMaterial({
            color: 0x59442e,
            roughness: 1
        }),
        barrel: new THREE.MeshStandardMaterial({
            color: 0x424b39,
            metalness: 0.4
        })
    };

    function box(x, y, z, sx, sy, sz, material, solid = true) {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(sx, sy, sz),
            material
        );

        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        scene.add(mesh);

        if (solid && collision) {
            collision.add(mesh);
        }

        return mesh;
    }

    function cylinder(x, y, z, radius, height, material) {
        const mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(radius, radius, height, 16),
            material
        );

        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        scene.add(mesh);
        collision?.add(mesh);

        return mesh;
    }

    // PERIMETER WALLS
    box(0, 3, -75, 150, 6, 2, materials.concrete);
    box(0, 3, 75, 150, 6, 2, materials.concrete);
    box(-75, 3, 0, 2, 6, 150, materials.concrete);
    box(75, 3, 0, 2, 6, 150, materials.concrete);

    // ABANDONED BUILDINGS
    box(-22, 3, -25, 24, 6, 18, materials.concrete);
    box(24, 3, -42, 28, 6, 20, materials.concrete);
    box(-35, 2.5, 30, 20, 5, 16, materials.concrete);

    // BUILDING DOORWAYS
    box(-22, 4.5, -15, 8, 3, 2, materials.metal);
    box(24, 4.5, -31, 8, 3, 2, materials.metal);

    // BARRICADES
    const barricades = [
        [-8, -12],
        [9, -20],
        [-15, -45],
        [15, -55],
        [35, 5],
        [-40, 0]
    ];

    for (const [x, z] of barricades) {
        box(x, 0.8, z, 4, 1.6, 1, materials.metal);
    }

    // CRATES
    const crates = [
        [-12, 8], [-9, 8],
        [12, -8], [15, -8],
        [-30, -12], [30, -30],
        [40, 20], [-40, 20]
    ];

    for (const [x, z] of crates) {
        box(x, 0.8, z, 1.6, 1.6, 1.6, materials.wood);
    }

    // BARRELS
    const barrels = [
        [-5, -30], [5, -35],
        [18, -10], [-25, 12],
        [32, -20], [-38, -30]
    ];

    for (const [x, z] of barrels) {
        cylinder(x, 0.65, z, 0.45, 1.3, materials.barrel);
    }

    // WATCHTOWERS
    for (const [x, z] of [[-60, -60], [60, -60], [-60, 60], [60, 60]]) {
        box(x, 4, z, 2, 8, 2, materials.metal);
        box(x, 8.5, z, 5, 1, 5, materials.wood);
    }

    console.log('ABANDONED SECTOR: COLLIDERS REGISTERED');
}
