// Function to calculate pace from cadence and stride length
function calculatePace(cadence, stride) {
  const distancePerMinute = cadence * stride;
  const pace = 1000 / distancePerMinute;
  return pace;
}

// Function to calculate step frequency from pace and stride length
function calculateCadence(pace, stride) {
  const speedKmPerMinute = 1 / pace;
  const distancePerMinute = speedKmPerMinute * 1000;
  const stepFrequency = distancePerMinute / stride;
  return stepFrequency;
}

// Function to format pace into minutes and seconds
function formatPace(pace) {
  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);
  return {
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0')
  };
}

function updatePace() {
  const cadence = parseFloat(cadenceSlider.value);
  const stride = parseFloat(strideSlider.value);
  const pace = calculatePace(cadence, stride);

  paceSlider.value = pace.toFixed(3);
  const formatPaceString = formatPace(pace);
  paceInputMinutes.value = formatPaceString.minutes;
  paceInputSeconds.value = formatPaceString.seconds;
}

// DOM elements
const cadenceSlider = document.getElementById('cadence-slider');
const cadenceInput = document.getElementById('cadence-input');
const cadenceValue = document.getElementById('cadence-value');

const strideSlider = document.getElementById('stride-slider');
const strideInput = document.getElementById('stride-input');
const strideValue = document.getElementById('stride-value');

const paceSlider = document.getElementById('pace-slider');
const paceInputMinutes = document.getElementById('pace-input-minutes');
const paceInputSeconds = document.getElementById('pace-input-seconds');
const paceValue = document.getElementById('pace-value');

// Event listeners
cadenceSlider.addEventListener('input', () => {
  cadenceInput.value = cadenceSlider.value;
  updatePace();
});

cadenceInput.addEventListener('input', () => {
  cadenceSlider.value = cadenceInput.value;
  updatePace();
});

strideSlider.addEventListener('input', () => {
  strideInput.value = parseFloat(strideSlider.value).toFixed(2);
  updatePace();
});

strideInput.addEventListener('input', () => {
  strideSlider.value = strideInput.value;
  updatePace();
});

// Limit stride input to 2 decimal places
strideInput.addEventListener('blur', () => {
  strideInput.value = parseFloat(strideInput.value).toFixed(2);
});

paceSlider.addEventListener('input', () => {
  const pace = parseFloat(paceSlider.value);
  const stride = parseFloat(strideSlider.value);
  const cadence = Math.ceil(calculateCadence(pace, stride));

  cadenceSlider.value = cadence.toFixed(0);
  cadenceInput.value = cadence.toFixed(0);

  const formatPaceString = formatPace(pace);
  paceInputMinutes.value = formatPaceString.minutes;
  paceInputSeconds.value = formatPaceString.seconds;
});

paceInputMinutes.addEventListener('input', () => {
  const pace = parseFloat(paceInputMinutes.value) + parseFloat(paceInputSeconds.value) / 60;
  paceSlider.value = pace;

  const stride = parseFloat(strideSlider.value);
  const cadence = Math.ceil(calculateCadence(pace, stride));

  cadenceSlider.value = cadence.toFixed(0);
  cadenceInput.value = cadence.toFixed(0);
});

paceInputSeconds.addEventListener('input', () => {
  const pace = parseFloat(paceInputMinutes.value) + parseFloat(paceInputSeconds.value) / 60;
  paceSlider.value = pace;

  const stride = parseFloat(strideSlider.value);
  const cadence = Math.ceil(calculateCadence(pace, stride));

  cadenceSlider.value = cadence.toFixed(0);
  cadenceInput.value = cadence.toFixed(0);
});

// Initial update
updatePace();
