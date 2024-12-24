// Constants and DOM Elements
const DOM = {
    cadence: {
        slider: document.getElementById('cadence-slider'),
        input: document.getElementById('cadence-input')
    },
    stride: {
        slider: document.getElementById('stride-slider'),
        input: document.getElementById('stride-input')
    },
    pace: {
        slider: document.getElementById('pace-slider'),
        minutes: document.getElementById('pace-input-minutes'),
        seconds: document.getElementById('pace-input-seconds')
    }
};

// Input Constraints
const LIMITS = {
    cadence: {
        max: parseFloat(DOM.cadence.input.getAttribute('max')) || 220,
        min: parseFloat(DOM.cadence.input.getAttribute('min')) || 140
    },
    stride: {
        max: parseFloat(DOM.stride.input.getAttribute('max')) || 1.3,
        min: parseFloat(DOM.stride.input.getAttribute('min')) || 0.5
    },
    pace: {
        minutes: {
            max: parseFloat(DOM.pace.minutes.getAttribute('max')) || 10,
            min: parseFloat(DOM.pace.minutes.getAttribute('min')) || 3
        },
        seconds: {
            max: parseFloat(DOM.pace.seconds.getAttribute('max')) || 59,
            min: parseFloat(DOM.pace.seconds.getAttribute('min')) || 0
        }
    }
};

// Calculator Class
class RunningCalculator {
    static calculatePace(cadence, stride) {
        const distancePerMinute = cadence * stride;
        return 1000 / distancePerMinute;
    }

    static calculateCadence(pace, stride) {
        const speedKmPerMinute = 1 / pace;
        const distancePerMinute = speedKmPerMinute * 1000;
        return distancePerMinute / stride;
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

// State Management
class StateManager {
    static save(key, value) {
        localStorage.setItem(key, value);
    }

    static load() {
        return {
            cadence: localStorage.getItem('cadence') || 180,
            stride: localStorage.getItem('stride') || 0.9,
            paceMinutes: localStorage.getItem('paceMinutes') || 5,
            paceSeconds: localStorage.getItem('paceSeconds') || 0
        };
    }
}

// UI Controller
class UIController {
    static updatePace() {
        const cadence = parseFloat(DOM.cadence.slider.value);
        const stride = parseFloat(DOM.stride.slider.value);
        const pace = RunningCalculator.calculatePace(cadence, stride);

        DOM.pace.slider.value = pace.toFixed(3);
        const formatPaceString = RunningCalculator.formatPace(pace);
        DOM.pace.minutes.value = formatPaceString.minutes;
        DOM.pace.seconds.value = formatPaceString.seconds;
    }

    static isCalculatedCadenceValid(pace, stride) {
        const cadence = Math.ceil(RunningCalculator.calculateCadence(pace, stride));
        return cadence >= LIMITS.cadence.min && cadence <= LIMITS.cadence.max;
    }

    static updateCadence(pace, stride) {
        const cadence = Math.ceil(RunningCalculator.calculateCadence(pace, stride));
        DOM.cadence.slider.value = cadence.toFixed(0);
        DOM.cadence.input.value = cadence.toFixed(0);
    }

    static initializeEventListeners() {
        // Cadence events
        DOM.cadence.slider.addEventListener('input', () => {
            DOM.cadence.input.value = DOM.cadence.slider.value;
            UIController.updatePace();
            UIController.saveState();
        });

        DOM.cadence.input.addEventListener('input', () => {
            if (DOM.cadence.input.value > LIMITS.cadence.max ||
                DOM.cadence.input.value < LIMITS.cadence.min
            ) {
                return;
            }

            DOM.cadence.slider.value = DOM.cadence.input.value;
            UIController.updatePace();
            UIController.saveState();
        });

        // Stride events
        DOM.stride.slider.addEventListener('input', () => {
            DOM.stride.input.value = parseFloat(DOM.stride.slider.value).toFixed(2);
            UIController.updatePace();
            UIController.saveState();
        });

        DOM.stride.input.addEventListener('input', () => {
            if (DOM.stride.input.value > LIMITS.stride.max ||
                DOM.stride.input.value < LIMITS.stride.min
            ) {
                return;
            }
            DOM.stride.slider.value = DOM.stride.input.value;
            UIController.updatePace();
            UIController.saveState();
        });

        // Pace events
        DOM.pace.slider.addEventListener('input', () => {
            const pace = parseFloat(DOM.pace.slider.value);
            const stride = parseFloat(DOM.stride.slider.value);
            if (UIController.isCalculatedCadenceValid(pace, stride)) {
                UIController.updateCadence(pace, stride);
                const formatPaceString = RunningCalculator.formatPace(pace);
                DOM.pace.minutes.value = formatPaceString.minutes;
                DOM.pace.seconds.value = formatPaceString.seconds;
                UIController.saveState();
            }
        });

        ['minutes', 'seconds'].forEach(type => {
            DOM.pace[type].addEventListener('input', () => {
                if (DOM.pace.minutes.value > LIMITS.pace.minutes.max ||
                    DOM.pace.minutes.value < LIMITS.pace.minutes.min
                ) {
                    return;
                }

                if (DOM.pace.seconds.value > LIMITS.pace.seconds.max ||
                    DOM.pace.seconds.value < LIMITS.pace.seconds.min
                ) {
                    return;
                }

                const pace = parseFloat(DOM.pace.minutes.value) + parseFloat(DOM.pace.seconds.value) / 60;
                const stride = parseFloat(DOM.stride.slider.value);
                if (UIController.isCalculatedCadenceValid(pace, stride)) {
                    DOM.pace.slider.value = pace;
                    UIController.updateCadence(pace, parseFloat(DOM.stride.slider.value));
                    UIController.saveState();
                }
            });
        });
    }

    static saveState() {
        StateManager.save('cadence', DOM.cadence.input.value);
        StateManager.save('stride', DOM.stride.input.value);
        StateManager.save('paceMinutes', DOM.pace.minutes.value);
        StateManager.save('paceSeconds', DOM.pace.seconds.value);
    }

    static loadState() {
        const state = StateManager.load();

        DOM.cadence.slider.value = state.cadence;
        DOM.cadence.input.value = state.cadence;

        DOM.stride.slider.value = state.stride;
        DOM.stride.input.value = parseFloat(state.stride).toFixed(2);

        DOM.pace.minutes.value = state.paceMinutes;
        DOM.pace.seconds.value = state.paceSeconds;

        const totalPaceInMinutes = parseFloat(state.paceMinutes) + (parseFloat(state.paceSeconds) / 60);
        DOM.pace.slider.value = totalPaceInMinutes;

        UIController.updatePace();
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    UIController.loadState();
    UIController.initializeEventListeners();
});
