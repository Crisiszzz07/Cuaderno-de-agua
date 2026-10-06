import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { LiveActivity } from '../src/application/live-activity.ts';
import { MemoryLiveStore } from '../src/infrastructure/memory-live-store.ts';
import { liveQuestions } from '../src/infrastructure/live-questions.ts';
import { createLiveHandler } from '../server/live-http.ts';

function setup(publicOrigin?: string) {
  let time = 0; let counter = 0;
  const activity = new LiveActivity(new MemoryLiveStore(), liveQuestions, () => time, () => (++counter).toString(16).padStart(8, '0') + 'b'.repeat(40));
  const handler = createLiveHandler(activity, 'public', publicOrigin);
  async function call(path: string, method = 'GET', body?: unknown, key?: string, origin = 'https://foticos.test', raw?: string, host = 'foticos.test') {
    const request = Readable.from(body === undefined && raw === undefined ? [] : [raw ?? JSON.stringify(body)]) as unknown as IncomingMessage;
    request.url = path; request.method = method;
    request.headers = { host, origin, 'content-type': 'application/json', ...(key ? { authorization: `Bearer ${key}` } : {}) };
    const headers: Record<string, string> = {};
    let status = 0; let output = '';
    const response = {
      headersSent: false,
      setHeader: (key: string, value: string) => { headers[key.toLowerCase()] = value; },
      writeHead: (value: number, extra: Record<string, string>) => { status = value; Object.assign(headers, Object.fromEntries(Object.entries(extra).map(([key, value]) => [key.toLowerCase(), value]))); },
      end: (value?: string | Uint8Array) => { output = value === undefined ? '' : typeof value === 'string' ? value : new TextDecoder().decode(value); },
    } as unknown as ServerResponse;
    await handler(request, response);
    return { status, headers, body: output, json: () => JSON.parse(output) };
  }
  return { call, at: (value: number) => { time = value; } };
}

test('el protocolo HTTP permite crear, unir, puntuar, consultar y borrar sin cookies', async () => {
  const { call, at } = setup();
  const created = await call('/api/live/sessions', 'POST', {});
  assert.equal(created.status, 201); const { code, hostKey } = created.json();
  const joined = await call(`/api/live/sessions/${code}/join`, 'POST', {});
  assert.equal(joined.status, 201); const { participantKey } = joined.json();
  at(30_000);
  const submitted = await Promise.all(Array.from({ length: 2 }, () => call(`/api/live/sessions/${code}/answers`, 'POST', { answers: liveQuestions.map(question => question.expected), before: 2, after: 5 }, participantKey)));
  assert.ok(submitted.every(response => response.status === 200));
  const personalState = await call(`/api/live/sessions/${code}`, 'GET', undefined, participantKey);
  assert.equal(personalState.json().participantSubmitted, true);
  at(135_000);
  const state = await call(`/api/live/sessions/${code}`);
  assert.equal(state.json().statistics.meanScore, 3);
  assert.equal(state.json().statistics.responses, 1, 'dos solicitudes simultáneas no duplican el voto');
  assert.equal(state.headers['cache-control'], 'no-store');
  assert.ok(!state.headers['set-cookie']);
  assert.ok(!state.body.includes(hostKey) && !state.body.includes(participantKey));
  assert.equal((await call(`/api/live/sessions/${code}`, 'DELETE', undefined, hostKey)).status, 200);
  assert.equal((await call(`/api/live/sessions/${code}`)).status, 404);
});
test('el despliegue exige el origen HTTPS exacto y conserva la salud local', async () => {
  const { call } = setup('https://foticos.test');
  assert.equal((await call('/api/live/sessions', 'POST', {})).status, 201);
  assert.equal((await call('/api/live/sessions', 'POST', {}, undefined, 'http://foticos.test')).status, 403);
  assert.equal((await call('/api/live/sessions', 'POST', {}, undefined, '')).status, 403);
  assert.equal((await call('/api/live/sessions', 'POST', {}, undefined, 'https://foticos.test', undefined, 'another.test')).status, 403);
  assert.equal((await call('/api/live/health', 'GET', undefined, undefined, '', undefined, '127.0.0.1:8082')).status, 200);
  assert.equal((await call('/api/live/health')).status, 200);
  assert.throws(() => setup('http://foticos.test'));
  assert.throws(() => setup('https://foticos.test/'));
});
test('las mutaciones rechazan otro origen, datos personales, JSON inválido y cargas grandes', async () => {
  const { call } = setup();
  assert.equal((await call('/api/live/sessions', 'POST', {}, undefined, 'https://another.test')).status, 403);
  assert.equal((await call('/api/live/sessions', 'POST', { name: 'dato no requerido' })).status, 400);
  assert.equal((await call('/api/live/sessions', 'POST', undefined, undefined, undefined, '{')).status, 400);
  assert.equal((await call('/api/live/sessions', 'POST', undefined, undefined, undefined, 'x'.repeat(4097))).status, 413);
});
test('una sesión desaparece a los tres minutos aun si nadie la consulta', async () => {
  const { call, at } = setup(); const created = (await call('/api/live/sessions', 'POST', {})).json();
  at(180_000);
  assert.equal((await call(`/api/live/sessions/${created.code}`)).status, 404);
});
test('el servidor sirve recursos locales, protege rutas y no habilita solicitudes externas', async () => {
  const { call } = setup();
  const asset = await call('/favicon.svg'); assert.equal(asset.status, 200);
  assert.equal(asset.headers['content-type'], 'image/svg+xml');
  assert.ok(asset.headers['content-security-policy'].includes("connect-src 'self'"));
  assert.equal(asset.headers['referrer-policy'], 'no-referrer');
  assert.equal((await call('/%00')).status, 400);
  assert.equal((await call('/no-existe')).status, 404);
  assert.equal((await call('/favicon.svg', 'POST', {})).status, 405);
});
