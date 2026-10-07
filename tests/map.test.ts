import test from 'node:test';
import assert from 'node:assert/strict';
import { colombiaOutline, colombiaPath } from '../src/infrastructure/colombia-outline.ts';
test('el contorno continental conserva el anillo y extremos de Natural Earth', () => {
  assert.deepEqual(colombiaOutline[0], colombiaOutline.at(-1));
  assert.equal(Math.min(...colombiaOutline.map(point => point[0])), -78.990935);
  assert.equal(Math.max(...colombiaOutline.map(point => point[1])), 12.437303);
  assert.equal(Math.min(...colombiaOutline.map(point => point[1])), -4.298187);
  assert.ok(colombiaOutline.length > 90);
  assert.match(colombiaPath(), /^M[\d.]+ [\d.]+ L/);
  assert.ok(colombiaPath().endsWith('Z') && !colombiaPath().includes('NaN'));
});
