export class ObjectiveSystem {
    constructor() {
        this.objectives = [
            {
                id: 1,
                title: 'ENTER THE ABANDONED SECTOR',
                description: 'Explore the abandoned facility.',
                completed: false
            },
            {
                id: 2,
                title: 'ELIMINATE HOSTILES',
                description: 'Eliminate all hostile soldiers.',
                completed: false
            },
            {
                id: 3,
                title: 'SECURE THE AREA',
                description: 'Clear the entire sector.',
                completed: false
            }
        ];

        this.createInterface();
        this.updateInterface();
    }

    complete(id) {
        const objective = this.objectives.find(item => item.id === id);

        if (!objective || objective.completed) return;

        objective.completed = true;
        this.updateInterface();
    }

    checkEnemies(enemySystem) {
        const alive = enemySystem.enemies.filter(
            enemy => enemy.userData.alive
        );

        if (alive.length === 0) {
            this.complete(2);
            this.complete(3);
        }
    }

    createInterface() {
        const style = document.createElement('style');

        style.textContent = `
            #objective-panel {
                position: fixed;
                top: 105px;
                right: 20px;
                z-index: 30;
                width: 230px;
                color: white;
                font-family: Arial, sans-serif;
                font-size: 12px;
                text-shadow: 1px 2px 4px black;
                pointer-events: none;
            }

            .objective {
                margin-bottom: 10px;
                opacity: 0.75;
            }

            .objective.completed {
                color: #75d88a;
                opacity: 1;
            }
        `;

        document.head.appendChild(style);

        const panel = document.createElement('div');
        panel.id = 'objective-panel';

        document.body.appendChild(panel);
    }

    updateInterface() {
        const panel = document.getElementById('objective-panel');
        if (!panel) return;

        panel.innerHTML = this.objectives.map(objective => `
            <div class="objective ${objective.completed ? 'completed' : ''}">
                ${objective.completed ? '✓' : '○'}
                ${objective.title}
            </div>
        `).join('');
    }
}
