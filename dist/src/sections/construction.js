const $$ = selector => [...document.querySelectorAll(selector)];

export function initConstructionFilters() {
  const buttons = $$('[data-construction-filter]');
  const panels = $$('[data-construction-panel]');
  if (!buttons.length || !panels.length) return;

  const select = family => {
    buttons.forEach(button => {
      const active = button.dataset.constructionFilter === family;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    panels.forEach(panel => {
      const active = panel.dataset.constructionPanel === family;
      panel.hidden = !active;
      panel.classList.toggle('active', active);
    });
  };

  buttons.forEach((button, index) => {
    button.addEventListener('click', () => select(button.dataset.constructionFilter));
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[nextIndex].focus();
      select(buttons[nextIndex].dataset.constructionFilter);
    });
  });

  select('cordas');
}
