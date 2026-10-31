
export class WaveSystem {
    constructor(enemySystem) {
        this.enemySystem = enemySystem;

        this.wave = 1;
        this.maxWaves = 5;

        this.waitTime = 5;
        this.timer = 0;

        this.waiting = false;
        this.finished = false;

        this.baseHealth = 100;
        this.healthIncrease = 15;

        this.createUI();
        this.applyCurrentWaveHealth();
    }

    createUI() {
        this.element = document.createElement('div');

        this.element.style.cssText = `
            position: fixed;
            top: 55px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            font-family: Arial, sans-serif;
            font-size: 15px;
            font-weight: bold;
            text-shadow: 0 2px 5px black;
            z-index: 30;
            pointer-events: none;
            text-align: center;
        `;

        document.body.appendChild(this.element);
        this.updateUI();
    }

    getEnemyHealth() {
        return this.baseHealth +
            (this.wave - 1) * this.healthIncrease;
    }

    applyCurrentWaveHealth() {
        const health = this.getEnemyHealth();

        for (const enemy of this.enemySystem.enemies) {
            if (!enemy.userData.alive) continue;

            enemy.userData.health = health;
            enemy.userData.maxHealth = health;
        }
    }

    update(delta) {
        if (this.finished) return;

        if (!this.waiting) {
            if (this.enemySystem.enemies.length === 0) {
                if (this.wave >= this.maxWaves) {
                    this.finished = true;
                    this.element.textContent = 'ALL WAVES COMPLETED';
                    return;
                }

                this.waiting = true;
                this.timer = this.waitTime;
            }

            return;
        }

        this.timer -= delta;

        if (this.timer <= 0) {
            this.startNextWave();
        } else {
            this.updateUI();
        }
    }

    startNextWave() {
        this.wave++;
        this.waiting = false;

        const amount = this.wave + 2;
        const enemyHealth = this.getEnemyHealth();

        for (let i = 0; i < amount; i++) {
            const x = Math.random() * 70 - 35;
            const z = -30 - Math.random() * 35;

            const enemy = this.enemySystem.createEnemy(x, z);

            enemy.userData.health = enemyHealth;
            enemy.userData.maxHealth = enemyHealth;
        }

        this.updateUI();
    }

    updateUI() {
        if (this.waiting) {
            this.element.textContent =
                `WAVE ${this.wave} COMPLETED | NEXT IN ${Math.ceil(this.timer)}s`;
        } else {
            this.element.textContent =
                `WAVE ${this.wave} / ${this.maxWaves} | ENEMY HP: ${this.getEnemyHealth()}`;
        }
    }
}
