import * as THREE from 'three';

export class EnemySystem {
    constructor(scene, collision) {
        this.scene = scene;
        this.collision = collision;
        this.enemies = [];

        this.materials = {
            body: new THREE.MeshStandardMaterial({
                color: 0x343b32,
                roughness: 0.95
            }),
            armor: new THREE.MeshStandardMaterial({
                color: 0x202724,
                roughness: 0.8
            }),
            skin: new THREE.MeshStandardMaterial({
                color: 0x9b806b
            }),
            helmet: new THREE.MeshStandardMaterial({
                color: 0x252d27,
                roughness: 0.9
            })
        };

        this.spawnEnemies();
    }

    createPart(enemy, geometry, material, position) {
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.set(...position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.enemy = enemy;

        enemy.add(mesh);
        return mesh;
    }

    createEnemy(x, z) {
        const enemy = new THREE.Group();

        this.createPart(enemy, new THREE.BoxGeometry(0.65, 0.9, 0.35), this.materials.body, [0, 1.15, 0]);
        this.createPart(enemy, new THREE.BoxGeometry(0.7, 0.45, 0.4), this.materials.armor, [0, 1.35, 0]);
        this.createPart(enemy, new THREE.SphereGeometry(0.2, 12, 12), this.materials.skin, [0, 1.8, 0]);

        this.createPart(
            enemy,
            new THREE.SphereGeometry(0.23, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
            this.materials.helmet,
            [0, 1.85, 0]
        );

        enemy.position.set(x, 0, z);

        enemy.userData.health = 100;
        enemy.userData.alive = true;
        enemy.userData.attackTimer = 0;

        this.scene.add(enemy);
        this.enemies.push(enemy);

        // Registrar o inimigo no sistema de colisão
        if (this.collision) {
            this.collision.add(enemy);
        }

        return enemy;
    }

    spawnEnemies() {
        const positions = [
            [-12, -18],
            [14, -25],
            [-20, -35],
            [22, -42],
            [0, -55],
            [30, -15]
        ];

        for (const [x, z] of positions) {
            this.createEnemy(x, z);
        }
    }

    damage(enemy, amount) {
        if (!enemy || !enemy.userData.alive) return;

        enemy.userData.health -= amount;

        if (enemy.userData.health <= 0) {
            enemy.userData.health = 0;
            enemy.userData.alive = false;

            this.scene.remove(enemy);

            this.enemies = this.enemies.filter(
                item => item !== enemy
            );
        }
    }
}
