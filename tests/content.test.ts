import test from 'node:test';
import assert from 'node:assert/strict';
import { getContent, getReferences } from '../src/application/get-content.ts';
import { citations } from '../src/infrastructure/citations.ts';
import type { ContentBlock } from '../src/domain/models.ts';

const content = getContent();
test('todo el contenido crítico enlaza referencias existentes y públicas', () => {
  const entries = [...content.sections, ...content.sections.flatMap<ContentBlock>(section => 'blocks' in section ? [...section.blocks] : []), ...content.species, ...content.threats, ...content.services, ...content.actions, ...content.scenarios];
  for (const entry of entries) {
    assert.ok(entry.citations.length > 0);
    assert.equal(getReferences(entry.citations).length, entry.citations.length);
  }
  assert.equal(new Set(citations.map(item => item.id)).size, citations.length);
  assert.ok(citations.every(item => item.url.startsWith('https://') && !new URL(item.url).username));
  assert.throws(() => getReferences(['inexistente']), /desconocida/);
});
test('se conserva la definición funcional y el límite oceánico se matiza', () => {
  const text = content.sections[0].paragraphs.join(' ');
  assert.match(text, /suficiente luz para la fotosíntesis/);
  assert.match(text, /No son un solo bioma fijo/);
  assert.match(text, /200 metros.*no una regla universal/);
  assert.match(text, /transparencia/);
});
test('cubre Colombia, las tres zonas y las dos especies solicitadas', () => {
  const text = content.sections[1].paragraphs.join(' ');
  for (const name of ['San Andrés', 'Providencia', 'Pacífico', 'Magdalena–Cauca', 'Caribe', 'Orinoco', 'Amazonas']) assert.ok(text.includes(name));
  assert.equal(content.lightZones.length, 3);
  assert.deepEqual(content.species.map(item => item.scientificName), ['Acropora palmata', 'Acropora cervicornis']);
});
test('los escenarios tienen opciones únicas y una relación esperada válida', () => {
  assert.equal(content.scenarios.length, 3);
  assert.equal(new Set(content.scenarios.map(item => item.id)).size, 3);
  for (const scenario of content.scenarios) {
    assert.deepEqual(scenario.questions.map(item => item.id), ['factor', 'balance', 'consequence']);
    for (const question of scenario.questions) {
      assert.equal(question.options.filter(option => option.id === question.expected).length, 1);
      assert.equal(new Set(question.options.map(option => option.id)).size, question.options.length);
    }
  }
});
test('el blanqueamiento no se confunde con muerte inmediata', () => {
  const text = content.scenarios[2].questions[2].explanation;
  assert.match(text, /está vivo/);
  assert.match(text, /recuperarse/);
});
