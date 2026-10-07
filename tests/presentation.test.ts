import test from 'node:test';
import assert from 'node:assert/strict';
import { preparePresentation } from '../src/application/prepare-presentation.ts';
import { getReferences } from '../src/application/get-content.ts';
import { createPresentationPptx } from '../src/infrastructure/export/pptx.ts';
import { crc32 } from '../src/infrastructure/export/zip.ts';

function unzipStored(bytes: Uint8Array): Map<string, string> {
  const files = new Map<string, string>();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decode = new TextDecoder();
  let offset = 0;
  while (view.getUint32(offset, true) === 0x04034b50) {
    assert.equal(view.getUint16(offset + 8, true), 0);
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const name = decode.decode(bytes.subarray(offset + 30, offset + 30 + nameLength));
    const start = offset + 30 + nameLength + extraLength;
    const body = bytes.subarray(start, start + size);
    assert.equal(crc32(body), view.getUint32(offset + 14, true), name);
    assert.ok(!files.has(name));
    files.set(name, decode.decode(body));
    offset = start + size;
  }
  assert.equal(view.getUint32(offset, true), 0x02014b50);
  assert.equal(view.getUint32(bytes.length - 22, true), 0x06054b50);
  assert.equal(view.getUint16(bytes.length - 12, true), files.size);
  return files;
}
test('el resumen conserva temas, tres explicaciones y todas las referencias', () => {
  const slides = preparePresentation();
  assert.equal(slides.length, 16);
  assert.equal(new Set(slides.map(slide => slide.id)).size, slides.length);
  for (const id of ['luz', 'colombia', 'factores', 'red', 'vida', 'corales', 'presiones', 'cuidar', 'acciones', 'actividad-grupos']) assert.ok(slides.some(slide => slide.id === id));
  assert.equal(slides.filter(slide => slide.id.startsWith('explicacion-')).length, 3);
  assert.deepEqual(slides.flatMap(slide => slide.references ?? []).map(reference => reference.id), getReferences().map(reference => reference.id));
  slides.forEach(slide => getReferences(slide.citationIds));
});
test('el PDF ofrece enlace de actividad y conserva categorías y años de amenaza', () => {
  const slides = preparePresentation();
  const activity = slides.find(slide => slide.id === 'actividad-grupos')!;
  assert.equal(activity.activityLink, 'https://cuadernodeagua.duckdns.org/#actividad');
  assert.match(activity.paragraphs.join(' '), /allí se genera el QR/);
  const corals = slides.find(slide => slide.id === 'corales')!;
  assert.match(corals.items[0].text, /En Peligro \(EN\).*2002.*2024/);
  assert.match(corals.items[1].text, /En Peligro Crítico \(CR\).*2002.*2024/);
  assert.ok(slides.filter(slide => slide.references).every(slide => slide.references!.length <= 10));
});
test('el PPTX empaqueta slides, tema, master, layout y enlaces coherentes', () => {
  const slides = preparePresentation();
  const files = unzipStored(createPresentationPptx(slides, getReferences()));
  assert.ok(files.has('[Content_Types].xml'));
  assert.ok(files.has('ppt/theme/theme1.xml'));
  assert.ok(files.has('ppt/slideMasters/slideMaster1.xml'));
  assert.ok(files.has('ppt/slideLayouts/slideLayout1.xml'));
  const presentation = files.get('ppt/presentation.xml')!;
  assert.equal((presentation.match(/<p:sldId /g) ?? []).length, 16);
  assert.match(presentation, /cx="12192000" cy="6858000"/);
  for (let index = 1; index <= slides.length; index++) {
    const slide = files.get(`ppt/slides/slide${index}.xml`)!;
    const relations = files.get(`ppt/slides/_rels/slide${index}.xml.rels`)!;
    assert.ok(slide.includes(slides[index - 1].title));
    assert.ok(slide.includes('<p:txBody>'), 'texto editable');
    assert.ok(!slide.includes('<p:pic>'), 'no se reemplaza el texto por capturas');
    const ids = [...slide.matchAll(/<p:cNvPr id="(\d+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length);
    for (const match of slide.matchAll(/<a:hlinkClick r:id="([^"]+)"/g)) assert.ok(relations.includes(`Id="${match[1]}"`));
    assert.ok(!/<a:endParaRPr[^>]*\/>\s*<a:r>/.test(slide));
    assert.ok(!/<a:lstStyle\/>\s*<\/p:txBody>/.test(slide));
  }
});
test('nombres científicos en cursiva y fuentes enlazadas en PPTX', () => {
  const files = unzipStored(createPresentationPptx(preparePresentation(), getReferences()));
  const coral = files.get('ppt/slides/slide7.xml')!;
  assert.match(coral, /i="1"[^<]*>.*?<a:t>Acropora palmata<\/a:t>/);
  assert.match(coral, /i="1"[^<]*>.*?<a:t>Acropora cervicornis<\/a:t>/);
  const relations = files.get('ppt/slides/_rels/slide7.xml.rels')!;
  assert.match(relations, /TargetMode="External"/);
  assert.match(relations, /parquesnacionales\.gov\.co/);
});
test('XML escapa texto editorial y empaquetado es determinista', () => {
  const slides = [{ id: 'prueba', title: 'Agua & luz <Colombia>', subtitle: '"Observación"', paragraphs: ['A & B < C'], items: [], citationIds: [] }];
  const bytes = createPresentationPptx(slides, []);
  assert.deepEqual(bytes, createPresentationPptx(slides, []));
  const slide = unzipStored(bytes).get('ppt/slides/slide1.xml')!;
  assert.ok(slide.includes('Agua &amp; luz &lt;Colombia&gt;'));
  assert.ok(slide.includes('A &amp; B &lt; C'));
});
