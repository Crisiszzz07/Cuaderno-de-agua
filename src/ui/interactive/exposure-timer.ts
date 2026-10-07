import { ExposureClock, exposureTiming, getExposurePlans } from '../../application/exposure-timer.ts';

const root = document.querySelector<HTMLElement>('[data-timer-root]');
const selector = document.querySelector<HTMLSelectElement>('[data-timer-plan]');
const plans = getExposurePlans();
const clock = new ExposureClock();
let plan = plans[0];
let enabled = false;
let announcementKey = '';
let interval: ReturnType<typeof setInterval> | undefined;
const toggles = [...document.querySelectorAll<HTMLButtonElement>('[data-timer-toggle]')];
const announcement = document.querySelector<HTMLElement>('[data-timer-announcement]');
const compact = document.querySelector<HTMLElement>('[data-timer-exposure-status]');
function update() {
  const state = exposureTiming(plan, clock.elapsedMilliseconds);
  if (state.finished) { clock.pause(); if (interval) clearInterval(interval); interval = undefined; }
  const minutes = String(Math.floor(state.remainingSeconds / 60)).padStart(2, '0');
  const seconds = String(state.remainingSeconds % 60).padStart(2, '0');
  document.querySelectorAll('[data-timer-clock]').forEach(node => { node.textContent = `${minutes}:${seconds}`; });
  document.querySelectorAll('[data-timer-stage]').forEach(node => { node.textContent = state.finished ? 'Tiempo concluido' : state.label; });
  toggles.forEach(button => {
    const label = clock.running ? 'Pausa' : enabled && !state.finished ? 'Reanudar' : 'Iniciar';
    button.textContent = label;
    button.setAttribute('aria-label', `${label} cronómetro`);
    button.disabled = state.finished;
  });
  if (selector) selector.disabled = enabled;
  if (compact) compact.hidden = !enabled || !document.documentElement.classList.contains('exposure-mode') || document.documentElement.classList.contains('fullscreen-exposure');
  document.querySelectorAll<HTMLElement>('[data-timer-fullscreen]').forEach(node => { node.hidden = !enabled; });
  document.querySelectorAll<HTMLElement>('[data-timer-warning]').forEach(node => {
    node.hidden = !state.warning || !clock.running;
    node.textContent = `${node.hasAttribute('data-timer-warning-compact') ? 'Bloque' : 'Cierre de bloque'} · ${plan.stages[state.stageIndex].endSeconds - state.elapsedSeconds} s`;
  });
  document.documentElement.classList.toggle('timer-warning', state.warning && clock.running);
  const key = state.finished ? 'finished' : `${state.stageIndex}:${state.warning}`;
  if (enabled && key !== announcementKey && announcement) {
    announcement.textContent = state.finished ? 'Han terminado los 15 minutos de exposición.' : state.warning ? `Quedan 15 segundos para cerrar ${state.label}.${state.nextLabel ? ` Sigue: ${state.nextLabel}.` : ''}` : `Bloque: ${state.label}.`;
    announcementKey = key;
  }
}
function toggle() {
  if (clock.running) { clock.pause(); if (interval) clearInterval(interval); interval = undefined; }
  else { enabled = true; clock.start(); interval = setInterval(update, 250); }
  update();
}
if (root && selector) {
  root.hidden = false;
  toggles.forEach(button => button.addEventListener('click', toggle));
  selector.addEventListener('change', () => {
    plan = plans.find(item => item.id === selector.value) ?? plans[0];
    const description = document.querySelector('[data-timer-plan-description]');
    if (description) description.textContent = plan.id === 'oral' ? 'Guion oral: cambios a los 3:30, 7:00, 10:30 y 14:30; cierre a los 15:00.' : 'Con actividad: cambios a los 3:00, 6:00, 9:00 y 12:00; actividad y cierre hasta los 15:00.';
    update();
  });
  document.querySelector('[data-timer-reset]')?.addEventListener('click', () => {
    if (interval) clearInterval(interval);
    interval = undefined; clock.reset(); enabled = false; announcementKey = '';
    if (announcement) announcement.textContent = 'Cronómetro reiniciado.';
    update();
  });
  new MutationObserver(update).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', update);
  update();
}
