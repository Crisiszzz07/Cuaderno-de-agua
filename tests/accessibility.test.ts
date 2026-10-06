import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../tokens.css', import.meta.url), 'utf8');
function luminance(token: string): number {
  const pattern = new RegExp(`--color-${token}: oklch\\((\\d+)% ([.\\d]+) (\\d+)\\)`);
  const match = css.match(pattern);
  assert.ok(match, `Token inexistente: ${token}`);
  const lightness = Number(match[1]) / 100;
  const chroma = Number(match[2]);
  const hue = Number(match[3]) * Math.PI / 180;
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);
  const l = (lightness + .3963377774 * a + .2158037573 * b) ** 3;
  const m = (lightness - .1055613458 * a - .0638541728 * b) ** 3;
  const s = (lightness - .0894841775 * a - 1.291485548 * b) ** 3;
  // OKLab -> linear sRGB. WCAG relative luminance is computed in linear light.
  const red = Math.max(0, Math.min(1, 4.0767416621 * l - 3.3077115913 * m + .2309699292 * s));
  const green = Math.max(0, Math.min(1, -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s));
  const blue = Math.max(0, Math.min(1, -.0041960863 * l - .7034186147 * m + 1.707614701 * s));
  return .2126 * red + .7152 * green + .0722 * blue;
}
function contrast(foreground: string, background: string): number {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => a - b);
  return (values[1] + .05) / (values[0] + .05);
}

for (const [foreground, background] of [
  ['ink', 'paper'], ['muted', 'paper'], ['accent', 'paper'],
  ['ink', 'water-light'], ['paper', 'water-deep'], ['paper', 'water-dark'],
  ['ink', 'sand'], ['muted', 'sand'], ['ink', 'sand-deep'],
  ['ink', 'water-pale'], ['muted', 'water-pale'], ['green', 'water-pale'],
  ['ink', 'green-pale'], ['ink', 'sun'], ['paper', 'ink'], ['paper', 'accent'],
  ['error', 'paper'], ['coral', 'sand'],
]) {
  test(`contraste AA: ${foreground} sobre ${background}`, () => {
    const ratio = contrast(foreground, background);
    assert.ok(ratio >= 4.5, `${foreground}/${background}: ${ratio.toFixed(2)}:1`);
  });
}
test('foco distinguible sobre superficies claras y oscuras', () => {
  assert.ok(contrast('focus', 'paper') >= 3);
  assert.ok(contrast('focus', 'sand') >= 3);
  assert.ok(contrast('sun', 'ink') >= 3);
});

test('la interfaz conserva controles nativos, foco y movimiento reducido', () => {
  const style = readFileSync(new URL('../src/ui/styles/global.css', import.meta.url), 'utf8');
  const activity = readFileSync(new URL('../src/ui/components/Activity.astro', import.meta.url), 'utf8');
  assert.match(style, /:focus-visible/);
  assert.match(style, /prefers-reduced-motion: reduce/);
  assert.match(activity, /<fieldset>/);
  assert.match(activity, /<legend>/);
  assert.match(activity, /type="radio"/);
  assert.match(activity, /aria-live="polite"/);
});
