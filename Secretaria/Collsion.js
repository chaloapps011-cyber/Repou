
import * as THREE from 'three';

export class CollisionSystem {
    constructor() {
        this.objects = [];
        this.playerRadius = 0.45;
    }

    add(object) {
        this.objects.push(object);
    }

    addMany(objects) {
        this.objects.push(...objects);
    }

    check(position) {
        const playerBox = new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(
                position.x,
                position.y,
                position.z
            ),
            new THREE.Vector3(
                this.playerRadius * 2,
                1.7,
                this.playerRadius * 2
            )
        );

        for (const object of this.objects) {
            const objectBox = new THREE.Box3().setFromObject(object);

            if (playerBox.intersectsBox(objectBox)) {
                return true;
            }
        }

        return false;
    }

    resolve(oldPosition, newPosition) {
        const result = newPosition.clone();

        if (!this.check(result)) {
            return result;
        }

        result.x = newPosition.x;

        if (this.check(result)) {
            result.x = oldPosition.x;
        }

        result.z = newPosition.z;

        if (this.check(result)) {
            result.z = oldPosition.z;
        }

        return result;
    }
}
