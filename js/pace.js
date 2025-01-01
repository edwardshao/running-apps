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

    const totalMinutes = timeHours * 60 + timeMinutes + timeSeconds / 60;

    const pace = totalMinutes / distance;

    const paceMinutes = Math.floor(pace);
    const paceSeconds = Math.floor((pace - paceMinutes) * 60);
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