import * as THREE from 'three';

export class EnemySystem {
    constructor(scene) {
        this.scene = scene;
        this.enemies = [];

        this.materials = {
            body: new THREE.MeshStandardMaterial({ color: 0x343b32, roughness: 0.95 }),
            armor: new THREE.MeshStandardMaterial({ color: 0x202724, roughness: 0.8 }),
            skin: new THREE.MeshStandardMaterial({ color: 0x9b806b }),
            helmet: new THREE.MeshStandardMaterial({ color: 0x252d27, roughness: 0.9 })
        };

        this.spawnEnemies();
    }

    createEnemy(x, z) {
        const enemy = new THREE.Group();

        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.65, 0.9, 0.35),
            this.materials.body
        );
        body.position.y = 1.15;
        enemy.add(body);

        const armor = new THREE.Mesh(
            new THREE.BoxGeometry(0.7, 0.45, 0.4),
            this.materials.armor
        );
        armor.position.y = 1.35;
        enemy.add(armor);

        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 12, 12),
            this.materials.skin
        );
        head.position.y = 1.8;
        enemy.add(head);

        const helmet = new THREE.Mesh(
            new THREE.SphereGeometry(0.23, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
            this.materials.helmet
        );
        helmet.position.y = 1.85;
        enemy.add(helmet);

        enemy.position.set(x, 0, z);
        enemy.userData.health = 100;
        enemy.userData.alive = true;

        enemy.traverse(object => {
            if (object.isMesh) {
                object.castShadow = true;
                object.userData.enemy = enemy;
            }
        });

        this.scene.add(enemy);
        this.enemies.push(enemy);
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
        }
    }
}
