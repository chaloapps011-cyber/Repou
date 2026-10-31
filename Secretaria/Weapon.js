import * as THREE from 'three';

export class Weapon {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.cooldown = false;

        this.weapon = new THREE.Group();
        this.camera.add(this.weapon);

        this.createModel();
        this.createMuzzleFlash();

        this.weapon.position.set(0.28, -0.25, -0.55);
        this.weapon.rotation.set(0, 0, 0);
    }

    createModel() {
        const metal = new THREE.MeshStandardMaterial({
            color: 0x252a2d,
            metalness: 0.8,
            roughness: 0.35
        });

        const dark = new THREE.MeshStandardMaterial({
            color: 0x111416,
            roughness: 0.8
        });

        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.16, 0.18, 0.65),
            metal
        );
        body.position.set(0, 0, -0.12);
        this.weapon.add(body);

        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.035, 0.035, 0.55, 12),
            metal
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.015, -0.55);
        this.weapon.add(barrel);

        const grip = new THREE.Mesh(
            new THREE.BoxGeometry(0.09, 0.22, 0.13),
            dark
        );
        grip.position.set(0, -0.18, 0.02);
        grip.rotation.x = -0.2;
        this.weapon.add(grip);

        const stock = new THREE.Mesh(
            new THREE.BoxGeometry(0.13, 0.13, 0.25),
            dark
        );
        stock.position.set(0, 0, 0.28);
        this.weapon.add(stock);

        const sight = new THREE.Mesh(
            new THREE.BoxGeometry(0.055, 0.07, 0.12),
            dark
        );
        sight.position.set(0, 0.12, -0.12);
        this.weapon.add(sight);

        this.weapon.traverse(object => {
            if (object.isMesh) {
                object.castShadow = true;
                object.receiveShadow = true;
            }
        });
    }

    createMuzzleFlash() {
        const material = new THREE.MeshBasicMaterial({
            color: 0xffbd45,
            transparent: true,
            opacity: 0
        });

        this.flash = new THREE.Mesh(
            new THREE.SphereGeometry(0.09, 8, 8),
            material
        );

        this.flash.position.set(0, 0.015, -0.85);
        this.weapon.add(this.flash);
    }

    shoot() {
        if (this.cooldown) return;

        this.cooldown = true;
        this.flash.material.opacity = 1;
        this.weapon.position.z -= 0.045;

        setTimeout(() => {
            this.flash.material.opacity = 0;
            this.weapon.position.z = -0.55;
            this.cooldown = false;
        }, 120);

        console.log('PROJECT ZERO: SHOT FIRED');
    }
} 
