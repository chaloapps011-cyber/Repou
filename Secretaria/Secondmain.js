
import * as THREE from 'three';

export class SecondMain {
    constructor({
        scene,
        camera,
        renderer,
        player,
        enemies,
        health,
        waves
    }) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.player = player;
        this.enemies = enemies;
        this.health = health;
        this.waves = waves;

        this.started = false;
        this.paused = false;
        this.finished = false;

        this.particles = [];
        this.enemyAnimations = new Map();

        this.precision = 100;
        this.targetPrecision = 100;

        this.lastEnemyCount = enemies.enemies.length;

        this.settings = {
            particles: true,
            animations: true,
            dynamicAim: true,
            mobileOptimization: true,
            maxParticles: 100
        };

        this.createStyles();
        this.createInterface();
        this.createAim();
        this.optimizeGraphics();
        this.setupEvents();
    }

    // =========================
    // STYLES
    // =========================

    createStyles() {
        const style = document.createElement('style');

        style.textContent = `
            .pz-overlay {
                position: fixed;
                inset: 0;
                z-index: 100;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(3, 6, 9, .94);
                color: white;
                font-family: Arial, sans-serif;
                text-align: center;
            }

            .pz-panel {
                width: min(85%, 360px);
                padding: 28px;
                background: #101820;
                border: 1px solid #46535c;
                border-radius: 12px;
                box-shadow: 0 0 35px #000;
            }

            .pz-panel h1 {
                font-size: 27px;
                letter-spacing: 4px;
                margin-bottom: 8px;
            }

            .pz-panel p {
                color: #aab7c0;
                font-size: 12px;
                letter-spacing: 2px;
            }

            .pz-button {
                width: 100%;
                padding: 14px;
                margin-top: 12px;
                border: 1px solid #657780;
                background: #25343d;
                color: white;
                font-weight: bold;
                letter-spacing: 2px;
                border-radius: 5px;
            }

            .pz-button:active {
                background: #526873;
            }

            .pz-hidden {
                display: none !important;
            }

            #pz-aim {
                position: fixed;
                top: 50%;
                left: 50%;
                width: 24px;
                height: 24px;
                transform: translate(-50%, -50%);
                pointer-events: none;
                z-index: 25;
            }

            #pz-aim::before,
            #pz-aim::after {
                content: "";
                position: absolute;
                background: #fff;
                box-shadow: 0 0 4px #000;
            }

            #pz-aim::before {
                width: 2px;
                height: 100%;
                left: 11px;
            }

            #pz-aim::after {
                height: 2px;
                width: 100%;
                top: 11px;
            }

            #pz-precision {
                position: fixed;
                top: 88px;
                left: 50%;
                transform: translateX(-50%);
                color: white;
                font: bold 11px Arial;
                text-shadow: 0 2px 4px black;
                z-index: 25;
                pointer-events: none;
            }

            #pz-wave-status {
                position: fixed;
                top: 110px;
                left: 50%;
                transform: translateX(-50%);
                color: #d7e2e8;
                font: bold 11px Arial;
                text-shadow: 0 2px 4px black;
                z-index: 25;
                pointer-events: none;
            }
        `;

        document.head.appendChild(style);
    }

    // =========================
    // INTERFACE
    // =========================

    createInterface() {
        this.menu = document.createElement('div');
        this.menu.className = 'pz-overlay';

        this.menu.innerHTML = `
            <div class="pz-panel">
                <h1>PROJECT: ZERO</h1>
                <p>ABANDONED SECTOR</p>
                <button class="pz-button" id="pz-start">
                    START MISSION
                </button>
            </div>
        `;

        document.body.appendChild(this.menu);

        this.pauseMenu = document.createElement('div');
        this.pauseMenu.className = 'pz-overlay pz-hidden';

        this.pauseMenu.innerHTML = `
            <div class="pz-panel">
                <h1>PAUSED</h1>
                <p>MISSION SUSPENDED</p>
                <button class="pz-button" id="pz-resume">
                    RESUME
                </button>
                <button class="pz-button" id="pz-restart">
                    RESTART
                </button>
            </div>
        `;

        document.body.appendChild(this.pauseMenu);

        this.endMenu = document.createElement('div');
        this.endMenu.className = 'pz-overlay pz-hidden';

        this.endMenu.innerHTML = `
            <div class="pz-panel">
                <h1 id="pz-end-title">MISSION COMPLETE</h1>
                <p id="pz-end-description">
                    ABANDONED SECTOR
                </p>
                <button class="pz-button" id="pz-end-restart">
                    PLAY AGAIN
                </button>
            </div>
        `;

        document.body.appendChild(this.endMenu);

        this.waveStatus = document.createElement('div');
        this.waveStatus.id = 'pz-wave-status';
        document.body.appendChild(this.waveStatus);

        document.getElementById('pz-start').onclick = () => {
            this.start();
        };

        document.getElementById('pz-resume').onclick = () => {
            this.resume();
        };

        document.getElementById('pz-restart').onclick = () => {
            window.location.reload();
        };

        document.getElementById('pz-end-restart').onclick = () => {
            window.location.reload();
        };
    }

    // =========================
    // AIM SYSTEM
    // =========================

    createAim() {
        this.aim = document.createElement('div');
        this.aim.id = 'pz-aim';

        this.precisionUI = document.createElement('div');
        this.precisionUI.id = 'pz-precision';

        document.body.appendChild(this.aim);
        document.body.appendChild(this.precisionUI);

        this.updatePrecisionUI();
    }

    updateAim(delta) {
        if (!this.settings.dynamicAim) return;

        const moving = this.player.position.distanceTo(
            this.previousPlayerPosition || this.player.position
        );

        this.targetPrecision = moving > 0.01 ? 65 : 100;

        this.precision += (
            this.targetPrecision - this.precision
        ) * Math.min(delta * 5, 1);

        const spread = 24 + (100 - this.precision) * 0.3;

        this.aim.style.width = `${spread}px`;
        this.aim.style.height = `${spread}px`;

        this.updatePrecisionUI();

        this.previousPlayerPosition = this.player.position.clone();
    }

    updatePrecisionUI() {
        this.precisionUI.textContent =
            `AIM PRECISION: ${Math.round(this.precision)}%`;
    }

    // =========================
    // ENEMY ANIMATIONS
    // =========================

    animateEnemies(delta, elapsed) {
        if (!this.settings.animations) return;

        for (const enemy of this.enemies.enemies) {
            if (!enemy.userData.alive) continue;

            let animation = this.enemyAnimations.get(enemy);

            if (!animation) {
                animation = {
                    baseY: enemy.position.y,
                    phase: Math.random() * Math.PI * 2
                };

                this.enemyAnimations.set(enemy, animation);
            }

            const distance = enemy.position.distanceTo(
                this.player.position
            );

            const moving = distance > 2;

            animation.phase += delta * (moving ? 7 : 2);

            enemy.position.y =
                animation.baseY +
                Math.abs(Math.sin(animation.phase)) *
                (moving ? 0.06 : 0.015);

            if (moving) {
                enemy.rotation.z =
                    Math.sin(animation.phase) * 0.025;
            } else {
                enemy.rotation.z *= 0.9;
            }
        }
    }

    // =========================
    // PARTICLE SYSTEM
    // =========================

    createImpact(position, color = 0xffaa55) {
        if (!this.settings.particles) return;

        if (this.particles.length >= this.settings.maxParticles) {
            this.removeParticle(this.particles[0]);
        }

        const geometry = new THREE.SphereGeometry(0.045, 5, 5);

        const material = new THREE.MeshBasicMaterial({
            color,
            transparent: true
        });

        const particle = new THREE.Mesh(geometry, material);

        particle.position.copy(position);

        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 4,
            Math.random() * 3,
            (Math.random() - 0.5) * 4
        );

        this.scene.add(particle);

        this.particles.push({
            mesh: particle,
            velocity,
            life: 0.6
        });
    }

    updateParticles(delta) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];

            particle.life -= delta;

            particle.mesh.position.addScaledVector(
                particle.velocity,
                delta
            );

            particle.velocity.y -= 5 * delta;

            particle.mesh.material.opacity = Math.max(
                0,
                particle.life / 0.6
            );

            if (particle.life <= 0) {
                this.removeParticle(particle);
            }
        }
    }

    removeParticle(particle) {
        this.scene.remove(particle.mesh);

        particle.mesh.geometry.dispose();
        particle.mesh.material.dispose();

        this.particles = this.particles.filter(
            item => item !== particle
        );
    }

    // =========================
    // GRAPHICS OPTIMIZATION
    // =========================

    optimizeGraphics() {
        if (!this.renderer) return;

        if (this.settings.mobileOptimization) {
            const mobile = /Android|iPhone|iPad/i.test(
                navigator.userAgent
            );

            if (mobile) {
                this.renderer.setPixelRatio(
                    Math.min(window.devicePixelRatio, 1)
                );

                this.renderer.shadowMap.enabled = false;
                this.renderer.setSize(
                    window.innerWidth,
                    window.innerHeight
                );
            }
        }
    }

    // =========================
    // WAVE BALANCING
    // =========================

    getWaveDifficulty() {
        const wave = this.waves?.wave || 1;

        return {
            enemySpeed: 1.8 + (wave - 1) * 0.2,
            enemyDamage: 8 + (wave - 1) * 2,
            enemyHealth: 100 + (wave - 1) * 15
        };
    }

    updateWaveBalance() {
        const difficulty = this.getWaveDifficulty();

        this.waveStatus.textContent =
            `SECTOR WAVE ${this.waves?.wave || 1} | ` +
            `ENEMIES: ${this.enemies.enemies.length}`;

        return difficulty;
    }

    // =========================
    // MENU CONTROL
    // =========================

    start() {
        if (this.started) return;

        this.started = true;
        this.paused = false;

        this.menu.classList.add('pz-hidden');
    }

    pause() {
        if (!this.started || this.finished || this.paused) return;

        this.paused = true;
        this.pauseMenu.classList.remove('pz-hidden');
    }

    resume() {
        if (this.finished) return;

        this.paused = false;
        this.pauseMenu.classList.add('pz-hidden');
    }

    // =========================
    // VICTORY / DEFEAT
    // =========================

    showEndScreen(victory) {
        if (this.finished) return;

        this.finished = true;
        this.paused = false;

        const title = document.getElementById('pz-end-title');
        const description = document.getElementById(
            'pz-end-description'
        );

        title.textContent = victory
            ? 'MISSION COMPLETE'
            : 'MISSION FAILED';

        description.textContent = victory
            ? 'ALL WAVES CLEARED'
            : 'YOU WERE ELIMINATED';

        this.pauseMenu.classList.add('pz-hidden');
        this.endMenu.classList.remove('pz-hidden');
    }

    checkGameEnd() {
        if (!this.health.alive) {
            this.showEndScreen(false);
            return;
        }

        if (this.waves?.finished) {
            this.showEndScreen(true);
        }
    }

    // =========================
    // EVENTS
    // =========================

    setupEvents() {
        window.addEventListener('keydown', event => {
            if (event.code === 'Escape') {
                if (this.paused) {
                    this.resume();
                } else {
                    this.pause();
                }
            }
        });

        window.addEventListener('resize', () => {
            if (!this.renderer || !this.camera) return;

            this.camera.aspect =
                window.innerWidth / window.innerHeight;

            this.camera.updateProjectionMatrix();

            this.renderer.setSize(
                window.innerWidth,
                window.innerHeight
            );
        });
    }

    // =========================
    // UPDATE
    // =========================

    update(delta, elapsed = 0) {
        if (!this.started || this.paused || this.finished) return;

        this.animateEnemies(delta, elapsed);
        this.updateAim(delta);
        this.updateParticles(delta);
        this.updateWaveBalance();
        this.checkGameEnd();
    }

    destroy() {
        for (const particle of [...this.particles]) {
            this.removeParticle(particle);
        }

        this.menu.remove();
        this.pauseMenu.remove();
        this.endMenu.remove();
        this.aim.remove();
        this.precisionUI.remove();
        this.waveStatus.remove();
    }
}
