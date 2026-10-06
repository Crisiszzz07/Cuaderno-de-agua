import type { ActivityAnswers, ActivityFeedback, ActivityScenario } from '../domain/models.ts';

/** Incomplete or unknown options never produce a misleading explanation. */
export function evaluateActivity(scenario: ActivityScenario, answers: ActivityAnswers): ActivityFeedback {
  const complete = scenario.questions.every(question =>
    question.options.some(option => option.id === answers[question.id]),
  );
  if (!complete) return { complete: false, questions: [] };
  return {
    complete: true,
    questions: scenario.questions.map(question => ({
      id: question.id,
      aligned: answers[question.id] === question.expected,
      explanation: question.explanation,
    })),
  };
}
