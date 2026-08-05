import { siteConfig } from '../data/siteConfig.js';
import { familias } from '../data/familias.js';
import { instrumentos } from '../data/instrumentos.js';
import { audioEngine } from '../audio/AudioEngine.js';
import { OrchestraMix } from './orchestra-mix.js';
import { initStage, initMascot, initDialogInstrumentViewer } from '../three/scenes.js';
import { prepareCanvas } from '../utils/canvas.js';

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

let toastTimer;
export function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('is-visible');
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2800);
}

export function applySiteConfig() {
  $$('[data-config]').forEach(element => {
    const key = element.dataset.config;
    if (Object.prototype.hasOwnProperty.call(siteConfig, key)) {
      element.textContent = siteConfig[key];
    }
  });
}

export async function initIntro() {
  const intro = $('#intro');
  const trigger = $('#intro-trigger');
  const canvas = $('#intro-stage');
  if (!intro || !trigger || !canvas) return null;

  document.body.classList.add('intro-active');
  intro.classList.remove('is-open');
  let stage = { reveal() {}, dispose() {}, mode: 'loading' };
  let opened = false;
  const stagePromise = initStage(canvas).then(instance => {
    stage = instance || stage;
    intro.dataset.renderMode = stage.mode || 'fallback';
    if (opened) stage.reveal?.();
    return stage;
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const openCurtains = () => {
    if (opened) return;
    opened = true;
    intro.classList.add('is-open');
    trigger.disabled = true;
    trigger.setAttribute('aria-hidden', 'true');
    stage.reveal?.();
    audioEngine.chord([146.83, 220, 293.66, 369.99], reducedMotion ? 0.8 : 1.75).catch(() => {});

    window.setTimeout(() => {
      document.body.classList.remove('intro-active');
      document.body.classList.add('experience-started');
      window.dispatchEvent(new CustomEvent('experience-started'));
      intro.querySelector('.intro-scroll')?.classList.add('is-ready');
    }, reducedMotion ? 120 : 2050);
  };

  trigger.addEventListener('pointerdown', () => intro.classList.add('is-pressed'));
  trigger.addEventListener('pointerup', () => intro.classList.remove('is-pressed'));
  trigger.addEventListener('pointercancel', () => intro.classList.remove('is-pressed'));
  trigger.addEventListener('pointerleave', () => intro.classList.remove('is-pressed'));
  trigger.addEventListener('click', openCurtains, { once: true });
  intro.addEventListener('click', openCurtains);
  trigger.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openCurtains();
    }
  });

  return stagePromise;
}

export function initThankYou() {
  const canvas = $('#thank-you-mascot-canvas');
  const button = $('#thank-you-audio');
  if (!canvas || !button) return null;

  const voice = new Audio('./public/assets/audio/marcio_tchau_gente.ogg');
  const section = $('#agradecimento');
  const widget = $('#mascot-widget');
  voice.preload = 'auto';
  voice.volume = 0.9;
  let scene = null;
  const observer = section && widget ? new IntersectionObserver(([entry]) => {
    widget.classList.toggle('is-hidden-for-thanks', entry.isIntersecting);
  }, { threshold: .35 }) : null;

  observer?.observe(section);
  initMascot(canvas).then(instance => { scene = instance; }).catch(() => showToast('Não foi possível carregar o mascote.'));
  button.addEventListener('click', async () => {
    try {
      voice.pause();
      voice.currentTime = 0;
      await voice.play();
      button.classList.add('is-speaking');
      voice.addEventListener('ended', () => button.classList.remove('is-speaking'), { once: true });
    } catch {
      showToast('Não foi possível reproduzir o áudio de despedida.');
    }
  });
  window.addEventListener('pagehide', () => {
    voice.pause();
    scene?.dispose?.();
  }, { once: true });
}

export function initMascotWidget() {
  const widget = $('#mascot-widget');
  const canvas = $('#mascot-canvas');
  if (!widget || !canvas) return null;

  const voice = new Audio('./public/assets/audio/marcio_oi_gente_1.ogg');
  voice.preload = 'auto';
  voice.volume = 0.86;
  let scene = null;
  let started = false;

  const playVoice = async () => {
    if (!audioEngine.enabled) {
      showToast('Ative o som no menu para ouvir o professor Marcio.');
      return;
    }
    try {
      voice.pause();
      voice.currentTime = 0;
      await voice.play();
      widget.classList.add('is-speaking');
      const finish = () => widget.classList.remove('is-speaking');
      voice.addEventListener('ended', finish, { once: true });
      window.setTimeout(finish, 1800);
    } catch {
      showToast('Clique novamente no mascote para ouvir o áudio.');
    }
  };

  const isMascotHit = event => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    return x >= 0.28 && x <= 0.72 && y >= 0.18 && y <= 0.70;
  };

  const start = async () => {
    if (started) return;
    started = true;
    widget.hidden = false;
    widget.removeAttribute('hidden');
    requestAnimationFrame(() => widget.classList.add('is-visible'));
    scene = await initMascot(canvas);
  };

  widget.addEventListener('click', event => {
    if (!event.shiftKey && isMascotHit(event)) playVoice();
  });
  start();
  window.addEventListener('audio-setting-changed', event => {
    if (!event.detail?.enabled) {
      voice.pause();
      widget.classList.remove('is-speaking');
    }
  });
  window.addEventListener('pagehide', () => {
    voice.pause();
    scene?.dispose?.();
  }, { once: true });

  return { start, playVoice };
}

export function initNavigation() {
  const navToggle = $('#nav-toggle');
  const navMenu = $('#nav-menu');
  const progress = $('#reading-progress');
  const navLinks = $$('.nav-menu a');
  const sections = $$('main .section[id]');

  navToggle?.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    navMenu?.classList.toggle('is-open', !expanded);
  });

  navLinks.forEach(link => link.addEventListener('click', () => {
    navMenu?.classList.remove('is-open');
    navToggle?.setAttribute('aria-expanded', 'false');
  }));

  const updateProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const percentage = scrollable > 0 ? Math.min(100, Math.max(0, window.scrollY / scrollable * 100)) : 0;
    if (progress) progress.style.width = `${percentage}%`;
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  const linkByTarget = new Map(navLinks.map(link => [link.getAttribute('href')?.slice(1), link]));
  const observer = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach(link => link.classList.remove('active'));
    linkByTarget.get(visible.target.id)?.classList.add('active');
  }, { rootMargin: '-25% 0px -60% 0px', threshold: [0.08, 0.25, 0.5] });
  sections.forEach(section => observer.observe(section));

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(item => revealObserver.observe(item));

  const soundToggle = $('#sound-toggle');
  soundToggle?.addEventListener('click', () => {
    const enabled = soundToggle.getAttribute('aria-pressed') !== 'true';
    soundToggle.setAttribute('aria-pressed', String(enabled));
    soundToggle.querySelector('.sr-only').textContent = enabled ? 'Som ativado' : 'Som desativado';
    soundToggle.querySelector('span[aria-hidden]').textContent = enabled ? '♪' : '×';
    audioEngine.setEnabled(enabled);
    if (!enabled) audioEngine.stopAll();
    window.dispatchEvent(new CustomEvent('audio-setting-changed', { detail: { enabled } }));
    showToast(enabled ? 'Som ativado.' : 'Som desativado.');
  });

  $('#stop-all-audio')?.addEventListener('click', () => {
    audioEngine.stopAll();
    showToast('Todos os sons foram interrompidos.');
  });
}



export function initPitchComparison() {
  const buttons = $$('[data-pitch-frequency]');
  if (!buttons.length) return;

  buttons.forEach(button => button.addEventListener('click', () => {
    const frequency = Number(button.dataset.pitchFrequency);
    if (!Number.isFinite(frequency)) return;
    audioEngine.stopAll();
    buttons.forEach(item => item.classList.remove('is-playing'));
    button.classList.add('is-playing');
    const gain = frequency === 110 ? 0.16 : 0.09;
    audioEngine.harmonicSeries(frequency, [1, .38, .2, .1], 1.65, gain).catch(error => showToast(error.message));
    window.setTimeout(() => button.classList.remove('is-playing'), 1700);
  }));
}

export function initOrchestra() {
  const map = $('#orchestra-map');
  const playButton = $('#orchestra-master-play');
  const pauseButton = $('#orchestra-master-pause');
  const timeline = $('#orchestra-timeline');
  const currentTime = $('#orchestra-current-time');
  const duration = $('#orchestra-duration');
  const visual = $('#orchestra-player-visual');
  const hotspotsToggle = $('#orchestra-hotspots-toggle');
  const note = $('#orchestra-stage-note');
  const particleStream = $('.orchestra-particle-stream', visual);
  if (!map || !playButton || !pauseButton || !timeline || !currentTime || !duration || !visual) return;

  const mix = new OrchestraMix();
  const controls = $$('[data-orchestra-family]');
  const particleSources = [
    './public/assets/audio/orquestra/visual/efeito-musica-1.png',
    './public/assets/audio/orquestra/visual/efeito-musica-2.webp',
    './public/assets/audio/orquestra/visual/efeito-musica-3.png'
  ];
  let animationFrame = null;
  let scrubbing = false;
  let resumeAfterScrub = false;
  const formatTime = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  const hasEnabledFamily = () => controls.some(button => mix.isFamilyEnabled(button.dataset.orchestraFamily));
  const updateControl = (key, enabled) => {
    const button = $(`[data-orchestra-family="${key}"]`);
    const card = button?.closest('.orchestra-family-control');
    if (!button || !card) return;
    const label = card.querySelector('h3').textContent.toLowerCase();
    card.classList.toggle('is-active', enabled);
    button.setAttribute('aria-label', `${enabled ? 'Pausar' : 'Tocar'} ${label}`);
    button.querySelector('span').textContent = enabled ? 'Ⅱ' : '▶';
    button.querySelector('small').textContent = enabled ? 'Pausar' : 'Tocar';
  };
  const updatePlayback = () => {
    const playing = mix.playing;
    visual.classList.toggle('is-playing', playing);
    playButton.classList.toggle('is-playing', playing);
    playButton.innerHTML = playing ? '<span aria-hidden="true">♫</span> Tocando' : '<span aria-hidden="true">▶</span> Tocar todas';
  };
  const showPosition = position => {
    timeline.value = position;
    currentTime.textContent = formatTime(position);
  };
  const updateTimeline = () => {
    if (!scrubbing) showPosition(mix.currentTime());
    updatePlayback();
  };
  const tick = () => {
    updateTimeline();
    if (mix.playing && !scrubbing) animationFrame = window.requestAnimationFrame(tick);
    else animationFrame = null;
  };
  const startTicker = () => {
    if (!animationFrame && mix.playing && !scrubbing) animationFrame = window.requestAnimationFrame(tick);
  };
  const beginScrub = () => {
    if (scrubbing) return;
    scrubbing = true;
    resumeAfterScrub = mix.playing;
    if (resumeAfterScrub) mix.pause();
  };
  const commitScrub = async () => {
    if (!scrubbing) return;
    scrubbing = false;
    const position = Number(timeline.value);
    const shouldResume = resumeAfterScrub;
    resumeAfterScrub = false;
    try {
      await mix.seek(position);
      if (shouldResume && hasEnabledFamily()) await mix.play();
    } catch (error) {
      showToast(error.message);
    } finally {
      updateTimeline();
      startTicker();
    }
  };
  const playAll = async () => {
    if (mix.playing) return;
    try {
      await mix.ensure();
      await mix.setAll(true);
      controls.forEach(button => updateControl(button.dataset.orchestraFamily, true));
      await mix.play();
      updateTimeline();
      startTicker();
    } catch (error) {
      showToast(error.message);
    }
  };

  if (particleStream) {
    Array.from({ length: 14 }, (_, index) => {
      const particle = document.createElement('img');
      const durationSeconds = 3.8 + Math.random() * 2.8;
      particle.className = 'orchestra-particle';
      particle.src = particleSources[index % particleSources.length];
      particle.alt = '';
      particle.style.setProperty('--size', `${15 + Math.random() * 18}px`);
      particle.style.setProperty('--drift', `${-125 + Math.random() * 250}px`);
      particle.style.setProperty('--rise', `${115 + Math.random() * 145}px`);
      particle.style.setProperty('--rotation', `${-25 + Math.random() * 50}deg`);
      particle.style.setProperty('--duration', `${durationSeconds}s`);
      particle.style.setProperty('--delay', `${-Math.random() * durationSeconds}s`);
      return particle;
    }).forEach(particle => particleStream.append(particle));
  }

  hotspotsToggle?.addEventListener('click', () => {
    const hidden = map.classList.toggle('hotspots-hidden');
    hotspotsToggle.setAttribute('aria-pressed', String(hidden));
    hotspotsToggle.innerHTML = hidden ? '<span aria-hidden="true">◉</span> Mostrar pontos' : '<span aria-hidden="true">◉</span> Ocultar pontos';
  });

  duration.textContent = formatTime(mix.duration);
  timeline.max = mix.duration;
  playButton.addEventListener('click', playAll);
  pauseButton.addEventListener('click', () => {
    if (!mix.playing) return;
    mix.pause();
    updateTimeline();
  });
  timeline.addEventListener('pointerdown', beginScrub);
  timeline.addEventListener('input', () => {
    beginScrub();
    showPosition(Number(timeline.value));
  });
  timeline.addEventListener('pointerup', commitScrub);
  timeline.addEventListener('change', commitScrub);
  timeline.addEventListener('keydown', event => {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) beginScrub();
  });
  timeline.addEventListener('keyup', commitScrub);
  timeline.addEventListener('blur', commitScrub);
  controls.forEach(button => button.addEventListener('click', async () => {
    try {
      await mix.ensure();
      const key = button.dataset.orchestraFamily;
      const enabled = await mix.toggleFamily(key);
      updateControl(key, enabled);
      if (enabled && !mix.playing) await mix.play();
      if (!hasEnabledFamily()) mix.pause();
      updateTimeline();
      startTicker();
    } catch (error) {
      showToast(error.message);
    }
  }));
  $$('.orchestra-hotspot', map).forEach(hotspot => {
    const show = () => {
      const number = hotspot.dataset.hotspot;
      const name = hotspot.dataset.name;
      const family = hotspot.dataset.family;
      if (note) note.textContent = family ? `${number}. ${name} · Família ${family}` : `${number}. ${name} · Coordena a orquestra`;
      $$('.orchestra-hotspot', map).forEach(item => item.classList.toggle('is-highlighted', item === hotspot));
    };
    const hide = () => {
      hotspot.classList.remove('is-highlighted');
      note.textContent = 'Passe o mouse sobre uma posição do palco.';
    };
    hotspot.addEventListener('mouseenter', show);
    hotspot.addEventListener('mouseleave', hide);
    hotspot.addEventListener('focus', show);
    hotspot.addEventListener('blur', hide);
    hotspot.addEventListener('click', show);
  });
  window.addEventListener('pagehide', () => {
    mix.pause();
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
  }, { once: true });
}

const instrumentAsset = name => `./public/assets/instrumentos/${name}`;

export function initFamilies() {
  const summary = $('#family-summary');
  const grid = $('#instrument-grid');
  const previousInstruments = $('#instrument-carousel-prev');
  const nextInstruments = $('#instrument-carousel-next');
  const tabs = $$('[data-family-tab]');
  const dialog = $('#instrument-dialog');
  const closeDialog = $('#instrument-dialog-close');
  const zoomIn = $('#instrument-model-zoom-in');
  const zoomOut = $('#instrument-model-zoom-out');
  const dialogModel = $('#instrument-dialog-model');
  const dialogFamily = $('#instrument-dialog-family');
  const dialogTitle = $('#instrument-dialog-title');
  const dialogDetails = $('#instrument-dialog-details');
  if (!summary || !grid || !dialog || !dialogModel || !dialogFamily || !dialogTitle || !dialogDetails) return;

  const instrumentAsset = name => `./public/assets/instrumentos/${name}`;
  const soundProfiles = {
    cordas: ['Cordas tensionadas', 'Arco, dedos ou martelos colocam as cordas em movimento.', 'O cavalete e a caixa de ressonância reforçam a vibração.', 'O músico altera o comprimento vibrante, a tensão ou escolhe outra corda.', 'Melodia, harmonia e base sonora da orquestra.'],
    madeiras: ['A coluna de ar dentro do corpo/tubo do instrumento', 'O sopro direto ou uma palheta inicia a vibração.', 'O corpo/tubo delimita a coluna de ar que ressoa; nos instrumentos com campana, ela ajuda a projetar o som.', 'Furos, chaves e registros mudam o comprimento efetivo da coluna de ar.', 'Cores melódicas, solos e ligações entre famílias.'],
    metais: ['Os lábios e a coluna de ar do tubo', 'A vibração dos lábios no bocal inicia o som.', 'O tubo e a campana reforçam e projetam as ressonâncias.', 'Válvulas, vara e harmônicos mudam o comprimento acústico e a nota.', 'Brilho, impacto, fanfarras e sustentação harmônica.'],
    percussao: ['Membranas, barras, placas ou discos', 'Impacto de baquetas, mãos ou choque entre peças inicia a vibração.', 'O corpo do instrumento e seus ressonadores projetam o som.', 'A afinação pode mudar por tensão, tamanho ou pela escolha de barras; alguns não têm altura definida.', 'Pulso, cor, transições dramáticas e efeitos sonoros.']
  };
  const playFrequency = instrument => audioEngine.tone(instrument.demoHz, { duration: 1.1, type: 'sine', gain: .12 }).catch(error => showToast(error.message));
  const instrumentAudio = new Map(Object.keys({
    violino: true, viola: true, violoncelo: true, contrabaixo: true, harpa: true, piano: true,
    piccolo: true, flauta: true, oboe: true, clarinete: true, fagote: true, contrafagote: true,
    trompete: true, trompa: true, trombone: true, tuba: true,
    timpano: true, xilofone: true, marimba: true, caixa: true, pratos: true, triangulo: true, gongo: true
  }).map(id => [id, new Audio(`./public/assets/audio/instrumentos/${id}.mp4`)]));
  let activeInstrumentAudio = null;
  let activeInstrumentId = null;
  const syncInstrumentButtons = () => {
    $$('[data-instrument-listen]', grid).forEach(button => {
      const active = button.dataset.instrumentListen === activeInstrumentId;
      button.classList.toggle('is-playing', active);
      button.setAttribute('aria-pressed', String(active));
      button.textContent = active ? '❚❚ Pausar instrumento' : '▶ Ouvir instrumento';
    });
  };
  const stopInstrumentAudio = () => {
    if (!activeInstrumentAudio) return;
    activeInstrumentAudio.pause();
    activeInstrumentAudio.currentTime = 0;
    activeInstrumentAudio = null;
    activeInstrumentId = null;
    syncInstrumentButtons();
  };
  const toggleInstrumentAudio = async id => {
    const audio = instrumentAudio.get(id);
    if (!audio) {
      showToast('Som não disponível para este instrumento.');
      return;
    }
    if (!audioEngine.enabled) {
      showToast('Ative o som no menu para ouvir o instrumento.');
      return;
    }
    if (activeInstrumentId === id) {
      stopInstrumentAudio();
      return;
    }
    stopInstrumentAudio();
    audio.currentTime = 0;
    activeInstrumentAudio = audio;
    activeInstrumentId = id;
    syncInstrumentButtons();
    try {
      await audio.play();
    } catch {
      stopInstrumentAudio();
      showToast('Não foi possível reproduzir o áudio deste instrumento.');
    }
  };
  instrumentAudio.forEach((audio, id) => audio.addEventListener('ended', () => {
    if (activeInstrumentId === id) stopInstrumentAudio();
  }));
  window.addEventListener('audio-setting-changed', event => {
    if (!event.detail?.enabled) stopInstrumentAudio();
  });
  window.addEventListener('pagehide', stopInstrumentAudio, { once: true });
  const instrumentModels = { gongo: 'tam-tam' };
  const instrumentModelUrl = id => `./public/assets/models/instrumentos/${instrumentModels[id] || id}.glb`;
  let dialogViewer = null;
  let viewerRequest = 0;
  let lastTrigger = null;
  const showInstrument = (id, trigger) => {
    const instrument = instrumentos[id];
    if (!instrument) return;
    const family = familias[instrument.familia];
    if (!family) return;
    lastTrigger = trigger;
    dialogFamily.textContent = `Família ${family.nome}`;
    dialogFamily.style.color = family.cor;
    dialogTitle.textContent = instrument.nome;
    const [vibra, inicio, amplificacao, nota, funcao] = soundProfiles[instrument.familia];
    const details = [
      ['Registro', `${instrument.faixa}<button class="instrument-frequency-button" data-instrument-frequency="${id}" type="button">▶ ${Math.round(instrument.demoHz)} Hz</button>`],
      ['Tamanho', instrument.tamanho],
      ['O que vibra', vibra],
      ['Como a vibração começa', inicio],
      ['Como o som é ampliado', amplificacao],
      ['Como a nota muda', nota],
      ['Como produz som', instrument.producao],
      ['Relação matemática', instrument.matematica],
      ['Função na orquestra', funcao],
      ['Curiosidade', instrument.curiosidade]
    ];
    dialogDetails.innerHTML = details.map(([term, text]) => `<div><dt>${term}</dt><dd>${text}</dd></div>`).join('');
    dialogDetails.querySelector('[data-instrument-frequency]')?.addEventListener('click', () => playFrequency(instrument));
    dialog.showModal();
    const request = ++viewerRequest;
    dialogViewer?.dispose();
    dialogViewer = null;
    initDialogInstrumentViewer(dialogModel, instrumentModelUrl(id)).then(viewer => {
      if (request !== viewerRequest || !dialog.open) {
        viewer?.dispose();
        return;
      }
      dialogViewer = viewer;
    }).catch(() => showToast(`Não foi possível carregar o modelo 3D de ${instrument.nome}.`));
  };
  closeDialog?.addEventListener('click', () => dialog.close());
  zoomIn?.addEventListener('click', () => dialogViewer?.zoomIn());
  zoomOut?.addEventListener('click', () => dialogViewer?.zoomOut());
  dialog.addEventListener('cancel', event => event.preventDefault());
  dialog.addEventListener('close', () => {
    viewerRequest += 1;
    dialogViewer?.dispose();
    dialogViewer = null;
    lastTrigger?.focus();
  });

  const visibleInstruments = 4;
  let activeFamily = 'cordas';
  let firstVisibleInstrument = 0;
  let isAnimating = false;

  const renderInstrumentCards = direction => {
    const ids = familias[activeFamily].instrumentos.slice(firstVisibleInstrument, firstVisibleInstrument + visibleInstruments);
    grid.innerHTML = ids.map(id => {
      const instrument = instrumentos[id];
      const visual = instrument.imagem
        ? `<img src="${instrumentAsset(instrument.imagem)}" alt="${instrument.nome}" loading="lazy">`
        : `<span aria-label="Ilustração de apoio; foto não disponível localmente" class="instrument-placeholder">${instrument.nome}</span>`;
      const hasAudio = instrumentAudio.has(id);
      const buttonLabel = hasAudio ? '▶ Tocar instrumento' : 'Som não disponível';
      return `<article aria-label="Abrir informações sobre ${instrument.nome}" class="instrument-card" data-instrument-card="${id}" role="button" tabindex="0">
        <figure>${visual}</figure>
        <span>${instrument.nome}</span><small>${instrument.faixa}</small><button aria-pressed="false" class="instrument-listen-button" data-instrument-listen="${id}" type="button"${hasAudio ? '' : ' disabled'}>${buttonLabel}</button>
      </article>`;
    }).join('');
    if (direction) grid.classList.add(direction === 1 ? 'is-entering-from-right' : 'is-entering-from-left');
    $$('[data-instrument-card]', grid).forEach(card => {
      card.addEventListener('click', event => {
        if (event.target.closest('[data-instrument-listen]')) return;
        showInstrument(card.dataset.instrumentCard, card);
      });
      card.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          showInstrument(card.dataset.instrumentCard, card);
        }
      });
    });
    $$('[data-instrument-listen]', grid).forEach(button => button.addEventListener('click', event => {
      event.stopPropagation();
      toggleInstrumentAudio(button.dataset.instrumentListen);
    }));
    syncInstrumentButtons();
    if (direction) window.setTimeout(() => grid.classList.remove('is-entering-from-right', 'is-entering-from-left'), 340);
    updateCarouselControls();
  };

  const updateCarouselControls = () => {
    const maxFirstVisible = Math.max(0, familias[activeFamily].instrumentos.length - visibleInstruments);
    if (previousInstruments) previousInstruments.disabled = firstVisibleInstrument === 0;
    if (nextInstruments) nextInstruments.disabled = firstVisibleInstrument >= maxFirstVisible;
  };

  const moveCarousel = direction => {
    const maxFirstVisible = Math.max(0, familias[activeFamily].instrumentos.length - visibleInstruments);
    const nextFirstVisible = Math.min(maxFirstVisible, Math.max(0, firstVisibleInstrument + direction));
    if (isAnimating || nextFirstVisible === firstVisibleInstrument) return;
    isAnimating = true;
    grid.classList.add(direction === 1 ? 'is-leaving-to-left' : 'is-leaving-to-right');
    window.setTimeout(() => {
      firstVisibleInstrument = nextFirstVisible;
      grid.classList.remove('is-leaving-to-left', 'is-leaving-to-right');
      renderInstrumentCards(direction);
      window.setTimeout(() => { isAnimating = false; }, 320);
    }, 220);
  };

  const render = key => {
    const family = familias[key];
    activeFamily = key;
    firstVisibleInstrument = 0;
    summary.style.setProperty('--family-color', family.cor);
    summary.innerHTML = `
      <div class="family-summary-copy">
        <h3>${family.nome}</h3>
        <p class="family-highlight">${family.destaque}</p>
        <p>${family.explicacao}</p>
        <div class="family-methods">${family.metodos.map(([title, text, examples]) => `<article><h4>${title}</h4><p>${text}</p><small>${examples}</small></article>`).join('')}</div>
      </div>
    `;
    tabs.forEach(tab => {
      const active = tab.dataset.familyTab === key;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    renderInstrumentCards();
  };

  previousInstruments?.addEventListener('click', () => moveCarousel(-1));
  nextInstruments?.addEventListener('click', () => moveCarousel(1));
  tabs.forEach(tab => tab.addEventListener('click', () => render(tab.dataset.familyTab)));
  render('cordas');
}

export function initPresentation() {
  const dialog = $('#presentation-dialog');
  const openButton = $('#presentation-button');
  const closeButton = $('#presentation-close');
  const slide = $('#presentation-slide');
  const counter = $('#presentation-counter');
  const previous = $('#presentation-prev');
  const next = $('#presentation-next');
  if (!dialog || !slide) return;

  const slides = [
    { title: 'Contexto e pergunta-guia', body: '<p>Saída pedagógica à Sala São Paulo e investigação sobre como instrumentos produzem som.</p><p><b>Pergunta:</b> onde a Matemática participa da construção, da afinação e da acústica?</p>' },
    { title: 'Aplicações observadas na Sala São Paulo', body: '<ul><li>Teto com 15 painéis móveis.</li><li>A altura do teto altera o volume acústico do modelo.</li><li>O teto móvel ajuda a adaptar a resposta da sala a repertórios e formações diferentes.</li></ul>' },
    { title: 'Como as famílias produzem som', body: '<ul><li>Cordas: cordas tensionadas.</li><li>Madeiras: colunas de ar.</li><li>Metais: lábios e tubo.</li><li>Percussão: membranas, barras, placas e cordas percutidas.</li></ul>' },
    { title: 'Matemática na construção', body: '<ul><li>Comprimento, tensão e densidade em cordas.</li><li>2^(1/12) e posição dos trastes.</li><li>Comprimento acústico de tubos e válvulas.</li><li>1/L² em barras e 1/r em membranas.</li></ul>' },
    { title: 'Acústica da sala', body: '<p>A fórmula de Sabine relaciona volume e absorção equivalente: RT60 = 0,161V/A.</p><p>O simulador é didático e não substitui medições profissionais.</p>' },
    { title: 'Conclusão', body: '<p>As razões definem intervalos, as equações ajudam a construir instrumentos, as funções representam ondas e a geometria transforma a sala de concertos.</p>' }
  ];
  let index = 0;
  const render = () => {
    slide.innerHTML = `<span class="slide-number">${String(index + 1).padStart(2, '0')}</span><h2>${slides[index].title}</h2>${slides[index].body}`;
    counter.textContent = `${index + 1} / ${slides.length}`;
    previous.disabled = index === 0;
    next.textContent = index === slides.length - 1 ? 'Encerrar' : 'Próximo';
  };
  openButton?.addEventListener('click', () => {
    index = 0;
    render();
    dialog.showModal();
    dialog.requestFullscreen?.().catch?.(() => {});
  });
  closeButton?.addEventListener('click', () => dialog.close());
  previous?.addEventListener('click', () => { if (index > 0) { index -= 1; render(); } });
  next?.addEventListener('click', () => {
    if (index < slides.length - 1) { index += 1; render(); }
    else dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') next?.click();
    if (event.key === 'ArrowLeft') previous?.click();
  });
}
