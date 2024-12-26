class Settings {
    static CONFIG = {
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

    static MESSAGES = {
        errors: {
            cadence: '步頻超出範圍 (Cadence out of range: 140-230)',
            stride: '步幅超出範圍 (Stride out of range: 0.1-2.0)',
            pace: '配速超出範圍 (Pace out of range: 01:00-09:59)',
            unexpected: '發生意外錯誤 (An unexpected error occurred)'
        }
    };
}

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

    static isValidNumber(value) {
        const num = Number(value);
        return !Number.isNaN(num) && Number.isFinite(num);
    }
}

class Calculator {
    static calculatePace(cadence, stride) {
        return 1000 / (cadence * stride);
    }

    static calculateCadence(pace, stride) {
        return Math.ceil((1000 / pace) / stride);
    }

    static paceToDecimal(minutes, seconds) {
        return minutes + seconds / 60;
    }

    static paceFromDecimal(pace) {
        const totalSeconds = Math.round(pace * 60);
        return {
            minutes: Math.floor(totalSeconds / 60),
            seconds: totalSeconds % 60
        };
    }

    static normalizeSeconds(current, previous) {
        let minutes = 0;
        let seconds = current;

        if (current > previous) {
            if (current > 59) {
                minutes = 1;
                seconds = 0;
            }
        } else if (current < 0) {
            minutes = -1;
            seconds = 59;
        }

        return { minutes, seconds };
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
                cadence: Utils.parseFloat(JSON.parse(localStorage.getItem('cadence')), Settings.CONFIG.defaults.cadence),
                stride: Utils.parseFloat(JSON.parse(localStorage.getItem('stride')), Settings.CONFIG.defaults.stride),
                pace: {
                    minutes: Utils.parseFloat(JSON.parse(localStorage.getItem('paceMinutes')), Settings.CONFIG.defaults.pace.minutes),
                    seconds: Utils.parseFloat(JSON.parse(localStorage.getItem('paceSeconds')), Settings.CONFIG.defaults.pace.seconds)
                }
            };
        } catch (error) {
            console.error('Failed to load state:', error);
            return Settings.CONFIG.defaults;
        }
    }
}

class EventHandler {
    #ui;
    #previousPaceSeconds = 0;

    constructor(ui) {
        this.#ui = ui;
    }

    handleCadenceChange(type) {
        try {
            const cadence = Utils.parseFloat(this.#ui.elements.cadence[type].value);
            const stride = Utils.parseFloat(this.#ui.elements.stride.slider.value);
            const pace = Calculator.calculatePace(cadence, stride);
            const { minutes, seconds } = Calculator.paceFromDecimal(pace);

            this.#ui.validateAndUpdate({ cadence, stride, minutes, seconds });
        } catch (error) {
            this.#ui.handleError(error);
        }
    }

    handleStrideChange(type) {
        try {
            const stride = Utils.parseFloat(this.#ui.elements.stride[type].value);
            const cadence = Utils.parseFloat(this.#ui.elements.cadence.slider.value);
            const pace = Calculator.calculatePace(cadence, stride);
            const { minutes, seconds } = Calculator.paceFromDecimal(pace);

            this.#ui.validateAndUpdate({ cadence, stride, minutes, seconds });
        } catch (error) {
            this.#ui.handleError(error);
        }
    }

    handlePaceSliderChange() {
        try {
            const pace = Utils.parseFloat(this.#ui.elements.pace.slider.value);
            const stride = Utils.parseFloat(this.#ui.elements.stride.slider.value);
            const { minutes, seconds } = Calculator.paceFromDecimal(pace);
            const cadence = Calculator.calculateCadence(pace, stride);

            this.#ui.validateAndUpdate({ cadence, stride, minutes, seconds });
        } catch (error) {
            this.#ui.handleError(error);
        }
    }

    handlePaceInputChange() {
        try {
            let minutes = Utils.parseFloat(this.#ui.elements.pace.minutes.value);
            let seconds = Utils.parseFloat(this.#ui.elements.pace.seconds.value);

            const { minutes: minutesAdjustment, seconds: normalizedSeconds } =
                Calculator.normalizeSeconds(seconds, this.#previousPaceSeconds);

            minutes += minutesAdjustment;
            seconds = normalizedSeconds;
            this.#previousPaceSeconds = seconds;

            const stride = Utils.parseFloat(this.#ui.elements.stride.slider.value);
            const pace = Calculator.paceToDecimal(minutes, seconds);
            const cadence = Calculator.calculateCadence(pace, stride);

            this.#ui.validateAndUpdate({ cadence, stride, minutes, seconds });
        } catch (error) {
            this.#ui.handleError(error);
        }
    }

    get previousPaceSeconds() {
        return this.#previousPaceSeconds;
    }

    set previousPaceSeconds(value) {
        this.#previousPaceSeconds = value;
    }
}

class UIController {
    #elements = {};
    #validators = {};
    #eventHandler;

    constructor() {
        this.#initializeElements();
        this.#initializeValidators();
        this.#eventHandler = new EventHandler(this);
        this.#initializeEventListeners();
    }

    get elements() {
        return this.#elements;
    }

    #initializeElements() {
        this.#elements = {
            cadence: {
                slider: Utils.getElement(Settings.CONFIG.elements.cadence.id.slider),
                input: Utils.getElement(Settings.CONFIG.elements.cadence.id.input)
            },
            stride: {
                slider: Utils.getElement(Settings.CONFIG.elements.stride.id.slider),
                input: Utils.getElement(Settings.CONFIG.elements.stride.id.input)
            },
            pace: {
                slider: Utils.getElement(Settings.CONFIG.elements.pace.id.slider),
                minutes: Utils.getElement(Settings.CONFIG.elements.pace.id.minutes),
                seconds: Utils.getElement(Settings.CONFIG.elements.pace.id.seconds)
            }
        };
    }

    #initializeValidators() {
        this.#validators = {
            cadence: (value) => value >= Settings.CONFIG.validation.cadence.min &&
                value <= Settings.CONFIG.validation.cadence.max,
            stride: (value) => value >= Settings.CONFIG.validation.stride.min &&
                value <= Settings.CONFIG.validation.stride.max,
            pace: {
                minutes: (value) => value >= Settings.CONFIG.validation.pace.minutes.min &&
                    value <= Settings.CONFIG.validation.pace.minutes.max,
                seconds: (value) => value >= Settings.CONFIG.validation.pace.seconds.min &&
                    value <= Settings.CONFIG.validation.pace.seconds.max
            }
        };
    }

    #initializeEventListeners() {
        this.#elements.cadence.slider.addEventListener('input',
            () => this.#eventHandler.handleCadenceChange('slider'));
        this.#elements.cadence.input.addEventListener('change',
            () => this.#eventHandler.handleCadenceChange('input'));

        this.#elements.stride.slider.addEventListener('input',
            () => this.#eventHandler.handleStrideChange('slider'));
        this.#elements.stride.input.addEventListener('change',
            () => this.#eventHandler.handleStrideChange('input'));

        this.#elements.pace.slider.addEventListener('input',
            () => this.#eventHandler.handlePaceSliderChange());
        ['minutes', 'seconds'].forEach(type => {
            this.#elements.pace[type].addEventListener('change',
                () => this.#eventHandler.handlePaceInputChange());
        });
    }

    validateAndUpdate(values) {
        const validation = this.#validateInputs(values);
        if (!validation.ok) {
            throw new ValidationError(validation.error);
        }

        const pace = Calculator.paceToDecimal(values.minutes, values.seconds);
        this.#updateValues(values.cadence, values.stride, pace);
        this.#saveState();
    }

    #validateInputs(values) {
        if (!this.#validators.cadence(values.cadence)) {
            return { ok: false, error: Settings.MESSAGES.errors.cadence };
        }
        if (!this.#validators.stride(values.stride)) {
            return { ok: false, error: Settings.MESSAGES.errors.stride };
        }
        if (!this.#validators.pace.minutes(values.minutes) || !this.#validators.pace.seconds(values.seconds)) {
            return { ok: false, error: Settings.MESSAGES.errors.pace };
        }
        return { ok: true };
    }

    #updateValues(cadence, stride, pace) {
        if (Utils.isValidNumber(cadence)) {
            this.#updateCadenceValues(cadence);
        }
        if (Utils.isValidNumber(stride)) {
            this.#updateStrideValues(stride);
        }
        if (Utils.isValidNumber(pace)) {
            this.#updatePaceValues(pace);
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
        const { minutes, seconds } = Calculator.paceFromDecimal(pace);
        this.#elements.pace.slider.value = pace.toFixed(3);
        this.#elements.pace.minutes.value = minutes;
        this.#elements.pace.seconds.value = seconds;
    }

    handleError(error) {
        const errorDisplay = document.getElementById('error-display');
        if (errorDisplay) {
            errorDisplay.textContent = error instanceof ValidationError ? error.message : Settings.MESSAGES.errors.unexpected;
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
            this.#updateValues(state.cadence, state.stride,
                Calculator.paceToDecimal(state.pace.minutes, state.pace.seconds));
            this.#eventHandler.previousPaceSeconds = state.pace.seconds;
        } catch (error) {
            this.handleError(error);
        }
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    const app = new UIController();
    app.loadState();
});
