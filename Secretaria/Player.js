
import * as THREE from 'three';

export class Player {
    constructor(camera, collision, mobileControls) {
        this.camera = camera;
        this.collision = collision;
        this.mobile = mobileControls;

        this.position = new THREE.Vector3(0, 1.7, 12);

        this.speed = 5;
        this.sprintSpeed = 8;
        this.sensitivity = 0.003;

        this.keys = {};
        this.yaw = 0;
        this.pitch = 0;

        this.camera.rotation.order = 'YXZ';

        this.setupKeyboard();
        this.setupMouseLook();
    }

    setupKeyboard() {
        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', e => {
            this.keys[e.code] = false;
        });
    }

    setupMouseLook() {
        let dragging = false;
        let lastX = 0;
        let lastY = 0;

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

            lastX = e.clientX;
            lastY = e.clientY;

            this.updateRotation();
        });
    }

    updateRotation() {
        this.pitch = THREE.MathUtils.clamp(
            this.pitch,
            -1.4,
            1.4
        );

        this.camera.rotation.set(
            this.pitch,
            this.yaw,
            0
        );
    }

    update(delta) {
        const input = new THREE.Vector3();

        const mobileMove = this.mobile.getMove();

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

        // TECLADO
        if (this.keys.KeyW || this.keys.ArrowUp) input.add(forward);
        if (this.keys.KeyS || this.keys.ArrowDown) input.sub(forward);
        if (this.keys.KeyD || this.keys.ArrowRight) input.add(right);
        if (this.keys.KeyA || this.keys.ArrowLeft) input.sub(right);

        // JOYSTICK
        input.addScaledVector(forward, -mobileMove.y);
        input.addScaledVector(right, mobileMove.x);

        if (input.lengthSq() > 1) input.normalize();

        const sprint =
            this.keys.ShiftLeft || this.mobile.sprinting;

        const speed = sprint
            ? this.sprintSpeed
            : this.speed;

        const oldPosition = this.position.clone();

        const nextPosition = this.position.clone().addScaledVector(
            input,
            speed * delta
        );

        this.position.copy(
            this.collision.resolve(oldPosition, nextPosition)
        );

        // CÂMERA
        this.camera.position.copy(this.position);

        // VISÃO TOUCHSCREEN
        this.yaw -= this.mobile.lookX * this.sensitivity;
        this.pitch -= this.mobile.lookY * this.sensitivity;

        this.mobile.lookX = 0;
        this.mobile.lookY = 0;

        this.updateRotation();
    }
}
