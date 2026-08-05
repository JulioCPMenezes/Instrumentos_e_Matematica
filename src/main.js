import {
  applySiteConfig,
  initFamilies,
  initIntro,
  initMascotWidget,
  initNavigation,
  initThankYou,
  initOrchestra,
  initPitchComparison,
  initPresentation
} from './sections/layout.js';
import { initMathLabs } from './sections/labs.js';
import { initConstructionFilters } from './sections/construction.js';
import { initFrequencySimulator } from './sections/sound.js';
import { initHallAcoustics } from './sections/acoustics.js';
import { initReverberation } from './sections/reverberation.js';

function safely(name, callback) {
  try {
    const result = callback();
    if (result?.catch) {
      result.catch(error => {
        console.error(`Falha ao iniciar ${name}:`, error);
      });
    }
  } catch (error) {
    console.error(`Falha ao iniciar ${name}:`, error);
  }
}

function initContentScale() {
  const content = document.querySelector('#site-content-scale');
  const desktop = window.matchMedia('(min-width: 761px)');
  if (!content) return;

  const syncHeight = () => {
    if (!desktop.matches) {
      content.style.removeProperty('height');
      return;
    }
    content.style.height = `${Math.ceil(content.scrollHeight * .8)}px`;
  };

  const observer = new ResizeObserver(syncHeight);
  observer.observe(content);
  window.addEventListener('resize', syncHeight, { passive: true });
  desktop.addEventListener('change', syncHeight);
  window.addEventListener('load', syncHeight, { once: true });
  document.fonts?.ready.then(syncHeight);
  syncHeight();
}

function initSalaHero() {
  const hero = document.querySelector('.sala-hero');
  if (!hero) return;

  const revealTitle = () => hero.classList.add('is-title-risen');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealTitle();
    return;
  }

  const observer = new IntersectionObserver(([entry]) => {
    hero.classList.toggle('is-title-risen', entry.isIntersecting);
  }, { threshold: .32 });
  observer.observe(hero);
}

function initialize() {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  applySiteConfig();
  safely('mascote virtual', initMascotWidget);
  safely('introdução', initIntro);
  window.addEventListener('experience-started', () => safely('agradecimento', initThankYou), { once: true });
  safely('escala do conteúdo', initContentScale);
  safely('navegação', initNavigation);
  safely('hero da Sala São Paulo', initSalaHero);
  safely('orquestra', initOrchestra);
  safely('comparação de frequência', initPitchComparison);
  safely('simulador de frequência', initFrequencySimulator);
  safely('famílias', initFamilies);
  safely('modo apresentação', initPresentation);
  safely('filtros de construção', initConstructionFilters);
  safely('laboratórios matemáticos', initMathLabs);
  safely('reverberação', initReverberation);
  safely('laboratório acústico', initHallAcoustics);

  document.documentElement.classList.add('js-ready');
  window.addEventListener('error', event => {
    if (String(event.message || '').includes('ResizeObserver loop')) return;
    console.error(event.error || event.message);
  });

}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize, { once: true });
} else {
  initialize();
}
