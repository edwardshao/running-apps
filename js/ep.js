document.addEventListener('DOMContentLoaded', () => {
    const distanceInput = document.getElementById('distance-input');
    const gainInput = document.getElementById('gain-input');
    const hoursInput = document.getElementById('time-input-hours');
    const minutesInput = document.getElementById('time-input-minutes');
    const secondsInput = document.getElementById('time-input-seconds');
    const epResult = document.getElementById('ep-result');
    const ephResult = document.getElementById('eph-result');
    const paceResult = document.getElementById('pace-result');
    const errorDisplay = document.getElementById('error-display');
    const paceMinutes = document.getElementById('pace-minutes');
    const paceSeconds = document.getElementById('pace-seconds');

    function calculate() {
        const distance = parseFloat(distanceInput.value);
        const gain = parseFloat(gainInput.value);
        const hours = parseFloat(hoursInput.value) || 0;
        const minutes = parseFloat(minutesInput.value) || 0;
        const seconds = parseFloat(secondsInput.value) || 0;

        errorDisplay.classList.remove('visible');
        errorDisplay.textContent = '';

        if (isNaN(distance) || isNaN(gain) || distance <= 0 || gain < 0) {
            epResult.textContent = '-';
            ephResult.textContent = '-';
            paceResult.textContent = '-';
            if ((distanceInput.value && distance <= 0) || (gainInput.value && gain < 0)) {
                errorDisplay.textContent = 'Distance must be positive, and gain must not be negative.';
                errorDisplay.classList.add('visible');
            }
            return;
        }

        const ep = distance + (gain / 100);
        epResult.textContent = ep.toFixed(2);

        const totalHours = hours + (minutes / 60) + (seconds / 3600);

        if (totalHours > 0) {
            const eph = ep / totalHours;
            ephResult.textContent = eph.toFixed(2);

            // Calculate EPH to Pace
            const paceInSeconds = 3600 / eph;
            const minutes = Math.floor(paceInSeconds / 60);
            const seconds = Math.floor(paceInSeconds % 60);
            paceMinutes.textContent = minutes.toString().padStart(2, '0');
            paceSeconds.textContent = seconds.toString().padStart(2, '0');
        } else {
            ephResult.textContent = '-';
            paceMinutes.textContent = '-';
            paceSeconds.textContent = '-'; // Reset pace result if invalid
        }

        if (window.parent) {
            const height = document.body.scrollHeight + 20;
            window.parent.postMessage({ height: height }, '*');
        }
    }

    distanceInput.addEventListener('input', calculate);
    gainInput.addEventListener('input', calculate);
    hoursInput.addEventListener('input', calculate);
    minutesInput.addEventListener('input', calculate);
    secondsInput.addEventListener('input', calculate);

    const copyButton = document.getElementById('copy-button');
    copyButton.addEventListener('click', () => {
        const distance = distanceInput.value;
        const gain = gainInput.value;
        const hours = hoursInput.value || 0;
        const minutes = minutesInput.value || 0;
        const seconds = secondsInput.value || 0;

        const ep = epResult.textContent;
        const eph = ephResult.textContent;
        const paceMinutesText = paceMinutes.textContent;
        const paceSecondsText = paceSeconds.textContent;

        if (ep === '-' || eph === '-' || paceMinutesText === '-' || paceSecondsText === '-') {
            return; // Don't copy if there are no valid results
        }

        const resultText = `距離: ${distance} km
爬升: ${gain} m
時間: ${hours}h:${minutes}m:${seconds}s
EP: ${ep}
EPH: ${eph}
EPH to Pace: ${paceMinutesText}:${paceSecondsText} min/km`.trim(); // Format EPH to Pace

        navigator.clipboard.writeText(resultText)
            .then(() => {
                const originalButtonText = copyButton.textContent;
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = originalButtonText;
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
            });
    });
});