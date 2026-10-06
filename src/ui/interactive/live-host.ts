import { LIVE_POLL_MS } from '../../shared/live-constants.ts';
import { liveApi, LiveApiError, formatTime, reportError } from './live-api.ts';
import { renderLiveStatistics } from './live-statistics.ts';

const hostRoot = document.querySelector<HTMLElement>('[data-live-host]');
if (hostRoot) {
  const root: HTMLElement = hostRoot;
  const create = root.querySelector<HTMLButtonElement>('[data-live-create]')!;
  const session = root.querySelector<HTMLElement>('[data-live-session]')!;
  const message = root.querySelector<HTMLElement>('[data-live-host-message]')!;
  const end = root.querySelector<HTMLButtonElement>('[data-live-end]')!;
  const statistics = root.querySelector<HTMLElement>('[data-live-statistics]')!;
  const localActivity = root.closest('section')?.querySelector<HTMLElement>('[data-local-activity]');
  let code = '';
  let hostKey = '';
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;
  let resultsShown = false;
  let expiresAt = 0;
  create.hidden = false;
  function showMessage(text: string) { message.textContent = text; message.hidden = false; }
  function discard(text: string) {
    running = false;
    if (timer) clearTimeout(timer);
    code = ''; hostKey = ''; resultsShown = false;
    session.hidden = true;
    if (localActivity) localActivity.hidden = false;
    statistics.replaceChildren();
    root.querySelector('[data-live-qr]')?.replaceChildren();
    root.querySelector<HTMLElement>('[data-live-code]')!.textContent = '';
    const link = root.querySelector<HTMLAnchorElement>('[data-live-join-link]')!;
    link.removeAttribute('href'); link.textContent = '';
    root.querySelector<HTMLElement>('[data-live-joined]')!.textContent = '0';
    root.querySelector<HTMLElement>('[data-live-submitted]')!.textContent = '0';
    create.disabled = false;
    showMessage(text);
  }
  async function poll() {
    if (!running) return;
    if (Date.now() >= expiresAt) { discard('La sesión terminó. La información temporal se ha descartado.'); return; }
    try {
      const snapshot = await liveApi.state(code);
      if (!running) return;
      message.hidden = true;
      root.querySelector<HTMLElement>('[data-live-phase]')!.textContent = snapshot.phase === 'joining' ? 'Entrar a la sesión' : snapshot.phase === 'answering' ? 'Responder desde el teléfono' : 'Comentar los resultados';
      root.querySelector<HTMLElement>('[data-live-clock]')!.textContent = formatTime(snapshot.expiresAt - snapshot.serverNow);
      root.querySelector<HTMLElement>('[data-live-joined]')!.textContent = String(snapshot.joined);
      root.querySelector<HTMLElement>('[data-live-submitted]')!.textContent = String(snapshot.submitted);
      if (snapshot.phase === 'results' && !resultsShown) {
        root.querySelector<HTMLElement>('[data-live-lobby]')!.hidden = true;
        statistics.hidden = false;
        renderLiveStatistics(statistics, snapshot);
        resultsShown = true;
      }
    } catch (error) {
      if (!running) return;
      if (error instanceof LiveApiError && error.status === 404) { discard('La sesión terminó. La información temporal se ha descartado.'); return; }
      showMessage(reportError(error));
    }
    if (running) timer = setTimeout(poll, LIVE_POLL_MS);
  }
  create.addEventListener('click', async () => {
    create.disabled = true;
    create.textContent = 'Abriendo sesión…';
    message.hidden = true;
    try {
      const { createQrPath } = await import('../../infrastructure/qr-code.ts');
      const result = await liveApi.create();
      code = result.code; hostKey = result.hostKey; running = true; resultsShown = false;
      expiresAt = Date.now() + result.snapshot.expiresAt - result.snapshot.serverNow;
      session.hidden = false; statistics.hidden = true;
      if (localActivity) localActivity.hidden = true;
      root.querySelector<HTMLElement>('[data-live-lobby]')!.hidden = false;
      root.querySelector<HTMLElement>('[data-live-code]')!.textContent = code;
      const url = new URL('/participar/', location.origin); url.searchParams.set('sesion', code);
      const link = root.querySelector<HTMLAnchorElement>('[data-live-join-link]')!;
      link.href = url.href; link.textContent = url.href;
      root.querySelector<HTMLElement>('[data-live-address-note]')!.hidden = !['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
      const qr = createQrPath(url.href);
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', `0 0 ${qr.size} ${qr.size}`);
      svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', `QR para participar en la sesión ${code}. El mismo enlace aparece al lado.`);
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('d', qr.path);
      svg.append(path);
      root.querySelector('[data-live-qr]')!.replaceChildren(svg);
      void poll();
    } catch (error) {
      discard(error instanceof LiveApiError ? error.message : 'No se pudo abrir la sesión. Comprueba la conexión y que el alojamiento incluya la actividad en vivo; puedes usar la alternativa local.');
    }
    finally { create.textContent = 'Abrir sesión de 3 min'; }
  });
  end.addEventListener('click', async () => {
    end.disabled = true;
    try { await liveApi.end(code, hostKey); discard('Sesión terminada: estadísticas y accesos temporales borrados.'); }
    catch (error) { showMessage(reportError(error)); }
    finally { end.disabled = false; }
  });
}
