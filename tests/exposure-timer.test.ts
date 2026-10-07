import test from 'node:test';
import assert from 'node:assert/strict';
import { ExposureClock, exposureTiming, getExposurePlans } from '../src/application/exposure-timer.ts';

test('el guion conserva los cuatro límites y ambas rutas terminan a los 15 minutos', () => {
  const plans = getExposurePlans();
  assert.deepEqual(plans[0].stages.map(stage => stage.endSeconds), [210, 420, 630, 870, 900]);
  assert.deepEqual(plans[1].stages.map(stage => stage.endSeconds), [180, 360, 540, 720, 900]);
});
test('avisa exactamente 15 segundos antes de cada cambio y no adelanta el bloque', () => {
  for (const plan of getExposurePlans()) {
    for (const [index, stage] of plan.stages.entries()) {
      assert.equal(exposureTiming(plan, (stage.endSeconds - 16) * 1000).warning, false);
      const warning = exposureTiming(plan, (stage.endSeconds - 15) * 1000);
      assert.equal(warning.warning, true);
      assert.equal(warning.stageIndex, index);
      const boundary = exposureTiming(plan, stage.endSeconds * 1000);
      assert.equal(boundary.warning, false);
      assert.equal(boundary.stageIndex, Math.min(index + 1, plan.stages.length - 1));
    }
  }
});
test('pausar conserva el tiempo y reanudar no acumula el intervalo de pausa', () => {
  let now = 0;
  const clock = new ExposureClock(() => now);
  clock.start(); now = 195_000;
  clock.pause(); now = 250_000;
  assert.equal(clock.elapsedMilliseconds, 195_000);
  clock.start(); now = 265_000;
  assert.equal(clock.elapsedMilliseconds, 210_000);
  clock.reset();
  assert.equal(clock.elapsedMilliseconds, 0);
  assert.equal(clock.running, false);
});
test('el tiempo real corrige saltos de intervalos y nunca muestra valores negativos', () => {
  let now = 0;
  const clock = new ExposureClock(() => now);
  clock.start(); now = 980_000;
  const state = exposureTiming(getExposurePlans()[0], clock.elapsedMilliseconds);
  assert.equal(state.finished, true);
  assert.equal(state.remainingSeconds, 0);
  assert.equal(state.elapsedSeconds, 900);
});
