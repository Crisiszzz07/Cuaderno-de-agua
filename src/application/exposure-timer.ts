import type { ExposurePlan, ExposureTiming } from '../domain/exposure-timer.ts';
import { exposurePlans } from '../infrastructure/exposure-plans.ts';

export function getExposurePlans(): readonly ExposurePlan[] { return exposurePlans; }
export function exposureTiming(plan: ExposurePlan, elapsedMilliseconds: number): ExposureTiming {
  const total = plan.stages.at(-1)!.endSeconds;
  const elapsedSeconds = Math.min(total, Math.max(0, Math.floor(elapsedMilliseconds / 1000)));
  const finished = elapsedSeconds >= total;
  const stageIndex = finished ? plan.stages.length - 1 : plan.stages.findIndex(stage => elapsedSeconds < stage.endSeconds);
  const stage = plan.stages[stageIndex];
  return {
    elapsedSeconds, remainingSeconds: total - elapsedSeconds, stageIndex, label: stage.label,
    warning: !finished && stage.endSeconds - elapsedSeconds <= 15, finished,
    nextLabel: plan.stages[stageIndex + 1]?.label,
  };
}

export class ExposureClock {
  private accumulated = 0;
  private startedAt: number | undefined;
  private readonly now: () => number;
  constructor(now: () => number = () => performance.now()) { this.now = now; }
  get running(): boolean { return this.startedAt !== undefined; }
  get elapsedMilliseconds(): number { return this.accumulated + (this.startedAt === undefined ? 0 : Math.max(0, this.now() - this.startedAt)); }
  start() { if (!this.running) this.startedAt = this.now(); }
  pause() { this.accumulated = this.elapsedMilliseconds; this.startedAt = undefined; }
  reset() { this.accumulated = 0; this.startedAt = undefined; }
}
