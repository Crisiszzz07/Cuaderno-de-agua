import test from 'node:test';
import assert from 'node:assert/strict';
import { createQrPath } from '../src/infrastructure/qr-code.ts';

test('el QR genera módulos reales con zona libre de cuatro módulos y enlace HTTPS', () => {
  const qr = createQrPath('https://example.org/participar/?sesion=ABCDEF01');
  assert.ok(qr.size >= 29);
  const points = [...qr.path.matchAll(/M(\d+) (\d+)h1v1h-1z/g)].map(match => [Number(match[1]), Number(match[2])]);
  assert.ok(points.length > 100);
  assert.ok(points.every(([x, y]) => x >= 4 && y >= 4 && x < qr.size - 4 && y < qr.size - 4));
  assert.ok(points.some(([x, y]) => x === 4 && y === 4), 'patrón de posición superior izquierdo');
});
test('el QR no interpola HTML o texto del enlace dentro del SVG', () => {
  const qr = createQrPath('https://example.org/participar/?sesion=ABCDEF01');
  assert.match(qr.path, /^(M\d+ \d+h1v1h-1z)+$/);
  assert.ok(!qr.path.includes('https') && !qr.path.includes('<'));
});
