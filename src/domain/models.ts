export interface Citation {
  id: string;
  short: string;
  title: string;
  publisher: string;
  year: string;
  url: string;
  mirror?: string;
  scope: string;
}

export interface ContentBlock {
  title: string;
  text: string;
  citations: readonly string[];
}

export interface EcosystemSection {
  id: string;
  nav: string;
  title: string;
  lead: string;
  paragraphs: readonly string[];
  citations: readonly string[];
  blocks?: readonly ContentBlock[];
}

export interface Species {
  scientificName: string;
  commonName: string;
  description: string;
  citations: readonly string[];
}

export interface Threat {
  activity: string;
  change: string;
  light: string;
  consequence: string;
  citations: readonly string[];
}

export type QuestionId = 'factor' | 'balance' | 'consequence';
export interface ActivityOption { id: string; label: string }
export interface ActivityQuestion {
  id: QuestionId;
  prompt: string;
  options: readonly ActivityOption[];
  expected: string;
  explanation: string;
}
export interface ActivityScenario {
  id: string;
  title: string;
  context: string;
  questions: readonly ActivityQuestion[];
  citations: readonly string[];
}
export type ActivityAnswers = Partial<Record<QuestionId, string>>;
export interface ActivityFeedback {
  complete: boolean;
  questions: readonly { id: QuestionId; aligned: boolean; explanation: string }[];
}

export type SlideVisual = 'coast' | 'light' | 'map' | 'turbidity' | 'food' | 'corals';
export interface PresentationSlide {
  id: string;
  title: string;
  subtitle: string;
  paragraphs: readonly string[];
  items: readonly { title: string; text: string; italicTitle?: boolean }[];
  citationIds: readonly string[];
  visual?: SlideVisual;
  references?: readonly Citation[];
}
