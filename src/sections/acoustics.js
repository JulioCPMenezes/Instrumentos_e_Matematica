import { formatNumber, sabineRT60 } from '../math/core.js';
import { audioEngine } from '../audio/AudioEngine.js';
import { initHallScene } from '../three/scenes.js';

const $ = selector => document.querySelector(selector);
const clamp = (value, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));

const MODEL = {
  minimumHeight: 8,
  maximumHeight: 24,
  minimumVolume: 12000,
  maximumVolume: 28000,
  // A is intentionally fixed so the experiment isolates the effect of V in Sabine's model.
  fixedAbsorption: 1800
};

function readingFor(rt60) {
  if (rt60 < 1.25) return 'Resposta mais seca e muito clara';
  if (rt60 < 1.6) return 'Clareza predominante';
  if (rt60 < 2.05) return 'Equilíbrio entre clareza e envolvimento';
  if (rt60 < 2.5) return 'Maior envolvimento reverberante';
  return 'Reverberação longa neste modelo';
}

function explanationFor(normalized, rt60) {
  if (normalized < 0.32) {
    return `Com o teto mais baixo, o volume do modelo diminui. Mantendo A constante, o RT₆₀ cai para aproximadamente ${formatNumber(rt60, 2)} s e a resposta tende a ficar mais clara.`;
  }
  if (normalized > 0.68) {
    return `Ao elevar o teto, o volume do modelo aumenta. Mantendo A constante, o RT₆₀ chega a aproximadamente ${formatNumber(rt60, 2)} s e o som permanece por mais tempo no ambiente.`;
  }
  return `Nesta altura intermediária, o modelo equilibra clareza e envolvimento. O RT₆₀ estimado é de aproximadamente ${formatNumber(rt60, 2)} s.`;
}

function wait(milliseconds) {
  return new Promise(resolve => window.setTimeout(resolve, milliseconds));
}

async function playDryAndReverberant(rt60) {
  audioEngine.stopAll();
  await audioEngine.tone(329.63, {
    duration: 0.55,
    type: 'triangle',
    gain: 0.10,
    attack: 0.015,
    release: 0.12
  });
  await wait(820);

  const repetitions = Math.max(3, Math.min(12, Math.round(rt60 * 3.7)));
  const interval = Math.max(88, Math.min(205, rt60 * 70));
  for (let index = 0; index < repetitions; index += 1) {
    window.setTimeout(() => {
      audioEngine.tone(329.63, {
        duration: 0.34 + index * 0.018,
        type: index === 0 ? 'triangle' : 'sine',
        gain: Math.max(0.009, 0.085 * Math.exp(-index / Math.max(2.0, rt60 * 1.8))),
        attack: 0.008,
        release: 0.18
      });
    }, index * interval);
  }
}

export async function initHallAcoustics() {
  const canvas = $('#hall-canvas');
  const area = $('#hall-drag-area');
  const grabber = $('#ceiling-grab-strip');
  const hint = $('#ceiling-drag-hint');
  if (!canvas || !area || !grabber) return null;

  const scene = await initHallScene(canvas);
  let normalized = 0.5;
  let dragging = false;
  let pointerStartY = 0;
  let valueAtStart = normalized;

  const calculate = () => {
    const height = MODEL.minimumHeight + normalized * (MODEL.maximumHeight - MODEL.minimumHeight);
    const volume = MODEL.minimumVolume + normalized * (MODEL.maximumVolume - MODEL.minimumVolume);
    const rt60 = sabineRT60(volume, MODEL.fixedAbsorption);

    $('#hall-height-out').textContent = `${formatNumber(height, 1)} m`;
    $('#hall-volume-out').textContent = `${formatNumber(volume, 0)} m³`;
    $('#hall-rt-result').textContent = `${formatNumber(rt60, 2)} s`;
    $('#hall-reading-result').textContent = readingFor(rt60);
    $('#hall-explanation').textContent = explanationFor(normalized, rt60);

    const meter = $('#reverb-meter-fill');
    if (meter) meter.style.width = `${clamp((rt60 - 0.95) / 1.65) * 100}%`;

    // The transparent hit area follows the visible ceiling, so the user grabs the roof itself.
    grabber.style.top = `${36 - normalized * 20}%`;
    grabber.setAttribute('aria-valuenow', formatNumber(height, 1));
    grabber.setAttribute('aria-valuetext', `${formatNumber(height, 1)} metros; reverberação estimada em ${formatNumber(rt60, 2)} segundos`);
    canvas.dataset.rt60 = String(rt60);
    scene?.setHeight?.(normalized);
    return rt60;
  };

  const setNormalized = value => {
    normalized = clamp(value);
    calculate();
  };

  const startDrag = event => {
    dragging = true;
    pointerStartY = event.clientY;
    valueAtStart = normalized;
    grabber.classList.add('is-dragging');
    area.classList.add('is-dragging');
    grabber.setPointerCapture?.(event.pointerId);
    hint?.classList.add('is-used');
    event.preventDefault();
  };

  const moveDrag = event => {
    if (!dragging) return;
    const rect = area.getBoundingClientRect();
    const delta = (pointerStartY - event.clientY) / Math.max(1, rect.height * 0.42);
    setNormalized(valueAtStart + delta);
  };

  const endDrag = event => {
    if (!dragging) return;
    dragging = false;
    grabber.classList.remove('is-dragging');
    area.classList.remove('is-dragging');
    if (event?.pointerId !== undefined) grabber.releasePointerCapture?.(event.pointerId);
  };

  grabber.addEventListener('pointerdown', startDrag);
  grabber.addEventListener('pointermove', moveDrag);
  grabber.addEventListener('pointerup', endDrag);
  grabber.addEventListener('pointercancel', endDrag);
  grabber.addEventListener('keydown', event => {
    const step = event.shiftKey ? 0.08 : 0.025;
    if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault();
      setNormalized(normalized + step);
      hint?.classList.add('is-used');
    }
    if (event.key === 'ArrowDown' || event.key === 'PageDown') {
      event.preventDefault();
      setNormalized(normalized - step);
      hint?.classList.add('is-used');
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setNormalized(0);
    }
    if (event.key === 'End') {
      event.preventDefault();
      setNormalized(1);
    }
  });

  $('#hall-audio')?.addEventListener('click', () => {
    const rt60 = Number(canvas.dataset.rt60 || calculate());
    playDryAndReverberant(rt60);
  });

  calculate();
  window.addEventListener('pagehide', () => scene?.dispose?.(), { once: true });
  return scene;
}
