import {
  stringWaveSpeed,
  stringFrequency,
  nearestNote,
  fretPosition,
  remainingStringLength,
  equalTemperamentFrequency,
  speedOfSound,
  openTubeFrequency,
  closedTubeFrequency,
  brassAddedLength,
  barFrequency,
  membraneFrequency,
  helmholtzFrequency,
  wavelength,
  formatNumber,
  clamp
} from '../math/core.js';
import { audioEngine } from '../audio/AudioEngine.js';
import { prepareCanvas, drawGrid, drawAxes, mapRange } from '../utils/canvas.js';
import { showToast } from './layout.js';

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

function text(element, value) {
  if (element) element.textContent = value;
}

export function initMathLabs() {
  return initInstrumentBuilder();
}

function initInstrumentBuilder() {
  const canvas = $('#instrument-builder-canvas');
  const inputs = {
    width: $('#builder-width'),
    height: $('#builder-height'),
    neck: $('#builder-neck'),
    strings: $('#builder-strings'),
    waist: $('#builder-waist'),
    hole: $('#builder-hole')
  };
  if (!canvas || Object.values(inputs).some(input => !input)) return null;

  let state = null;
  let phase = 0;
  let active = true;

  const classify = ({ width, height, neck }) => {
    const size = width + height + neck;
    if (size < 170) return 'Violino';
    if (size < 220) return 'Viola';
    if (size < 300) return 'Violoncelo';
    return 'Contrabaixo';
  };

  const update = () => {
    const dimensions = Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, Number(input.value)]));
    const frequency = stringFrequency({ lengthM: dimensions.neck / 100, tensionN: 108.9, linearDensityKgM: .001 });
    state = { ...dimensions, frequency, note: nearestNote(frequency), classification: classify(dimensions) };
    text($('#builder-width-out'), `${state.width} cm`);
    text($('#builder-height-out'), `${state.height} cm`);
    text($('#builder-neck-out'), `${state.neck} cm`);
    text($('#builder-strings-out'), String(state.strings));
    text($('#builder-waist-out'), String(state.waist));
    text($('#builder-hole-out'), String(state.hole));
    text($('#builder-classification'), state.classification);
    text($('#builder-frequency'), `${formatNumber(state.frequency, 1)} Hz`);
    text($('#builder-note'), state.note.name);
    text($('#builder-formula-values'), `f = 1/(2 × ${formatNumber(state.neck / 100, 2)} m) · √(108,9 N / 0,001 kg/m) = ${formatNumber(state.frequency, 1)} Hz`);
  };

  const draw = () => {
    if (!active) return;
    const prepared = prepareCanvas(canvas);
    if (prepared && state) {
      const { context, width, height } = prepared;
      context.clearRect(0, 0, width, height);
      const scale = Math.min(width / 460, height / 560);
      const centerX = width / 2;
      const bodyHeight = state.height * 2.25 * scale;
      const bodyWidth = state.width * 1.38 * scale;
      const neckLength = state.neck * 1.08 * scale;
      const bodyTop = height * .59 - bodyHeight / 2;
      const neckTop = bodyTop - neckLength;
      const waist = state.waist * .33 * scale;
      const holeRadius = state.hole * .52 * scale;
      const vibration = Math.sin(phase) * 1.5 * scale;

      context.fillStyle = 'rgba(0,0,0,.25)';
      context.beginPath();
      context.ellipse(centerX + 12 * scale, bodyTop + bodyHeight + 20 * scale, bodyWidth * .58, bodyHeight * .13, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#422213';
      context.fillRect(centerX - bodyWidth * .075, neckTop, bodyWidth * .15, neckLength + bodyHeight * .11);
      context.fillStyle = '#28140c';
      context.beginPath();
      context.roundRect(centerX - bodyWidth * .18, neckTop - 26 * scale, bodyWidth * .36, 31 * scale, 7 * scale);
      context.fill();

      const body = context.createLinearGradient(centerX - bodyWidth, bodyTop, centerX + bodyWidth, bodyTop + bodyHeight);
      body.addColorStop(0, '#703515');
      body.addColorStop(.48, '#cc7b35');
      body.addColorStop(1, '#572510');
      context.fillStyle = body;
      context.strokeStyle = '#e3c679';
      context.lineWidth = 2.5 * scale;
      context.beginPath();
      context.moveTo(centerX, bodyTop);
      context.bezierCurveTo(centerX + bodyWidth * .7, bodyTop, centerX + bodyWidth * .78, bodyTop + bodyHeight * .22, centerX + bodyWidth * .42 - waist, bodyTop + bodyHeight * .47);
      context.bezierCurveTo(centerX + bodyWidth * .82, bodyTop + bodyHeight * .7, centerX + bodyWidth * .72, bodyTop + bodyHeight, centerX, bodyTop + bodyHeight);
      context.bezierCurveTo(centerX - bodyWidth * .72, bodyTop + bodyHeight, centerX - bodyWidth * .82, bodyTop + bodyHeight * .7, centerX - bodyWidth * .42 + waist, bodyTop + bodyHeight * .47);
      context.bezierCurveTo(centerX - bodyWidth * .78, bodyTop + bodyHeight * .22, centerX - bodyWidth * .7, bodyTop, centerX, bodyTop);
      context.fill();
      context.stroke();

      context.fillStyle = 'rgba(15,7,3,.78)';
      context.beginPath();
      context.ellipse(centerX, bodyTop + bodyHeight * .5, holeRadius, holeRadius * .72, 0, 0, Math.PI * 2);
      context.fill();
      const bridgeY = bodyTop + bodyHeight * .62;
      context.fillStyle = '#e3b160';
      context.fillRect(centerX - bodyWidth * .23, bridgeY, bodyWidth * .46, 5 * scale);
      const spacing = state.strings > 1 ? bodyWidth * .26 / (state.strings - 1) : 0;
      for (let index = 0; index < state.strings; index += 1) {
        const x = centerX - (state.strings - 1) * spacing / 2 + index * spacing;
        context.strokeStyle = `rgba(249,234,196,${.55 + index / state.strings * .35})`;
        context.lineWidth = 1 + index / state.strings;
        context.beginPath();
        context.moveTo(x, neckTop - 17 * scale);
        context.lineTo(x + vibration * (index % 2 ? 1 : -1), bodyTop + bodyHeight * .76);
        context.stroke();
      }
    }
    phase += .16;
    requestAnimationFrame(draw);
  };

  Object.values(inputs).forEach(input => input.addEventListener('input', update));
  $('#builder-play')?.addEventListener('click', () => audioEngine.harmonicSeries(state.frequency, [1, .34, .17, .08], 1.5, .09).catch(error => showToast(error.message)));
  update();
  draw();
  return () => { active = false; };
}

function initStringLab() {
  const lengthInput = $('#string-length');
  const tensionInput = $('#string-tension');
  const densityInput = $('#string-density');
  const harmonicInput = $('#string-harmonic');
  const instrumentInput = $('#string-instrument');
  const canvas = $('#string-canvas');
  if (!lengthInput || !canvas) return null;

  const presets = {
    violino: [33, 55, 8], viola: [42, 62, 14], violoncelo: [70, 90, 42],
    contrabaixo: [105, 110, 110], harpa: [75, 70, 24], piano: [48, 95, 18]
  };
  const defaults = { length: 65, tension: 80, density: 30, harmonic: 1 };
  let phase = 0;
  let state = null;
  let active = true;
  let target = null;
  let previous = null;

  const describe = () => {
    if (!previous || !state) return 'Altere uma medida para ver a explicação.';
    const ratio = state.frequency / previous.frequency;
    const changed = previous.lengthM !== state.lengthM ? 'comprimento' : previous.tensionN !== state.tensionN ? 'tensão' : previous.linearDensityKgM !== state.linearDensityKgM ? 'densidade' : 'harmônico';
    const relation = changed === 'comprimento' ? 'a frequência varia inversamente com o comprimento' : changed === 'tensão' ? 'a frequência cresce com a raiz quadrada da tensão' : changed === 'densidade' ? 'uma corda mais pesada vibra mais lentamente' : 'um harmônico maior possui mais nós na corda';
    const targetText = target ? ` Meta: 440 Hz; faltam ${formatNumber(Math.abs(state.frequency - target), 1)} Hz.` : '';
    return `Você alterou ${changed}: ${relation}. A frequência ficou ${formatNumber(ratio, 2)}× a anterior.${targetText}`;
  };

  const update = () => {
    const next = {
      lengthM: Number(lengthInput.value) / 100,
      tensionN: Number(tensionInput?.value || 80),
      linearDensityKgM: Number(densityInput?.value || 30) / 10000,
      harmonic: Number(harmonicInput?.value || 1)
    };
    const speed = stringWaveSpeed(next.tensionN, next.linearDensityKgM);
    const frequency = stringFrequency(next);
    state = { ...next, speed, frequency, note: nearestNote(frequency) };
    text($('#string-length-out'), `${formatNumber(state.lengthM, 2)} m`);
    text($('#string-frequency-result'), `${formatNumber(frequency, 1)} Hz`);
    text($('#string-note-result'), state.note.name);
    text($('#string-feedback'), describe());
    previous = { ...state };
  };

  const draw = () => {
    if (!active) return;
    const prepared = prepareCanvas(canvas);
    if (prepared && state) {
      const { context, width, height } = prepared;
      drawGrid(context, width, height, { color: 'rgba(255,255,255,.05)', step: 24 });
      const left = 30; const right = width - 30; const center = height / 2;
      const amplitude = Math.min(height * .31, 70) * Math.min(1, .7 + state.tensionN / 600);
      context.strokeStyle = 'rgba(255,255,255,.25)'; context.lineWidth = 7;
      context.beginPath(); context.moveTo(left, center - 48); context.lineTo(left, center + 48); context.moveTo(right, center - 48); context.lineTo(right, center + 48); context.stroke();
      context.strokeStyle = '#e3c679'; context.lineWidth = 3; context.shadowColor = 'rgba(227,198,121,.5)'; context.shadowBlur = 12;
      context.beginPath();
      for (let x = left; x <= right; x += 2) { const t = (x - left) / Math.max(1, right - left); const y = center + Math.sin(Math.PI * state.harmonic * t) * Math.sin(phase) * amplitude; x === left ? context.moveTo(x, y) : context.lineTo(x, y); }
      context.stroke(); context.shadowBlur = 0; context.fillStyle = 'rgba(255,255,255,.65)'; context.font = '12px system-ui'; context.fillText(`L = ${formatNumber(state.lengthM, 2)} m`, left, height - 20); context.textAlign = 'right'; context.fillText(`n = ${state.harmonic}`, right, height - 20); context.textAlign = 'left';
    }
    phase += Math.min(.48, .06 + (state?.frequency || 100) / 1800); requestAnimationFrame(draw);
  };

  const change = () => update();
  [lengthInput, tensionInput, densityInput, harmonicInput].filter(Boolean).forEach(input => input.addEventListener('input', change));
  instrumentInput?.addEventListener('change', () => { const [length, tension, density] = presets[instrumentInput.value]; lengthInput.value = length; tensionInput.value = tension; densityInput.value = density; update(); text($('#string-feedback'), `Referência alterada para ${instrumentInput.options[instrumentInput.selectedIndex].text}. Os valores são didáticos.`); });
  $('#string-reset')?.addEventListener('click', () => { lengthInput.value = defaults.length; tensionInput && (tensionInput.value = defaults.tension); densityInput && (densityInput.value = defaults.density); harmonicInput && (harmonicInput.value = defaults.harmonic); if (instrumentInput) instrumentInput.value = 'violino'; target = null; previous = null; update(); text($('#string-feedback'), 'Valores redefinidos para a referência inicial.'); });
  canvas.addEventListener('pointerdown', event => { canvas.setPointerCapture?.(event.pointerId); const updateFromPointer = pointer => { const rect = canvas.getBoundingClientRect(); const ratio = clamp((pointer.clientX - rect.left) / rect.width, 0, 1); lengthInput.value = Math.round(Number(lengthInput.min) + ratio * (Number(lengthInput.max) - Number(lengthInput.min))); update(); }; updateFromPointer(event); const move = pointer => updateFromPointer(pointer); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', () => canvas.removeEventListener('pointermove', move), { once: true }); });
  $('#string-play')?.addEventListener('click', () => audioEngine.tone(state.frequency, { type: 'sine', gain: .08 }).catch(error => showToast(error.message)));
  update(); draw(); return () => { active = false; };
}

function initFretLab() {
  const scaleInput = $('#fret-scale');
  const countInput = $('#fret-count');
  const baseInput = $('#fret-base');
  const canvas = $('#fret-canvas');
  const tableBody = $('#fret-table');
  if (!scaleInput || !canvas) return null;

  const update = () => {
    const scale = Number(scaleInput.value);
    const count = Number(countInput.value);
    const baseFrequency = Number(baseInput.value);
    text($('#fret-scale-out'), `${formatNumber(scale, 0)} mm`);
    text($('#fret-count-out'), String(count));
    text($('#fret-base-out'), `${formatNumber(baseFrequency, 0)} Hz`);

    const prepared = prepareCanvas(canvas);
    if (prepared) {
      const { context, width, height } = prepared;
      context.fillStyle = '#1a0e09';
      context.fillRect(20, height * 0.25, width - 40, height * 0.5);
      const gradient = context.createLinearGradient(20, 0, width - 20, 0);
      gradient.addColorStop(0, '#6c331a');
      gradient.addColorStop(0.5, '#a85a2b');
      gradient.addColorStop(1, '#6a3017');
      context.fillStyle = gradient;
      context.fillRect(28, height * 0.31, width - 56, height * 0.38);
      context.strokeStyle = 'rgba(238,223,193,.72)';
      context.lineWidth = 1;
      for (let string = 0; string < 6; string += 1) {
        const y = height * 0.36 + string * height * 0.055;
        context.beginPath();
        context.moveTo(28, y);
        context.lineTo(width - 28, y);
        context.stroke();
      }
      context.strokeStyle = '#e2c981';
      context.lineWidth = 2;
      for (let fret = 0; fret <= count; fret += 1) {
        const position = fretPosition(scale, fret);
        const x = mapRange(position, 0, scale, 28, width - 28);
        context.beginPath();
        context.moveTo(x, height * 0.31);
        context.lineTo(x, height * 0.69);
        context.stroke();
        if ([3, 5, 7, 9, 12, 15, 17, 19, 21, 24].includes(fret)) {
          context.fillStyle = fret === 12 ? '#e3c679' : 'rgba(255,255,255,.55)';
          context.beginPath();
          context.arc(x - (fret === count ? 2 : 6), height * 0.5, 3.5, 0, Math.PI * 2);
          context.fill();
        }
      }
      context.fillStyle = 'rgba(255,255,255,.72)';
      context.font = '12px system-ui';
      context.fillText('pestana', 28, height * 0.2);
      context.textAlign = 'right';
      context.fillText(`escala = ${scale} mm`, width - 28, height * 0.84);
      context.textAlign = 'left';
    }

    if (tableBody) {
      let previousPosition = 0;
      tableBody.innerHTML = Array.from({ length: count + 1 }, (_, fret) => {
        const position = fretPosition(scale, fret);
        const space = fret === 0 ? 0 : position - previousPosition;
        previousPosition = position;
        const frequency = equalTemperamentFrequency(baseFrequency, fret);
        const note = nearestNote(frequency);
        return `<tr><td>${fret}</td><td>${formatNumber(position, 2)} mm</td><td>${fret === 0 ? '—' : `${formatNumber(space, 2)} mm`}</td><td>${formatNumber(frequency, 2)} Hz</td><td>${note.name}</td></tr>`;
      }).join('');
    }
  };

  [scaleInput, countInput, baseInput].forEach(input => input.addEventListener('input', update));
  window.addEventListener('resize', update);
  update();
  return () => window.removeEventListener('resize', update);
}

function initTubeLab() {
  const lengthInput = $('#tube-length'); const temperatureInput = $('#tube-temperature'); const modeInput = $('#tube-mode'); const instrumentInput = $('#tube-instrument'); const canvas = $('#tube-canvas');
  if (!lengthInput || !canvas) return null;
  const presets = { flautim: [32, 'open'], flauta: [65, 'open'], oboe: [58, 'open'], clarinete: [66, 'closed'], fagote: [130, 'closed'] };
  const defaults = { length: 65, temperature: 20, mode: 1, type: 'open' }; let holes = Array(6).fill(false); let state = null; let phase = 0; let active = true; let target = null;
  const effectiveLength = physical => { const first = holes.findIndex(Boolean); return first < 0 ? physical : physical * (.87 - first * .105); };
  const update = () => {
    const physicalLengthM = Number(lengthInput.value) / 100; const lengthM = effectiveLength(physicalLengthM); const temperatureC = Number(temperatureInput?.value || 20); const mode = Number(modeInput?.value || 1); const type = $('input[name="tube-type"]:checked')?.value || 'open'; const speed = speedOfSound(temperatureC); const frequency = type === 'open' ? openTubeFrequency({ lengthM, temperatureC, mode }) : closedTubeFrequency({ lengthM, temperatureC, mode });
    state = { physicalLengthM, lengthM, temperatureC, mode, type, speed, frequency, note: nearestNote(frequency) }; text($('#tube-length-out'), `${formatNumber(physicalLengthM, 2)} m`); text($('#tube-temperature-out'), `${formatNumber(temperatureC, 0)} °C`); text($('#tube-mode-out'), String(mode)); text($('#tube-speed-result'), `${formatNumber(speed, 1)} m/s`); text($('#tube-frequency-result'), `${formatNumber(frequency, 1)} Hz`); text($('#tube-note-result'), state.note.name); text($('#tube-wavelength-result'), `${formatNumber(lengthM, 2)} m`); const first = holes.findIndex(Boolean); text($('#tube-feedback'), first < 0 ? 'Nenhum furo está aberto: a coluna efetiva usa todo o tubo.' : `O furo ${first + 1} encurtou didaticamente a coluna de ar. A frequência aumentou.${target ? ` Meta: faltam ${formatNumber(Math.abs(frequency - target), 1)} Hz.` : ''}`);
  };
  const draw = () => { if (!active) return; const prepared = prepareCanvas(canvas); if (prepared && state) { const { context, width, height } = prepared; drawGrid(context, width, height, { color: 'rgba(255,255,255,.045)', step: 24 }); const left = 45; const right = width - 45; const center = height / 2; context.strokeStyle = 'rgba(227,198,121,.8)'; context.lineWidth = 7; context.beginPath(); context.moveTo(left, center - 72); context.lineTo(right, center - 72); context.moveTo(left, center + 72); context.lineTo(right, center + 72); if (state.type === 'closed') { context.moveTo(left, center - 72); context.lineTo(left, center + 72); } context.stroke(); context.strokeStyle = '#70b7dc'; context.lineWidth = 3; context.beginPath(); const cycles = state.type === 'open' ? state.mode : (2 * state.mode - 1) / 2; for (let x = left; x <= right; x += 2) { const t = (x - left) / (right - left); const shape = state.type === 'open' ? Math.cos(Math.PI * state.mode * t) : Math.sin(Math.PI * (state.mode - .5) * t); const y = center + shape * Math.sin(phase) * 60; x === left ? context.moveTo(x, y) : context.lineTo(x, y); } context.stroke(); } phase += .13; requestAnimationFrame(draw); };
  [lengthInput, temperatureInput, modeInput].filter(Boolean).forEach(input => input.addEventListener('input', update)); $$('input[name="tube-type"]').forEach(input => input.addEventListener('change', update)); $('#tube-reset')?.addEventListener('click', () => { lengthInput.value = defaults.length; temperatureInput && (temperatureInput.value = defaults.temperature); modeInput && (modeInput.value = defaults.mode); holes.fill(false); target = null; update(); }); $('#tube-play')?.addEventListener('click', () => audioEngine.tone(state.frequency, { type: state.type === 'closed' ? 'square' : 'sine', gain: .06 }).catch(error => showToast(error.message))); update(); draw(); return () => { active = false; };
}

function initBrassLab() {
  const semitonesInput = $('#brass-semitones');
  const diagram = $('#brass-diagram');
  if (!semitonesInput) return null;

  const baseLength = 1.4;
  const baseFrequency = 220;
  let state = null;
  const update = () => {
    const semitones = Number(semitonesInput.value);
    const added = brassAddedLength(baseLength, semitones);
    const frequency = baseFrequency * 2 ** (-semitones / 12);
    state = { semitones, frequency, note: nearestNote(frequency) };
    text($('#brass-semitones-out'), `${semitones} ${semitones === 1 ? 'semitom' : 'semitons'}`);
    text($('#brass-frequency-result'), `${formatNumber(frequency, 1)} Hz`);
    text($('#brass-note-result'), state.note.name);
    text($('#brass-feedback'), semitones ? `O ar percorre mais ${formatNumber(added, 2)} m. Por isso, o som fica mais grave.` : 'Sem caminho extra: este é o som mais agudo do modelo.');
    diagram?.style.setProperty('--extension-width', `${clamp(12 + added / baseLength * 95, 12, 45)}%`);
  };

  semitonesInput.addEventListener('input', update);
  $('#brass-reset')?.addEventListener('click', () => { semitonesInput.value = 1; update(); });
  $('#brass-play')?.addEventListener('click', () => audioEngine.tone(state.frequency, { type: 'sawtooth', gain: .055 }).catch(error => showToast(error.message)));
  update();
  return null;
}

const barMaterials = {
  rosewood: { name: 'madeira rígida', E: 16e9, rho: 850 },
  aluminum: { name: 'alumínio', E: 69e9, rho: 2700 },
  steel: { name: 'aço', E: 200e9, rho: 7850 }
};

function initBarLab() {
  const lengthInput = $('#bar-length');
  const thicknessInput = $('#bar-thickness');
  const materialSelect = $('#bar-material');
  const canvas = $('#bar-canvas');
  if (!lengthInput || !canvas) return null;
  let phase = 0;
  let state = null;
  let active = true;

  const update = () => {
    const lengthM = Number(lengthInput.value) / 100;
    const thicknessM = Number(thicknessInput.value) / 1000;
    const material = barMaterials[materialSelect.value];
    const frequency = barFrequency({ lengthM, thicknessM, youngModulusPa: material.E, densityKgM3: material.rho });
    const note = nearestNote(frequency);
    state = { lengthM, thicknessM, material, frequency, note };
    text($('#bar-length-out'), `${formatNumber(lengthM, 2)} m`);
    text($('#bar-thickness-out'), `${formatNumber(thicknessM * 1000, 0)} mm`);
    text($('#bar-frequency-result'), `${formatNumber(frequency, 1)} Hz`);
    text($('#bar-note-result'), note.name);
    text($('#bar-inverse-result'), `${formatNumber(1 / lengthM ** 2, 2)} m⁻²`);
  };

  const draw = () => {
    if (!active) return;
    const prepared = prepareCanvas(canvas);
    if (prepared && state) {
      const { context, width, height } = prepared;
      drawGrid(context, width, height, { color: 'rgba(255,255,255,.045)', step: 24 });
      const left = width * 0.12;
      const right = width * 0.88;
      const center = height * 0.5;
      const barHeight = clamp(state.thicknessM * 1800, 12, 44);
      const amplitude = 32;
      const gradient = context.createLinearGradient(left, 0, right, 0);
      gradient.addColorStop(0, '#6f3518');
      gradient.addColorStop(0.5, '#c57932');
      gradient.addColorStop(1, '#5e2a13');
      context.strokeStyle = gradient;
      context.lineWidth = barHeight;
      context.lineCap = 'round';
      context.beginPath();
      for (let x = left; x <= right; x += 2) {
        const t = (x - left) / (right - left);
        const modeShape = Math.cosh(4.73 * (t - 0.5)) / Math.cosh(2.365) - Math.cos(Math.PI * 2 * (t - 0.5));
        const normalized = modeShape / 2.2;
        const y = center + normalized * Math.sin(phase) * amplitude;
        if (x === left) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
      context.fillStyle = '#e3c679';
      [0.224, 0.776].forEach(t => {
        const x = left + (right - left) * t;
        context.beginPath();
        context.arc(x, center + 45, 7, 0, Math.PI * 2);
        context.fill();
      });
      context.fillStyle = 'rgba(255,255,255,.55)';
      context.font = '12px system-ui';
      context.fillText('apoios próximos dos nós', left, height - 20);
    }
    phase += 0.14;
    requestAnimationFrame(draw);
  };

  [lengthInput, thicknessInput, materialSelect].forEach(input => input.addEventListener('input', update));
  $('#bar-play')?.addEventListener('click', () => audioEngine.tone(state.frequency, { type: 'triangle', gain: .075, duration: 1.1 }).catch(error => showToast(error.message)));
  update();
  draw();
  return () => { active = false; };
}

function initMembraneLab() {
  const radiusInput = $('#membrane-radius');
  const canvas = $('#membrane-canvas');
  if (!radiusInput || !canvas) return null;
  let phase = 0;
  let state = null;
  let active = true;

  const update = () => {
    const radiusM = Number(radiusInput.value) / 100;
    const tensionPerLength = 1600;
    const surfaceDensity = 0.5;
    const frequency = membraneFrequency({ radiusM, tensionPerLength, surfaceDensity });
    const note = nearestNote(frequency);
    state = { radiusM, tensionPerLength, surfaceDensity, frequency, note };
    text($('#membrane-radius-out'), `${formatNumber(radiusM, 2)} m`);
    text($('#membrane-frequency-result'), `${formatNumber(frequency, 1)} Hz`);
    text($('#membrane-note-result'), note.name);
    text($('#membrane-feedback'), radiusM > .35 ? 'A membrana maior vibra mais devagar: o som ficou mais grave.' : 'A membrana menor vibra mais rápido: o som ficou mais agudo.');
  };

  const draw = () => {
    if (!active) return;
    const prepared = prepareCanvas(canvas);
    if (prepared && state) {
      const { context, width, height } = prepared;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.34;
      const gradient = context.createRadialGradient(centerX - radius * 0.3, centerY - radius * 0.35, 0, centerX, centerY, radius);
      gradient.addColorStop(0, '#f3e6c8');
      gradient.addColorStop(0.7, '#b98b58');
      gradient.addColorStop(1, '#5d2d19');
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = '#e3c679';
      context.lineWidth = 8;
      context.stroke();
      context.fillStyle = `rgba(123,44,66,${0.18 + 0.18 * Math.sin(phase)})`;
      context.beginPath();
      context.arc(centerX, centerY, radius * (0.42 + Math.sin(phase) * 0.03), 0, Math.PI * 2);
      context.fill();
    }
    phase += 0.07;
    requestAnimationFrame(draw);
  };

  radiusInput.addEventListener('input', update);
  $('#membrane-play')?.addEventListener('click', () => audioEngine.tone(state.frequency, { type: 'triangle', gain: 0.08, duration: 1.3 }).catch(error => showToast(error.message)));
  update();
  draw();
  return () => { active = false; };
}

function initHelmholtzLab() {
  const areaInput = $('#helm-area');
  const volumeInput = $('#helm-volume');
  const neckInput = $('#helm-neck');
  const visual = $('#resonator-visual');
  if (!areaInput) return null;
  let state = null;
  const update = () => {
    const areaCm2 = Number(areaInput.value);
    const volumeL = Number(volumeInput.value);
    const neckCm = Number(neckInput.value) / 10;
    const frequency = helmholtzFrequency({ openingAreaM2: areaCm2 / 10000, volumeM3: volumeL / 1000, effectiveNeckLengthM: neckCm / 100 });
    const note = nearestNote(frequency);
    state = { areaCm2, volumeL, neckCm, frequency, note };
    text($('#helm-area-out'), `${formatNumber(areaCm2, 0)} cm²`);
    text($('#helm-volume-out'), `${formatNumber(volumeL, 0)} L`);
    text($('#helm-neck-out'), `${formatNumber(neckCm, 1)} cm`);
    text($('#helm-frequency-result'), `${formatNumber(frequency, 1)} Hz`);
    text($('#helm-note-result'), note.name);
    text($('#helm-volume-result'), `${formatNumber(volumeL, 1)} L`);
    text($('#helm-area-result'), `${formatNumber(areaCm2, 1)} cm²`);
    if (visual) {
      visual.style.setProperty('--resonator-width', `${clamp(120 + Math.sqrt(volumeL) * 12, 130, 250)}px`);
      visual.style.setProperty('--resonator-height', `${clamp(150 + Math.sqrt(volumeL) * 13, 170, 280)}px`);
      visual.style.setProperty('--resonator-opening', `${clamp(24 + Math.sqrt(areaCm2) * 5, 28, 85)}px`);
    }
  };
  [areaInput, volumeInput, neckInput].forEach(input => input.addEventListener('input', update));
  $('#helm-play')?.addEventListener('click', () => audioEngine.tone(state.frequency, { type: 'sine', gain: 0.09, duration: 1.25 }).catch(error => showToast(error.message)));
  update();
  return null;
}

export function initComparator() {
  const tabs = $$('[data-compare]');
  const canvas = $('#comparator-canvas');
  const measureInput = $('#comparator-measure');
  const title = $('#comparator-title');
  const description = $('#comparator-description');
  const formula = $('#comparator-formula');
  if (!canvas || !measureInput) return;

  const configs = {
    strings: {
      title: 'Cordas: f ∝ 1/L', formula: 'f ∝ 1/L', unit: 'm', min: 20, max: 120, value: 65,
      description: 'Tensão e densidade linear ficam constantes; apenas o comprimento muda.',
      compute: cm => stringFrequency({ lengthM: cm / 100, tensionN: 80, linearDensityKgM: 0.003 })
    },
    tubes: {
      title: 'Tubos abertos: f ∝ 1/L', formula: 'f = v/(2L)', unit: 'm', min: 20, max: 200, value: 65,
      description: 'Temperatura e tipo de tubo ficam constantes; apenas o comprimento acústico muda.',
      compute: cm => openTubeFrequency({ lengthM: cm / 100, temperatureC: 20, mode: 1 })
    },
    bars: {
      title: 'Barras uniformes: f ∝ 1/L²', formula: 'f ≈ 1,028 · h/L² · √(E/ρ)', unit: 'm', min: 15, max: 80, value: 32,
      description: 'Material e espessura ficam constantes; apenas o comprimento da barra muda.',
      compute: cm => barFrequency({ lengthM: cm / 100, thicknessM: 0.018, youngModulusPa: 16e9, densityKgM3: 850 })
    },
    membranes: {
      title: 'Membranas: f ∝ 1/r', formula: 'f₀₁ ≈ 0,3827/r · √(S/σ)', unit: 'm', min: 15, max: 65, value: 35,
      description: 'Tensão e densidade superficial ficam constantes; apenas o raio muda.',
      compute: cm => membraneFrequency({ radiusM: cm / 100, tensionPerLength: 1600, surfaceDensity: 0.5 })
    }
  };
  let current = 'strings';

  const draw = () => {
    const config = configs[current];
    const prepared = prepareCanvas(canvas);
    if (!prepared) return;
    const { context, width, height } = prepared;
    context.fillStyle = '#fbf8f1';
    context.fillRect(0, 0, width, height);
    drawGrid(context, width, height, { color: 'rgba(30,53,87,.06)', step: 32 });
    drawAxes(context, width, height, { color: 'rgba(30,53,87,.28)', padding: 48 });
    const samples = Array.from({ length: 60 }, (_, index) => {
      const measure = config.min + (config.max - config.min) * index / 59;
      return { measure, frequency: config.compute(measure) };
    });
    const maxFrequency = Math.max(...samples.map(point => point.frequency));
    const minFrequency = Math.min(...samples.map(point => point.frequency));
    const toX = value => mapRange(value, config.min, config.max, 48, width - 34);
    const toY = value => mapRange(value, minFrequency, maxFrequency, height - 48, 30);
    context.strokeStyle = '#7b2c42';
    context.lineWidth = 3;
    context.beginPath();
    samples.forEach((point, index) => {
      const x = toX(point.measure);
      const y = toY(point.frequency);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();
    const currentMeasure = Number(measureInput.value);
    const currentFrequency = config.compute(currentMeasure);
    context.fillStyle = '#c8a24a';
    context.beginPath();
    context.arc(toX(currentMeasure), toY(currentFrequency), 7, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#fff';
    context.lineWidth = 3;
    context.stroke();
    context.fillStyle = '#655f56';
    context.font = '12px system-ui';
    context.textAlign = 'center';
    context.fillText(`dimensão (${config.unit})`, width / 2, height - 10);
    context.save();
    context.translate(14, height / 2);
    context.rotate(-Math.PI / 2);
    context.fillText('frequência (Hz)', 0, 0);
    context.restore();
    context.textAlign = 'left';
    context.fillStyle = '#1e3557';
    context.font = '700 13px system-ui';
    context.fillText(`${formatNumber(currentFrequency, 1)} Hz`, Math.min(width - 95, toX(currentMeasure) + 12), Math.max(25, toY(currentFrequency) - 12));
    text($('#comparator-measure-out'), `${formatNumber(currentMeasure / 100, 2)} ${config.unit}`);
  };

  const select = key => {
    current = key;
    const config = configs[key];
    measureInput.min = config.min;
    measureInput.max = config.max;
    measureInput.value = config.value;
    text(title, config.title);
    text(description, config.description);
    text(formula, config.formula);
    tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.compare === key));
    draw();
  };
  tabs.forEach(tab => tab.addEventListener('click', () => select(tab.dataset.compare)));
  measureInput.addEventListener('input', draw);
  window.addEventListener('resize', draw);
  select('strings');
}
