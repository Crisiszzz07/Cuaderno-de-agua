export interface ExposureStage {
  id: string;
  label: string;
  endSeconds: number;
}
export interface ExposurePlan {
  id: string;
  label: string;
  stages: readonly ExposureStage[];
}
export interface ExposureTiming {
  elapsedSeconds: number;
  remainingSeconds: number;
  stageIndex: number;
  label: string;
  warning: boolean;
  finished: boolean;
  nextLabel?: string;
}
