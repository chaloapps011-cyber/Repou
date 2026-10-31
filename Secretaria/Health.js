export class HealthSystem {
    constructor(maxHealth = 100) {
        this.maxHealth = maxHealth;
        this.health = maxHealth;
        this.alive = true;

        this.createInterface();
        this.updateInterface();
    }

    createInterface() {
        const style = document.createElement('style');

        style.textContent = `
            #health-panel {
                position: fixed;
                left: 20px;
                top: 55px;
                z-index: 30;
                color: white;
                font-family: Arial, sans-serif;
                text-shadow: 1px 2px 4px black;
                pointer-events: none;
            }

            #health-label {
                font-size: 13px;
                font-weight: bold;
                margin-bottom: 5px;
            }

            #health-bar {
                width: 150px;
                height: 10px;
                background: #222;
                border: 1px solid #aaa;
            }

            #health-fill {
                height: 100%;
                width: 100%;
                background: #50bd65;
                transition: width 0.2s;
            }

            #death-screen {
                display: none;
                position: fixed;
                inset: 0;
                z-index: 100;
                background: #000d;
                color: white;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                font-family: Arial, sans-serif;
            }

            #death-screen h1 {
                color: #c43b35;
                font-size: 38px;
            }
        `;

        document.head.appendChild(style);

        const panel = document.createElement('div');
        panel.id = 'health-panel';
        panel.innerHTML = `
            <div id="health-label">HEALTH: 100</div>
            <div id="health-bar">
                <div id="health-fill"></div>
            </div>
        `;

        document.body.appendChild(panel);

        const death = document.createElement('div');
        death.id = 'death-screen';
        death.innerHTML = `
            <h1>YOU DIED</h1>
            <p>PROJECT: ZERO</p>
        `;

        document.body.appendChild(death);
    }

    takeDamage(amount) {
        if (!this.alive) return;

        this.health = Math.max(0, this.health - amount);
        this.updateInterface();

        if (this.health <= 0) {
            this.alive = false;
            document.getElementById('death-screen').style.display = 'flex';
        }
    }

    heal(amount) {
        if (!this.alive) return;

        this.health = Math.min(
            this.maxHealth,
            this.health + amount
        );

        this.updateInterface();
    }

    updateInterface() {
        const label = document.getElementById('health-label');
        const fill = document.getElementById('health-fill');

        if (!label || !fill) return;

        label.textContent = `HEALTH: ${this.health}`;
        fill.style.width = `${this.health / this.maxHealth * 100}%`;

        fill.style.background =
            this.health > 50 ? '#50bd65' :
            this.health > 25 ? '#d6a33d' :
            '#c43b35';
    }
}
