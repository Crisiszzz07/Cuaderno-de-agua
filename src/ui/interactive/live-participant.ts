import type { LiveSnapshot, LiveSubmission } from '../../domain/live-activity.ts';
import { scoreLiveAnswers } from '../../application/evaluate-live.ts';
import { CLARITY_LABELS, LIVE_POLL_MS } from '../../shared/live-constants.ts';
import { liveApi, LiveApiError, formatTime, reportError } from './live-api.ts';
import { renderLiveStatistics } from './live-statistics.ts';

const root = document.querySelector<HTMLElement>('[data-live-participant]');
if (root) {
  const codeForm = root.querySelector<HTMLFormElement>('[data-live-code-form]')!;
  const session = root.querySelector<HTMLElement>('[data-participant-session]')!;
  const message = root.querySelector<HTMLElement>('[data-participant-message]')!;
  const waiting = root.querySelector<HTMLElement>('[data-participant-waiting]')!;
  const form = root.querySelector<HTMLFormElement>('[data-participant-questions]')!;
  const questionArea = root.querySelector<HTMLElement>('[data-participant-question]')!;
  const next = root.querySelector<HTMLButtonElement>('[data-participant-next]')!;
  const back = root.querySelector<HTMLButtonElement>('[data-participant-back]')!;
  const resultArea = root.querySelector<HTMLElement>('[data-participant-result]')!;
  const statistics = root.querySelector<HTMLElement>('[data-participant-statistics]')!;
  let code = '';
  let key = '';
  let snapshot: LiveSnapshot | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let step = 0;
  let renderedStep = -1;
  let before = 0;
  let after = 0;
  let answers: string[] = [];
  let pending: LiveSubmission | undefined;
  let acknowledged = false;
  let running = false;
  let expiresAt = 0;
  let sending = false;
  let resultsShown = false;
  function showMessage(text: string) { message.textContent = text; message.hidden = false; }
  function discard(text: string) {
    running = false;
    if (timer) clearTimeout(timer);
    key = ''; code = ''; snapshot = undefined; before = 0; after = 0; answers = []; pending = undefined; acknowledged = false;
    session.hidden = true; codeForm.hidden = false;
    questionArea.replaceChildren(); resultArea.replaceChildren(); statistics.replaceChildren(); waiting.textContent = '';
    showMessage(text);
  }
  function renderQuestion() {
    if (!snapshot || renderedStep === step) return;
    const question = step > 0 && step < 4 ? snapshot.questions[step - 1] : undefined;
    const prompt = question?.prompt ?? (step === 0 ? 'Antes de responder: ¿qué tan claro te resulta el tema?' : 'Después de responder: ¿qué tan claro te resulta el tema?');
    const options = question?.options ?? CLARITY_LABELS.map((label, index) => ({ id: String(index + 1), label }));
    const selected = step === 0 ? String(before) : step === 4 ? String(after) : answers[step - 1];
    questionArea.replaceChildren();
    if (question) { const context = document.createElement('p'); context.textContent = question.context; questionArea.append(context); }
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend'); legend.textContent = prompt; fieldset.append(legend);
    options.forEach(option => {
      const label = document.createElement('label');
      const input = document.createElement('input'); input.type = 'radio'; input.name = 'choice'; input.value = option.id; input.required = true; input.checked = selected === option.id;
      const text = document.createElement('span'); text.textContent = option.label;
      label.append(input, text); fieldset.append(label);
    });
    questionArea.append(fieldset);
    root!.querySelector<HTMLElement>('[data-participant-progress]')!.textContent = `Paso ${step + 1} de 5${question ? ' · Pregunta puntuada' : ' · Percepción, sin puntaje'}`;
    next.textContent = step === 4 ? 'Enviar respuestas' : 'Continuar';
    back.disabled = step === 0;
    renderedStep = step;
  }
  function update() {
    if (!snapshot) return;
    const phase = snapshot.phase;
    root!.querySelector<HTMLElement>('[data-participant-phase]')!.textContent = phase === 'joining' ? 'Entrada y primera valoración' : phase === 'answering' ? 'Tiempo para responder' : 'Resultados y cierre';
    root!.querySelector<HTMLElement>('[data-participant-clock]')!.textContent = formatTime((phase === 'joining' ? snapshot.joinEndsAt : phase === 'answering' ? snapshot.answerEndsAt : snapshot.expiresAt) - snapshot.serverNow);
    if (phase === 'results') {
      form.hidden = true; waiting.hidden = true;
      if (!resultsShown) {
        resultArea.hidden = false;
        const text = document.createElement('p');
        const included = acknowledged && pending;
        const score = included ? scoreLiveAnswers(pending!.answers, snapshot.explanations?.map(explanation => explanation.expected) ?? []) : 0;
        text.textContent = included ? `Tu conexión obtuvo ${score} de ${snapshot.questions.length} puntos. Cada acierto vale un punto; no se puntúa la rapidez ni tu percepción.` : 'No se enviaron todas las respuestas a tiempo. Tu conexión no se incluyó en los puntajes ni en las valoraciones del grupo.';
        resultArea.replaceChildren(text);
        statistics.hidden = false;
        renderLiveStatistics(statistics, snapshot, 2);
        resultsShown = true;
      }
      return;
    }
    if (pending || (phase === 'joining' && step > 0)) {
      form.hidden = true; waiting.hidden = false;
      waiting.textContent = pending ? acknowledged ? 'Tus respuestas llegaron. Los resultados se mostrarán al cerrar el tiempo de participación.' : 'Comprobando el envío. Si vuelve la conexión antes del cierre, se reintentará sin duplicar tu respuesta.' : 'Primera valoración lista. Las preguntas empezarán al terminar la entrada.';
      return;
    }
    waiting.hidden = true; form.hidden = false;
    renderQuestion();
  }
  async function poll() {
    if (!running) return;
    if (Date.now() >= expiresAt) { discard('La sesión terminó. Tus respuestas, puntaje y estadísticas temporales se han descartado.'); return; }
    try {
      const value = await liveApi.state(code, key);
      if (!running) return;
      snapshot = value; acknowledged ||= value.participantSubmitted === true; message.hidden = true; update();
      if (pending && !acknowledged && value.phase === 'answering' && !sending) void sendPending();
    } catch (error) {
      if (!running) return;
      if (error instanceof LiveApiError && error.status === 404) { discard(error.message); return; }
      showMessage(reportError(error));
    }
    if (running) timer = setTimeout(poll, LIVE_POLL_MS);
  }
  async function joinSession(value: string) {
    const normalized = value.trim().toUpperCase();
    if (!/^[A-F0-9]{8}$/.test(normalized)) { showMessage('Escribe el código de ocho caracteres que aparece en la exposición.'); return; }
    const button = codeForm.querySelector<HTMLButtonElement>('button')!;
    button.disabled = true;
    try {
      const joined = await liveApi.join(normalized);
      code = normalized; key = joined.participantKey; snapshot = joined.snapshot;
      expiresAt = Date.now() + joined.snapshot.expiresAt - joined.snapshot.serverNow;
      step = 0; renderedStep = -1; before = 0; after = 0; answers = []; pending = undefined; acknowledged = false; resultsShown = false;
      codeForm.hidden = true; session.hidden = false; resultArea.hidden = true; statistics.hidden = true;
      running = true; message.hidden = true; update(); void poll();
    } catch (error) { showMessage(reportError(error)); }
    finally { button.disabled = false; }
  }
  codeForm.addEventListener('submit', event => {
    event.preventDefault();
    const code = new FormData(codeForm).get('code');
    if (typeof code === 'string') void joinSession(code);
  });
  function saveChoice() {
    const choice = new FormData(form).get('choice');
    if (typeof choice !== 'string') return false;
    if (step === 0) before = Number(choice);
    else if (step === 4) after = Number(choice);
    else answers[step - 1] = choice;
    return true;
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || !running || !saveChoice()) return;
    if (step < 4) {
      step++; renderedStep = -1; update();
      questionArea.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
      return;
    }
    pending = { answers: [...answers], before, after };
    update();
    await sendPending();
  });
  async function sendPending() {
    if (!pending || sending || !running) return;
    sending = true; next.disabled = true; back.disabled = true;
    try {
      await liveApi.submit(code, pending, key);
      if (!running) return;
      acknowledged = true;
      message.hidden = true; update();
    } catch (error) { showMessage(reportError(error)); }
    finally { sending = false; next.disabled = false; back.disabled = step === 0; }
  }
  back.addEventListener('click', () => {
    if (sending || step === 0) return;
    saveChoice(); step--; renderedStep = -1; update();
    questionArea.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
  });
  const initial = new URL(location.href).searchParams.get('sesion');
  if (initial) { codeForm.querySelector<HTMLInputElement>('input')!.value = initial; void joinSession(initial); }
}
