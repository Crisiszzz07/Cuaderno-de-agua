const toggle = document.querySelector<HTMLButtonElement>('[data-exposure-toggle]');
const exposureToolbar = document.querySelector<HTMLElement>('[data-exposure-toolbar]');
const indicator = document.querySelector<HTMLElement>('[data-section-indicator]');
const sections = [...document.querySelectorAll<HTMLElement>('[data-section]')];
const progressLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-progress-link]')];
const previous = [...document.querySelectorAll<HTMLButtonElement>('[data-previous]')];
const next = [...document.querySelectorAll<HTMLButtonElement>('[data-next]')];
const header = document.querySelector<HTMLElement>('.site-header');
const fullscreenButton = document.querySelector<HTMLButtonElement>('[data-fullscreen]');
const message = document.querySelector<HTMLElement>('[data-exposure-message]');
const dock = document.querySelector<HTMLElement>('[data-fullscreen-dock]');
const dockIndicator = document.querySelector<HTMLElement>('[data-fullscreen-indicator]');
const dockMessage = document.querySelector<HTMLElement>('[data-fullscreen-message]');
const exitFullscreen = document.querySelector<HTMLButtonElement>('[data-exit-fullscreen]');
let current = 0;

function showMessage(text: string) {
  const target = document.documentElement.classList.contains('fullscreen-exposure') ? dockMessage : message;
  if (target) { target.textContent = text; target.hidden = false; }
}

function syncFullscreen() {
  if (!fullscreenButton) return;
  const active = document.fullscreenElement === document.documentElement;
  const focused = active && toggle?.getAttribute('aria-pressed') === 'true';
  document.documentElement.classList.toggle('fullscreen-exposure', focused);
  if (dock) dock.hidden = !focused;
  if (dockMessage) dockMessage.hidden = true;
  fullscreenButton.setAttribute('aria-pressed', String(active));
  fullscreenButton.textContent = active ? 'Salir de pantalla completa' : 'Pantalla completa';
  updateChromeSizes();
  goToSection(current);
  if (!active && toggle?.getAttribute('aria-pressed') === 'true') fullscreenButton.focus({ preventScroll: true });
}

function updateChromeSizes() {
  document.documentElement.style.setProperty('--header-height', `${header?.getBoundingClientRect().height ?? 0}px`);
  document.documentElement.style.setProperty('--toolbar-height', `${exposureToolbar?.getBoundingClientRect().height ?? 0}px`);
}

function updateSection(index: number) {
  current = index;
  progressLinks.forEach((link, i) => {
    if (i === index) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  const section = sections[index];
  sections.forEach((item, i) => { item.dataset.activeExposure = String(i === index); });
  if (dockIndicator) dockIndicator.textContent = `${index + 1} / ${sections.length}`;
  if (indicator && section) indicator.textContent = `${index + 1} / ${sections.length} · ${section.dataset.label ?? ''}`;
  previous.forEach(button => { button.disabled = index === 0; });
  next.forEach(button => { button.disabled = index === sections.length - 1; });
}

function goToSection(index: number) {
  const section = sections[index];
  if (!section) return;
  updateSection(index);
  section.scrollIntoView({ behavior: 'instant', block: 'start' });
  section.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  history.replaceState(null, '', `#${section.id}`);
}

if (toggle && exposureToolbar) {
  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    const active = toggle.getAttribute('aria-pressed') !== 'true';
    toggle.setAttribute('aria-pressed', String(active));
    document.documentElement.classList.toggle('exposure-mode', active);
    exposureToolbar.hidden = !active;
    if (!active) {
      document.documentElement.classList.remove('fullscreen-exposure');
      if (dock) dock.hidden = true;
    }
    if (message) message.hidden = true;
    if (!active && document.fullscreenElement === document.documentElement) {
      void document.exitFullscreen().catch(() => showMessage('Para salir de pantalla completa, pulsa Esc.'));
    }
    updateChromeSizes();
    // Returning to normal reading leaves the current section in view.
    if (active) goToSection(current);
  });
  if (fullscreenButton) {
    fullscreenButton.disabled = !document.fullscreenEnabled;
    if (!document.fullscreenEnabled) fullscreenButton.title = 'La pantalla completa no está disponible en este navegador o contexto.';
    fullscreenButton.addEventListener('click', async () => {
      if (message) message.hidden = true;
      try {
        if (document.fullscreenElement === document.documentElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
      } catch {
        showMessage('El navegador no permitió la pantalla completa. Puedes continuar en modo exposición.');
      }
      syncFullscreen();
    });
    document.addEventListener('fullscreenchange', syncFullscreen);
    exitFullscreen?.addEventListener('click', async () => {
      try { await document.exitFullscreen(); }
      catch { showMessage('Pulsa Esc para salir de pantalla completa.'); }
    });
  }
  previous.forEach(button => button.addEventListener('click', () => goToSection(current - 1)));
  next.forEach(button => button.addEventListener('click', () => goToSection(current + 1)));
  document.addEventListener('keydown', event => {
    if (!document.documentElement.classList.contains('fullscreen-exposure') || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target;
    if (target instanceof Element && target.closest('input, textarea, select, button, a, [contenteditable="true"]')) return;
    if (event.key === 'ArrowRight' || event.key === 'PageDown') { event.preventDefault(); goToSection(current + 1); }
    if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); goToSection(current - 1); }
  });
  progressLinks.forEach((link, index) => link.addEventListener('click', event => {
    event.preventDefault();
    goToSection(index);
  }));
  let ticking = false;
  function trackScroll() {
    if (document.documentElement.classList.contains('fullscreen-exposure')) return;
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      if (document.documentElement.classList.contains('fullscreen-exposure')) { ticking = false; return; }
      const threshold = window.innerHeight * 0.36;
      let index = 0;
      sections.forEach((section, i) => { if (section.getBoundingClientRect().top < threshold) index = i; });
      updateSection(index);
      ticking = false;
    });
  }
  window.addEventListener('scroll', trackScroll, { passive: true });
  window.addEventListener('resize', trackScroll);
  const resizeObserver = new ResizeObserver(updateChromeSizes);
  if (header) resizeObserver.observe(header);
  resizeObserver.observe(exposureToolbar);
  updateChromeSizes();
  updateSection(0);
  trackScroll();
}

export {};
