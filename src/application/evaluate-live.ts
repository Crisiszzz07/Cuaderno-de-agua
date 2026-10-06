import type { LiveQuestion, LiveSubmission } from '../domain/live-activity.ts';

export function validateLiveSubmission(value: unknown, questions: readonly LiveQuestion[]): value is LiveSubmission {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  if (Object.keys(data).sort().join(',') !== 'after,answers,before') return false;
  const { answers, before, after } = data;
  if (!Array.isArray(answers) || answers.length !== questions.length) return false;
  if (!answers.every((answer, index) => typeof answer === 'string' && questions[index].options.some(option => option.id === answer))) return false;
  return typeof before === 'number' && Number.isInteger(before) && before >= 1 && before <= 5
    && typeof after === 'number' && Number.isInteger(after) && after >= 1 && after <= 5;
}

export function scoreLiveSubmission(submission: LiveSubmission, questions: readonly LiveQuestion[]): number {
  return scoreLiveAnswers(submission.answers, questions.map(question => question.expected));
}

export function scoreLiveAnswers(answers: readonly string[], expected: readonly string[]): number {
  return expected.reduce((score, answer, index) => score + Number(answers[index] === answer), 0);
}
