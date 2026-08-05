import { audioEngine } from '../audio/AudioEngine.js';
import { showToast } from './layout.js';

export function initReverberation() {
  const buttons = [...document.querySelectorAll('[data-reverb]')];
  if (!buttons.length) return;

  buttons.forEach(button => button.addEventListener('click', () => {
    const long = button.dataset.reverb === 'long';
    buttons.forEach(item => item.classList.remove('is-playing'));
    button.classList.add('is-playing');
    audioEngine.reverberatedTone(329.63, {
      decay: long ? 1.35 : .16,
      repeats: long ? 10 : 2
    }).catch(error => showToast(error.message));
    window.setTimeout(() => button.classList.remove('is-playing'), long ? 3200 : 900);
  }));
}
