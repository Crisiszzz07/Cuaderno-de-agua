import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateActivity } from '../src/application/evaluate-activity.ts';
import { scenarios } from '../src/infrastructure/scenarios.ts';
import type { ActivityAnswers } from '../src/domain/models.ts';

for (const scenario of scenarios) {
  test(`${scenario.id}: explica una cadena completa`, () => {
    const answers: ActivityAnswers = {};
    scenario.questions.forEach(question => { answers[question.id] = question.expected; });
    const result = evaluateActivity(scenario, answers);
    assert.equal(result.complete, true);
    assert.equal(result.questions.length, 3);
    assert.ok(result.questions.every(question => question.aligned && question.explanation.length > 40));
    assert.ok(!('score' in result));
  });
  test(`${scenario.id}: invita a revisar las relaciones equivocadas`, () => {
    const answers: ActivityAnswers = {};
    scenario.questions.forEach(question => { answers[question.id] = question.options.find(option => option.id !== question.expected)?.id; });
    const result = evaluateActivity(scenario, answers);
    assert.equal(result.complete, true);
    assert.ok(result.questions.every(question => !question.aligned));
    assert.deepEqual(result.questions.map(question => question.explanation), scenario.questions.map(question => question.explanation));
  });
  test(`${scenario.id}: rechaza respuestas incompletas o desconocidas`, () => {
    assert.deepEqual(evaluateActivity(scenario, {}), { complete: false, questions: [] });
    assert.equal(evaluateActivity(scenario, { factor: 'desconocida', balance: 'x', consequence: 'y' }).complete, false);
    assert.equal(evaluateActivity(scenario, { factor: scenario.questions[0].expected }).complete, false);
  });
  test(`${scenario.id}: no modifica contenido ni respuestas`, () => {
    const before = JSON.stringify(scenario);
    const answers = Object.freeze({ factor: scenario.questions[0].expected });
    evaluateActivity(scenario, answers);
    assert.equal(JSON.stringify(scenario), before);
  });
}
