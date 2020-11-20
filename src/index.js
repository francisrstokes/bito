const microcan = require('microcan-fp');

const CHAR_LIMIT = 64;
const MAX_VOLUME = 0.1;

const inputEl = document.getElementById('codeInput');
const bpmDisplayEl = document.getElementById('bpmDisplay');
const attackEl = document.getElementById('attackSlider');
const decayEl = document.getElementById('decaySlider');
let targetBPM = Number(bpmDisplayEl.innerText);
let isMuted = false;
let mouseInCanvas = false;

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
  {
    code: "T(440,'7_235_320_037_532_235_7_3_0_0'.split('')[i%32])",
    lines: [
      'Tetris (54 bytes)'
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

const textH = Math.floor(w/15);
ctx.font = `${textH}px Inconsolata`;
const textSize = ctx.measureText('Click here to start');
ctx.fillText('Click here to start', (w - textSize.width)/2, (h - textH)/2);
canvas.addEventListener('click', run, { once: true });

const checkForCharLimit = () => {
  if (inputEl.value.length > CHAR_LIMIT) {
    inputEl.classList.add('over-limit');
  } else {
    inputEl.classList.remove('over-limit');
  }
}

if (location.hash) {
  const keyPairs = location.hash.slice(2).split('&').map(opt => opt.split('='));
  keyPairs.forEach(kp => {
    if (kp.length !== 2) return;
    if (kp[0] === 'code') {
      inputEl.value = decodeURIComponent(kp[1]);
      checkForCharLimit();
    }
    if (kp[0] === 'bpm') {
      const parsed = Number(kp[1]);
      if (Number.isInteger(parsed) && parsed >= 60 && parsed <= 500) {
        targetBPM = parsed;
        bpmDisplayEl.innerText = targetBPM;
      }
    }
    if (kp[0] === 'attack') {
      const parsed = Number(kp[1]);
      if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 0.5) {
        attackEl.value = parsed;
      }
    }
    if (kp[0] === 'decay') {
      const parsed = Number(kp[1]);
      if (!Number.isNaN(parsed) && parsed >= 0.5 && parsed <= 1) {
        decayEl.value = parsed;
      }
    }
  })
}

function run() {
  document.querySelector('.hint').classList.remove('hidden');
  const commentEl = document.querySelector('.comment');
  let tutorialPointer = 0;

  const setComment = lines => {
    commentEl.innerHTML = lines.map(line => (
      `<div class="comment-line">${line}</div>`
    )).join('');
  };

  setComment([
    'Make music in 64 bytes!',
    'Write a function that returns a frequency at a point in time',
    'Click the hint button below for more information'
  ]);

  document.querySelector('.hint').addEventListener('click', () => {
    const tut = tutorial[tutorialPointer];
    setBitoFunction(tut.code);
    setComment(tut.lines);
    tutorialPointer = (tutorialPointer + 1) % tutorial.length;
  });

  const waveTypes = [
    'triangle',
    'square',
    'sawtooth',
    'sine'
  ];

  const audioCtx = new AudioContext();

  const gainNode = audioCtx.createGain();
  gainNode.connect(audioCtx.destination);

  const oscillator = audioCtx.createOscillator();
  oscillator.connect(gainNode);
  oscillator.type = waveTypes[0];

  oscillator.frequency.setValueAtTime(880.0, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(MAX_VOLUME, audioCtx.currentTime);

  oscillator.start();

  window.addEventListener('blur', () => {
    if (!isMuted) {
      gainNode.disconnect();
    }
  });
  window.addEventListener('focus', () => {
    if (!isMuted) {
      gainNode.connect(audioCtx.destination);
    }
  });

  // b is the bar number
  // i is the index of the cell
  // t is in seconds
  // o is the offset in the bar (the beat)
  // function should return a number representing a frequency
  // Infinities change wave type, and NaN or anything else represents no sound
  let updateFn = new Function('b', 'i', 't', 'o', 'return ' + inputEl.value);

  const updateURL = () => {
    const escapedFn = encodeURIComponent(inputEl.value);
    history.pushState(null, '', `#?attack=${attackEl.value}&decay=${decayEl.value}&bpm=${targetBPM}&code=${escapedFn}`);
  }

  const setBitoFunction = code => {
    waveTypeIndex = 0;
    oscillator.type = waveTypes[waveTypeIndex];
    updateFn = new Function('b', 'i', 't', 'o', 'return ' + code);
    updateURL();
    inputEl.value = code;
  }

  document.getElementById('bpmUp').addEventListener('click', () => {
    targetBPM = Math.min(
      targetBPM + 10,
      500
    );
    bpmDisplayEl.innerText = targetBPM;
    updateURL();
  });
  document.getElementById('bpmDown').addEventListener('click', () => {
    targetBPM = Math.max(
      targetBPM - 10,
      60
    );
    bpmDisplayEl.innerText = targetBPM;
    updateURL();
  });
  attackEl.addEventListener('change', updateURL);
  decayEl.addEventListener('change', updateURL);

  canvas.addEventListener('click', () => {
    isMuted = !isMuted;
    if (isMuted) {
      gainNode.disconnect();
    } else {
      gainNode.connect(audioCtx.destination);
    }
  });
  canvas.addEventListener('mouseenter', () => {
    mouseInCanvas = true;
  });
  canvas.addEventListener('mouseleave', () => {
    mouseInCanvas = false;
  });

  
  // Inject math functions into global scope
  Object.getOwnPropertyNames(Math).forEach(prop => {
    window[prop] = Math[prop];
  });

  // Inject the tone function
  window.T = (b, n) => b*(1.059463**n);

  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      setBitoFunction(e.target.value);
    }
    checkForCharLimit();
  });

  const bars = 16;
  const barSize = w / bars / 2;
  const beatSize = barSize * 4;

  let cellIndex = 0;
  let i = 0;
  let noNote = false;
  let waveTypeIndex = 0;
  let lastValue = 0;

  let attackCurveQueued = false;
  let decayCurveQueued = false;

  //i%=32,g=(a,b)=>i>=a&i<b+a,T(195,g(0,5)|g(6,7)?2:g(14,7)?7:g(22,7)?5:g(30,1)?0:m)
  const update = () => {
    mc.background([0, 0, 0, 1]);
    mc.noFill();
    mc.stroke([0, 0, 0, 1]);

    const beatPeriodFrames = Math.round(3600/targetBPM);
    const beatPeriodT = (i % beatPeriodFrames) / beatPeriodFrames;
    const attackStart = Number(attackEl.value);
    const decayStart = Number(decayEl.value);

    if (i > 0 && i % beatPeriodFrames === 0) {
      attackCurveQueued = false;
      decayCurveQueued = false;

      cellIndex = (cellIndex + 1) % 64;

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
    }

    if (!attackCurveQueued && beatPeriodT >= attackStart && beatPeriodT < 0.5) {
      gainNode.gain.setTargetAtTime(MAX_VOLUME, audioCtx.currentTime, 0.035);
      attackCurveQueued = true;
    }

    if (beatPeriodT >= decayStart && !decayCurveQueued) {
      gainNode.gain.setTargetAtTime(0.01, audioCtx.currentTime, 0.035);
      decayCurveQueued = true;
    }

    const currentBar = Math.floor(cellIndex / 4);
    const currentBeat = cellIndex % 4;
    console.log(currentBeat);

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
            const c = lastValue > 440
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

    if (mouseInCanvas && !isMuted) {
      mc.background([0,0,0,0.2]);

      ctx.font = `${textH}px Inconsolata`;
      mc.fill([255,255,255,1]);
      const text = 'Mute';
      const textSize = ctx.measureText(text);
      ctx.fillText(text, (w - textSize.width)/2, (h - textH)/2);
    }

    if (isMuted) {
      mc.background([0,0,0,0.2]);

      ctx.font = `${textH}px Inconsolata`;
      mc.fill([255,255,255,1]);
      const text = 'Unmute';
      const textSize = ctx.measureText(text);
      ctx.fillText(text, (w - textSize.width)/2, (h - textH)/2);
    }

    i++;

    requestAnimationFrame(update);
  }

  update();
}
