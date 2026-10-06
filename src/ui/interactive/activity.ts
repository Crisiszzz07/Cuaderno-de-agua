import { evaluateActivity } from '../../application/evaluate-activity.ts';
import { getScenarios } from '../../application/get-activity.ts';
import type { ActivityAnswers, ActivityScenario } from '../../domain/models.ts';

const root = document.querySelector<HTMLElement>('[data-activity]');
const scenarios = getScenarios();
if (root) {
  root.classList.add('is-enhanced');
  const articles = [...root.querySelectorAll<HTMLElement>('[data-scenario]')];
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-scenario-button]')];
  function selectScenario(id: string, moveFocus: boolean) {
    articles.forEach(article => { article.hidden = article.dataset.scenario !== id; });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scenarioButton === id)));
    if (moveFocus) articles.find(article => article.dataset.scenario === id)?.querySelector<HTMLElement>('h3')?.focus({ preventScroll: true });
  }
  selectScenario(scenarios[0].id, false);
  buttons.forEach(button => button.addEventListener('click', () => selectScenario(button.dataset.scenarioButton ?? '', true)));

  articles.forEach(article => {
    const scenario: ActivityScenario | undefined = scenarios.find(item => item.id === article.dataset.scenario);
    const form = article.querySelector<HTMLFormElement>('form');
    const feedback = article.querySelector<HTMLElement>('.activity-feedback');
    const error = article.querySelector<HTMLElement>('.activity-error');
    if (!scenario || !form || !feedback || !error) return;
    // Native validation is a useful fallback; enhanced validation also announces errors.
    form.noValidate = true;
    form.addEventListener('submit', event => {
      event.preventDefault();
      const values = new FormData(form);
      const answers: ActivityAnswers = {};
      scenario.questions.forEach(question => {
        const value = values.get(question.id);
        if (typeof value === 'string') answers[question.id] = value;
      });
      const result = evaluateActivity(scenario, answers);
      if (!result.complete) {
        error.hidden = false;
        feedback.hidden = true;
        const missing = scenario.questions.find(question => !answers[question.id]);
        if (missing) form.querySelector<HTMLInputElement>(`input[name="${missing.id}"]`)?.focus();
        return;
      }
      error.hidden = true;
      feedback.replaceChildren();
      const heading = document.createElement('h4');
      heading.textContent = 'Conectemos las ideas';
      feedback.append(heading);
      result.questions.forEach((item, index) => {
        const paragraph = document.createElement('p');
        const lead = document.createElement('strong');
        lead.textContent = `${index + 1}. ${item.aligned ? 'La relación coincide.' : 'Revisen esta relación.'} `;
        paragraph.append(lead, document.createTextNode(item.explanation));
        feedback.append(paragraph);
      });
      feedback.hidden = false;
    });
    form.addEventListener('reset', () => {
      feedback.hidden = true;
      feedback.replaceChildren();
      error.hidden = true;
    });
    form.addEventListener('change', () => { feedback.hidden = true; error.hidden = true; });
  });
}
