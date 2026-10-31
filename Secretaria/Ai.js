import * as THREE from 'three';

export class EnemyAI {
    constructor(enemySystem, player, healthSystem) {
        this.enemySystem = enemySystem;
        this.player = player;
        this.health = healthSystem;

        this.detectionRange = 25;
        this.attackRange = 2;
        this.moveSpeed = 1.8;
        this.attackCooldown = 0;
    }

    update(delta) {
        if (!this.health.alive) return;

        for (const enemy of this.enemySystem.enemies) {
            if (!enemy.userData.alive) continue;

            const distance = enemy.position.distanceTo(
                this.player.position
            );

            if (distance > this.detectionRange) continue;

            const direction = new THREE.Vector3()
                .subVectors(this.player.position, enemy.position);

            direction.y = 0;

            if (direction.lengthSq() > 0) {
                direction.normalize();
                enemy.rotation.y = Math.atan2(
                    direction.x,
                    direction.z
                );
            }

            if (distance > this.attackRange) {
                enemy.position.addScaledVector(
                    direction,
                    this.moveSpeed * delta
                );
            } else {
                this.attack(enemy, delta);
            }
        }
    }

    attack(enemy, delta) {
        enemy.userData.attackTimer =
            (enemy.userData.attackTimer || 0) - delta;

        if (enemy.userData.attackTimer > 0) return;

        enemy.userData.attackTimer = 1.2;

        this.health.takeDamage(8);

        console.log('PROJECT ZERO: PLAYER HIT');
    }
}
