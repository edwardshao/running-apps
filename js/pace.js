const distanceInput = document.getElementById('distance-input');
const timeInputHours = document.getElementById('time-input-hours');
const timeInputMinutes = document.getElementById('time-input-minutes');
const timeInputSeconds = document.getElementById('time-input-seconds');
const paceMinutesText = document.getElementById('pace-minutes');
const paceSecondsText = document.getElementById('pace-seconds');

distanceInput.addEventListener('input', calculatePace);
timeInputHours.addEventListener('input', calculatePace);
timeInputMinutes.addEventListener('input', calculatePace);
timeInputSeconds.addEventListener('input', calculatePace);

function calculatePace() {
    const distance = parseFloat(distanceInput.value);
    const timeHours = parseInt(timeInputHours.value);
    const timeMinutes = parseInt(timeInputMinutes.value);
    const timeSeconds = parseInt(timeInputSeconds.value);

    // make sure all values are present
    if (isNaN(distance) || isNaN(timeHours) ||
        isNaN(timeMinutes) || isNaN(timeSeconds)) {
        paceMinutesText.textContent = '-';
        paceSecondsText.textContent = '-';
        return;
    }

    // make sure distance > 0
    if (distance <= 0) {
        paceMinutesText.textContent = '-';
        paceSecondsText.textContent = '-';
        return;
    }

    // make sure time values are positive and not all zero
    if (timeHours < 0 || timeMinutes < 0 || timeSeconds < 0 ||
        (timeHours == 0 && timeMinutes == 0 && timeSeconds == 0)) {
        paceMinutesText.textContent = '-';
        paceSecondsText.textContent = '-';
        return;
    }

    const totalSeconds = timeHours * 60 * 60 + timeMinutes * 60 + timeSeconds;
    const secondsPerKm = totalSeconds / distance;
    const paceMinutes = Math.floor(secondsPerKm / 60);
    const paceSeconds = Math.floor(secondsPerKm % 60);

    paceMinutesText.textContent = paceMinutes.toString().padStart(2, '0');
    paceSecondsText.textContent = paceSeconds.toString().padStart(2, '0');
}

function updateDistance(value) {
    const distanceInput = document.getElementById('distance-input');
    switch (value) {
        case 'marathon':
            distanceInput.value = 42.195;
            distanceInput.disabled = true;
            calculatePace();
            break;
        case 'half':
            distanceInput.value = 21.0975;
            distanceInput.disabled = true;
            calculatePace();
            break;
        case '10k':
            distanceInput.value = 10;
            distanceInput.disabled = true;
            calculatePace();
            break;
        case '5k':
            distanceInput.value = 5;
            distanceInput.disabled = true;
            calculatePace();
            break;
        default:
            distanceInput.value = '';
            distanceInput.disabled = false;
            calculatePace();
    }
}