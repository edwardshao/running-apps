// Constants and Types
const CONFIG = {
    elements: {
        cadence: { id: { slider: 'cadence-slider', input: 'cadence-input' } },
        stride: { id: { slider: 'stride-slider', input: 'stride-input' } },
        pace: { id: { slider: 'pace-slider', minutes: 'pace-input-minutes', seconds: 'pace-input-seconds' } }
    },
    defaults: {
        cadence: 180,
        stride: 0.9,
        pace: { minutes: 6, seconds: 10 }
    }
};

class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

// Enhanced Utils Class
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

    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
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
                    max: Utils.parseFloat(this.pace.minutes.getAttribute('max'), 9)
                },
                seconds: {
                    min: Utils.parseFloat(this.pace.seconds.getAttribute('min'), 0),
                    max: Utils.parseFloat(this.pace.seconds.getAttribute('max'), 59)
                }
            }
        };
    }
}

// Enhanced Calculator Class
class RunningCalculator {
    static calculatePace(cadence, stride) {
        if (cadence <= 0 || stride <= 0) {
            throw new ValidationError('Cadence and stride must be positive numbers');
        }
        return 1000 / (cadence * stride);
    }

    static calculateCadence(pace, stride) {
        if (pace <= 0 || stride <= 0) {
            throw new ValidationError('Pace and stride must be positive numbers');
        }
        return Math.ceil((1000 / pace) / stride);
    }

    static formatPace(pace) {
        if (pace <= 0) {
            throw new ValidationError('Pace must be a positive number');
        }
        const totalSeconds = Math.round(pace * 60);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return {
            minutes: minutes.toString().padStart(2, '0'),
            seconds: seconds.toString().padStart(2, '0')
        };
    }
}

// Enhanced State Management
class StateManager {
    static #STATE_KEYS = ['cadence', 'stride', 'paceMinutes', 'paceSeconds'];

    static save(state) {
        try {
            Object.entries(state).forEach(([key, value]) => {
                localStorage.setItem(key, JSON.stringify(value));
            });
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }

    static load() {
        try {
            return {
                cadence: Utils.parseFloat(JSON.parse(localStorage.getItem('cadence')), CONFIG.defaults.cadence),
                stride: Utils.parseFloat(JSON.parse(localStorage.getItem('stride')), CONFIG.defaults.stride),
                pace: {
                    minutes: Utils.parseFloat(JSON.parse(localStorage.getItem('paceMinutes')), CONFIG.defaults.pace.minutes),
                    seconds: Utils.parseFloat(JSON.parse(localStorage.getItem('paceSeconds')), CONFIG.defaults.pace.seconds)
                }
            };
        } catch (error) {
            console.error('Failed to load state:', error);
            return CONFIG.defaults;
        }
    }

    static clear() {
        this.#STATE_KEYS.forEach(key => localStorage.removeItem(key));
    }
}

// Enhanced UI Controller
class UIController {
    #dom;
    #errorDisplay;

    constructor() {
        this.#dom = new DOMElements();
        this.#errorDisplay = document.getElementById('error-display');
        this.#initializeEventListeners();
    }

    #showErrorMessage(message) {
        if (this.#errorDisplay) {
            this.#errorDisplay.textContent = message;
            this.#errorDisplay.classList.add('visible');
            // Auto-hide after 3 seconds
            setTimeout(() => {
                this.#hideErrorMessage();
            }, 3000);
        }
    }

    #hideErrorMessage() {
        if (this.#errorDisplay) {
            this.#errorDisplay.classList.remove('visible');
            this.#errorDisplay.textContent = '';
        }
    }

    #handleError(error) {
        if (error instanceof ValidationError) {
            this.#showErrorMessage(error.message);
            console.warn(error.message);
            this.loadState();
        } else {
            this.#showErrorMessage('發生意外錯誤 (An unexpected error occurred)');
            console.error('Unexpected error:', error);
        }
    }

    #initializeEventListeners() {
        // Event handler setup
        this.#setupCadenceEvents();
        this.#setupStrideEvents();
        this.#setupPaceEvents();
    }

    #setupCadenceEvents() {
        // For cadence slider
        this.#dom.cadence.slider.addEventListener('input', () => {
            try {
                const cadence = Utils.parseFloat(this.#dom.cadence.slider.value);

                // Get stride value and calculate pace
                const stride = Utils.parseFloat(this.#dom.stride.slider.value);
                const pace = RunningCalculator.calculatePace(cadence, stride);
                const { minutes, seconds } = RunningCalculator.formatPace(pace);

                const { ok, error } =
                    this.isValidInputsWithError(cadence, stride, parseInt(minutes), parseInt(seconds));

                if (!ok) {
                    throw new ValidationError(error);
                }

                this.#dom.cadence.input.value = cadence;
                this.updatePace(pace);
            } catch (error) {
                this.#handleError(error);
            }
        });

        // For cadence input
        this.#dom.cadence.input.addEventListener('change', () => {
            try {
                const cadence = Utils.parseFloat(this.#dom.cadence.input.value);

                // Get stride value and calculate pace
                const stride = Utils.parseFloat(this.#dom.stride.slider.value);
                const pace = RunningCalculator.calculatePace(cadence, stride);
                const { minutes, seconds } = RunningCalculator.formatPace(pace);

                const { ok, error } =
                    this.isValidInputsWithError(cadence, stride, parseInt(minutes), parseInt(seconds));

                if (!ok) {
                    throw new ValidationError(error);
                }

                this.#dom.cadence.slider.value = cadence;
                this.updatePace(pace);
            } catch (error) {
                this.#handleError(error);
            }
        });
    }

    #setupStrideEvents() {
        // For stride slider
        this.#dom.stride.slider.addEventListener('input', () => {
            try {
                const stride = Utils.parseFloat(this.#dom.stride.slider.value);

                // Get cadence value and calculate pace
                const cadence = Utils.parseFloat(this.#dom.cadence.slider.value);
                const pace = RunningCalculator.calculatePace(cadence, stride);
                const { minutes, seconds } = RunningCalculator.formatPace(pace);

                const { ok, error } =
                    this.isValidInputsWithError(cadence, stride, parseInt(minutes), parseInt(seconds));

                if (!ok) {
                    throw new ValidationError(error);
                }

                this.#dom.stride.input.value = stride.toFixed(2);
                this.updatePace(pace);
            } catch (error) {
                this.#handleError(error);
            }
        });

        // For stride input
        this.#dom.stride.input.addEventListener('change', () => {
            try {
                const stride = Utils.parseFloat(this.#dom.stride.input.value);

                // Get cadence value and calculate pace
                const cadence = Utils.parseFloat(this.#dom.cadence.slider.value);
                const pace = RunningCalculator.calculatePace(cadence, stride);
                const { minutes, seconds } = RunningCalculator.formatPace(pace);

                const { ok, error } =
                    this.isValidInputsWithError(cadence, stride, parseInt(minutes), parseInt(seconds));

                if (!ok) {
                    throw new ValidationError(error);
                }

                //  Limit stride input to 2 decimal places
                this.#dom.stride.input.value = stride.toFixed(2);

                this.#dom.stride.slider.value = stride;
                this.updatePace(pace);
            } catch (error) {
                this.#handleError(error);
            }
        });
    }

    #setupPaceEvents() {
        this.#dom.pace.slider.addEventListener('input', () => {
            try {
                const pace = Utils.parseFloat(this.#dom.pace.slider.value);
                const stride = Utils.parseFloat(this.#dom.stride.slider.value);
                const { minutes, seconds } = RunningCalculator.formatPace(pace);

                // calculate cadence
                const cadence = Math.ceil(RunningCalculator.calculateCadence(pace, stride));

                const { ok, error } =
                    this.isValidInputsWithError(cadence, stride, parseInt(minutes), parseInt(seconds));

                if (!ok) {
                    throw new ValidationError(error);
                }

                this.#dom.pace.minutes.value = minutes;
                this.#dom.pace.seconds.value = seconds;
                this.updateCadence(cadence);
            } catch (error) {
                this.#handleError(error);
            }
        });

        ['minutes', 'seconds'].forEach(type => {
            this.#dom.pace[type].addEventListener('change', () => {
                try {
                    const minutes = Utils.parseFloat(this.#dom.pace.minutes.value);
                    const seconds = Utils.parseFloat(this.#dom.pace.seconds.value);

                    // Get stride value and calculate cadence
                    const stride = Utils.parseFloat(this.#dom.stride.slider.value);
                    const pace = minutes + seconds / 60;
                    const cadence = Math.ceil(RunningCalculator.calculateCadence(pace, stride));

                    const { ok, error } =
                        this.isValidInputsWithError(cadence, stride, parseInt(minutes), parseInt(seconds));

                    if (!ok) {
                        throw new ValidationError(error);
                    }

                    this.#dom.pace.slider.value = pace;
                    this.updateCadence(cadence);
                } catch (error) {
                    this.#handleError(error);
                }
            });
        });
    }

    updatePace(pace) {
        this.#dom.pace.slider.value = pace.toFixed(3);
        const { minutes, seconds } = RunningCalculator.formatPace(pace);
        this.#dom.pace.minutes.value = minutes;
        this.#dom.pace.seconds.value = seconds;

        this.saveState();
    }

    updateCadence(cadence) {
        this.#dom.cadence.slider.value = cadence.toString();
        this.#dom.cadence.input.value = cadence.toString();

        this.saveState();
    }

    isValidCadence(cadence) {
        return cadence >= this.#dom.limits.cadence.min &&
            cadence <= this.#dom.limits.cadence.max;
    }

    isValidStride(stride) {
        return stride >= this.#dom.limits.stride.min &&
            stride <= this.#dom.limits.stride.max;
    }

    isValidPace(minutes, seconds) {
        return minutes >= this.#dom.limits.pace.minutes.min &&
            minutes <= this.#dom.limits.pace.minutes.max &&
            seconds >= this.#dom.limits.pace.seconds.min &&
            seconds <= this.#dom.limits.pace.seconds.max;
    }

    isValidInputsWithError(cadence, stride, minutes, seconds) {
        if (!this.isValidCadence(cadence)) {
            return {
                ok: false,
                error: '步頻超出範圍 (Cadence out of range: 140-230)'
            };
        }
        if (!this.isValidStride(stride)) {
            return {
                ok: false,
                error: '步幅超出範圍 (Stride out of range: 0.1-2.0)'
            };
        }
        if (!this.isValidPace(minutes, seconds)) {
            return {
                ok: false,
                error: '配速超出範圍 (Pace out of range: 1:00-09:59)'
            };
        }
        return {
            ok: true,
            error: ''
        };
    }

    saveState() {
        StateManager.save({
            cadence: this.#dom.cadence.input.value,
            stride: this.#dom.stride.input.value,
            paceMinutes: this.#dom.pace.minutes.value,
            paceSeconds: this.#dom.pace.seconds.value
        });
    }

    loadState(state = StateManager.load()) {
        try {
            this.#dom.cadence.slider.value = state.cadence;
            this.#dom.cadence.input.value = state.cadence;

            this.#dom.stride.slider.value = state.stride;
            this.#dom.stride.input.value = state.stride;

            this.#dom.pace.minutes.value = state.pace.minutes;
            this.#dom.pace.seconds.value = state.pace.seconds;

            const totalPace = state.pace.minutes + (state.pace.seconds / 60);
            this.#dom.pace.slider.value = totalPace;
        } catch (error) {
            this.#handleError(error);
        }
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    const app = new UIController();
    app.loadState();
});
