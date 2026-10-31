import * as THREE from 'three';

export class EnemyAI {
    constructor(enemySystem, player, healthSystem, collision) {
        this.enemySystem = enemySystem;
        this.player = player;
        this.health = healthSystem;
        this.collision = collision;

        this.detectionRange = 25;
        this.attackRange = 2;
        this.moveSpeed = 1.8;
        this.attackDamage = 8;
        this.attackInterval = 1.2;
    }

    update(delta) {
        if (!this.health.alive) return;

        for (const enemy of this.enemySystem.enemies) {
            if (!enemy.userData.alive) continue;

            const direction = new THREE.Vector3()
                .subVectors(this.player.position, enemy.position);

            direction.y = 0;

            const distance = direction.length();

            if (distance > this.detectionRange) continue;

            direction.normalize();

            enemy.rotation.y = Math.atan2(
                direction.x,
                direction.z
            );

            if (distance > this.attackRange) {
                this.moveEnemy(enemy, direction, delta);
            } else {
                this.attack(enemy, delta);
            }
        }
    }

    moveEnemy(enemy, direction, delta) {
        const movement = direction.clone().multiplyScalar(
            this.moveSpeed * delta
        );

        const nextPosition = enemy.position.clone().add(movement);

        if (this.collision && this.collision.check(nextPosition)) {
            return;
        }

        enemy.position.copy(nextPosition);
    }

    attack(enemy, delta) {
        enemy.userData.attackTimer -= delta;

        if (enemy.userData.attackTimer > 0) return;

        enemy.userData.attackTimer = this.attackInterval;

        this.health.takeDamage(this.attackDamage);
    }
}
