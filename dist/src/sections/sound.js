import {
  beatFrequency,
  formatNumber,
  intensityDecibels,
  nearestNote,
  speedOfSound,
  wavelength
} from '../math/core.js';
import { audioEngine } from '../audio/AudioEngine.js';
import { drawAxes, drawGrid, mapRange, prepareCanvas } from '../utils/canvas.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function drawWave(canvas, {
  frequency = 440,
  amplitude = 0.7,
  phase = 0,
  time = 0,
  dark = false
} = {}) {
  const prepared = prepareCanvas(canvas);
  if (!prepared) return;
  const { context, width, height } = prepared;
  const background = dark ? '#101827' : '#fbf8f1';
  const grid = dark ? 'rgba(255,255,255,.08)' : 'rgba(30,53,87,.07)';
  const axis = dark ? 'rgba(255,255,255,.25)' : 'rgba(30,53,87,.22)';
  const line = dark ? '#dbb968' : '#7b2c42';

  context.fillStyle = background;
  context.fillRect(0, 0, width, height);
  drawGrid(context, width, height, { color: grid, step: 28 });
  context.strokeStyle = axis;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(0, height / 2);
  context.lineTo(width, height / 2);
  context.stroke();

  const cycles = Math.max(1.2, Math.min(8, frequency / 110));
  context.strokeStyle = line;
  context.lineWidth = 3;
  context.beginPath();
  for (let x = 0; x <= width; x += 2) {
    const normalized = x / Math.max(1, width);
    const y = height / 2 + Math.sin(normalized * Math.PI * 2 * cycles + phase + time) * amplitude * height * 0.31;
    if (x === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.stroke();
}

function initTabs() {
  const buttons = $$('[data-sound-lab]');
  const panels = $$('[data-sound-panel]');
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const target = button.dataset.soundLab;
      buttons.forEach(item => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-selected', String(active));
      });
      panels.forEach(panel => {
        panel.hidden = panel.dataset.soundPanel !== target;
      });
      window.dispatchEvent(new Event('resize'));
    });
  });
}

function drawFrequencySimulatorWave(canvas, frequency, time) {
  const prepared = prepareCanvas(canvas);
  if (!prepared) return;
  const { context, width, height } = prepared;
  context.fillStyle = '#101722';
  context.fillRect(0, 0, width, height);
  drawGrid(context, width, height, { color: 'rgba(255,255,255,.07)', step: 30 });
  context.strokeStyle = 'rgba(255,255,255,.2)';
  context.beginPath();
  context.moveTo(0, height / 2);
  context.lineTo(width, height / 2);
  context.stroke();
  const cycles = Math.max(1.1, Math.min(12, frequency / 80));
  context.strokeStyle = '#e3c679';
  context.lineWidth = 3;
  context.beginPath();
  for (let x = 0; x <= width; x += 2) {
    const u = x / Math.max(1, width);
    const y = height / 2 + Math.sin(u * Math.PI * 2 * cycles + time) * height * .29;
    if (x === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.stroke();
}

export function initFrequencySimulator() {
  const canvas = $('#frequency-simulator-canvas');
  const input = $('#frequency-simulator-input');
  const output = $('#frequency-simulator-output');
  const classification = $('#frequency-simulator-classification');
  const period = $('#frequency-simulator-period');
  const wavelengthOutput = $('#frequency-simulator-wavelength');
  const play = $('#frequency-simulator-play');
  const stop = $('#frequency-simulator-stop');
  if (!canvas || !input || !output || !classification || !period || !wavelengthOutput) return;

  let animationFrame = 0;
  let animationTime = 0;
  let stopTone = null;
  const currentFrequency = () => Number(input.value);
  const update = () => {
    const frequency = currentFrequency();
    output.textContent = `${formatNumber(frequency, 0)} Hz`;
    classification.textContent = frequency <= 200 ? 'Grave' : frequency <= 600 ? 'Média' : 'Aguda';
    period.textContent = `${formatNumber(1000 / frequency, 2)} ms`;
    wavelengthOutput.textContent = `${formatNumber(wavelength(frequency, speedOfSound(20)), 2)} m`;
  };
  const stopPlaying = () => {
    stopTone?.();
    stopTone = null;
    play?.classList.remove('is-playing');
  };
  const startPlaying = async () => {
    stopPlaying();
    stopTone = await audioEngine.continuousTone(currentFrequency(), { gain: .1 });
    play?.classList.add('is-playing');
  };
  const animate = () => {
    drawFrequencySimulatorWave(canvas, currentFrequency(), animationTime);
    animationTime += .045;
    animationFrame = requestAnimationFrame(animate);
  };

  input.addEventListener('input', () => {
    const wasPlaying = Boolean(stopTone);
    update();
    if (wasPlaying) startPlaying();
  });
  play?.addEventListener('click', startPlaying);
  stop?.addEventListener('click', stopPlaying);
  update();
  animate();
  window.addEventListener('pagehide', () => { cancelAnimationFrame(animationFrame); stopPlaying(); }, { once: true });
}

export function initBasicWave() {
  const canvas = $('#basic-wave-canvas');
  const frequency = $('#basic-frequency');
  const amplitude = $('#basic-amplitude');
  const phase = $('#basic-phase');
  const play = $('#basic-play');
  if (!canvas || !frequency || !amplitude || !phase) return;

  let animationTime = 0;
  let animationFrame = 0;
  let visible = true;

  const observer = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
  }, { threshold: 0.05 });
  observer.observe(canvas);

  const updateText = () => {
    const f = Number(frequency.value);
    const a = Number(amplitude.value) / 100;
    const p = Number(phase.value);
    $('#basic-frequency-output').textContent = `${formatNumber(f, 0)} Hz`;
    $('#basic-amplitude-output').textContent = formatNumber(a, 2);
    $('#basic-phase-output').textContent = `${formatNumber(p, 0)}°`;
    $('#basic-period').textContent = `${formatNumber(1000 / f, 2)} ms`;
    $('#basic-wavelength').textContent = `${formatNumber(wavelength(f, speedOfSound(20)), 2)} m`;
    $('#basic-note').textContent = nearestNote(f).name;
  };

  const animate = () => {
    if (visible) {
      drawWave(canvas, {
        frequency: Number(frequency.value),
        amplitude: Number(amplitude.value) / 100,
        phase: Number(phase.value) * Math.PI / 180,
        time: animationTime,
        dark: false
      });
      animationTime += 0.035;
    }
    animationFrame = requestAnimationFrame(animate);
  };

  [frequency, amplitude, phase].forEach(input => input.addEventListener('input', updateText));
  play?.addEventListener('click', () => audioEngine.tone(Number(frequency.value), {
    duration: 1.35,
    type: 'sine',
    gain: 0.11
  }));
  updateText();
  animate();

  window.addEventListener('pagehide', () => cancelAnimationFrame(animationFrame), { once: true });
}

function harmonicPresets(name) {
  const presets = {
    soft: [1, 0.26, 0.1, 0.04, 0.02, 0.01, 0, 0],
    bright: [1, 0.68, 0.48, 0.34, 0.24, 0.17, 0.12, 0.08],
    odd: [1, 0, 0.58, 0, 0.30, 0, 0.16, 0],
    upper: [0.55, 0.2, 0.34, 0.5, 0.46, 0.38, 0.3, 0.24]
  };
  return presets[name] || presets.soft;
}

function drawHarmonicVisuals(waveCanvas, spectrumCanvas, fundamental, amplitudes, time) {
  const wave = prepareCanvas(waveCanvas);
  if (wave) {
    const { context, width, height } = wave;
    context.fillStyle = '#101827';
    context.fillRect(0, 0, width, height);
    drawGrid(context, width, height, { color: 'rgba(255,255,255,.06)', step: 28 });
    context.strokeStyle = '#dbb968';
    context.lineWidth = 2.5;
    context.beginPath();
    const normalization = Math.max(1, amplitudes.reduce((sum, value, index) => sum + value / (index + 1), 0));
    for (let x = 0; x <= width; x += 2) {
      const u = x / Math.max(1, width);
      let yValue = 0;
      amplitudes.forEach((amplitude, index) => {
        yValue += amplitude / (index + 1) * Math.sin(2 * Math.PI * (index + 1) * u * 2.4 + time * (0.55 + index * 0.04));
      });
      const y = height / 2 - yValue / normalization * height * 0.34;
      if (x === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
    context.fillStyle = 'rgba(255,255,255,.72)';
    context.font = '12px system-ui';
    context.fillText(`Fundamental: ${formatNumber(fundamental, 0)} Hz`, 16, 22);
  }

  const spectrum = prepareCanvas(spectrumCanvas);
  if (spectrum) {
    const { context, width, height } = spectrum;
    context.fillStyle = '#101827';
    context.fillRect(0, 0, width, height);
    drawGrid(context, width, height, { color: 'rgba(255,255,255,.05)', step: 28 });
    const padding = 30;
    const barWidth = Math.max(12, (width - padding * 2) / amplitudes.length * 0.55);
    amplitudes.forEach((amplitude, index) => {
      const x = mapRange(index, 0, amplitudes.length - 1, padding + barWidth / 2, width - padding - barWidth / 2);
      const h = amplitude * Math.max(0, height - 62);
      const gradient = context.createLinearGradient(0, height - 28 - h, 0, height - 28);
      gradient.addColorStop(0, '#dbb968');
      gradient.addColorStop(1, '#7b2c42');
      context.fillStyle = gradient;
      context.fillRect(x - barWidth / 2, height - 28 - h, barWidth, h);
      context.fillStyle = 'rgba(255,255,255,.72)';
      context.font = '10px system-ui';
      context.textAlign = 'center';
      context.fillText(`${index + 1}`, x, height - 10);
    });
  }
}

function initHarmonics() {
  const mixer = $('#harmonic-mixer');
  const fundamentalInput = $('#harmonic-fundamental');
  const waveCanvas = $('#harmonic-wave-canvas');
  const spectrumCanvas = $('#harmonic-spectrum-canvas');
  if (!mixer || !fundamentalInput || !waveCanvas || !spectrumCanvas) return;

  let amplitudes = harmonicPresets('soft');
  let time = 0;
  let visible = true;
  const observer = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
  }, { threshold: 0.05 });
  observer.observe(waveCanvas);

  const renderControls = () => {
    mixer.innerHTML = amplitudes.map((amplitude, index) => `
      <div class="harmonic-control">
        <label for="harmonic-${index + 1}"><span>${index + 1}º</span><output>${formatNumber(amplitude, 2)}</output></label>
        <input id="harmonic-${index + 1}" type="range" min="0" max="100" value="${Math.round(amplitude * 100)}" aria-label="Amplitude do ${index + 1}º harmônico">
      </div>
    `).join('');
    [...mixer.querySelectorAll('input')].forEach((input, index) => {
      input.addEventListener('input', () => {
        amplitudes[index] = Number(input.value) / 100;
        input.closest('.harmonic-control').querySelector('output').textContent = formatNumber(amplitudes[index], 2);
      });
    });
  };

  const applyPreset = preset => {
    amplitudes = [...harmonicPresets(preset)];
    renderControls();
  };

  $$('[data-harmonic-preset]').forEach(button => {
    button.addEventListener('click', () => applyPreset(button.dataset.harmonicPreset));
  });

  fundamentalInput.addEventListener('input', () => {
    $('#harmonic-fundamental-out').textContent = `${formatNumber(fundamentalInput.value, 0)} Hz`;
  });
  $('#harmonic-play')?.addEventListener('click', () => {
    audioEngine.harmonicSeries(Number(fundamentalInput.value), amplitudes, 1.8);
  });

  const animate = () => {
    if (visible) drawHarmonicVisuals(waveCanvas, spectrumCanvas, Number(fundamentalInput.value), amplitudes, time);
    time += 0.025;
    requestAnimationFrame(animate);
  };

  renderControls();
  fundamentalInput.dispatchEvent(new Event('input'));
  animate();
}

function drawBeat(canvas, frequencyA, frequencyB, time = 0) {
  const prepared = prepareCanvas(canvas);
  if (!prepared) return;
  const { context, width, height } = prepared;
  context.fillStyle = '#101827';
  context.fillRect(0, 0, width, height);
  drawGrid(context, width, height, { color: 'rgba(255,255,255,.06)', step: 28 });
  const normalizedA = frequencyA / 40;
  const normalizedB = frequencyB / 40;

  context.strokeStyle = '#dbb968';
  context.lineWidth = 2.5;
  context.beginPath();
  for (let x = 0; x <= width; x += 2) {
    const u = x / Math.max(1, width);
    const sum = (Math.sin(2 * Math.PI * normalizedA * u + time) + Math.sin(2 * Math.PI * normalizedB * u + time)) / 2;
    const y = height / 2 - sum * height * 0.29;
    if (x === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.stroke();

  const difference = Math.abs(frequencyA - frequencyB);
  context.strokeStyle = 'rgba(166,209,225,.78)';
  context.setLineDash([7, 5]);
  context.lineWidth = 1.5;
  context.beginPath();
  for (let x = 0; x <= width; x += 2) {
    const u = x / Math.max(1, width);
    const envelope = Math.abs(Math.cos(Math.PI * difference * u * 0.65));
    const upper = height / 2 - envelope * height * 0.30;
    if (x === 0) context.moveTo(x, upper);
    else context.lineTo(x, upper);
  }
  context.stroke();
  context.beginPath();
  for (let x = 0; x <= width; x += 2) {
    const u = x / Math.max(1, width);
    const envelope = Math.abs(Math.cos(Math.PI * difference * u * 0.65));
    const lower = height / 2 + envelope * height * 0.30;
    if (x === 0) context.moveTo(x, lower);
    else context.lineTo(x, lower);
  }
  context.stroke();
  context.setLineDash([]);
}

function initBeats() {
  const inputA = $('#beat-a');
  const inputB = $('#beat-b');
  const canvas = $('#beat-canvas');
  if (!inputA || !inputB || !canvas) return;
  let time = 0;
  const update = () => {
    const a = Number(inputA.value);
    const b = Number(inputB.value);
    $('#beat-a-out').textContent = `${formatNumber(a, 0)} Hz`;
    $('#beat-b-out').textContent = `${formatNumber(b, 0)} Hz`;
    $('#beat-result').textContent = `${formatNumber(beatFrequency(a, b), 2)} Hz`;
  };
  [inputA, inputB].forEach(input => input.addEventListener('input', update));
  $('#beat-play')?.addEventListener('click', () => Promise.all([
    audioEngine.tone(Number(inputA.value), { duration: 3.2, gain: 0.07 }),
    audioEngine.tone(Number(inputB.value), { duration: 3.2, gain: 0.07 })
  ]));
  const animate = () => {
    drawBeat(canvas, Number(inputA.value), Number(inputB.value), time);
    time += 0.045;
    requestAnimationFrame(animate);
  };
  update();
  animate();
}

function initWavelength() {
  const input = $('#wavelength-frequency');
  const result = $('#wavelength-result');
  const visual = $('#scale-scene');
  if (!input || !result) return;
  const update = () => {
    const frequency = Number(input.value);
    const length = wavelength(frequency, speedOfSound(20));
    $('#wavelength-frequency-out').textContent = `${formatNumber(frequency, 0)} Hz`;
    result.textContent = `${formatNumber(length, 2)} m`;
    if (visual) {
      visual.style.setProperty('--wave-scale', String(Math.min(1, Math.max(0.08, length / 5))));
      const label = $('#scale-label');
      if (label) label.textContent = `A onda mede aproximadamente ${formatNumber(length, 2)} m`;
    }
  };
  input.addEventListener('input', update);
  update();
}

function drawDb(canvas, activeRatio) {
  const prepared = prepareCanvas(canvas);
  if (!prepared) return;
  const { context, width, height } = prepared;
  context.fillStyle = '#101827';
  context.fillRect(0, 0, width, height);
  drawGrid(context, width, height, { color: 'rgba(255,255,255,.06)', step: 28 });
  const padding = 42;
  drawAxes(context, width, height, { color: 'rgba(255,255,255,.28)', padding });
  context.strokeStyle = '#dbb968';
  context.lineWidth = 2.5;
  context.beginPath();
  for (let ratio = 1; ratio <= 100; ratio += 0.5) {
    const x = mapRange(ratio, 1, 100, padding, width - padding);
    const y = mapRange(intensityDecibels(ratio), 0, 20, height - padding, padding);
    if (ratio === 1) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.stroke();
  const x = mapRange(activeRatio, 1, 100, padding, width - padding);
  const y = mapRange(intensityDecibels(activeRatio), 0, 20, height - padding, padding);
  context.fillStyle = '#7b2c42';
  context.beginPath();
  context.arc(x, y, 6, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = '#fff';
  context.lineWidth = 2;
  context.stroke();
  context.fillStyle = 'rgba(255,255,255,.72)';
  context.font = '11px system-ui';
  context.fillText('razão de potência', width / 2 - 38, height - 10);
  context.save();
  context.translate(13, height / 2 + 28);
  context.rotate(-Math.PI / 2);
  context.fillText('diferença (dB)', 0, 0);
  context.restore();
}

function initDecibels() {
  const input = $('#db-ratio');
  const canvas = $('#db-canvas');
  if (!input || !canvas) return;
  const update = () => {
    const ratio = Number(input.value);
    $('#db-ratio-out').textContent = `${formatNumber(ratio, 0)}×`;
    $('#db-result').textContent = `${formatNumber(intensityDecibels(ratio), 2)} dB`;
    drawDb(canvas, ratio);
  };
  input.addEventListener('input', update);
  window.addEventListener('resize', update);
  update();
}

export function initSoundLab() {
  initTabs();
  initHarmonics();
  initBeats();
  initWavelength();
  initDecibels();
}
