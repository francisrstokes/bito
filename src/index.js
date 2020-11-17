const microcan = require('microcan-fp');

// TODO
// buffered calculation? fixed BPM?
// Show indication when over 64 bytes (but don't block)

const CHAR_LIMIT = 64;

const tutorial = [
  {
    code: '110 * (b+1)',
    lines: [
      'This function should always return a frequency',
      'That frequency can be calculated using the arguments',
      'b represents the bar number (0-15)'
    ]
  },
  {
    code: '110 + i',
    lines: [
      'i represents the cell index (0-127)'
    ]
  },
  {
    code: '220 + sin(t) * 440',
    lines: [
      't represents time in seconds since the page loaded'
    ]
  },
  {
    code: '[440,523.25,659.25,783.99][o]',
    lines: [
      'o represents the offset into the bar (0-3)',
      'You can think of this as the beat',
    ]
  },
  {
    code: 'sin(t) * cos(b + t) + tan(i) * 440',
    lines: [
      'All Math functions are available in the global scope'
    ]
  },
  {
    code: '[0,3,5,7].map(x => T(440, x))[(b + o) % 4]',
    lines: [
      'The T(base, f) function gives you notes n semitones',
      'from the freq n. Quick shortcut to musicality!',
    ]
  },
  {
    code: '[0,3,5,7].map(x => T(440, x))[(b + o) % 4]',
    lines: [
      'The T(base, f) function gives you notes n semitones',
      'from the freq n. Quick shortcut to musicality!',
    ]
  },
  {
    code: '[110, 220, 440, NaN][o]',
    lines: [
      'NaN and other non number values are pauses'
    ]
  },
  {
    code: '[110, 220, 440, 1/0][o]',
    lines: [
      'Infinity and -Infinity change the wave type'
    ]
  },
  {
    code: '[0,3,5,[-1,6,-7,7][b%4]].map(x=>T(440,x))[(b+o)%4]',
    lines: [
      'Try to keep it under 64 bytes, and happy hacking!'
    ]
  },
];

const w = 300;
const h = 300;

const canvas = document.getElementById('main');
const ctx = canvas.getContext('2d');
const mc = microcan(ctx, [w, h]);
const rect = (size, position) => mc.drawShape(mc.rect(size, position));
const circle = (r, position) => mc.drawEllipse(mc.circle(r, position));

mc.fill([255, 255, 255, 1]);
mc.noStroke();

const textH = Math.floor(w/20);
ctx.font = `${textH}px Courier`;
const textSize = ctx.measureText('Click here to start');
ctx.fillText('Click here to start', (w - textSize.width)/2, (h - textH)/2);
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

  window.addEventListener('blur', () => {
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  });

  window.addEventListener('focus', () => {
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
  });

  // b is the bar number
  // i is the index of the cell
  // t is in seconds
  // o is the offset in the bar (the beat)

  // function should return a number representing a frequency
  // Infinities change wave type, and NaN or anything else represents no sound
  let updateFn = new Function('b', 'i', 't', 'o', 'return ' + inputEl.value);

  const setBitoFunction = code => {
    waveTypeIndex = 0;
    oscillator.type = waveTypes[waveTypeIndex];
    updateFn = new Function('b', 'i', 't', 'o', 'return ' + code);
    const escapedFn = encodeURIComponent(code);
    window.location.hash = escapedFn;
    inputEl.value = code;
  }


  const commentEl = document.querySelector('.comment');
  let tutorialPointer = 0;
  canvas.addEventListener('click', () => {
    const tut = tutorial[tutorialPointer];
    setBitoFunction(tut.code);
    commentEl.innerHTML = tut.lines.map(line => (
      `<div class="comment-line">${line}</div>`
    )).join('');
    tutorialPointer = (tutorialPointer + 1) % tutorial.length;
  });


  // Inject math functions into global scope
  Object.getOwnPropertyNames(Math).forEach(prop => {
    window[prop] = Math[prop];
  });

  // Inject the tone function
  window.T = (b, n) => b*(1.059463**n);

  if (location.hash) {
    inputEl.value = decodeURIComponent(location.hash.slice(1));
  }

  const inputClasses = inputEl.classList;
  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      setBitoFunction(e.target.value);
    }

    console.log(e.target.value.length);
    if (e.target.value.length > CHAR_LIMIT) {
      inputClasses.add('over-limit');
    } else {
      inputClasses.remove('over-limit');
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
    mc.stroke([0, 0, 0, 1]);

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

    let orderCount = 0;
    for (let bar = 0; bar < bars; bar++) {
      const y = floor(bar / 2) * beatSize;

      mc.push();
      mc.noStroke();
      if (bar === 0) {
        mc.fill([0xff, 0x22, 0x44, 0.2]);
      } else {
        if (orderCount < 2) {
          mc.fill([2555, 255, 255, 0.2]);
        } else {
          mc.fill([0xff, 0x22, 0x44, 0.2]);
        }
        orderCount = (orderCount + 1) % 4;
      }
      const xPos = bar % 2 === 0 ? beatSize*2 : beatSize*6;
      rect([beatSize*4, beatSize], [xPos, y+beatSize/2])
      mc.pop();

      mc.strokeWeight(2);
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
            let r = beatSize / 2 / 2;
            if (currentBeat === 0) {
              r *= 1.5;
            }

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
            }

            circle(r, [x+beatSize/2, y+beatSize/2]);
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
