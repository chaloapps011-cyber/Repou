
import * as THREE from 'three';

/*
 PROJECT: ZERO
 MODE SYSTEM
 File: src/Mode.js

 Includes:
 - Sandbox
 - Object editor
 - Basic physics
 - Vehicles
 - Game modes
 - Teams
 - Objectives
 - Match timer
 - Survival waves
 - Training
 - Future multiplayer adapter
*/

export default class Mode {
    constructor({
        scene,
        camera,
        renderer,
        player = null,
        enemies = null,
        health = null,
        ammo = null,
        onModeChange = null
    }) {
        if (!scene || !camera || !renderer) {
            throw new Error('Mode: scene, camera and renderer are required.');
        }

        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.player = player;
        this.enemies = enemies;
        this.health = health;
        this.ammo = ammo;
        this.onModeChange = onModeChange;

        this.active = false;
        this.mode = null;
        this.paused = false;
        this.destroyed = false;

        this.objects = [];
        this.vehicles = [];
        this.physicsObjects = [];
        this.selected = null;

        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();

        this.gravity = 9.8;
        this.groundY = 0;

        this.match = {
            time: 0,
            duration: 300,
            score: 0,
            kills: 0,
            wave: 1,
            blue: 0,
            red: 0,
            objective: 0,
            finished: false
        };

        this.network = {
            connected: false,
            socket: null,
            room: null,
            players: new Map()
        };

        this.keys = {};
        this.createInterface();
        this.bindEvents();
    }

    // -----------------------------
    // INTERFACE
    // -----------------------------

    createInterface() {
        this.style = document.createElement('style');
        this.style.textContent = `
        #pz-mode-root {
            position:fixed;
            inset:0;
            z-index:900;
            pointer-events:none;
            color:white;
            font-family:Arial,sans-serif;
        }

        #pz-mode-root * { box-sizing:border-box; }

        .pz-panel {
            background:rgba(8,11,18,.94);
            border:1px solid #343b4c;
            border-radius:10px;
            padding:12px;
            pointer-events:auto;
        }

        #pz-mode-menu {
            position:absolute;
            inset:0;
            display:flex;
            align-items:center;
            justify-content:center;
            background:rgba(0,0,0,.78);
            pointer-events:auto;
            overflow:auto;
        }

        .pz-menu-content {
            width:min(94%,620px);
            max-height:92%;
            overflow:auto;
            padding:18px;
            background:#101522;
            border:1px solid #39445c;
            border-radius:14px;
        }

        .pz-title {
            font-size:25px;
            font-weight:900;
            letter-spacing:3px;
            margin-bottom:5px;
        }

        .pz-subtitle {
            color:#8c9bb5;
            font-size:12px;
            margin-bottom:16px;
        }

        .pz-mode-grid {
            display:grid;
            grid-template-columns:repeat(2,minmax(0,1fr));
            gap:9px;
        }

        .pz-button {
            padding:13px 8px;
            background:#1c2638;
            border:1px solid #394862;
            border-radius:8px;
            color:white;
            font-weight:bold;
            cursor:pointer;
            min-height:43px;
        }

        .pz-button:active { background:#394d70; }

        .pz-button.primary {
            background:#a32335;
            border-color:#e44a5e;
        }

        .pz-button.danger {
            background:#66212a;
        }

        #pz-sandbox-ui {
            display:none;
            position:absolute;
            inset:0;
            pointer-events:none;
        }

        #pz-top-menu {
            position:absolute;
            top:8px;
            left:50%;
            transform:translateX(-50%);
            width:min(95%,650px);
            display:flex;
            flex-wrap:wrap;
            gap:6px;
            justify-content:center;
            background:rgba(130,20,30,.94);
            padding:8px;
            border-radius:9px;
            pointer-events:auto;
        }

        #pz-catalog {
            position:absolute;
            left:8px;
            top:80px;
            bottom:10px;
            width:min(155px,36vw);
            overflow:auto;
            background:rgba(130,100,10,.94);
            border-radius:9px;
            padding:8px;
            pointer-events:auto;
        }

        #pz-properties {
            position:absolute;
            right:8px;
            top:80px;
            bottom:10px;
            width:min(175px,39vw);
            overflow:auto;
            background:rgba(10,105,65,.95);
            border-radius:9px;
            padding:8px;
            pointer-events:auto;
        }

        .pz-small {
            width:100%;
            margin:3px 0;
            padding:9px 5px;
            border:1px solid rgba(255,255,255,.2);
            background:rgba(0,0,0,.3);
            color:white;
            border-radius:6px;
            font-size:12px;
        }

        .pz-field {
            width:100%;
            margin:3px 0 8px;
            padding:7px;
            background:#101b19;
            color:white;
            border:1px solid #76b79b;
            border-radius:5px;
        }

        .pz-label {
            display:block;
            font-size:11px;
            margin-top:8px;
            color:#e3f5e9;
        }

        #pz-hud {
            position:absolute;
            top:10px;
            right:10px;
            background:rgba(0,0,0,.65);
            padding:9px;
            border-radius:7px;
            font-size:12px;
            pointer-events:none;
        }

        #pz-mode-root button,
        #pz-mode-root input {
            font:inherit;
        }

        @media(max-width:500px) {
            .pz-title {font-size:20px}
            .pz-mode-grid {grid-template-columns:1fr 1fr}
            #pz-catalog {width:31vw}
            #pz-properties {width:34vw}
        }
        `;

        document.head.appendChild(this.style);

        this.root = document.createElement('div');
        this.root.id = 'pz-mode-root';

        this.root.innerHTML = `
        <div id="pz-mode-menu">
            <div class="pz-menu-content">
                <div class="pz-title">PROJECT: ZERO</div>
                <div class="pz-subtitle">TACTICAL COMBAT SYSTEM</div>
                <div class="pz-mode-grid" id="pz-mode-grid"></div>
                <button class="pz-button" id="pz-close-menu"
                    style="width:100%;margin-top:12px">
                    FECHAR MENU
                </button>
            </div>
        </div>

        <div id="pz-sandbox-ui">
            <div id="pz-top-menu">
                <button class="pz-button" data-action="save">SALVAR</button>
                <button class="pz-button" data-action="load">CARREGAR</button>
                <button class="pz-button" data-action="duplicate">DUPLICAR</button>
                <button class="pz-button" data-action="delete">EXCLUIR</button>
                <button class="pz-button" data-action="exit">SAIR</button>
            </div>

            <div id="pz-catalog">
                <b>CATÁLOGO</b>
                <div id="pz-catalog-list"></div>
            </div>

            <div id="pz-properties">
                <b>PROPRIEDADES</b>
                <div id="pz-property-content">
                    Selecione um objeto.
                </div>
            </div>
        </div>

        <div id="pz-hud" style="display:none"></div>
        `;

        document.body.appendChild(this.root);

        this.menu = this.root.querySelector('#pz-mode-menu');
        this.grid = this.root.querySelector('#pz-mode-grid');
        this.sandboxUI = this.root.querySelector('#pz-sandbox-ui');
        this.catalog = this.root.querySelector('#pz-catalog-list');
        this.properties = this.root.querySelector('#pz-property-content');
        this.hud = this.root.querySelector('#pz-hud');

        this.createModeButtons();
        this.createCatalog();
    }

    createModeButtons() {
        const modes = [
            ['SANDBOX', 'Editor de mundo'],
            ['FREE MODE', 'Exploração livre'],
            ['TEAM FIGHT', 'Combate em equipes'],
            ['ELITE SQUAD', 'Combate de esquadrões'],
            ['TIME MODE', 'Partida cronometrada'],
            ['OBJECTIVE MODE', 'Conquiste objetivos'],
            ['SURVIVAL', 'Sobreviva às ondas'],
            ['TRAINING', 'Treinamento']
        ];

        for (const [name, description] of modes) {
            const button = document.createElement('button');
            button.className = 'pz-button';
            button.innerHTML = `<b>${name}</b><br><small>${description}</small>`;

            button.addEventListener('click', () => {
                this.startMode(name);
            });

            this.grid.appendChild(button);
        }

        this.root.querySelector('#pz-close-menu')
            .addEventListener('click', () => {
                this.menu.style.display = 'none';
            });
    }

    createCatalog() {
        const items = [
            ['BLOCK', 'Bloco'],
            ['WALL', 'Parede'],
            ['FLOOR', 'Piso'],
            ['DOOR', 'Porta'],
            ['BARREL', 'Barril'],
            ['CRATE', 'Caixa'],
            ['LAMP', 'Lâmpada'],
            ['BARRIER', 'Barreira'],
            ['STAIRS', 'Escada'],
            ['PLATFORM', 'Plataforma'],
            ['ENEMY', 'Inimigo'],
            ['TARGET', 'Alvo'],
            ['CAR', 'Carro'],
            ['TRUCK', 'Caminhão']
        ];

        for (const [type, label] of items) {
            const button = document.createElement('button');
            button.className = 'pz-small';
            button.textContent = '+ ' + label;
            button.addEventListener('click', () => this.spawnObject(type));
            this.catalog.appendChild(button);
        }
    }

    // -----------------------------
    // EVENTS
    // -----------------------------

    bindEvents() {
        this.onKeyDown = event => {
            this.keys[event.code] = true;

            if (event.code === 'Escape') {
                this.toggleMenu();
            }

            if (event.code === 'Delete') {
                this.deleteSelected();
            }

            if (event.code === 'KeyD' && event.shiftKey) {
                this.duplicateSelected();
            }
        };

        this.onKeyUp = event => {
            this.keys[event.code] = false;
        };

        this.onPointerDown = event => {
            if (!this.active || this.mode !== 'SANDBOX') return;

            if (event.target.closest('#pz-mode-root')) return;

            this.selectObject(event);
        };

        this.onTopClick = event => {
            const button = event.target.closest('[data-action]');
            if (!button) return;

            const action = button.dataset.action;

            if (action === 'save') this.saveBuild();
            if (action === 'load') this.loadBuild();
            if (action === 'duplicate') this.duplicateSelected();
            if (action === 'delete') this.deleteSelected();

            if (action === 'exit') {
                this.exitMode();
            }
        };

        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);

        this.renderer.domElement.addEventListener(
            'pointerdown',
            this.onPointerDown
        );

        this.root.querySelector('#pz-top-menu')
            .addEventListener('click', this.onTopClick);
    }

    toggleMenu() {
        if (this.mode === 'SANDBOX') return;
        this.menu.style.display =
            this.menu.style.display === 'none' ? 'flex' : 'none';
    }

    // -----------------------------
    // MODES
    // -----------------------------

    startMode(name) {
        if (this.destroyed) return;

        this.mode = name;
        this.active = true;
        this.paused = false;

        this.match = {
            time: 0,
            duration: name === 'TIME MODE' ? 180 : 300,
            score: 0,
            kills: 0,
            wave: 1,
            blue: 0,
            red: 0,
            objective: 0,
            finished: false
        };

        this.menu.style.display = 'none';

        const sandbox = name === 'SANDBOX';
        this.sandboxUI.style.display = sandbox ? 'block' : 'none';
        this.hud.style.display = sandbox ? 'none' : 'block';

        this.hud.textContent = name;

        if (name !== 'SANDBOX') {
            this.startMatchRules(name);
        }

        this.onModeChange?.(name);

        window.dispatchEvent(new CustomEvent(
            'projectzero:modechange',
            { detail: { mode: name } }
        ));
    }

    startMatchRules(name) {
        if (name === 'TEAM FIGHT') {
            this.match.duration = 300;
            this.match.blue = 0;
            this.match.red = 0;
        }

        if (name === 'ELITE SQUAD') {
            this.match.duration = 240;
        }

        if (name === 'TIME MODE') {
            this.match.duration = 180;
        }

        if (name === 'OBJECTIVE MODE') {
            this.match.objective = 0;
        }

        if (name === 'SURVIVAL') {
            this.match.wave = 1;
        }
    }

    exitMode() {
        this.active = false;
        this.paused = false;
        this.mode = null;

        this.sandboxUI.style.display = 'none';
        this.hud.style.display = 'none';
        this.menu.style.display = 'flex';

        this.onModeChange?.(null);
    }

    pause() {
        this.paused = true;
    }

    resume() {
        this.paused = false;
    }

    // -----------------------------
    // SANDBOX OBJECTS
    // -----------------------------

    spawnObject(type) {
        const object = this.createObject(type);
        if (!object) return;

        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);

        object.position.copy(this.camera.position)
            .add(direction.multiplyScalar(4));

        object.position.y = Math.max(
            object.position.y,
            this.groundY + 1
        );

        object.userData.pzType = type;
        object.userData.velocity = new THREE.Vector3();
        object.userData.dynamic = true;
        object.userData.mass = 1;
        object.userData.grounded = false;

        this.scene.add(object);
        this.objects.push(object);
        this.physicsObjects.push(object);

        this.select(object);
        return object;
    }

    createObject(type) {
        const material = color => new THREE.MeshStandardMaterial({
            color,
            roughness: 0.8
        });

        const box = (w, h, d, color) =>
            new THREE.Mesh(
                new THREE.BoxGeometry(w, h, d),
                material(color)
            );

        if (type === 'BLOCK') return box(1, 1, 1, 0x778899);
        if (type === 'WALL') return box(4, 3, .35, 0x68717c);
        if (type === 'FLOOR') return box(4, .2, 4, 0x555d66);
        if (type === 'BARREL') {
            return new THREE.Mesh(
                new THREE.CylinderGeometry(.5, .5, 1.2, 16),
                material(0x9a542b)
            );
        }

        if (type === 'CRATE') return box(1, 1, 1, 0x956b39);
        if (type === 'BARRIER') return box(2, .8, .5, 0xd0a42e);
        if (type === 'PLATFORM') return box(3, .3, 3, 0x66717f);

        if (type === 'LAMP') {
            const group = new THREE.Group();
            const pole = new THREE.Mesh(
                new THREE.CylinderGeometry(.06, .08, 3),
                material(0x333333)
            );
            pole.position.y = 1.5;

            const light = new THREE.PointLight(0xffdf9a, 5, 12);
            light.position.y = 3;

            const bulb = new THREE.Mesh(
                new THREE.SphereGeometry(.2, 12, 12),
                material(0xffdf9a)
            );
            bulb.position.y = 3;

            group.add(pole, light, bulb);
            return group;
        }

        if (type === 'DOOR') {
            const group = new THREE.Group();

            const frame = box(1.6, 2.8, .2, 0x443a31);
            const door = box(1.35, 2.6, .12, 0x865d3c);
            door.position.z = .12;
            door.userData.isDoor = true;

            const handle = new THREE.Mesh(
                new THREE.SphereGeometry(.06),
                material(0xd7b34c)
            );
            handle.position.set(.5, 0, .22);

            group.add(frame, door, handle);
            group.userData.door = door;
            group.userData.open = false;
            group.userData.toggleDoor = () => {
                group.userData.open = !group.userData.open;
                door.rotation.y = group.userData.open ? -1.5 : 0;
            };

            return group;
        }

        if (type === 'STAIRS') {
            const group = new THREE.Group();

            for (let i = 0; i < 5; i++) {
                const step = box(2, .3, .5, 0x777777);
                step.position.set(0, i * .3, i * -.5);
                group.add(step);
            }

            return group;
        }

        if (type === 'ENEMY' || type === 'TARGET') {
            const group = new THREE.Group();

            const body = new THREE.Mesh(
                new THREE.BoxGeometry(.65, 1.2, .35),
                material(type === 'ENEMY' ? 0x8e3030 : 0x339c73)
            );
            body.position.y = .9;

            const head = new THREE.Mesh(
                new THREE.SphereGeometry(.25, 12, 12),
                material(0xb58d70)
            );
            head.position.y = 1.65;

            group.add(body, head);
            group.userData.health = type === 'ENEMY' ? 100 : 1;
            group.userData.isTarget = true;

            return group;
        }

        if (type === 'CAR' || type === 'TRUCK') {
            const group = new THREE.Group();
            const truck = type === 'TRUCK';

            const chassis = box(
                truck ? 2.2 : 1.8,
                .5,
                truck ? 4 : 3,
                truck ? 0x9b3636 : 0x3470a6
            );
            chassis.position.y = .8;

            const cabin = box(
                truck ? 1.8 : 1.4,
                .8,
                truck ? 1.5 : 1.3,
                0x252e3a
            );
            cabin.position.set(0, 1.4, -.2);

            group.add(chassis, cabin);

            const wheels = [];

            for (const x of [-1, 1]) {
                for (const z of [-1.2, 1.2]) {
                    const wheel = new THREE.Mesh(
                        new THREE.CylinderGeometry(.35, .35, .2, 12),
                        material(0x151515)
                    );

                    wheel.rotation.z = Math.PI / 2;
                    wheel.position.set(x, .35, z);
                    group.add(wheel);
                    wheels.push(wheel);
                }
            }

            group.userData.isVehicle = true;
            group.userData.vehicleSpeed = 0;
            group.userData.wheels = wheels;
            group.userData.mass = 5;

            this.vehicles.push(group);
            return group;
        }

        return null;
    }

    // -----------------------------
    // SELECTION AND PROPERTIES
    // -----------------------------

    selectObject(event) {
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
            this.select(null);
            return;
        }

        let object = hits[0].object;

        while (object.parent && !this.objects.includes(object)) {
            object = object.parent;
        }

        if (object.userData.isDoor && object.parent?.userData.toggleDoor) {
            object.parent.userData.toggleDoor();
        }

        this.select(object);
    }

    select(object) {
        this.selected = object;

        if (!object) {
            this.properties.textContent = 'Selecione um objeto.';
            return;
        }

        this.renderProperties();
    }

    renderProperties() {
        const object = this.selected;
        if (!object) return;

        const field = (label, key, value) => `
            <label class="pz-label">${label}</label>
            <input class="pz-field" data-key="${key}"
                type="number" step="0.1" value="${value.toFixed(2)}">
        `;

        this.properties.innerHTML = `
            <b>${object.userData.pzType || 'OBJECT'}</b>

            ${field('Posição X','x',object.position.x)}
            ${field('Posição Y','y',object.position.y)}
            ${field('Posição Z','z',object.position.z)}

            ${field('Escala','scale',object.scale.x)}

            ${field('Rotação Y','rotation',object.rotation.y)}

            <button class="pz-small" data-property="freeze">
                ${object.userData.dynamic ? 'DESATIVAR FÍSICA' : 'ATIVAR FÍSICA'}
            </button>

            <button class="pz-small" data-property="duplicate">
                DUPLICAR OBJETO
            </button>

            <button class="pz-small" data-property="delete">
                EXCLUIR OBJETO
            </button>
        `;

        this.properties.querySelectorAll('[data-key]')
            .forEach(input => {
                input.addEventListener('change', () => {
                    if (!this.selected) return;

                    const value = Number(input.value);
                    if (!Number.isFinite(value)) return;

                    const key = input.dataset.key;

                    if (key === 'x' || key === 'y' || key === 'z') {
                        this.selected.position[key] = value;
                    }

                    if (key === 'scale') {
                        this.selected.scale.setScalar(
                            Math.max(.1, value)
                        );
                    }

                    if (key === 'rotation') {
                        this.selected.rotation.y = value;
                    }
                });
            });

        this.properties.querySelectorAll('[data-property]')
            .forEach(button => {
                button.addEventListener('click', () => {
                    const action = button.dataset.property;

                    if (action === 'freeze') {
                        object.userData.dynamic =
                            !object.userData.dynamic;
                    }

                    if (action === 'duplicate') {
                        this.duplicateSelected();
                    }

                    if (action === 'delete') {
                        this.deleteSelected();
                    }

                    this.renderProperties();
                });
            });
    }

    duplicateSelected() {
        if (!this.selected) return;

        const clone = this.selected.clone(true);

        clone.position.x += 1;
        clone.userData = {
            ...this.selected.userData,
            velocity: new THREE.Vector3(),
            dynamic: true
        };

        this.scene.add(clone);
        this.objects.push(clone);
        this.physicsObjects.push(clone);

        if (clone.userData.isVehicle) {
            this.vehicles.push(clone);
        }

        this.select(clone);
    }

    deleteSelected() {
        if (!this.selected) return;

        const object = this.selected;

        this.scene.remove(object);

        this.objects = this.objects.filter(item => item !== object);
        this.physicsObjects = this.physicsObjects.filter(
            item => item !== object
        );
        this.vehicles = this.vehicles.filter(item => item !== object);

        this.select(null);
    }

    // -----------------------------
    // BASIC PHYSICS
    // -----------------------------

    updatePhysics(delta) {
        const dt = Math.min(delta, .05);

        for (const object of this.physicsObjects) {
            if (!object.userData.dynamic) continue;

            const velocity = object.userData.velocity;

            if (!velocity) continue;

            velocity.y -= this.gravity * dt;
            object.position.y += velocity.y * dt;

            const bounds = new THREE.Box3().setFromObject(object);

            if (bounds.min.y < this.groundY) {
                object.position.y += this.groundY - bounds.min.y;
                velocity.y = 0;
                object.userData.grounded = true;
            } else {
                object.userData.grounded = false;
            }
        }

        this.resolveObjectStacking();
    }

    resolveObjectStacking() {
        for (let i = 0; i < this.physicsObjects.length; i++) {
            const a = this.physicsObjects[i];

            if (!a.userData.dynamic) continue;

            const boundsA = new THREE.Box3().setFromObject(a);

            for (let j = 0; j < this.physicsObjects.length; j++) {
                if (i === j) continue;

                const b = this.physicsObjects[j];
                const boundsB = new THREE.Box3().setFromObject(b);

                const overlapX =
                    boundsA.max.x > boundsB.min.x &&
                    boundsA.min.x < boundsB.max.x;

                const overlapZ =
                    boundsA.max.z > boundsB.min.z &&
                    boundsA.min.z < boundsB.max.z;

                const overlapY =
                    boundsA.max.y > boundsB.min.y &&
                    boundsA.min.y < boundsB.max.y;

                if (!overlapX || !overlapZ || !overlapY) continue;

                const aVelocity = a.userData.velocity;

                if (
                    aVelocity &&
                    aVelocity.y <= 0 &&
                    boundsA.min.y < boundsB.max.y
                ) {
                    const correction =
                        boundsB.max.y - boundsA.min.y;

                    a.position.y += correction;

                    aVelocity.y = 0;
                    a.userData.grounded = true;

                    boundsA.setFromObject(a);
                }
            }
        }
    }

    // -----------------------------
    // VEHICLES
    // -----------------------------

    updateVehicles(delta) {
        const dt = Math.min(delta, .05);

        for (const vehicle of this.vehicles) {
            if (!this.objects.includes(vehicle)) continue;

            const speed = vehicle.userData.vehicleSpeed || 0;

            if (this.keys.KeyW || this.keys.ArrowUp) {
                vehicle.userData.vehicleSpeed = Math.min(
                    speed + 8 * dt, 12
                );
            } else if (this.keys.KeyS || this.keys.ArrowDown) {
                vehicle.userData.vehicleSpeed = Math.max(
                    speed - 8 * dt, -5
                );
            } else {
                vehicle.userData.vehicleSpeed *= .97;
            }

            const steering =
                (this.keys.KeyA || this.keys.ArrowLeft ? 1 : 0) -
                (this.keys.KeyD || this.keys.ArrowRight ? 1 : 0);

            vehicle.rotation.y +=
                steering * vehicle.userData.vehicleSpeed * .035 * dt;

            const forward = new THREE.Vector3(0, 0, -1)
                .applyQuaternion(vehicle.quaternion);

            vehicle.position.addScaledVector(
                forward,
                vehicle.userData.vehicleSpeed * dt
            );

            for (const wheel of vehicle.userData.wheels || []) {
                wheel.rotation.x += vehicle.userData.vehicleSpeed * dt;
            }
        }
    }

    // -----------------------------
    // GAMEPLAY SYSTEMS
    // -----------------------------

    addKill(team = 'blue') {
        this.match.kills++;
        this.match.score += 100;

        if (this.mode === 'TEAM FIGHT') {
            if (team === 'blue') this.match.blue++;
            else this.match.red++;
        }

        this.updateHUD();
    }

    captureObjective() {
        this.match.objective++;
        this.match.score += 250;
        this.updateHUD();
    }

    nextWave() {
        if (this.mode !== 'SURVIVAL') return;

        this.match.wave++;
        this.match.score += 100;
        this.updateHUD();
    }

    updateHUD() {
        this.hud.textContent =
            `${this.mode} | SCORE ${this.match.score} | ` +
            `KILLS ${this.match.kills} | ` +
            `TIME ${Math.max(0, Math.ceil(
                this.match.duration - this.match.time
            ))} | WAVE ${this.match.wave} | ` +
            `BLUE ${this.match.blue} - RED ${this.match.red}`;
    }

    updateMatch(delta) {
        if (this.mode === 'SANDBOX') return;

        this.match.time += delta;
        this.updateHUD();

        if (
            this.match.time >= this.match.duration &&
            !this.match.finished
        ) {
            this.match.finished = true;
            this.finishMatch();
        }
    }

    finishMatch() {
        this.paused = true;

        const result = document.createElement('div');
        result.className = 'pz-panel';
        result.style.cssText = `
            position:absolute;
            top:50%;
            left:50%;
            transform:translate(-50%,-50%);
            text-align:center;
            min-width:220px;
            pointer-events:auto;
        `;

        result.innerHTML = `
            <h2>PARTIDA FINALIZADA</h2>
            <p>Modo: ${this.mode}</p>
            <p>Pontuação: ${this.match.score}</p>
            <p>Eliminações: ${this.match.kills}</p>
            <button class="pz-button primary">CONTINUAR</button>
        `;

        this.root.appendChild(result);

        result.querySelector('button').onclick = () => {
            result.remove();
            this.exitMode();
        };
    }

    // -----------------------------
    // BUILD SAVE / LOAD
    // -----------------------------

    saveBuild() {
        const data = this.objects.map(object => ({
            type: object.userData.pzType,
            position: object.position.toArray(),
            rotation: object.rotation.toArray(),
            scale: object.scale.toArray(),
            dynamic: object.userData.dynamic
        }));

        localStorage.setItem(
            'PROJECT_ZERO_SANDBOX',
            JSON.stringify(data)
        );

        this.showMessage('CONSTRUÇÃO SALVA');
    }

    loadBuild() {
        const raw = localStorage.getItem('PROJECT_ZERO_SANDBOX');

        if (!raw) {
            this.showMessage('NENHUMA CONSTRUÇÃO SALVA');
            return;
        }

        let data;

        try {
            data = JSON.parse(raw);
        } catch {
            this.showMessage('ARQUIVO DE CONSTRUÇÃO INVÁLIDO');
            return;
        }

        this.clearBuild();

        for (const item of data) {
            const object = this.createObject(item.type);
            if (!object) continue;

            object.position.fromArray(item.position);
            object.rotation.fromArray(item.rotation);
            object.scale.fromArray(item.scale);

            object.userData.pzType = item.type;
            object.userData.velocity = new THREE.Vector3();
            object.userData.dynamic = item.dynamic ?? true;

            this.scene.add(object);
            this.objects.push(object);
            this.physicsObjects.push(object);
        }

        this.showMessage('CONSTRUÇÃO CARREGADA');
    }

    clearBuild() {
        for (const object of this.objects) {
            this.scene.remove(object);
        }

        this.objects = [];
        this.physicsObjects = [];
        this.vehicles = [];
        this.select(null);
    }

    showMessage(message) {
        const previous = this.hud.textContent;
        this.hud.style.display = 'block';
        this.hud.textContent = message;

        setTimeout(() => {
            if (this.hud) {
                this.hud.textContent = previous;
            }
        }, 1800);
    }

    // -----------------------------
    // FUTURE MULTIPLAYER
    // -----------------------------

    async connectServer(url, room = 'PUBLIC') {
        if (this.network.socket) {
            this.network.socket.close();
        }

        return new Promise((resolve, reject) => {
            try {
                const socket = new WebSocket(url);

                this.network.socket = socket;
                this.network.room = room;

                socket.onopen = () => {
                    this.network.connected = true;

                    socket.send(JSON.stringify({
                        type: 'JOIN_ROOM',
                        room
                    }));

                    resolve(true);
                };

                socket.onmessage = event => {
                    this.handleNetworkMessage(event.data);
                };

                socket.onerror = () => {
                    this.network.connected = false;
                    reject(new Error('Falha na conexão com o servidor.'));
                };

                socket.onclose = () => {
                    this.network.connected = false;
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    handleNetworkMessage(raw) {
        let message;

        try {
            message = JSON.parse(raw);
        } catch {
            return;
        }

        if (message.type === 'PLAYER_LIST') {
            this.network.players.clear();

            for (const player of message.players || []) {
                this.network.players.set(player.id, player);
            }
        }

        if (message.type === 'PLAYER_JOINED') {
            this.network.players.set(message.player.id, message.player);
        }

        if (message.type === 'PLAYER_LEFT') {
            this.network.players.delete(message.id);
        }

        if (message.type === 'MATCH_STATE') {
            this.match = {
                ...this.match,
                ...message.state
            };
        }
    }

    sendNetwork(type, payload = {}) {
        const socket = this.network.socket;

        if (!socket || socket.readyState !== WebSocket.OPEN) {
            return false;
        }

        socket.send(JSON.stringify({
            type,
            room: this.network.room,
            payload
        }));

        return true;
    }

    disconnectServer() {
        if (this.network.socket) {
            this.network.socket.close();
            this.network.socket = null;
        }

        this.network.connected = false;
        this.network.players.clear();
    }

    // -----------------------------
    // UPDATE
    // -----------------------------

    update(delta) {
        if (!this.active || this.paused || this.destroyed) return;

        if (this.mode === 'SANDBOX') {
            this.updatePhysics(delta);
            this.updateVehicles(delta);
        } else {
            this.updateMatch(delta);
        }
    }

    destroy() {
        this.disconnectServer();

        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);

        this.renderer.domElement.removeEventListener(
            'pointerdown',
            this.onPointerDown
        );

        this.root?.remove();
        this.style?.remove();

        this.clearBuild();
        this.destroyed = true;
        this.active = false;
    }
}
