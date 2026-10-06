export interface LiveQuestion {
  id: string;
  context: string;
  prompt: string;
  options: readonly { id: string; label: string }[];
  expected: string;
  explanation: string;
  citations: readonly string[];
}
export interface LiveSubmission { answers: readonly string[]; before: number; after: number }
export type LivePhase = 'joining' | 'answering' | 'results';
export interface LiveStatistics {
  responses: number;
  meanScore: number | null;
  correctCounts: number[];
  optionCounts: number[][];
  scoreCounts: number[];
  beforeCounts: number[];
  afterCounts: number[];
}
export interface LiveRoom {
  code: string;
  hostKey: string;
  createdAt: number;
  expiresAt: number;
  participants: Map<string, { submitted: boolean }>;
  statistics: LiveStatistics;
}
export interface LiveStore {
  get(code: string): LiveRoom | undefined;
  set(room: LiveRoom): void;
  delete(code: string): void;
  purge(now: number): void;
  size: number;
}
export interface LiveSnapshot {
  code: string;
  phase: LivePhase;
  serverNow: number;
  joinEndsAt: number;
  answerEndsAt: number;
  expiresAt: number;
  joined: number;
  submitted: number;
  participantSubmitted?: boolean;
  questions: readonly Omit<LiveQuestion, 'expected' | 'explanation' | 'citations'>[];
  statistics?: LiveStatistics;
  explanations?: readonly { expected: string; explanation: string; citations: readonly string[] }[];
}
