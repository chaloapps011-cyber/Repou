
export class MobileControls {
    constructor() {
        this.moveX = 0;
        this.moveY = 0;
        this.lookX = 0;
        this.lookY = 0;
        this.shooting = false;
        this.sprinting = false;

        this.createInterface();
        this.setupJoystick();
        this.setupLook();
    }

    createInterface() {
        const style = document.createElement('style');

        style.textContent = `
            .mobile-controls {
                position: fixed;
                inset: 0;
                z-index: 20;
                pointer-events: none;
                user-select: none;
            }

            .joystick-zone {
                position: absolute;
                left: 25px;
                bottom: 35px;
                width: 140px;
                height: 140px;
                border-radius: 50%;
                background: #ffffff18;
                border: 2px solid #ffffff55;
                pointer-events: auto;
                touch-action: none;
            }

            .joystick-knob {
                position: absolute;
                width: 55px;
                height: 55px;
                left: 40px;
                top: 40px;
                border-radius: 50%;
                background: #c7d0d0aa;
                border: 2px solid white;
            }

            .look-zone {
                position: absolute;
                right: 0;
                top: 0;
                width: 58%;
                height: 75%;
                pointer-events: auto;
                touch-action: none;
            }

            .action-button {
                position: absolute;
                right: 25px;
                bottom: 45px;
                width: 75px;
                height: 75px;
                border-radius: 50%;
                border: 2px solid #ffffff88;
                background: #a33b32bb;
                color: white;
                font-size: 13px;
                font-weight: bold;
                pointer-events: auto;
                touch-action: none;
            }

            .sprint-button {
                position: absolute;
                right: 115px;
                bottom: 35px;
                width: 65px;
                height: 65px;
                border-radius: 50%;
                border: 2px solid #ffffff88;
                background: #ffffff22;
                color: white;
                font-size: 11px;
                pointer-events: auto;
                touch-action: none;
            }
        `;

        document.head.appendChild(style);

        this.ui = document.createElement('div');
        this.ui.className = 'mobile-controls';

        this.ui.innerHTML = `
            <div class="joystick-zone">
                <div class="joystick-knob"></div>
            </div>

            <div class="look-zone"></div>

            <button class="action-button">FIRE</button>
            <button class="sprint-button">RUN</button>
        `;

        document.body.appendChild(this.ui);
    }

    setupJoystick() {
        const zone = this.ui.querySelector('.joystick-zone');
        const knob = this.ui.querySelector('.joystick-knob');

        const radius = 45;
        let active = false;

        const update = e => {
            const rect = zone.getBoundingClientRect();

            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            let dx = e.clientX - centerX;
            let dy = e.clientY - centerY;

            const distance = Math.hypot(dx, dy);

            if (distance > radius) {
                dx = dx / distance * radius;
                dy = dy / distance * radius;
            }

            knob.style.transform = `translate(${dx}px, ${dy}px)`;

            this.moveX = dx / radius;
            this.moveY = dy / radius;
        };

        zone.addEventListener('pointerdown', e => {
            active = true;
            zone.setPointerCapture(e.pointerId);
            update(e);
        });

        zone.addEventListener('pointermove', e => {
            if (active) update(e);
        });

        const stop = () => {
            active = false;
            this.moveX = 0;
            this.moveY = 0;
            knob.style.transform = 'translate(0, 0)';
        };

        zone.addEventListener('pointerup', stop);
        zone.addEventListener('pointercancel', stop);
    }

    setupLook() {
        const zone = this.ui.querySelector('.look-zone');

        let active = false;
        let lastX = 0;
        let lastY = 0;

        zone.addEventListener('pointerdown', e => {
            active = true;
            zone.setPointerCapture(e.pointerId);
            lastX = e.clientX;
            lastY = e.clientY;
        });

        zone.addEventListener('pointermove', e => {
            if (!active) return;

            this.lookX += e.clientX - lastX;
            this.lookY += e.clientY - lastY;

            lastX = e.clientX;
            lastY = e.clientY;
        });

        const stop = () => active = false;

        zone.addEventListener('pointerup', stop);
        zone.addEventListener('pointercancel', stop);
    }

    getMove() {
        return {
            x: this.moveX,
            y: this.moveY
        };
    }
}
