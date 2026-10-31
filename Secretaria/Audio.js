export class AudioSystem {
    constructor() {
        this.context = null;
        this.masterVolume = 0.5;
        this.enabled = true;
    }

    initialize() {
        if (this.context) return;

        const AudioContext =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContext) {
            this.enabled = false;
            return;
        }

        this.context = new AudioContext();
    }

    playTone(frequency, duration, volume = 0.3, type = 'square') {
        if (!this.enabled) return;

        this.initialize();
        if (!this.context) return;

        if (this.context.state === 'suspended') {
            this.context.resume();
        }

        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(
            frequency,
            this.context.currentTime
        );

        gain.gain.setValueAtTime(
            volume * this.masterVolume,
            this.context.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            this.context.currentTime + duration
        );

        oscillator.connect(gain);
        gain.connect(this.context.destination);

        oscillator.start();
        oscillator.stop(this.context.currentTime + duration);
    }

    gunshot() {
        this.playTone(90, 0.12, 0.8, 'sawtooth');
        this.playTone(45, 0.18, 0.5, 'square');
    }

    reload() {
        this.playTone(650, 0.06, 0.25, 'square');

        setTimeout(() => {
            this.playTone(420, 0.08, 0.25, 'square');
        }, 300);

        setTimeout(() => {
            this.playTone(800, 0.07, 0.25, 'square');
        }, 900);
    }

    hit() {
        this.playTone(180, 0.1, 0.35, 'triangle');
    }

    playerDamage() {
        this.playTone(70, 0.25, 0.6, 'sawtooth');
    }

    setVolume(value) {
        this.masterVolume = Math.max(0, Math.min(1, value));
    }

    toggle() {
        this.enabled = !this.enabled;
    }
}
