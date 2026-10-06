import test from 'node:test';
import assert from 'node:assert/strict';
import { checkDeployment } from '../scripts/check-deployment.ts';

test('el ensayo remoto comprueba recursos y HTTPS sin crear sesiones', async context => {
  const calls: string[] = [];
  context.mock.method(globalThis, 'fetch', async (input: URL) => {
    calls.push(input.href);
    if (input.protocol === 'http:') return new Response(null, { status: 301, headers: { location: 'https://agua.test/' } });
    return new Response(input.pathname === '/api/live/health' ? JSON.stringify({ available: true, persistence: 'memory', durationSeconds: 180 }) : 'recurso', {
      headers: {
        'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer',
        'content-security-policy': "frame-ancestors 'none'", 'strict-transport-security': 'max-age=86400',
        'cache-control': 'no-store',
      },
    });
  });
  await checkDeployment(new URL('https://agua.test'));
  assert.equal(calls.length, 6);
  assert.ok(calls.includes('https://agua.test/participar/'));
  assert.ok(calls.every(url => !url.includes('/sessions')));
});

test('el ensayo rechaza HTTP, cabeceras ausentes y conexiones fallidas', async context => {
  await assert.rejects(checkDeployment(new URL('http://agua.test')), /HTTPS/);
  context.mock.method(globalThis, 'fetch', async () => new Response('sin protección'));
  await assert.rejects(checkDeployment(new URL('https://agua.test')), /nosniff/);
  context.mock.restoreAll();
  context.mock.method(globalThis, 'fetch', async () => { throw new Error('certificado no válido'); });
  await assert.rejects(checkDeployment(new URL('https://agua.test')), /certificado/);
});
