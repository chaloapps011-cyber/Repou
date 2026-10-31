
import * as THREE from 'three';

export class Player {
    constructor(camera, collision) {
        this.camera = camera;
        this.collision = collision;

        this.position = new THREE.Vector3(0, 1.7, 12);

        this.speed = 5;
        this.sprintSpeed = 8;
        this.sensitivity = 0.003;

        this.keys = {};
        this.yaw = 0;
        this.pitch = 0;

        this.velocity = new THREE.Vector3();

        this.setupControls();
    }

    setupControls() {
        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', e => {
            this.keys[e.code] = false;
        });

        let dragging = false;
        let lastX = 0;
        let lastY = 0;

        this.camera.rotation.order = 'YXZ';

        this.camera.parent?.addEventListener?.('pointermove', () => {});

        window.addEventListener('pointerdown', e => {
            if (e.target.tagName !== 'CANVAS') return;

            dragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
        });

        window.addEventListener('pointerup', () => {
            dragging = false;
        });

        window.addEventListener('pointermove', e => {
            if (!dragging) return;

            this.yaw -= (e.clientX - lastX) * this.sensitivity;
            this.pitch -= (e.clientY - lastY) * this.sensitivity;

            this.pitch = THREE.MathUtils.clamp(
                this.pitch,
                -1.4,
                1.4
            );

            lastX = e.clientX;
            lastY = e.clientY;

            this.camera.rotation.set(this.pitch, this.yaw, 0);
        });
    }

    update(delta) {
        const direction = new THREE.Vector3();

        const forward = new THREE.Vector3(
            -Math.sin(this.yaw),
            0,
            -Math.cos(this.yaw)
        );

        const right = new THREE.Vector3(
            Math.cos(this.yaw),
            0,
            -Math.sin(this.yaw)
        );

        if (this.keys.KeyW || this.keys.ArrowUp) {
            direction.add(forward);
        }

        if (this.keys.KeyS || this.keys.ArrowDown) {
            direction.sub(forward);
        }

        if (this.keys.KeyD || this.keys.ArrowRight) {
            direction.add(right);
        }

        if (this.keys.KeyA || this.keys.ArrowLeft) {
            direction.sub(right);
        }

        if (direction.lengthSq() > 0) {
            direction.normalize();
        }

        const sprint = this.keys.ShiftLeft;
        const currentSpeed = sprint ? this.sprintSpeed : this.speed;

        const oldPosition = this.position.clone();

        const nextPosition = this.position.clone().addScaledVector(
            direction,
            currentSpeed * delta
        );

        this.position.copy(
            this.collision.resolve(oldPosition, nextPosition)
        );

        this.camera.position.copy(this.position);
    }
}
