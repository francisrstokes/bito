const microcan = require('microcan-fp');

const w = 500;
const h = 500;

const lerp = (a, b, t) => a + (b - a) * t;
const mapRange = (fa, fb, ta, tb, x) => lerp(ta, tb, (x - fa) / (fb - fa));
const clamp = (min, max, x) => {
  if (x > max) return max;
  if (x < min) return min;
  return x;
};

const MIN_FREQ = 220;
const MAX_FREQ = 880;

const inputEl = document.getElementById('codeInput');
const canvas = document.getElementById('main');
const ctx = canvas.getContext('2d');

const audioCtx = new AudioContext();

const gainNode = audioCtx.createGain();
gainNode.connect(audioCtx.destination);

const oscillator = audioCtx.createOscillator();
oscillator.connect(gainNode);

oscillator.frequency.setValueAtTime(880.0, audioCtx.currentTime);
gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

oscillator.start();

// Inject math functions into global scope
Object.getOwnPropertyNames(Math).forEach(prop => {
  window[prop] = Math[prop];
});

// Inject the tone function
window.T = n => mapRange(MIN_FREQ, MAX_FREQ, -1, 1, clamp(MIN_FREQ, MAX_FREQ, 440 * (1.059463**n)));

if (location.hash) {
    inputEl.value = decodeURIComponent(location.hash.slice(1, 32));
}

// b is the bar number
// i is the index of the cell
// t is in seconds
// o is the offset in the bar (the beat)
//
// function should return a number from -1 to 1
// which maps to frequencies from 220Hz to 880Hz (A3 to A5)
let updateFn = new Function('b', 'i', 't', 'o', 'return ' + inputEl.value);

inputEl.addEventListener('keydown', e => {
  if (e.key === 'Backspace') {
    return true;
  }

  if (e.target.value.length === 32) {
    e.preventDefault();
    return false;
  }

  if (e.key === 'Enter') {
    updateFn = new Function('t', 'i', 'b', 'o', 'return ' + e.target.value);
    const escapedFn = encodeURIComponent(e.target.value);
    window.location.hash = escapedFn;
  }
});

const bars = 16;
const barSize = w / bars / 2;
const beatSize = barSize * 4;

const mc = microcan(ctx, [w, h]);
const rect = (size, position) => mc.drawShape(mc.rect(size, position));

let cellIndex = 0;
let i = 0;

const update = () => {
  mc.background([0, 0, 0, 1]);
  mc.noFill();
  mc.stroke([255, 255, 255, 1]);

  const currentBar = Math.floor(cellIndex / 4);
  const currentBeat = cellIndex % 4;

  for (let bar = 0; bar < bars; bar++) {
    const y = floor(bar / 2) * beatSize;

    mc.strokeWeight(6);
    rect([beatSize*4*0.99, beatSize*0.99], [beatSize*2, y+beatSize/2]);
    rect([beatSize*4*0.99, beatSize*0.99], [beatSize*6, y+beatSize/2]);

    mc.strokeWeight(0.5);
    for (let beat = 0; beat < 4; beat++) {
      const x = (bar % 2 === 0)
        ? beat * beatSize
        : beatSize * 4 + beat * beatSize;
      rect([beatSize, beatSize], [x+beatSize/2, y+beatSize/2]);

      if (bar === currentBar && beat === currentBeat) {
        mc.push();
        mc.strokeWeight(8);
        mc.stroke([0xff, 0x22, 0x44, 1]);
        rect([beatSize*0.4, beatSize*0.4], [x+beatSize/2, y+beatSize/2]);
        mc.pop();
      }
    }
  }

  if (i % 10 === 0) {
    let value;
    try {
      value = updateFn(audioCtx.currentTime, cellIndex, currentBar, currentBeat);
    } catch (e) {}

    if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
      value = 0;
    }

    const clamped = clamp(-1, 1, value);
    const freq = lerp(MIN_FREQ, MAX_FREQ, (clamped + 1) / 2);
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);

    cellIndex = (cellIndex + 1) % 64;
  }

  i++;

  requestAnimationFrame(update);
}

update();
