// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"node_modules/microcan-fp/dist/microcan.js":[function(require,module,exports) {
var define;
var global = arguments[3];
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.microcan = factory());
}(this, (function () { 'use strict';

  const curry = (fn, toStringMessage) => {
    const curried = (...args) => {
      if (args.length >= fn.length) {
        return fn(...args);
      }
      const nextFn = (...argsNext) => curried(...args, ...argsNext);

      if (toStringMessage) {
        nextFn.toString = function toString() { return toStringMessage; };
      }

      return nextFn;
    };
    if (toStringMessage) {
      curried.toString = function toString() { return toStringMessage; };
    }
    return curried;
  };
  const TAU = Math.PI * 2;

  const TRANSPARENT = [0,0,0,0];

  function microcan(canvasCtx, [w, h]) {
    let width = w;
    let height = h;
    let ctx = canvasCtx;

    const stack = [];
    let font = {size:14, font: 'Arial', modifier: ''};
    let strokeColor = [0,0,0,1];
    let fillColor = [0,0,0,1];
    let dashVector = [];

    ctx.canvas.width = w;
    ctx.canvas.height = h;

    function push() {
      stack.push({
        font,
        strokeColor,
        fillColor,
        dashVector,
        strokeWeight: ctx.lineWidth
      });
    }

    function pop() {
      const out = stack.pop();
      if (!out) {
        throw new Error('No stack to pop');
      }

      setFont(out.font.size, out.font.font, out.font.modifier);
      stroke(out.strokeColor);
      fill(out.fillColor);
      dash(out.dashVector);
      strokeWeight(out.strokeWeight);
    }

    // State functions
    function setWidthHeight([w, h]) {
      width = w;
      height = h;
      ctx.canvas.width = w;
      ctx.canvas.height = h;
    }

    function setCtx(canvasCtx) {
      ctx = canvasCtx;
    }


    function text(text, pos) {
      ctx.fillText(text, ...pos);
      ctx.strokeText(text, ...pos);
    }

    function centeredText(text, pos) {
      const size = ctx.measureText(text);
      ctx.fillText(text, pos[0] - size.width / 2, pos[1] + font.size / 4);
      ctx.strokeText(text, pos[0] - size.width / 2, pos[1] + font.size / 4);
    }

    function setFont(size, _font, modifier) {
      ctx.font = `${modifier ? modifier + ' ' : ''}${size}px ${font}`;

      font.font = font;
      font.modifier = modifier;
      font.size = size;
    }

    // Drawing modifier functions
    function fill([r, g, b, a]) {
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      fillColor = [r, g, b, a];
    }

    function stroke([r, g, b, a]) {
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      strokeColor = [r, g, b, a];
    }

    function noStroke() {
      stroke(TRANSPARENT);
      strokeColor = TRANSPARENT;
    }

    function noFill() {
      fill(TRANSPARENT);
      fillColor = TRANSPARENT;
    }

    function dash(widthSpacingVector) {
      ctx.setLineDash(widthSpacingVector);
      dashVector = widthSpacingVector;
    }

    function noDash() {
      ctx.setLineDash([]);
      dashVector = [];
    }

    function background([r, g, b, a]) {
      const oldColor = ctx.fillStyle;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = oldColor;
    }

    function strokeWeight(weight) {
      ctx.lineWidth = weight;
    }

    // Shape descriptor functions
    function polygon(points) {
      return {
        type: 'polygon',
        points
      };
    }
    const poly = curry(function poly(n, radius, [x, y]) {
      const a = TAU / n;
      const points = Array.from(Array(n), (_, i) => [
        x + Math.cos(a * i) * radius,
        y + Math.sin(a * i) * radius
      ]);
      return polygon(points);
    }, 'poly(n:Number, radius:Number, position:Vector)');

    const alignedPoly = curry(function alignedPoly(n, radius, [x, y]) {
      const alignment = (n % 2 === 0)
        ? -TAU/(n*2)
        : Math.PI/(n*2);

      const a = (TAU / n) + alignment;
      const points = Array.from(Array(n), (_, i) => [
        x + Math.cos(a * i) * radius,
        y + Math.sin(a * i) * radius
      ]);
      return polygon(points);
    }, 'alignedPolygon(n:Number, radius:Number, position:Vector)');

    const rect = curry(function rect([w, h], [x, y]) {
      const w2 = w/2;
      const h2 = h/2;
      return polygon([
        [x - w2, y - h2],
        [x + w2, y - h2],
        [x + w2, y + h2],
        [x - w2, y + h2],
      ]);
    }, 'rect(dimensions:Vector, position:Vector)');

    const square = curry(function square(sideLength, position) {
      return rect([sideLength, sideLength], position);
    }, 'square(sideLength:Number, position:Vector)');

    const line = curry(function line(p1, p2) {
      return polygon([p1, p2]);
    }, 'line(v1:Vector, v2:Vector)');

    const fullEllipse = curry(function fullEllipse(rotation, radiusV, angleV, positionV) {
      return {
        type: 'ellipse',
        rotation,
        radius: radiusV,
        angle: angleV,
        position: positionV
      };
    }, 'fullEllipse(rotation:Number, radius:Vector, angle:Vector, position:Vector)');

    const ellipse = curry(function ellipse(rotation, radiusV, positionV) {
      return fullEllipse(rotation, radiusV, [0, TAU], positionV);
    }, 'ellipse(rotation:Number, radius:Vector, position:Vector)');

    const circle = curry(function circle(radius, positionV) {
      return fullEllipse(0, [radius, radius], [0, TAU], positionV);
    }, 'circle(radius:Number, position:Vector)');

    const arc = curry(function arc(radius, angleV, positionV) {
      return fullEllipse(0, [radius, radius], angleV, positionV);
    }, 'arc(radius:Number, angle:Vector, position:Vector)');

    // Drawing functions
    function drawEllipse(shape) {
      const {rotation, radius, angle, position} = shape;
      ctx.beginPath();
      ctx.ellipse(...position, ...radius, rotation, ...angle, false);
      ctx.stroke();
      ctx.fill();
      ctx.closePath();
    }
    function drawArc(shape) {
      const {radius, angle, position} = shape;
      ctx.beginPath();
      ctx.arc(...position, radius[0], ...angle, false);
      ctx.stroke();
      ctx.fill();
      ctx.closePath();
    }

    function drawPolygon(shape) {
      const {points} = shape;
      ctx.beginPath();
      ctx.moveTo(...points[0]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(...points[i]);
      }
      ctx.lineTo(...points[0]);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    }
    function drawLine(shape) {
      const {points: [[x1, y1], [x2, y2]]} = shape;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.closePath();
    }

    function drawShape(shape) {
      switch (shape.type) {
        case 'ellipse': return drawEllipse(shape);
        case 'polygon': return drawPolygon(shape);
      }
    }

    // Maps
    const mapPolygon = curry(function liftPolygon(fn, polygonShape) {
      return polygon(polygonShape.points.map(fn));
    }, 'mapPolygon(fn:Function, polygon:Polygon)');

    const mapPosition = curry(function mapPosition(fn, e) {
      const {radius, angle, rotation} = e;
      return fullEllipse(rotation, radius, angle, fn(e));
    }, 'mapPosition(fn:Function, ellipse:Ellipse)');

    const mapRotation = curry(function mapRotation(fn, e) {
      const {radius, angle, position} = e;
      return fullEllipse(fn(e), radius, angle, position);
    }, 'mapRotation(fn:Function, ellipse:Ellipse)');

    const mapAngle = curry(function mapAngle(fn, e) {
      const {radius, position, rotation} = e;
      return fullEllipse(rotation, radius, fn(e), position);
    }, 'mapAngle(fn:Function, ellipse:Ellipse)');

    const mapRadius = curry(function mapRadius(fn, e) {
      const {angle, position, rotation} = e;
      return fullEllipse(rotation, fn(e), angle, position);
    }, 'mapRadius(fn:Function, ellipse:Ellipse)');

    // Output
    return {
      setWidthHeight,
      setCtx,
      fill,
      stroke,
      noStroke,
      noFill,
      dash,
      noDash,
      background,
      strokeWeight,
      polygon,
      poly,
      alignedPoly,
      rect,
      square,
      line,
      fullEllipse,
      ellipse,
      circle,
      arc,
      drawEllipse,
      drawArc,
      drawPolygon,
      drawShape,
      drawLine,
      mapPolygon,
      mapPosition,
      mapRotation,
      mapAngle,
      mapRadius,

      text,
      centeredText,
      setFont,
      font,
      strokeColor,
      fillColor,
      dashVector,
      push,
      pop,
      ctx
    };
  }

  return microcan;

})));

},{}],"src/index.js":[function(require,module,exports) {
var microcan = require('microcan-fp'); // TODO
// buffered calculation? fixed BPM?
// Show indication when over 64 bytes (but don't block)


var CHAR_LIMIT = 64;
var tutorial = [{
  code: '110 * (b+1)',
  lines: ['b represents the bar number (0-15)']
}, {
  code: '110 + i',
  lines: ['i represents the cell index (0-127)']
}, {
  code: '220 + sin(t) * 440',
  lines: ['t represents time in seconds since the page loaded']
}, {
  code: '[440,523.25,659.25,783.99][o]',
  lines: ['o represents the offset into the bar (0-3)', 'You can think of this as the beat']
}, {
  code: 'sin(t) * cos(b + t) + tan(i) * 440',
  lines: ['The whole Math library is available in the global scope']
}, {
  code: '[0,3,5,7].map(x => T(440, x))[(b + o) % 4]',
  lines: ['The T(base, f) function gives you notes n semitones', 'from the freq n. Quick shortcut to musicality!']
}, {
  code: '[0,3,5,7].map(x => T(440, x))[(b + o) % 4]',
  lines: ['The T(base, f) function gives you notes n semitones', 'from the freq n. Quick shortcut to musicality!']
}, {
  code: '[110, 220, 440, NaN][o]',
  lines: ['NaN and other non number values are pauses']
}, {
  code: '[110, 220, 440, 1/0][o]',
  lines: ['Infinity and -Infinity change the wave type']
}, {
  code: '[0,3,5,8].map(x=>T(110*((b+1)%4),x))[i%4]',
  lines: ['Try to keep it under 64 bytes, and Happy hacking!']
}];
var w = 300;
var h = 300;
var canvas = document.getElementById('main');
var ctx = canvas.getContext('2d');
var mc = microcan(ctx, [w, h]);

var rect = function rect(size, position) {
  return mc.drawShape(mc.rect(size, position));
};

var circle = function circle(r, position) {
  return mc.drawEllipse(mc.circle(r, position));
};

mc.fill([255, 255, 255, 1]);
mc.noStroke();
var textH = Math.floor(w / 20);
ctx.font = "".concat(textH, "px Courier");
var textSize = ctx.measureText('Click here to start');
ctx.fillText('Click here to start', (w - textSize.width) / 2, (h - textH) / 2);
canvas.addEventListener('click', run, {
  once: true
});

function run() {
  var waveTypes = ['triangle', 'square', 'sawtooth', 'sine'];
  var inputEl = document.getElementById('codeInput');
  var audioCtx = new AudioContext();
  var gainNode = audioCtx.createGain();
  gainNode.connect(audioCtx.destination);
  var oscillator = audioCtx.createOscillator();
  oscillator.connect(gainNode);
  oscillator.type = waveTypes[0];
  oscillator.frequency.setValueAtTime(880.0, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
  oscillator.start(); // b is the bar number
  // i is the index of the cell
  // t is in seconds
  // o is the offset in the bar (the beat)
  // function should return a number representing a frequency
  // Infinities change wave type, and NaN or anything else represents no sound

  var updateFn = new Function('b', 'i', 't', 'o', 'return ' + inputEl.value);

  var setBitoFunction = function setBitoFunction(code) {
    waveTypeIndex = 0;
    oscillator.type = waveTypes[waveTypeIndex];
    updateFn = new Function('b', 'i', 't', 'o', 'return ' + code);
    var escapedFn = encodeURIComponent(code);
    window.location.hash = escapedFn;
    inputEl.value = code;
  };

  var commentEl = document.querySelector('.comment');
  var tutorialPointer = 0;
  canvas.addEventListener('click', function () {
    var tut = tutorial[tutorialPointer];
    setBitoFunction(tut.code);
    commentEl.innerHTML = tut.lines.map(function (line) {
      return "<div class=\"comment-line\">".concat(line, "</div>");
    }).join('');
    tutorialPointer = (tutorialPointer + 1) % tutorial.length;
  }); // Inject math functions into global scope

  Object.getOwnPropertyNames(Math).forEach(function (prop) {
    window[prop] = Math[prop];
  }); // Inject the tone function

  window.T = function (b, n) {
    return b * Math.pow(1.059463, n);
  };

  if (location.hash) {
    inputEl.value = decodeURIComponent(location.hash.slice(1));
  }

  var inputClasses = inputEl.classList;
  inputEl.addEventListener('keydown', function (e) {
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
  var bars = 16;
  var barSize = w / bars / 2;
  var beatSize = barSize * 4;
  var cellIndex = 0;
  var i = 0;
  var noNote = false;
  var waveTypeIndex = 0;
  var lastValue = 0;

  var update = function update() {
    mc.background([0, 0, 0, 1]);
    mc.noFill();
    mc.stroke([0, 0, 0, 1]);
    var currentBar = Math.floor(cellIndex / 4);
    var currentBeat = cellIndex % 4;

    if (i % 10 === 0) {
      var value;

      try {
        value = updateFn(currentBar, cellIndex, audioCtx.currentTime, currentBeat);
      } catch (e) {
        value = NaN;
      }

      var skip = false;

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
        waveTypeIndex = waveTypeIndex - 1 === -1 ? waveTypes.length - 1 : waveTypeIndex - 1;
        oscillator.type = waveTypes[waveTypeIndex];
        skip = true;
      }

      if (!skip) {
        if (noNote) {
          oscillator.connect(gainNode);
          noNote = false;
        }

        var freq = value;
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
      }

      lastValue = value;
      cellIndex = (cellIndex + 1) % 64;
    }

    var orderCount = 0;

    for (var bar = 0; bar < bars; bar++) {
      var y = floor(bar / 2) * beatSize;
      mc.push();
      mc.noStroke();

      if (bar === 0) {
        mc.fill([0xff, 0x22, 0x44, 0.1]);
      } else {
        if (orderCount < 2) {
          mc.fill([2555, 255, 255, 0.1]);
        } else {
          mc.fill([0xff, 0x22, 0x44, 0.1]);
        }

        orderCount = (orderCount + 1) % 4;
      }

      var xPos = bar % 2 === 0 ? beatSize * 2 : beatSize * 6;
      rect([beatSize * 4, beatSize], [xPos, y + beatSize / 2]);
      mc.pop();
      mc.strokeWeight(0.5);

      for (var beat = 0; beat < 4; beat++) {
        var x = bar % 2 === 0 ? beat * beatSize : beatSize * 4 + beat * beatSize;
        rect([beatSize, beatSize], [x + beatSize / 2, y + beatSize / 2]);

        if (bar === currentBar && beat === currentBeat) {
          mc.push();

          if (!Number.isNaN(lastValue)) {
            var c = lastValue > 0 ? [255, 255, 255, 1] : [0xff, 0x22, 0x44, 1];
            var r = beatSize / 2 / 2;

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

            circle(r, [x + beatSize / 2, y + beatSize / 2]);
          }

          mc.pop();
        }
      }
    }

    i++;
    requestAnimationFrame(update);
  };

  update();
}
},{"microcan-fp":"node_modules/microcan-fp/dist/microcan.js"}],"node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "52523" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["node_modules/parcel-bundler/src/builtins/hmr-runtime.js","src/index.js"], null)
//# sourceMappingURL=/src.a2b27638.js.map