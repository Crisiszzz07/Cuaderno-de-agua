import type { LiveQuestion } from '../domain/live-activity.ts';
import { scenarios } from './scenarios.ts';

// Three concept questions reuse the already sourced classroom scenarios.
export const liveQuestions: readonly LiveQuestion[] = [
  { scenario: scenarios[0], question: scenarios[0].questions[1] },
  { scenario: scenarios[1], question: scenarios[1].questions[2] },
  { scenario: scenarios[2], question: scenarios[2].questions[1] },
].map(({ scenario, question }) => ({
  id: scenario.id,
  context: scenario.context,
  prompt: question.prompt,
  options: question.options,
  expected: question.expected,
  explanation: question.explanation,
  citations: scenario.citations,
}));
