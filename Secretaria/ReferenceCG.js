
import * as THREE from 'three';

export class ReferenceCG {
    constructor({ scene, camera, renderer }) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.active = false;
        this.currentMode = null;
        this.selected = null;
        this.objects = [];
        this.enemies = [];
        this.vehicles = [];
        this.particles = [];

        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();

        this.moveSpeed = 8;
        this.gridSize = 1;
        this.snapEnabled = true;

        this.driving = null;
        this.keys = {};
        this.physics = true;

        this.materials = {
            concrete: 0x777d80,
            metal: 0x38434a,
            wood: 0x805b38,
            glass: 0x76b9d1,
            red: 0xa93636,
            green: 0x43865c,
            blue: 0x416f9e,
            yellow: 0xc5a43b
        };

        this.createInterface();
        this.createSandboxTools();
        this.setupEvents();
    }

    // ==================================
    // INTERFACE
    // ==================================

    createInterface() {
        this.style = document.createElement('style');

        this.style.textContent = `
            #referencecg {
                position: fixed;
                inset: 0;
                z-index: 50;
                pointer-events: none;
                font-family: Arial, sans-serif;
                color: white;
                user-select: none;
            }

            #referencecg button,
            #referencecg input,
            #referencecg select {
                pointer-events: auto;
            }

            .rcg-panel {
                background: rgba(12, 17, 23, .96);
                border: 1px solid #ffffff30;
                border-radius: 9px;
                padding: 10px;
                box-sizing: border-box;
                pointer-events: auto;
                overflow-y: auto;
                max-height: 65vh;
            }

            .rcg-red {
                background: rgba(150, 35, 42, .96);
            }

            .rcg-yellow {
                background: rgba(157, 119, 27, .96);
            }

            .rcg-green {
                background: rgba(34, 111, 65, .96);
            }

            .rcg-button {
                width: 100%;
                padding: 11px 8px;
                margin: 3px 0;
                border: 1px solid #ffffff45;
                border-radius: 5px;
                background: #17232c;
                color: white;
                font-size: 12px;
                font-weight: bold;
                cursor: pointer;
                touch-action: manipulation;
            }

            .rcg-button:active {
                background: #526776;
            }

            .rcg-title {
                font-weight: bold;
                font-size: 13px;
                letter-spacing: 1px;
                margin-bottom: 8px;
            }

            .rcg-label {
                display: block;
                font-size: 10px;
                color: #e0e5e9;
                margin: 8px 0 3px;
            }

            .rcg-input {
                width: 100%;
                box-sizing: border-box;
                padding: 8px;
                background: #101820;
                color: white;
                border: 1px solid #ffffff35;
                border-radius: 4px;
            }

            #rcg-menu {
                position: absolute;
                inset: 0;
                background: rgba(3, 6, 10, .96);
                display: flex;
                align-items: center;
                justify-content: center;
                pointer-events: auto;
            }

            #rcg-menu-content {
                width: min(90%, 440px);
                max-height: 85vh;
                overflow-y: auto;
                padding: 20px;
                background: #111a22;
                border: 1px solid #52616d;
                border-radius: 12px;
                text-align: center;
            }

            #rcg-menu h1 {
                letter-spacing: 4px;
                font-size: 26px;
            }

            #rcg-layout {
                position: absolute;
                inset: 0;
                display: none;
                pointer-events: none;
            }

            #rcg-top {
                position: absolute;
                top: 8px;
                left: 50%;
                transform: translateX(-50%);
                width: min(94%, 500px);
            }

            #rcg-left {
                position: absolute;
                left: 8px;
                top: 90px;
                width: 145px;
            }

            #rcg-right {
                position: absolute;
                right: 8px;
                top: 90px;
                width: 155px;
            }

            #rcg-status {
                position: absolute;
                bottom: 12px;
                left: 50%;
                transform: translateX(-50%);
                background: #101820dd;
                border: 1px solid #ffffff35;
                padding: 8px 15px;
                border-radius: 5px;
                font-size: 11px;
                pointer-events: none;
            }

            .rcg-hidden {
                display: none !important;
            }

            @media(max-width: 600px) {
                #rcg-left {
                    width: 115px;
                    top: 80px;
                }

                #rcg-right {
                    width: 125px;
                    top: 80px;
                }

                .rcg-button {
                    padding: 9px 5px;
                    font-size: 10px;
                }

                .rcg-panel {
                    padding: 7px;
                }
            }
        `;

        document.head.appendChild(this.style);

        this.root = document.createElement('div');
        this.root.id = 'referencecg';

        this.root.innerHTML = `
            <div id="rcg-menu">
                <div id="rcg-menu-content">
                    <h1>PROJECT: ZERO</h1>
                    <p>GAME MODE SELECTOR</p>
                    <div id="rcg-mode-list"></div>
                </div>
            </div>

            <div id="rcg-layout">
                <div id="rcg-top"
                     class="rcg-panel rcg-red">
                    <div class="rcg-title">
                        REFERENCE CG | SANDBOX
                    </div>
                    <button class="rcg-button" data-action="menu">
                        GAME MODES
                    </button>
                    <button class="rcg-button" data-action="save">
                        SAVE BUILD
                    </button>
                    <button class="rcg-button" data-action="load">
                        LOAD BUILD
                    </button>
                    <button class="rcg-button" data-action="clear">
                        CLEAR OBJECTS
                    </button>
                    <button class="rcg-button" data-action="exit">
                        EXIT SANDBOX
                    </button>
                </div>

                <div id="rcg-left"
                     class="rcg-panel rcg-yellow">
                    <div class="rcg-title">OBJECT CATALOG</div>
                    <div id="rcg-catalog"></div>
                </div>

                <div id="rcg-right"
                     class="rcg-panel rcg-green">
                    <div class="rcg-title">PROPERTIES</div>
                    <div id="rcg-properties">
                        Select an object.
                    </div>
                </div>

                <div id="rcg-status">
                    SANDBOX READY
                </div>
            </div>
        `;

        document.body.appendChild(this.root);

        this.menu = this.root.querySelector('#rcg-menu');
        this.layout = this.root.querySelector('#rcg-layout');
        this.catalog = this.root.querySelector('#rcg-catalog');
        this.properties = this.root.querySelector('#rcg-properties');
        this.status = this.root.querySelector('#rcg-status');

        this.createModeButtons();
    }

    // ==================================
    // GAME MODES
    // ==================================

    createModeButtons() {
        const modes = [
            ['SANDBOX', 'Free construction mode'],
            ['FREE MODE', 'Explore the map freely'],
            ['TEAM FIGHT', 'Two teams battle'],
            ['ELITE SQUAD', 'Squad-based combat'],
            ['TIME MODE', 'Timed matches'],
            ['OBJECTIVE MODE', 'Complete missions'],
            ['SURVIVAL', 'Survive enemy waves'],
            ['TRAINING', 'Practice your aim']
        ];

        const container = this.root.querySelector('#rcg-mode-list');

        for (const [name, description] of modes) {
            const button = document.createElement('button');

            button.className = 'rcg-button';
            button.textContent = `${name} | ${description}`;

            button.addEventListener('click', () => {
                this.selectMode(name);
            });

            container.appendChild(button);
        }
    }

    selectMode(mode) {
        this.currentMode = mode;

        if (mode === 'SANDBOX') {
            this.startSandbox();
            return;
        }

        this.active = false;
        this.layout.style.display = 'none';
        this.menu.style.display = 'flex';

        this.dispatch('modechange', {
            mode,
            onlineReady: true
        });

        this.status.textContent = `${mode} SELECTED`;
    }

    // ==================================
    // SANDBOX
    // ==================================

    startSandbox() {
        this.currentMode = 'SANDBOX';
        this.active = true;

        this.menu.style.display = 'none';
        this.layout.style.display = 'block';

        this.status.textContent = 'SANDBOX ACTIVE';

        this.dispatch('sandboxstart', {
            mode: 'SANDBOX'
        });
    }

    // ==================================
    // OBJECT CATALOG
    // ==================================

    createSandboxTools() {
        const categories = {
            BLOCKS: [
                ['Concrete block', 'concrete'],
                ['Metal block', 'metal'],
                ['Wood block', 'wood'],
                ['Glass block', 'glass'],
                ['Red block', 'red'],
                ['Green block', 'green'],
                ['Blue block', 'blue'],
                ['Yellow block', 'yellow'],
                ['Large block', 'large'],
                ['Small block', 'small'],
                ['Wall', 'wall'],
                ['Floor', 'floor']
            ],

            OBJECTS: [
                ['Door', 'door'],
                ['Double door', 'doubleDoor'],
                ['Barrel', 'barrel'],
                ['Crate', 'crate'],
                ['Lamp', 'lamp'],
                ['Road barrier', 'barrier'],
                ['Stairs', 'stairs'],
                ['Platform', 'platform']
            ],

            VEHICLES: [
                ['Car', 'car'],
                ['Truck', 'truck'],
                ['Off-road vehicle', 'offroad']
            ],

            CHARACTERS: [
                ['Enemy soldier', 'enemy'],
                ['Target dummy', 'target']
            ]
        };

        this.catalog.innerHTML = '';

        for (const [category, items] of Object.entries(categories)) {
            const heading = document.createElement('div');

            heading.className = 'rcg-title';
            heading.textContent = category;

            this.catalog.appendChild(heading);

            for (const [label, type] of items) {
                const button = document.createElement('button');

                button.className = 'rcg-button';
                button.textContent = label;

                button.addEventListener('click', () => {
                    this.spawnObject(type);
                });

                this.catalog.appendChild(button);
            }
        }
    }

    // ==================================
    // OBJECT CREATION
    // ==================================

    createMaterial(color) {
        return new THREE.MeshStandardMaterial({
            color,
            roughness: 0.8,
            metalness: 0.15
        });
    }

    createBox(type, size, color, position) {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(...size),
            this.createMaterial(color)
        );

        mesh.position.copy(position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        mesh.userData.rcg = {
            type,
            editable: true
        };

        this.scene.add(mesh);
        this.objects.push(mesh);

        return mesh;
    }

    spawnObject(type) {
        if (!this.active) return;

        const position = this.getSpawnPosition();

        let object;

        switch (type) {
            case 'concrete':
                object = this.createBox(type, [2, 2, 2], this.materials.concrete, position);
                break;

            case 'metal':
                object = this.createBox(type, [2, 2, 2], this.materials.metal, position);
                break;

            case 'wood':
                object = this.createBox(type, [2, 2, 2], this.materials.wood, position);
                break;

            case 'glass':
                object = this.createBox(type, [2, 2, 2], this.materials.glass, position);
                object.material.transparent = true;
                object.material.opacity = 0.55;
                break;

            case 'red':
                object = this.createBox(type, [2, 2, 2], this.materials.red, position);
                break;

            case 'green':
                object = this.createBox(type, [2, 2, 2], this.materials.green, position);
                break;

            case 'blue':
                object = this.createBox(type, [2, 2, 2], this.materials.blue, position);
                break;

            case 'yellow':
                object = this.createBox(type, [2, 2, 2], this.materials.yellow, position);
                break;

            case 'large':
                object = this.createBox(type, [5, 5, 5], 0x777777, position);
                break;

            case 'small':
                object = this.createBox(type, [0.5, 0.5, 0.5], 0x999999, position);
                break;

            case 'wall':
                object = this.createBox(type, [6, 4, 0.5], 0x666666, position);
                break;

            case 'floor':
                object = this.createBox(type, [6, 0.3, 6], 0x555555, position);
                break;

            case 'door':
                object = this.createDoor(position);
                break;

            case 'doubleDoor':
                object = this.createDoubleDoor(position);
                break;

            case 'barrel':
                object = this.createCylinder(position, 0.65, 1.3, 0x515b42, type);
                break;

            case 'crate':
                object = this.createBox(type, [1.5, 1.5, 1.5], 0x805b38, position);
                break;

            case 'lamp':
                object = this.createLamp(position);
                break;

            case 'barrier':
                object = this.createBox(type, [4, 1.2, 0.5], 0xd4a62e, position);
                break;

            case 'stairs':
                object = this.createStairs(position);
                break;

            case 'platform':
                object = this.createBox(type, [5, 0.5, 5], 0x56636b, position);
                break;

            case 'car':
                object = this.createVehicle(position, 'car');
                break;

            case 'truck':
                object = this.createVehicle(position, 'truck');
                break;

            case 'offroad':
                object = this.createVehicle(position, 'offroad');
                break;

            case 'enemy':
                object = this.createCharacter(position, false);
                break;

            case 'target':
                object = this.createCharacter(position, true);
                break;
        }

        if (object) {
            this.selectObject(object);
            this.status.textContent = `${type.toUpperCase()} CREATED`;
        }
    }

    getSpawnPosition() {
        const direction = new THREE.Vector3();

        this.camera.getWorldDirection(direction);

        return this.camera.position.clone()
            .addScaledVector(direction, 6);
    }

    createCylinder(position, radius, height, color, type) {
        const object = new THREE.Mesh(
            new THREE.CylinderGeometry(radius, radius, height, 16),
            this.createMaterial(color)
        );

        object.position.copy(position);
        object.castShadow = true;
        object.userData.rcg = { type };

        this.scene.add(object);
        this.objects.push(object);

        return object;
    }

    // ==================================
    // DOORS
    // ==================================

    createDoor(position) {
        const group = new THREE.Group();

        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 3, 0.2),
            this.createMaterial(0x20282d)
        );

        frame.position.y = 1.5;
        group.add(frame);

        const door = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 2.8, 0.12),
            this.createMaterial(0x765338)
        );

        door.position.set(0, 1.4, 0.15);
        group.add(door);

        group.position.copy(position);

        group.userData.rcg = {
            type: 'door',
            door,
            open: false,
            hinge: new THREE.Group()
        };

        this.scene.add(group);
        this.objects.push(group);

        return group;
    }

    createDoubleDoor(position) {
        const group = new THREE.Group();

        for (const side of [-1, 1]) {
            const door = new THREE.Mesh(
                new THREE.BoxGeometry(0.9, 2.8, 0.12),
                this.createMaterial(0x765338)
            );

            door.position.set(side * 0.45, 1.4, 0);
            door.userData.doorSide = side;

            group.add(door);
        }

        group.position.copy(position);

        group.userData.rcg = {
            type: 'doubleDoor',
            open: false
        };

        this.scene.add(group);
        this.objects.push(group);

        return group;
    }

    toggleDoor(object) {
        if (!object?.userData.rcg) return;

        const data = object.userData.rcg;

        if (data.type === 'door') {
            data.open = !data.open;

            data.door.rotation.y = data.open
                ? -Math.PI / 2
                : 0;
        }

        if (data.type === 'doubleDoor') {
            data.open = !data.open;

            for (const door of object.children) {
                if (!door.userData.doorSide) continue;

                door.rotation.y = data.open
                    ? door.userData.doorSide * Math.PI / 2
                    : 0;
            }
        }

        this.dispatch('doorchange', {
            object,
            open: data.open
        });
    }

    // ==================================
    // DECORATIONS
    // ==================================

    createLamp(position) {
        const group = new THREE.Group();

        const bulb = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0xffe4a0 })
        );

        bulb.position.y = 2.5;

        const light = new THREE.PointLight(0xffd58a, 2, 12);
        light.position.y = 2.5;

        group.add(bulb);
        group.add(light);

        group.position.copy(position);
        group.userData.rcg = { type: 'lamp' };

        this.scene.add(group);
        this.objects.push(group);

        return group;
    }

    createStairs(position) {
        const group = new THREE.Group();

        for (let i = 0; i < 5; i++) {
            const step = new THREE.Mesh(
                new THREE.BoxGeometry(3, 0.4, 1),
                this.createMaterial(0x747b80)
            );

            step.position.set(0, i * 0.4, i * -0.8);
            group.add(step);
        }

        group.position.copy(position);
        group.userData.rcg = { type: 'stairs' };

        this.scene.add(group);
        this.objects.push(group);

        return group;
    }

    // ==================================
    // CHARACTERS
    // ==================================

    createCharacter(position, target = false) {
        const group = new THREE.Group();

        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.7, 1, 0.4),
            this.createMaterial(target ? 0x3b8fbb : 0x394334)
        );

        body.position.y = 1.1;

        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.23, 12, 12),
            this.createMaterial(0xc09a7c)
        );

        head.position.y = 1.8;

        group.add(body, head);
        group.position.copy(position);

        group.userData.rcg = {
            type: target ? 'target' : 'enemy',
            health: 100,
            maxHealth: 100
        };

        this.scene.add(group);
        this.objects.push(group);

        if (!target) {
            this.enemies.push(group);
        }

        return group;
    }

    // ==================================
    // VEHICLES
    // ==================================

    createVehicle(position, type) {
        const group = new THREE.Group();

        const isTruck = type === 'truck';

        const body = new THREE.Mesh(
            new THREE.BoxGeometry(
                isTruck ? 2.5 : 1.9,
                isTruck ? 1 : 0.65,
                isTruck ? 4 : 3
            ),
            this.createMaterial(
                type === 'offroad' ? 0x465c39 : 0x334958
            )
        );

        body.position.y = 0.9;
        body.castShadow = true;

        group.add(body);

        const cabin = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 0.8, 1.4),
            this.createMaterial(0x28383f)
        );

        cabin.position.set(0, 1.55, -0.35);
        group.add(cabin);

        const wheels = [];

        for (const x of [-1, 1]) {
            for (const z of [-1, 1]) {
                const wheel = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.42, 0.42, 0.25, 12),
                    this.createMaterial(0x151515)
                );

                wheel.rotation.z = Math.PI / 2;
                wheel.position.set(x * 0.95, 0.45, z * 1.05);

                group.add(wheel);
                wheels.push(wheel);
            }
        }

        group.position.copy(position);

        group.userData.rcg = {
            type,
            velocity: 0,
            steering: 0,
            wheels,
            maxSpeed: type === 'truck' ? 12 : 20,
            acceleration: 9,
            friction: 4
        };

        this.scene.add(group);
        this.objects.push(group);
        this.vehicles.push(group);

        return group;
    }

    enterVehicle(vehicle) {
        if (this.driving) return;

        this.driving = vehicle;

        this.status.textContent = 'DRIVING: WASD / ARROWS';

        this.dispatch('vehicleenter', { vehicle });
    }

    exitVehicle() {
        if (!this.driving) return;

        const vehicle = this.driving;
        this.driving = null;

        this.dispatch('vehicleexit', { vehicle });
    }

    updateVehicles(delta) {
        for (const vehicle of this.vehicles) {
            const data = vehicle.userData.rcg;

            if (!data) continue;

            if (vehicle === this.driving) {
                if (this.keys.KeyW || this.keys.ArrowUp) {
                    data.velocity += data.acceleration * delta;
                }

                if (this.keys.KeyS || this.keys.ArrowDown) {
                    data.velocity -= data.acceleration * delta;
                }

                if (this.keys.KeyA || this.keys.ArrowLeft) {
                    data.steering = 1;
                } else if (this.keys.KeyD || this.keys.ArrowRight) {
                    data.steering = -1;
                } else {
                    data.steering = 0;
                }

                data.velocity = THREE.MathUtils.clamp(
                    data.velocity,
                    -data.maxSpeed * 0.4,
                    data.maxSpeed
                );

                vehicle.rotation.y +=
                    data.steering *
                    data.velocity *
                    0.025 *
                    delta;
            } else {
                data.velocity *= Math.max(0, 1 - data.friction * delta);
            }

            vehicle.translateZ(-data.velocity * delta);

            for (const wheel of data.wheels) {
                wheel.rotation.x += data.velocity * delta;
            }
        }
    }

    // ==================================
    // SELECTION
    // ==================================

    setupEvents() {
        this.root.addEventListener('click', event => {
            const button = event.target.closest('[data-action]');

            if (!button) return;

            this.handleAction(button.dataset.action);
        });

        this.renderer.domElement.addEventListener(
            'pointerdown',
            event => {
                if (!this.active) return;

                if (event.pointerType === 'mouse' && event.button !== 0) {
                    return;
                }

                this.selectFromPointer(event);
            }
        );

        window.addEventListener('keydown', event => {
            this.keys[event.code] = true;

            if (event.code === 'Escape' && this.driving) {
                this.exitVehicle();
            }

            if (event.code === 'Delete' || event.code === 'Backspace') {
                this.deleteSelected();
            }
        });

        window.addEventListener('keyup', event => {
            this.keys[event.code] = false;
        });
    }

    selectFromPointer(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();

        this.pointer.x =
            ((event.clientX - rect.left) / rect.width) * 2 - 1;

        this.pointer.y =
            -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.pointer, this.camera);

        const hits = this.raycaster.intersectObjects(
            this.objects,
            true
        );

        if (!hits.length) {
            this.selectObject(null);
            return;
        }

        let object = hits[0].object;

        while (object.parent && !object.userData.rcg) {
            object = object.parent;
        }

        if (!object.userData.rcg) return;

        const type = object.userData.rcg.type;

        if (type === 'door' || type === 'doubleDoor') {
            this.toggleDoor(object);
            this.selectObject(object);
            return;
        }

        if (this.vehicles.includes(object)) {
            this.selectObject(object);

            if (event.detail >= 2) {
                this.enterVehicle(object);
            }

            return;
        }

        this.selectObject(object);
    }

    selectObject(object) {
        this.selected = object;

        if (!object) {
            this.properties.textContent = 'Select an object.';
            return;
        }

        this.renderProperties();
    }

    // ==================================
    // PROPERTY PANEL
    // ==================================

    renderProperties() {
        const object = this.selected;

        if (!object) return;

        const position = object.position;
        const scale = object.scale;
        const rotation = object.rotation;

        this.properties.innerHTML = `
            <div class="rcg-title">
                ${object.userData.rcg.type.toUpperCase()}
            </div>

            <label class="rcg-label">POSITION X</label>
            <input class="rcg-input" data-property="x"
                type="number" step="0.5" value="${position.x.toFixed(2)}">

            <label class="rcg-label">POSITION Y</label>
            <input class="rcg-input" data-property="y"
                type="number" step="0.5" value="${position.y.toFixed(2)}">

            <label class="rcg-label">POSITION Z</label>
            <input class="rcg-input" data-property="z"
                type="number" step="0.5" value="${position.z.toFixed(2)}">

            <label class="rcg-label">SCALE</label>
            <input class="rcg-input" data-property="scale"
                type="number" min="0.1" max="20" step="0.1" value="${scale.x.toFixed(2)}">

            <label class="rcg-label">ROTATION</label>
            <input class="rcg-input" data-property="rotation"
                type="number" step="15" value="${THREE.MathUtils.radToDeg(rotation.y).toFixed(0)}">

            <button class="rcg-button" data-action="duplicate">
                DUPLICATE
            </button>

            <button class="rcg-button" data-action="move-away">
                MOVE AWAY
            </button>

            <button class="rcg-button" data-action="delete">
                DELETE OBJECT
            </button>

            <button class="rcg-button" data-action="drive">
                ENTER VEHICLE
            </button>
        `;

        this.properties.querySelectorAll('[data-property]')
            .forEach(input => {
                input.addEventListener('change', () => {
                    this.applyProperty(
                        input.dataset.property,
                        Number(input.value)
                    );
                });
            });
    }

    applyProperty(property, value) {
        const object = this.selected;

        if (!object || !Number.isFinite(value)) return;

        if (property === 'x' || property === 'y' || property === 'z') {
            object.position[property] = value;
        }

        if (property === 'scale') {
            const size = THREE.MathUtils.clamp(value, 0.1, 20);
            object.scale.setScalar(size);
        }

        if (property === 'rotation') {
            object.rotation.y = THREE.MathUtils.degToRad(value);
        }
    }

    // ==================================
    // ACTIONS
    // ==================================

    handleAction(action) {
        switch (action) {
            case 'menu':
                this.exitSandbox();
                break;

            case 'save':
                this.saveBuild();
                break;

            case 'load':
                this.loadBuild();
                break;

            case 'clear':
                this.clearObjects();
                break;

            case 'exit':
                this.exitSandbox();
                break;

            case 'delete':
                this.deleteSelected();
                break;

            case 'duplicate':
                this.duplicateSelected();
                break;

            case 'move-away':
                this.moveSelectedAway();
                break;

            case 'drive':
                if (this.selected && this.vehicles.includes(this.selected)) {
                    this.enterVehicle(this.selected);
                }
                break;
        }
    }

    deleteSelected() {
        if (!this.selected) return;

        const object = this.selected;

        this.scene.remove(object);

        this.objects = this.objects.filter(item => item !== object);
        this.vehicles = this.vehicles.filter(item => item !== object);
        this.enemies = this.enemies.filter(item => item !== object);

        this.selectObject(null);

        this.dispatch('objectdelete', { object });
    }

    duplicateSelected() {
        if (!this.selected) return;

        const clone = this.selected.clone(true);

        clone.position.x += 2;

        this.scene.add(clone);
        this.objects.push(clone);

        if (this.vehicles.includes(this.selected)) {
            this.vehicles.push(clone);
        }

        this.selectObject(clone);
    }

    moveSelectedAway() {
        if (!this.selected) return;

        const direction = new THREE.Vector3();

        this.camera.getWorldDirection(direction);

        this.selected.position.addScaledVector(direction, -3);

        this.renderProperties();
    }

    clearObjects() {
        if (!confirm('Delete all Sandbox objects?')) return;

        for (const object of [...this.objects]) {
            this.scene.remove(object);
        }

        this.objects = [];
        this.vehicles = [];
        this.enemies = [];

        this.selectObject(null);

        this.status.textContent = 'SANDBOX CLEARED';
    }

    // ==================================
    // SAVE / LOAD
    // ==================================

    saveBuild() {
        const data = this.objects.map(object => ({
            type: object.userData.rcg?.type || 'unknown',
            position: object.position.toArray(),
            rotation: object.rotation.toArray(),
            scale: object.scale.toArray()
        }));

        try {
            localStorage.setItem(
                'PROJECT_ZERO_SANDBOX',
                JSON.stringify(data)
            );

            this.status.textContent = 'BUILD SAVED';
        } catch (error) {
            this.status.textContent = 'SAVE FAILED';
            console.error(error);
        }
    }

    loadBuild() {
        const saved = localStorage.getItem('PROJECT_ZERO_SANDBOX');

        if (!saved) {
            this.status.textContent = 'NO SAVED BUILD';
            return;
        }

        try {
            const data = JSON.parse(saved);

            this.clearObjectsWithoutConfirm();

            for (const item of data) {
                this.spawnObject(item.type);

                const object = this.objects[this.objects.length - 1];

                if (!object) continue;

                object.position.fromArray(item.position);
                object.rotation.fromArray(item.rotation);
                object.scale.fromArray(item.scale);
            }

            this.selectObject(null);
            this.status.textContent = 'BUILD LOADED';
        } catch (error) {
            this.status.textContent = 'LOAD FAILED';
            console.error(error);
        }
    }

    clearObjectsWithoutConfirm() {
        for (const object of this.objects) {
            this.scene.remove(object);
        }

        this.objects = [];
        this.vehicles = [];
        this.enemies = [];
    }

    // ==================================
    // UPDATE
    // ==================================

    update(delta) {
        if (!this.active) return;

        if (this.driving) {
            this.updateVehicles(delta);
        } else {
            for (const vehicle of this.vehicles) {
                const data = vehicle.userData.rcg;

                if (Math.abs(data.velocity) > 0.01) {
                    data.velocity *= Math.max(
                        0,
                        1 - data.friction * delta
                    );
                }
            }
        }
    }

    // ==================================
    // MODE EXIT
    // ==================================

    exitSandbox() {
        this.active = false;
        this.layout.style.display = 'none';
        this.menu.style.display = 'flex';

        this.exitVehicle();

        this.dispatch('sandboxexit', {});
    }

    // ==================================
    // EVENTS FOR MAIN.JS
    // ==================================

    dispatch(name, detail) {
        window.dispatchEvent(
            new CustomEvent(`referencecg:${name}`, {
                detail
            })
        );
    }

    destroy() {
        this.clearObjectsWithoutConfirm();

        this.root.remove();
        this.style.remove();

        this.active = false;
    }
}
