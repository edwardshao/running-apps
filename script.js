// Constants and DOM Elements
const DOM = {
    cadence: {
        slider: document.getElementById('cadence-slider'),
        input: document.getElementById('cadence-input'),
        value: document.getElementById('cadence-value')
    },
    stride: {
        slider: document.getElementById('stride-slider'),
        input: document.getElementById('stride-input'),
        value: document.getElementById('stride-value')
    },
    pace: {
        slider: document.getElementById('pace-slider'),
        minutes: document.getElementById('pace-input-minutes'),
        seconds: document.getElementById('pace-input-seconds'),
        value: document.getElementById('pace-value')
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
            DOM.stride.slider.value = DOM.stride.input.value;
            UIController.updatePace();
            UIController.saveState();
        });

        // Pace events
        DOM.pace.slider.addEventListener('input', () => {
            const pace = parseFloat(DOM.pace.slider.value);
            const stride = parseFloat(DOM.stride.slider.value);
            UIController.updateCadence(pace, stride);
            const formatPaceString = RunningCalculator.formatPace(pace);
            DOM.pace.minutes.value = formatPaceString.minutes;
            DOM.pace.seconds.value = formatPaceString.seconds;
            UIController.saveState();
        });

        ['minutes', 'seconds'].forEach(type => {
            DOM.pace[type].addEventListener('input', () => {
                const pace = parseFloat(DOM.pace.minutes.value) + parseFloat(DOM.pace.seconds.value) / 60;
                DOM.pace.slider.value = pace;
                UIController.updateCadence(pace, parseFloat(DOM.stride.slider.value));
                UIController.saveState();
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
