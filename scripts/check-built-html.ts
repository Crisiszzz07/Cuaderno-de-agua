import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Static sanity checks complement, and do not replace, browser accessibility review.
const html = await readFile('dist/index.html', 'utf8');
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'IDs duplicados');
for (const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(match[1]), `Ancla inexistente: ${match[1]}`);
assert.match(html, /<html lang="es"/);
assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
assert.equal((html.match(/<fieldset\b/g) ?? []).length, 9);
assert.equal((html.match(/<legend\b/g) ?? []).length, 9);
assert.equal((html.match(/type="radio"/g) ?? []).length, 27);
assert.equal((html.match(/<i>Acropora palmata<\/i>/g) ?? []).length, 2);
assert.equal((html.match(/<i>Acropora cervicornis<\/i>/g) ?? []).length, 2);
for (const match of html.matchAll(/<svg\b([^>]+)>/g)) {
  assert.ok(/aria-hidden="true"|role="img"/.test(match[1]), 'SVG sin nombre accesible o sin ocultación decorativa');
}
assert.ok(!/<iframe|https?:\/\/[^"']+\.(?:js|css|woff)/.test(html), 'Recursos externos inesperados');
assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>\s*\S/.test(html), 'Un script en línea sería bloqueado por la política de Nginx');
assert.ok(!/lorem ipsum|\bTODO\b|\bPLACEHOLDER\b/i.test(html));
console.log('HTML construido: anclas, nombres accesibles, nueve grupos de radios, cursivas y recursos locales correctos.');
const presentation = await readFile('dist/exposicion/index.html', 'utf8');
assert.equal((presentation.match(/class="export-slide/g) ?? []).length, 16);
const presentationIds = [...presentation.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(presentationIds).size, presentationIds.length);
assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>\s*\S/.test(presentation));
const pptx = await readFile('dist/downloads/ecosistemas-foticos.pptx');
assert.equal(pptx.readUInt32LE(0), 0x04034b50);
console.log('Exportación construida: 16 diapositivas, IDs únicos, scripts locales y descarga PPTX disponible.');
const participant = await readFile('dist/participar/index.html', 'utf8');
assert.match(participant, /lang="es"/);
assert.match(participant, /data-live-participant/);
assert.ok(!/type="(?:email|password)"/.test(participant));
assert.match(html, /data-live-host/);
console.log('Actividad construida: vista de anfitrión y participación sin correo, nombre o contraseña.');
