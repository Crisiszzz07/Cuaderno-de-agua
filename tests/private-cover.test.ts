import test from 'node:test';
import assert from 'node:assert/strict';
import { scryptSync } from 'node:crypto';
import { PrivateCover, parsePrivateCover } from '../server/private-cover.ts';
import { preparePresentation } from '../src/application/prepare-presentation.ts';

const salt = 'b'.repeat(32);
const config = { salt, hash: scryptSync('fixture-cover-code', salt, 64).toString('hex'), authorship: { institution: 'Institución de prueba', semester: 'Semestre de prueba', authors: ['Autor de prueba'] } };
test('la portada pública introduce Ecología y no contiene reparto ni autoría privada', () => {
  const cover = preparePresentation()[0];
  assert.match(cover.subtitle, /Ecología.*Universidad de Cartagena/);
  assert.equal(cover.items.length, 0);
  assert.ok(!JSON.stringify(cover).includes('Integrante'));
});
test('los intentos se limitan antes de calcular el hash y el bloqueo vence al minuto', async () => {
  let time = 0;
  const cover = new PrivateCover(config, () => time);
  for (let index = 0; index < 5; index++) await assert.rejects(cover.authorize({ code: 'wrong-code' }), { status: 403 });
  await assert.rejects(cover.authorize({ code: 'fixture-cover-code' }), { status: 429 });
  time = 60_000;
  const allowed = await cover.authorize({ code: 'fixture-cover-code' });
  assert.deepEqual(allowed.authors, ['Autor de prueba']);
  assert.ok(!('hash' in allowed) && !('salt' in allowed));
});
test('se rechazan configuración incompleta y datos adicionales en la solicitud', async () => {
  assert.throws(() => parsePrivateCover({ code: 'plaintext' }));
  const cover = new PrivateCover(parsePrivateCover(config));
  await assert.rejects(cover.authorize({ code: 'fixture-cover-code', name: 'extra' }), { status: 400 });
  await assert.rejects(cover.authorize({ code: 'x'.repeat(129) }), { status: 400 });
});
test('la configuración privada solo permite devolver los campos de autoría', async () => {
  const cover = new PrivateCover(parsePrivateCover({ ...config, authorship: { ...config.authorship, internalNote: 'no-publicar' } }));
  const result = await cover.authorize({ code: 'fixture-cover-code' });
  assert.deepEqual(Object.keys(result).sort(), ['authors', 'institution', 'semester']);
  assert.ok(!JSON.stringify(result).includes('no-publicar'));
});
