import test from 'node:test';
import assert from 'node:assert/strict';
import { LiveActivity, LiveActivityError } from '../src/application/live-activity.ts';
import { MemoryLiveStore } from '../src/infrastructure/memory-live-store.ts';
import { liveQuestions } from '../src/infrastructure/live-questions.ts';
import { scoreLiveSubmission, validateLiveSubmission } from '../src/application/evaluate-live.ts';
import { LIVE_MAX_PARTICIPANTS, LIVE_MAX_ROOMS } from '../src/shared/live-constants.ts';

function fixture() {
  let time = 0; let counter = 0;
  const store = new MemoryLiveStore();
  const activity = new LiveActivity(store, liveQuestions, () => time, () => (++counter).toString(16).padStart(8, '0') + 'a'.repeat(40));
  return { store, activity, at: (value: number) => { time = value; } };
}
const correct = { answers: liveQuestions.map(question => question.expected), before: 2, after: 4 };
function status(expected: number) { return (error: unknown) => error instanceof LiveActivityError && error.status === expected; }

test('la actividad completa dura 180 segundos, con fases y eliminación exactas', () => {
  const { activity, store, at } = fixture();
  const session = activity.create();
  assert.equal(session.snapshot.phase, 'joining');
  assert.equal(session.snapshot.expiresAt, 180_000);
  at(29_999); assert.equal(activity.snapshot(session.code).phase, 'joining');
  at(30_000); assert.equal(activity.snapshot(session.code).phase, 'answering');
  at(134_999); assert.equal(activity.snapshot(session.code).phase, 'answering');
  at(135_000); assert.equal(activity.snapshot(session.code).phase, 'results');
  at(179_999); assert.equal(activity.snapshot(session.code).phase, 'results');
  at(180_000); activity.purge(); assert.equal(store.size, 0);
  assert.throws(() => activity.snapshot(session.code), status(404));
});
test('antes del cierre no se revelan estadísticas, respuestas correctas ni accesos', () => {
  const { activity, at } = fixture(); const session = activity.create();
  activity.join(session.code); at(30_000);
  const snapshot = activity.snapshot(session.code);
  assert.ok(!snapshot.statistics && !snapshot.explanations);
  const serialized = JSON.stringify(snapshot);
  assert.ok(!serialized.includes(session.hostKey));
  assert.ok(!serialized.includes('expected') && !serialized.includes('participantKey'));
});
test('tres aciertos valen tres puntos y la percepción no altera el puntaje', () => {
  assert.equal(scoreLiveSubmission(correct, liveQuestions), 3);
  assert.equal(scoreLiveSubmission({ ...correct, before: 5, after: 1 }, liveQuestions), 3);
  assert.equal(scoreLiveSubmission({ ...correct, answers: liveQuestions.map(question => question.options.find(option => option.id !== question.expected)!.id) }, liveQuestions), 0);
});
test('se rechazan respuestas incompletas, opciones inventadas y datos adicionales', () => {
  for (const value of [{}, { ...correct, answers: [] }, { ...correct, answers: ['x', 'y', 'z'] }, { ...correct, before: 0 }, { ...correct, after: 6 }, { ...correct, before: 1.5 }, { ...correct, name: 'dato adicional' }]) assert.equal(validateLiveSubmission(value, liveQuestions), false);
  assert.equal(validateLiveSubmission(correct, liveQuestions), true);
});
test('no se reciben respuestas antes de abrir preguntas o después del cierre', () => {
  const { activity, at } = fixture(); const session = activity.create(); const member = activity.join(session.code);
  assert.throws(() => activity.submit(session.code, member.participantKey, correct), status(409));
  at(135_000); assert.throws(() => activity.submit(session.code, member.participantKey, correct), status(409));
  assert.throws(() => activity.join(session.code), status(409));
});
test('reintentar un envío confirmado no duplica votos, incluso durante resultados', () => {
  const { activity, at } = fixture(); const session = activity.create(); const member = activity.join(session.code);
  at(30_000);
  assert.deepEqual(activity.submit(session.code, member.participantKey, correct), { submitted: true });
  assert.deepEqual(activity.submit(session.code, member.participantKey, correct), { submitted: true });
  at(135_000); activity.submit(session.code, member.participantKey, correct);
  const snapshot = activity.snapshot(session.code, member.participantKey);
  assert.equal(snapshot.statistics?.responses, 1);
  assert.equal(snapshot.participantSubmitted, true);
});
test('las estadísticas distinguen puntajes, opciones y percepción antes/después', () => {
  const { activity, at } = fixture(); const session = activity.create();
  const first = activity.join(session.code); const second = activity.join(session.code);
  at(30_000); activity.submit(session.code, first.participantKey, correct);
  const partial = { answers: [liveQuestions[0].expected, liveQuestions[1].options.find(option => option.id !== liveQuestions[1].expected)!.id, liveQuestions[2].options.find(option => option.id !== liveQuestions[2].expected)!.id], before: 1, after: 3 };
  activity.submit(session.code, second.participantKey, partial);
  at(135_000); const statistics = activity.snapshot(session.code).statistics!;
  assert.equal(statistics.responses, 2); assert.equal(statistics.meanScore, 2);
  assert.deepEqual(statistics.correctCounts, [2, 1, 1]);
  assert.deepEqual(statistics.scoreCounts, [0, 1, 0, 1]);
  assert.deepEqual(statistics.beforeCounts, [1, 1, 0, 0, 0]);
  assert.deepEqual(statistics.afterCounts, [0, 0, 1, 1, 0]);
  assert.ok(statistics.optionCounts.every(counts => counts.reduce((sum, count) => sum + count, 0) === 2));
});
test('no se conservan respuestas, percepciones o puntajes por conexión', () => {
  const { activity, store, at } = fixture(); const session = activity.create(); const member = activity.join(session.code);
  at(30_000); activity.submit(session.code, member.participantKey, correct);
  assert.deepEqual(store.get(session.code)!.participants.get(member.participantKey), { submitted: true });
  assert.deepEqual(Object.keys(store.get(session.code)!).sort(), ['code', 'createdAt', 'expiresAt', 'hostKey', 'participants', 'statistics']);
});
test('la persona anfitriona puede borrar; una conexión o sesión ajena no', () => {
  const { activity } = fixture(); const first = activity.create(); const second = activity.create();
  const member = activity.join(first.code);
  assert.throws(() => activity.end(first.code, member.participantKey), status(403));
  assert.throws(() => activity.submit(second.code, member.participantKey, correct), status(403));
  assert.throws(() => activity.snapshot(second.code, member.participantKey), status(403));
  activity.end(first.code, first.hostKey);
  assert.throws(() => activity.snapshot(first.code), status(404));
  assert.equal(activity.snapshot(second.code).code, second.code);
});
test('cero respuestas no produce promedio o porcentaje inventado', () => {
  const { activity, at } = fixture(); const session = activity.create(); at(135_000);
  assert.equal(activity.snapshot(session.code).statistics?.meanScore, null);
  assert.equal(activity.snapshot(session.code).statistics?.responses, 0);
});
test('una vista de resultados no permite mutar los contadores internos', () => {
  const { activity, at } = fixture(); const session = activity.create(); const member = activity.join(session.code);
  at(30_000); activity.submit(session.code, member.participantKey, correct); at(135_000);
  activity.snapshot(session.code).statistics!.correctCounts[0] = 999;
  assert.equal(activity.snapshot(session.code).statistics?.correctCounts[0], 1);
});
test('hay límites de memoria y las sesiones vencidas liberan capacidad', () => {
  const { activity, at } = fixture(); const session = activity.create();
  for (let i = 0; i < LIVE_MAX_PARTICIPANTS; i++) activity.join(session.code);
  assert.throws(() => activity.join(session.code), status(429));
  for (let i = 1; i < LIVE_MAX_ROOMS; i++) activity.create();
  assert.throws(() => activity.create(), status(429));
  at(180_000); assert.ok(activity.create().code);
});
