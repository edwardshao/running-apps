// Configuration and Types
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
    },
    validation: {
        cadence: { min: 140, max: 230 },
        stride: { min: 0.1, max: 2.0 },
        pace: {
            minutes: { min: 1, max: 9 },
            seconds: { min: 0, max: 59 }
        }
    }
};

class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

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

class RunningCalculator {
    static calculatePace(cadence, stride) {
        return 1000 / (cadence * stride);
    }

    static calculateCadence(pace, stride) {
        return Math.ceil((1000 / pace) / stride);
    }

    static formatPace(pace) {
        const totalSeconds = Math.round(pace * 60);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return {
            minutes: minutes.toString().padStart(2, '0'),
            seconds: seconds.toString().padStart(2, '0')
        };
    }

    static parsePaceToDecimal(minutes, seconds) {
        return minutes + seconds / 60;
    }
}

class StateManager {
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
}

class UIController {
    #elements = {};
    #validators = {};

    constructor() {
        this.#initializeElements();
        this.#initializeValidators();
        this.#initializeEventListeners();
    }

    #initializeElements() {
        this.#elements = {
            cadence: {
                slider: Utils.getElement(CONFIG.elements.cadence.id.slider),
                input: Utils.getElement(CONFIG.elements.cadence.id.input)
            },
            stride: {
                slider: Utils.getElement(CONFIG.elements.stride.id.slider),
                input: Utils.getElement(CONFIG.elements.stride.id.input)
            },
            pace: {
                slider: Utils.getElement(CONFIG.elements.pace.id.slider),
                minutes: Utils.getElement(CONFIG.elements.pace.id.minutes),
                seconds: Utils.getElement(CONFIG.elements.pace.id.seconds)
            }
        };
    }

    #initializeValidators() {
        this.#validators = {
            cadence: (value) => value >= CONFIG.validation.cadence.min && value <= CONFIG.validation.cadence.max,
            stride: (value) => value >= CONFIG.validation.stride.min && value <= CONFIG.validation.stride.max,
            pace: {
                minutes: (value) => value >= CONFIG.validation.pace.minutes.min && value <= CONFIG.validation.pace.minutes.max,
                seconds: (value) => value >= CONFIG.validation.pace.seconds.min && value <= CONFIG.validation.pace.seconds.max
            }
        };
    }

    #initializeEventListeners() {
        // Cadence events
        this.#elements.cadence.slider.addEventListener('input', () => this.#handleCadenceChange('slider'));
        this.#elements.cadence.input.addEventListener('change', () => this.#handleCadenceChange('input'));

        // Stride events
        this.#elements.stride.slider.addEventListener('input', () => this.#handleStrideChange('slider'));
        this.#elements.stride.input.addEventListener('change', () => this.#handleStrideChange('input'));

        // Pace events
        this.#elements.pace.slider.addEventListener('input', () => this.#handlePaceSliderChange());
        ['minutes', 'seconds'].forEach(type => {
            this.#elements.pace[type].addEventListener('change', () => this.#handlePaceInputChange());
        });
    }

    #validateInputs(values) {
        if (!this.#validators.cadence(values.cadence)) {
            return { ok: false, error: '步頻超出範圍 (Cadence out of range: 140-230)' };
        }
        if (!this.#validators.stride(values.stride)) {
            return { ok: false, error: '步幅超出範圍 (Stride out of range: 0.1-2.0)' };
        }
        if (!this.#validators.pace.minutes(values.minutes) || !this.#validators.pace.seconds(values.seconds)) {
            return { ok: false, error: '配速超出範圍 (Pace out of range: 1:00-09:59)' };
        }
        return { ok: true };
    }

    #handleCadenceChange(type) {
        try {
            const cadence = Utils.parseFloat(this.#elements.cadence[type].value);
            const stride = Utils.parseFloat(this.#elements.stride.slider.value);
            const pace = RunningCalculator.calculatePace(cadence, stride);
            const { minutes, seconds } = RunningCalculator.formatPace(pace);

            const validation = this.#validateInputs({ cadence, stride, minutes: parseInt(minutes), seconds: parseInt(seconds) });
            if (!validation.ok) throw new ValidationError(validation.error);

            this.#updateCadenceValues(cadence);
            this.#updatePaceValues(pace);
            this.#saveState();
        } catch (error) {
            this.#handleError(error);
        }
    }

    #handleStrideChange(type) {
        try {
            const stride = Utils.parseFloat(this.#elements.stride[type].value);
            const cadence = Utils.parseFloat(this.#elements.cadence.slider.value);
            const pace = RunningCalculator.calculatePace(cadence, stride);
            const { minutes, seconds } = RunningCalculator.formatPace(pace);

            const validation = this.#validateInputs({ cadence, stride, minutes: parseInt(minutes), seconds: parseInt(seconds) });
            if (!validation.ok) throw new ValidationError(validation.error);

            this.#updateStrideValues(stride);
            this.#updatePaceValues(pace);
            this.#saveState();
        } catch (error) {
            this.#handleError(error);
        }
    }

    #handlePaceSliderChange() {
        try {
            const pace = Utils.parseFloat(this.#elements.pace.slider.value);
            const stride = Utils.parseFloat(this.#elements.stride.slider.value);
            const { minutes, seconds } = RunningCalculator.formatPace(pace);
            const cadence = Math.ceil(RunningCalculator.calculateCadence(pace, stride));

            const validation = this.#validateInputs({ cadence, stride, minutes: parseInt(minutes), seconds: parseInt(seconds) });
            if (!validation.ok) throw new ValidationError(validation.error);

            this.#updatePaceValues(pace);
            this.#updateCadenceValues(cadence);
            this.#saveState();
        } catch (error) {
            this.#handleError(error);
        }
    }

    #handlePaceInputChange() {
        try {
            const minutes = Utils.parseFloat(this.#elements.pace.minutes.value);
            const seconds = Utils.parseFloat(this.#elements.pace.seconds.value);
            const stride = Utils.parseFloat(this.#elements.stride.slider.value);
            const pace = RunningCalculator.parsePaceToDecimal(minutes, seconds);
            const cadence = Math.ceil(RunningCalculator.calculateCadence(pace, stride));

            const validation = this.#validateInputs({ cadence, stride, minutes: parseInt(minutes), seconds: parseInt(seconds) });
            if (!validation.ok) throw new ValidationError(validation.error);

            this.#updatePaceValues(pace);
            this.#updateCadenceValues(cadence);
            this.#saveState();
        } catch (error) {
            this.#handleError(error);
        }
    }

    #updateCadenceValues(cadence) {
        this.#elements.cadence.slider.value = cadence;
        this.#elements.cadence.input.value = cadence;
    }

    #updateStrideValues(stride) {
        this.#elements.stride.slider.value = stride.toFixed(2);
        this.#elements.stride.input.value = stride.toFixed(2);
    }

    #updatePaceValues(pace) {
        const { minutes, seconds } = RunningCalculator.formatPace(pace);
        this.#elements.pace.slider.value = pace.toFixed(3);
        this.#elements.pace.minutes.value = minutes;
        this.#elements.pace.seconds.value = seconds;
    }

    #handleError(error) {
        const errorDisplay = document.getElementById('error-display');
        if (errorDisplay) {
            errorDisplay.textContent = error instanceof ValidationError ? error.message : '發生意外錯誤 (An unexpected error occurred)';
            errorDisplay.classList.add('visible');
            setTimeout(() => {
                errorDisplay.classList.remove('visible');
                errorDisplay.textContent = '';
            }, 3000);
        }
        if (error instanceof ValidationError) {
            this.loadState();
        }
    }

    #saveState() {
        StateManager.save({
            cadence: this.#elements.cadence.input.value,
            stride: this.#elements.stride.input.value,
            paceMinutes: this.#elements.pace.minutes.value,
            paceSeconds: this.#elements.pace.seconds.value
        });
    }

    loadState(state = StateManager.load()) {
        try {
            this.#updateCadenceValues(state.cadence);
            this.#elements.stride.slider.value = state.stride;
            this.#elements.stride.input.value = state.stride;
            this.#elements.pace.minutes.value = state.pace.minutes;
            this.#elements.pace.seconds.value = state.pace.seconds;
            this.#elements.pace.slider.value = state.pace.minutes + (state.pace.seconds / 60);
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
