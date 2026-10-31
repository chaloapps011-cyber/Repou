import * as THREE from 'three';

export class ShootingSystem {
    constructor(camera, weapon, ammo, enemySystem) {
        this.camera = camera;
        this.weapon = weapon;
        this.ammo = ammo;
        this.enemySystem = enemySystem;

        this.raycaster = new THREE.Raycaster();
        this.damage = 34;
        this.range = 100;
    }

    shoot() {
        if (!this.ammo.shoot()) return;

        this.weapon.shoot();

        this.raycaster.setFromCamera(
            new THREE.Vector2(0, 0),
            this.camera
        );

        const targets = [];

        for (const enemy of this.enemySystem.enemies) {
            if (enemy.userData.alive) {
                enemy.traverse(object => {
                    if (object.isMesh) targets.push(object);
                });
            }
        }

        const hits = this.raycaster.intersectObjects(targets);

        if (hits.length === 0) return;

        const hit = hits[0];

        if (hit.distance > this.range) return;

        const enemy = hit.object.userData.enemy;

        if (enemy) {
            this.enemySystem.damage(enemy, this.damage);
            console.log('HIT! DAMAGE:', this.damage);
        }
    }

    reload() {
        this.ammo.reload();
    }
}
