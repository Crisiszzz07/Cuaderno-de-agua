// Shared pause control for original scientific illustrations; no motion library.
if (!document.body.classList.contains('presentation-page')) {
  const root = document.documentElement;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-motion-toggle]')];
  const figures = [...document.querySelectorAll<HTMLElement>('[data-motion-figure]')];
  let requested = true;

  function applyPreference() {
    const enabled = requested && !preference.matches;
    root.classList.add('motion-ready');
    root.classList.toggle('motion-paused', !enabled);
    buttons.forEach(button => {
      button.hidden = false;
      button.disabled = preference.matches;
      button.setAttribute('aria-pressed', String(enabled));
      button.textContent = preference.matches ? 'Movimiento reducido' : enabled ? 'Pausar animaciones' : 'Reproducir animaciones';
    });
  }
  buttons.forEach(button => button.addEventListener('click', () => { requested = !requested; applyPreference(); }));
  preference.addEventListener('change', applyPreference);
  document.addEventListener('visibilitychange', () => root.classList.toggle('motion-suspended', document.hidden));
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { (entry.target as HTMLElement).dataset.motionVisible = String(entry.isIntersecting); });
  }, { threshold: .12 });
  figures.forEach(figure => observer.observe(figure));
  applyPreference();
}
export {};
