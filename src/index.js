const microcan = require('microcan-fp');

// TODO
// buffered calculation? fixed BPM?
// Show indication when over 64 bytes (but don't block)

const w = 500;
const h = 500;

const canvas = document.getElementById('main');
const ctx = canvas.getContext('2d');
const mc = microcan(ctx, [w, h]);
const rect = (size, position) => mc.drawShape(mc.rect(size, position));
const circle = (r, position) => mc.drawEllipse(mc.circle(r, position));

mc.fill([255, 255, 255, 1]);
mc.noStroke();
ctx.font = '30px Courier';
const textSize = ctx.measureText('Click here to start');
ctx.fillText('Click here to start', (w - textSize.width)/2, (h - 15)/2);
canvas.addEventListener('click', run, { once: true });

function run() {
  const waveTypes = [
    'triangle',
    'square',
    'sawtooth',
    'sine'
  ];

  const inputEl = document.getElementById('codeInput');

  const audioCtx = new AudioContext();

  const gainNode = audioCtx.createGain();
  gainNode.connect(audioCtx.destination);

  const oscillator = audioCtx.createOscillator();
  oscillator.connect(gainNode);
  oscillator.type = waveTypes[0];

  oscillator.frequency.setValueAtTime(880.0, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

  oscillator.start();

  // Inject math functions into global scope
  Object.getOwnPropertyNames(Math).forEach(prop => {
    window[prop] = Math[prop];
  });

  // Inject the tone function
  window.T = (b, n) => b*(1.059463**n);

  if (location.hash) {
    inputEl.value = decodeURIComponent(location.hash.slice(1));
  }

  // b is the bar number
  // i is the index of the cell
  // t is in seconds
  // o is the offset in the bar (the beat)

  // function should return a number representing a frequency
  // Infinities change wave type, and NaN or anything else represents no sound
  let updateFn = new Function('b', 'i', 't', 'o', 'return ' + inputEl.value);

  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      updateFn = new Function('b', 'i', 't', 'o', 'return ' + e.target.value);
      const escapedFn = encodeURIComponent(e.target.value);
      window.location.hash = escapedFn;
    }
  });

  const bars = 16;
  const barSize = w / bars / 2;
  const beatSize = barSize * 4;

  let cellIndex = 0;
  let i = 0;
  let noNote = false;
  let waveTypeIndex = 0;
  let lastValue = 0;

  const update = () => {
    mc.background([0, 0, 0, 1]);
    mc.noFill();
    mc.stroke([255, 255, 255, 1]);

    const currentBar = Math.floor(cellIndex / 4);
    const currentBeat = cellIndex % 4;

    if (i % 10 === 0) {
      let value;
      try {
        value = updateFn(currentBar, cellIndex, audioCtx.currentTime, currentBeat);
      } catch (e) {
        value = NaN;
      }

      let skip = false;
      if (Number.isNaN(value) || typeof value !== 'number') {
        if (!noNote) {
          oscillator.disconnect(gainNode);
          noNote = true;
        }
        skip = true;
      }

      if (value === Infinity) {
        waveTypeIndex = (waveTypeIndex + 1) % waveTypes.length;
        oscillator.type = waveTypes[waveTypeIndex];
        skip = true;
      }

      if (value === -Infinity) {
        waveTypeIndex = waveTypeIndex - 1 === -1
          ? waveTypes.length - 1
          : waveTypeIndex - 1;
        oscillator.type = waveTypes[waveTypeIndex];
        skip = true;
      }

      if (!skip) {
        if (noNote) {
          oscillator.connect(gainNode);
          noNote = false;
        }

        const freq = value;
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
      }

      lastValue = value;
      cellIndex = (cellIndex + 1) % 64;
    }

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

          if (!Number.isNaN(lastValue)) {
            const c = lastValue > 0
              ? [255, 255, 255, 1]
              : [0xff, 0x22, 0x44, 1];
            let r = beatSize / 2;

            if (lastValue === Infinity) {
              mc.noFill();
              mc.strokeWeight(8);
              mc.stroke(c);
            } else if (lastValue === -Infinity) {
              mc.noFill();
              mc.strokeWeight(8);
              mc.stroke(c);
            } else {
              mc.noStroke();
              mc.fill(c);
              // r = Math.abs(lastValue) * beatSize / 2;
            }

            circle(r * 0.8, [x+beatSize/2, y+beatSize/2]);
            // rect([beatSize*0.4, beatSize*0.4], [x+beatSize/2, y+beatSize/2]);
          }

          mc.pop();
        }
      }
    }

    i++;

    requestAnimationFrame(update);
  }

  update();
}
