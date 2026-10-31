import * as THREE from 'three';

export class CollisionSystem {
    constructor() {
        this.objects = [];
        this.playerRadius = 0.45;
        this.playerHeight = 1.7;
    }

    add(object) {
        if (object && !this.objects.includes(object)) {
            this.objects.push(object);
        }
    }

    addMany(objects) {
        for (const object of objects) {
            this.add(object);
        }
    }

    remove(object) {
        this.objects = this.objects.filter(item => item !== object);
    }

    check(position, ignoredObject = null) {
        const playerBox = new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(
                position.x,
                position.y - this.playerHeight / 2,
                position.z
            ),
            new THREE.Vector3(
                this.playerRadius * 2,
                this.playerHeight,
                this.playerRadius * 2
            )
        );

        for (const object of this.objects) {
            if (!object || !object.parent) continue;
            if (object === ignoredObject) continue;

            const objectBox = new THREE.Box3().setFromObject(object);

            if (playerBox.intersectsBox(objectBox)) {
                return true;
            }
        }

        return false;
    }

    resolve(oldPosition, newPosition) {
        const result = oldPosition.clone();

        const testX = oldPosition.clone();
        testX.x = newPosition.x;

        if (!this.check(testX)) {
            result.x = newPosition.x;
        }

        const testZ = result.clone();
        testZ.z = newPosition.z;

        if (!this.check(testZ)) {
            result.z = newPosition.z;
        }

        return result;
    }

    clear() {
        this.objects = [];
    }
}
