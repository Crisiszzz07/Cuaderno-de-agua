import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { chromium } from 'playwright';
import { LiveActivity } from '../src/application/live-activity.ts';
import { MemoryLiveStore } from '../src/infrastructure/memory-live-store.ts';
import { liveQuestions } from '../src/infrastructure/live-questions.ts';
import { createLiveHandler } from '../server/live-http.ts';

// Real browser pages + real HTTP adapter, routed in-process without network sockets.
let clock = Date.now(); let counter = 0;
const store = new MemoryLiveStore();
const activity = new LiveActivity(store, liveQuestions, () => clock, () => (++counter).toString(16).padStart(8, '0') + 'c'.repeat(40));
const handler = createLiveHandler(activity, 'dist');
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ reducedMotion: 'reduce' });
await mkdir('test-results/live', { recursive: true });
await context.route('**/*', async route => {
  const url = new URL(route.request().url());
  assert.equal(url.hostname, 'foticos.test');
  const request = Readable.from(route.request().postDataBuffer() ? [route.request().postDataBuffer()!] : []) as unknown as IncomingMessage;
  request.url = url.pathname + url.search;
  request.method = route.request().method();
  request.headers = { ...await route.request().allHeaders(), host: 'foticos.test' };
  const headers: Record<string, string> = {};
  let status = 200; let body = Buffer.alloc(0);
  const response = {
    headersSent: false,
    setHeader: (key: string, value: string) => { headers[key.toLowerCase()] = String(value); },
    writeHead: (value: number, extra: Record<string, string | number>) => { status = value; Object.entries(extra).forEach(([key, value]) => { headers[key.toLowerCase()] = String(value); }); },
    end: (value?: string | Uint8Array) => { body = value === undefined ? Buffer.alloc(0) : typeof value === 'string' ? Buffer.from(value) : Buffer.from(value); },
  } as unknown as ServerResponse;
  await handler(request, response);
  await route.fulfill({ status, headers, body });
});
const errors: string[] = [];
context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
try {
  const host = await context.newPage();
  await host.setViewportSize({ width: 1440, height: 900 });
  await host.goto('https://foticos.test/#actividad');
  await host.getByRole('button', { name: 'Abrir sesión de 3 min', exact: true }).click();
  await host.locator('[data-live-qr] svg').waitFor();
  assert.equal(await host.locator('[data-local-activity]').isVisible(), false);
  const link = await host.locator('[data-live-join-link]').getAttribute('href');
  assert.ok(link);
  assert.ok(link.startsWith('https://foticos.test/participar/?sesion='));
  const first = await context.newPage(); const second = await context.newPage();
  for (const page of [first, second]) await page.setViewportSize({ width: 375, height: 812 });
  await Promise.all([first.goto(link), second.goto(link)]);
  await first.getByLabel('Poco claro', { exact: true }).check();
  await first.getByRole('button', { name: 'Continuar', exact: true }).click();
  await second.getByLabel('Nada claro', { exact: true }).check();
  await second.getByRole('button', { name: 'Continuar', exact: true }).click();
  await first.getByText('Primera valoración lista.', { exact: false }).waitFor();
  clock += 30_000;
  for (const [page, allCorrect] of [[first, true], [second, false]] as const) {
    for (const [index, question] of liveQuestions.entries()) {
      const option = question.options.find(option => allCorrect || index === 0 ? option.id === question.expected : option.id !== question.expected)!;
      await page.getByLabel(option.label, { exact: true }).check();
      await page.getByRole('button', { name: 'Continuar', exact: true }).click();
    }
    await page.getByLabel(allCorrect ? 'Muy claro' : 'Algo claro', { exact: true }).check();
    await page.getByRole('button', { name: 'Enviar respuestas', exact: true }).click();
    await page.getByText('Tus respuestas llegaron.', { exact: false }).waitFor();
  }
  clock += 105_000;
  await host.getByText('2 respuestas completas de 2 conexiones · Promedio: 2.0 de 3 puntos.', { exact: true }).waitFor();
  await first.getByText('Tu conexión obtuvo 3 de 3 puntos.', { exact: false }).waitFor();
  await second.getByText('Tu conexión obtuvo 1 de 3 puntos.', { exact: false }).waitFor();
  assert.equal(await host.locator('table tbody tr').count(), 5);
  assert.equal(await host.locator('.live-bar-row meter').count(), 9);
  await host.locator('[data-live-statistics]').screenshot({ path: 'test-results/live/estadisticas.png' });
  await first.screenshot({ path: 'test-results/live/participante-375.png', fullPage: true });
  assert.equal((await context.cookies()).length, 0);
  for (const page of [host, first, second]) assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
  clock += 45_000; activity.purge();
  await host.getByText('La sesión terminó. La información temporal se ha descartado.', { exact: true }).waitFor();
  await first.getByText(/La sesión terminó|La sesión terminó o no existe/).waitFor();
  assert.equal(await host.locator('[data-live-statistics]').textContent(), '');
  assert.equal(await first.locator('[data-participant-result]').textContent(), '');
  assert.equal(store.size, 0);
  assert.deepEqual(errors, []);
  console.log('Actividad QR: anfitrión + dos teléfonos, puntajes, percepción, tres minutos y descarte; sin cookies, almacenamiento ni red externa.');
} finally { await browser.close(); }
