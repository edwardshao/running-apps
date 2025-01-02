class Settings {
    static CONFIG = {
        elements: {
            distance: { input: 'distance-input', preset: 'distance-preset' },
            time: {
                hours: 'time-input-hours',
                minutes: 'time-input-minutes',
                seconds: 'time-input-seconds'
            },
            pace: { minutes: 'pace-minutes', seconds: 'pace-seconds' }
        },
        presets: {
            marathon: 42.195,
            half: 21.0975,
            '10k': 10,
            '5k': 5
        },
        validation: {
            distance: { min: 0.0001 },
            time: {
                hours: { min: 0 },
                minutes: { min: 0, max: 59 },
                seconds: { min: 0, max: 59 }
            }
        }
    };

    static MESSAGES = {
        errors: {
            distance: '距離必須大於 0',
            time: '時間必須大於 0',
            invalid: '請輸入有效數值'
        }
    };
}

class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

class Calculator {
    static calculatePace(distance, totalSeconds) {
        const paceSeconds = totalSeconds / distance;
        return {
            minutes: Math.floor(paceSeconds / 60),
            seconds: Math.floor(paceSeconds % 60)
        };
    }

    static calculateTotalSeconds(hours, minutes, seconds) {
        return hours * 3600 + minutes * 60 + seconds;
    }
}

class UIController {
    #elements = {};

    constructor() {
        this.#initializeElements();
        this.#initializeEventListeners();
    }

    #initializeElements() {
        this.#elements = {
            distance: {
                input: document.getElementById(Settings.CONFIG.elements.distance.input),
                preset: document.getElementById(Settings.CONFIG.elements.distance.preset)
            },
            time: {
                hours: document.getElementById(Settings.CONFIG.elements.time.hours),
                minutes: document.getElementById(Settings.CONFIG.elements.time.minutes),
                seconds: document.getElementById(Settings.CONFIG.elements.time.seconds)
            },
            pace: {
                minutes: document.getElementById(Settings.CONFIG.elements.pace.minutes),
                seconds: document.getElementById(Settings.CONFIG.elements.pace.seconds)
            },
            error: document.getElementById('error-display')
        };
    }

    #initializeEventListeners() {
        this.#elements.distance.input.addEventListener('input', () => this.calculate());
        this.#elements.distance.preset.addEventListener('change', () => this.handlePresetChange());
        Object.values(this.#elements.time).forEach(element => {
            element.addEventListener('input', () => this.calculate());
        });
    }

    handlePresetChange() {
        const preset = this.#elements.distance.preset.value;
        const presetDistance = Settings.CONFIG.presets[preset];

        this.#elements.distance.input.value = presetDistance || '';
        this.#elements.distance.input.disabled = preset !== 'other';
        this.calculate();
    }

    calculate() {
        try {
            const values = this.#getInputValues();
            this.#validateInputs(values);

            const totalSeconds = Calculator.calculateTotalSeconds(
                values.time.hours,
                values.time.minutes,
                values.time.seconds
            );

            if (totalSeconds === 0) {
                throw new ValidationError(Settings.MESSAGES.errors.time);
            }

            const pace = Calculator.calculatePace(values.distance, totalSeconds);
            this.#updatePaceDisplay(pace);
            this.#hideError();
        } catch (error) {
            this.#showError(error.message);
        }
    }

    #getInputValues() {
        return {
            distance: parseFloat(this.#elements.distance.input.value),
            time: {
                hours: parseInt(this.#elements.time.hours.value) || 0,
                minutes: parseInt(this.#elements.time.minutes.value) || 0,
                seconds: parseInt(this.#elements.time.seconds.value) || 0
            }
        };
    }

    #validateInputs(values) {
        if (isNaN(values.distance) || values.distance < Settings.CONFIG.validation.distance.min) {
            throw new ValidationError(Settings.MESSAGES.errors.distance);
        }

        if (values.time.hours < 0 || values.time.minutes < 0 || values.time.seconds < 0) {
            throw new ValidationError(Settings.MESSAGES.errors.time);
        }
    }

    #updatePaceDisplay(pace) {
        this.#elements.pace.minutes.textContent = pace.minutes.toString().padStart(2, '0');
        this.#elements.pace.seconds.textContent = pace.seconds.toString().padStart(2, '0');
    }

    #showError(message) {
        this.#elements.error.textContent = message;
        this.#elements.error.classList.add('visible');
        // Reset pace display when error occurs
        this.#elements.pace.minutes.textContent = '-';
        this.#elements.pace.seconds.textContent = '-';
    }

    #hideError() {
        this.#elements.error.classList.remove('visible');
        this.#elements.error.textContent = '';
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    new UIController();
});