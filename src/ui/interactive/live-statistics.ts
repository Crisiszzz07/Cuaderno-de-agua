import type { LiveSnapshot } from '../../domain/live-activity.ts';
import { CLARITY_LABELS } from '../../shared/live-constants.ts';
import { getReferences } from '../../application/get-content.ts';

function element(tag: string, text: string, className?: string) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}
export function renderLiveStatistics(target: HTMLElement, snapshot: LiveSnapshot, headingLevel: 2 | 4 = 4) {
  const statistics = snapshot.statistics;
  if (!statistics) return;
  target.replaceChildren();
  target.append(element(`h${headingLevel}`, 'Lo que respondió el grupo'));
  if (!statistics.responses) { target.append(element('p', 'No llegaron respuestas completas a tiempo. No hay puntajes ni porcentajes que mostrar.')); return; }
  target.append(element('p', `${statistics.responses} respuestas completas de ${snapshot.joined} conexiones · Promedio: ${statistics.meanScore?.toFixed(1)} de ${snapshot.questions.length} puntos.`, 'live-summary'));
  const questions = document.createElement('div');
  questions.className = 'live-question-statistics';
  snapshot.questions.forEach((question, index) => {
    const block = document.createElement('section');
    block.append(element(`h${headingLevel + 1}`, question.prompt));
    const correct = statistics.correctCounts[index];
    block.append(element('p', `${correct} de ${statistics.responses} respuestas correctas (${Math.round(correct / statistics.responses * 100)} %).`));
    question.options.forEach((option, optionIndex) => {
      const count = statistics.optionCounts[index][optionIndex];
      const row = element('p', `${option.label}: ${count}`, 'live-bar-row');
      const meter = document.createElement('meter');
      meter.min = 0; meter.max = statistics.responses; meter.value = count;
      meter.setAttribute('aria-label', `${option.label}: ${count} de ${statistics.responses}`);
      row.append(meter); block.append(row);
    });
    const explanation = snapshot.explanations?.[index];
    if (explanation) {
      block.append(element('p', explanation.explanation, 'live-explanation'));
      const sources = element('p', 'Fuentes: ', 'sources');
      getReferences(explanation.citations).forEach((reference, sourceIndex) => {
        if (sourceIndex) sources.append(document.createTextNode(' · '));
        const link = document.createElement('a'); link.href = reference.url; link.textContent = reference.short;
        sources.append(link);
      });
      block.append(sources);
    }
    questions.append(block);
  });
  target.append(questions, element(`h${headingLevel}`, '¿Qué tan claro se percibe el tema?'));
  const table = document.createElement('table');
  const caption = document.createElement('caption'); caption.textContent = 'Claridad declarada antes y después de responder. Número de conexiones por opción.';
  const head = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['Percepción', 'Antes', 'Después'].forEach(text => { const cell = element('th', text); cell.setAttribute('scope', 'col'); headerRow.append(cell); });
  head.append(headerRow);
  const body = document.createElement('tbody');
  CLARITY_LABELS.forEach((label, index) => {
    const row = document.createElement('tr');
    const title = element('th', label); title.setAttribute('scope', 'row');
    row.append(title, element('td', String(statistics.beforeCounts[index])), element('td', String(statistics.afterCounts[index])));
    body.append(row);
  });
  table.append(caption, head, body);
  target.append(table, element('p', 'Este sondeo es orientativo: la claridad declarada no demuestra aprendizaje. Los aciertos corresponden solo a estas tres preguntas. No hay clasificación de personas.', 'live-privacy'));
}
