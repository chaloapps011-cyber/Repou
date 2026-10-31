export class AmmoSystem {
    constructor() {
        this.magazineSize = 30;
        this.magazine = 30;
        this.reserve = 120;
        this.reloading = false;
        this.reloadTime = 1.8;

        this.createInterface();
        this.updateInterface();
    }

    shoot() {
        if (this.reloading) return false;
        if (this.magazine <= 0) return false;

        this.magazine--;
        this.updateInterface();

        return true;
    }

    reload() {
        if (this.reloading) return;
        if (this.magazine === this.magazineSize) return;
        if (this.reserve <= 0) return;

        this.reloading = true;
        this.updateInterface();

        setTimeout(() => {
            const needed = this.magazineSize - this.magazine;
            const amount = Math.min(needed, this.reserve);

            this.magazine += amount;
            this.reserve -= amount;

            this.reloading = false;
            this.updateInterface();
        }, this.reloadTime * 1000);
    }

    createInterface() {
        const style = document.createElement('style');

        style.textContent = `
            #ammo-panel {
                position: fixed;
                right: 20px;
                bottom: 135px;
                z-index: 30;
                color: white;
                font-family: Arial, sans-serif;
                font-size: 20px;
                font-weight: bold;
                text-shadow: 1px 2px 4px black;
                pointer-events: none;
            }
        `;

        document.head.appendChild(style);

        const panel = document.createElement('div');
        panel.id = 'ammo-panel';
        panel.textContent = '30 / 120';

        document.body.appendChild(panel);
    }

    updateInterface() {
        const panel = document.getElementById('ammo-panel');
        if (!panel) return;

        panel.textContent = this.reloading
            ? 'RELOADING...'
            : `${this.magazine} / ${this.reserve}`;
    }
}
