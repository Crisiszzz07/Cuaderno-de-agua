import type { CoverAuthorship } from '../../domain/private-cover.ts';

const printButton = document.querySelector<HTMLButtonElement>('[data-print-slides]');
const toggle = document.querySelector<HTMLButtonElement>('[data-private-cover-toggle]');
const form = document.querySelector<HTMLFormElement>('[data-private-cover-form]');
const codeInput = document.querySelector<HTMLInputElement>('[data-cover-code]');
const authorship = document.querySelector<HTMLElement>('[data-cover-authorship]');
const status = document.querySelector<HTMLElement>('[data-private-cover-status]');
let expiry: ReturnType<typeof setTimeout> | undefined;
let generation = 0;
function clearAuthorship() {
  if (expiry) clearTimeout(expiry);
  if (authorship) {
    authorship.hidden = true;
    authorship.querySelector('[data-cover-authors]')?.replaceChildren();
    for (const selector of ['[data-cover-institution]', '[data-cover-semester]']) {
      const node = authorship.querySelector(selector);
      if (node) node.textContent = '';
    }
  }
  if (codeInput) codeInput.value = '';
}
function closeForm() {
  generation++;
  if (form) form.hidden = true;
  toggle?.setAttribute('aria-expanded', 'false');
  clearAuthorship();
}
if (printButton) {
  printButton.hidden = false;
  printButton.addEventListener('click', () => { closeForm(); window.print(); });
}
if (toggle && form && codeInput && authorship && status && location.protocol === 'https:') {
  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    if (!form.hidden) { closeForm(); return; }
    form.hidden = !form.hidden;
    toggle.setAttribute('aria-expanded', String(!form.hidden));
    status.textContent = '';
    codeInput.value = '';
    if (!form.hidden) codeInput.focus();
  });
  document.querySelector('[data-private-cover-cancel]')?.addEventListener('click', () => { closeForm(); toggle.focus(); });
  let pending = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || !form.reportValidity()) return;
    pending = true;
    const requestGeneration = generation;
    const code = codeInput.value;
    codeInput.value = '';
    const submit = form.querySelector<HTMLButtonElement>('[type="submit"]');
    if (submit) submit.disabled = true;
    status.textContent = 'Validando acceso…';
    try {
      const response = await fetch('/api/private-cover', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }),
        credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(10_000),
      });
      if (requestGeneration !== generation) return;
      if (!response.ok) {
        status.textContent = response.status === 429 ? 'Espera un minuto antes de volver a intentar.' : response.status === 403 ? 'El código no permite acceder a esta portada.' : 'Esta portada no está disponible. Puedes guardar el PDF general.';
        codeInput.focus();
        return;
      }
      const data = await response.json() as CoverAuthorship;
      if (!Array.isArray(data.authors) || !data.authors.every(name => typeof name === 'string') || typeof data.institution !== 'string' || typeof data.semester !== 'string') throw new Error('Respuesta no válida');
      const list = authorship.querySelector('[data-cover-authors]');
      list?.replaceChildren(...data.authors.map(name => { const item = document.createElement('li'); item.textContent = name; return item; }));
      const institution = authorship.querySelector('[data-cover-institution]');
      const semester = authorship.querySelector('[data-cover-semester]');
      if (institution) institution.textContent = data.institution;
      if (semester) semester.textContent = data.semester;
      authorship.hidden = false;
      status.textContent = 'Portada con autoría lista para imprimir.';
      form.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      expiry = setTimeout(clearAuthorship, 120_000);
      window.print();
    } catch {
      status.textContent = 'No se pudo validar el acceso. Inténtalo de nuevo con conexión al sitio.';
      clearAuthorship();
    } finally {
      pending = false;
      if (submit) submit.disabled = false;
    }
  });
}
window.addEventListener('afterprint', clearAuthorship);
window.addEventListener('pagehide', closeForm);
