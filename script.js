// Constants
const CONFIG = {
    elements: {
        cadence: { id: { slider: 'cadence-slider', input: 'cadence-input' } },
        stride: { id: { slider: 'stride-slider', input: 'stride-input' } },
        pace: { id: { slider: 'pace-slider', minutes: 'pace-input-minutes', seconds: 'pace-input-seconds' } }
    },
    defaults: {
        cadence: 180,
        stride: 0.9,
        pace: { minutes: 5, seconds: 0 }
    }
};

// Utils Class
class Utils {
    static getElement(id) {
        const element = document.getElementById(id);
        if (!element) throw new Error(`Element with id ${id} not found`);
        return element;
    }

    static parseFloat(value, fallback = 0) {
        const parsed = Number.parseFloat(value);
        return Number.isNaN(parsed) ? fallback : parsed;
    }
}

// DOM Class
class DOMElements {
    constructor() {
        this.cadence = {
            slider: Utils.getElement(CONFIG.elements.cadence.id.slider),
            input: Utils.getElement(CONFIG.elements.cadence.id.input)
        };
        this.stride = {
            slider: Utils.getElement(CONFIG.elements.stride.id.slider),
            input: Utils.getElement(CONFIG.elements.stride.id.input)
        };
        this.pace = {
            slider: Utils.getElement(CONFIG.elements.pace.id.slider),
            minutes: Utils.getElement(CONFIG.elements.pace.id.minutes),
            seconds: Utils.getElement(CONFIG.elements.pace.id.seconds)
        };

        this.limits = this.initializeLimits();
    }

    initializeLimits() {
        return {
            cadence: {
                min: Utils.parseFloat(this.cadence.input.getAttribute('min'), 140),
                max: Utils.parseFloat(this.cadence.input.getAttribute('max'), 230)
            },
            stride: {
                min: Utils.parseFloat(this.stride.input.getAttribute('min'), 0.1),
                max: Utils.parseFloat(this.stride.input.getAttribute('max'), 2.0)
            },
            pace: {
                minutes: {
                    min: Utils.parseFloat(this.pace.minutes.getAttribute('min'), 1),
                    max: Utils.parseFloat(this.pace.minutes.getAttribute('max'), 10)
                },
                seconds: {
                    min: Utils.parseFloat(this.pace.seconds.getAttribute('min'), 0),
                    max: Utils.parseFloat(this.pace.seconds.getAttribute('max'), 59)
                }
            }
        };
    }
}

// Calculator Class
class RunningCalculator {
    static calculatePace(cadence, stride) {
        return 1000 / (cadence * stride);
    }

    static calculateCadence(pace, stride) {
        return (1000 / pace) / stride;
    }

    static formatPace(pace) {
        const minutes = Math.floor(pace);
        const seconds = Math.round((pace - minutes) * 60);
        return {
            minutes: minutes.toString().padStart(2, '0'),
            seconds: seconds.toString().padStart(2, '0')
        };
    }
}

// State Management Class
class StateManager {
    static save(state) {
        Object.entries(state).forEach(([key, value]) => {
            localStorage.setItem(key, JSON.stringify(value));
        });
    }

    static load() {
        return {
            cadence: Utils.parseFloat(JSON.parse(localStorage.getItem('cadence')), CONFIG.defaults.cadence),
            stride: Utils.parseFloat(JSON.parse(localStorage.getItem('stride')), CONFIG.defaults.stride),
            pace: {
                minutes: Utils.parseFloat(JSON.parse(localStorage.getItem('paceMinutes')), CONFIG.defaults.pace.minutes),
                seconds: Utils.parseFloat(JSON.parse(localStorage.getItem('paceSeconds')), CONFIG.defaults.pace.seconds)
            }
        };
    }
}

// UI Controller Class
class UIController {
    constructor() {
        this.dom = new DOMElements();
        this.initializeEventListeners();
    }

    updatePace() {
        const cadence = Utils.parseFloat(this.dom.cadence.slider.value);
        const stride = Utils.parseFloat(this.dom.stride.slider.value);
        const pace = RunningCalculator.calculatePace(cadence, stride);

        this.dom.pace.slider.value = pace.toFixed(3);
        const { minutes, seconds } = RunningCalculator.formatPace(pace);
        this.dom.pace.minutes.value = minutes;
        this.dom.pace.seconds.value = seconds;

        this.saveState();
    }

    updateCadence(pace, stride) {
        const cadence = Math.ceil(RunningCalculator.calculateCadence(pace, stride));
        if (this.isValidCadence(cadence)) {
            this.dom.cadence.slider.value = cadence.toString();
            this.dom.cadence.input.value = cadence.toString();
            this.saveState();
        }
    }

    isValidCadence(cadence) {
        return cadence >= this.dom.limits.cadence.min &&
            cadence <= this.dom.limits.cadence.max;
    }

    isValidStride(stride) {
        return stride >= this.dom.limits.stride.min &&
            stride <= this.dom.limits.stride.max;
    }

    isValidPace(minutes, seconds) {
        return minutes >= this.dom.limits.pace.minutes.min &&
            minutes <= this.dom.limits.pace.minutes.max &&
            seconds >= this.dom.limits.pace.seconds.min &&
            seconds <= this.dom.limits.pace.seconds.max;
    }

    initializeEventListeners() {
        // Cadence events
        ['slider', 'input'].forEach(type => {
            this.dom.cadence[type].addEventListener('input', () => {
                const value = Utils.parseFloat(this.dom.cadence[type].value);
                if (this.isValidCadence(value)) {
                    this.dom.cadence.slider.value = value;
                    this.dom.cadence.input.value = value;
                    this.updatePace();
                }
            });
        });

        // Stride events
        // For stride slider
        this.dom.stride.slider.addEventListener('input', () => {
            const value = Utils.parseFloat(this.dom.stride.slider.value);
            if (this.isValidStride(value)) {
                this.dom.stride.slider.value = value;
                this.dom.stride.input.value = value.toFixed(2);
                this.updatePace();
            }
        });

        // For stride input
        this.dom.stride.input.addEventListener('input', () => {
            const value = Utils.parseFloat(this.dom.stride.input.value);
            if (this.isValidStride(value)) {
                this.dom.stride.slider.value = value;
                this.updatePace();
            }
        });

        // Limit stride input to 2 decimal places
        this.dom.stride.input.addEventListener('blur', () => {
            const value = Utils.parseFloat(this.dom.stride.input.value);
            this.dom.stride.input.value = value.toFixed(2);
        });

        // Pace events
        this.dom.pace.slider.addEventListener('input', () => {
            const pace = Utils.parseFloat(this.dom.pace.slider.value);
            const stride = Utils.parseFloat(this.dom.stride.slider.value);
            const { minutes, seconds } = RunningCalculator.formatPace(pace);

            if (this.isValidPace(parseInt(minutes), parseInt(seconds))) {
                this.dom.pace.minutes.value = minutes;
                this.dom.pace.seconds.value = seconds;
                this.updateCadence(pace, stride);
            }
        });

        ['minutes', 'seconds'].forEach(type => {
            this.dom.pace[type].addEventListener('input', () => {
                const minutes = Utils.parseFloat(this.dom.pace.minutes.value);
                const seconds = Utils.parseFloat(this.dom.pace.seconds.value);

                if (this.isValidPace(minutes, seconds)) {
                    const pace = minutes + seconds / 60;
                    const stride = Utils.parseFloat(this.dom.stride.slider.value);
                    this.dom.pace.slider.value = pace;
                    this.updateCadence(pace, stride);
                }
            });
        });
    }

    saveState() {
        StateManager.save({
            cadence: this.dom.cadence.input.value,
            stride: this.dom.stride.input.value,
            paceMinutes: this.dom.pace.minutes.value,
            paceSeconds: this.dom.pace.seconds.value
        });
    }

    loadState() {
        const state = StateManager.load();

        this.dom.cadence.slider.value = state.cadence;
        this.dom.cadence.input.value = state.cadence;

        this.dom.stride.slider.value = state.stride;
        this.dom.stride.input.value = state.stride;

        this.dom.pace.minutes.value = state.pace.minutes;
        this.dom.pace.seconds.value = state.pace.seconds;

        const totalPace = state.pace.minutes + (state.pace.seconds / 60);
        this.dom.pace.slider.value = totalPace;

        this.updatePace();
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    const app = new UIController();
    app.loadState();
});
