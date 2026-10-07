import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { chromium } from 'playwright';
import { scenarios } from '../src/infrastructure/scenarios.ts';
import { preparePresentation } from '../src/application/prepare-presentation.ts';

// Route the built files locally: this test needs no network or preview server.
const directory = resolve('dist');
const output = resolve('test-results/revision-motion');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ reducedMotion: 'reduce' });
await context.route('**/*', async route => {
  const url = new URL(route.request().url());
  assert.equal(url.hostname, 'foticos.test', `Solicitud externa: ${url.hostname}`);
  if (url.pathname === '/api/private-cover') {
    assert.equal(route.request().method(), 'POST');
    assert.equal(url.search, '');
    const payload = route.request().postDataJSON() as { code: string };
    await route.fulfill({ status: payload.code === 'fixture-cover-code' ? 200 : 403, contentType: 'application/json', headers: { 'Cache-Control': 'no-store' }, body: JSON.stringify(payload.code === 'fixture-cover-code' ? { institution: 'Universidad de prueba', semester: 'Semestre de prueba', authors: ['Autor de prueba'] } : { error: 'Acceso denegado' }) });
    return;
  }
  const path = decodeURIComponent(url.pathname);
  const target = resolve(directory, `.${path.endsWith('/') ? `${path}index.html` : path}`);
  assert.ok(target.startsWith(`${directory}${sep}`));
  const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
  await route.fulfill({ status: 200, contentType: types[extname(target)] ?? 'application/octet-stream', body: await readFile(target) });
});
const page = await context.newPage();
const errors: string[] = [];
page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto('http://foticos.test/');
  await page.locator('.activity.is-enhanced').waitFor();
  assert.equal(await page.locator('[data-motion-toggle]:disabled').count(), 4, 'Movimiento reducido respeta la preferencia del dispositivo');
  assert.equal(await page.locator('.motion-paused').count(), 1);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForFunction(() => !document.documentElement.classList.contains('motion-paused'));
  await page.locator('.coastal-scene [data-motion-toggle]').click();
  assert.equal(await page.locator('.motion-paused').count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Reproducir animaciones', exact: true }).count(), 4);
  await page.locator('.coastal-scene [data-motion-toggle]').click();
  assert.equal(await page.locator('.motion-paused').count(), 0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 375, 414, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: width >= 1920 ? 1080 : 900 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(overflow, false, `Desborde a ${width}px`);
    const beyondViewport = await page.locator('main, header, footer').evaluateAll(elements => elements.flatMap(root => [...root.querySelectorAll('a, button, fieldset, svg')]).filter(element => {
      const box = element.getBoundingClientRect();
      return box.width > 0 && (box.left < -1 || box.right > innerWidth + 1);
    }).map(element => element.textContent?.slice(0, 50)));
    assert.deepEqual(beyondViewport, [], `Elementos recortados a ${width}px`);
    await page.screenshot({ path: `${output}/inicio-${width}.png` });
    await page.locator('#actividad').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/actividad-${width}.png` });
    await page.evaluate(() => window.scrollTo(0, 0));
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  assert.ok(page.url().endsWith('#contenido'));
  const toggle = page.getByRole('button', { name: 'Modo exposición' });
  await toggle.focus();
  const focus = await toggle.evaluate(element => getComputedStyle(element).outlineStyle);
  assert.notEqual(focus, 'none');
  await page.keyboard.press('Space');
  await page.locator('.exposure-mode').waitFor();
  const fullscreen = page.locator('[data-fullscreen]');
  if (await fullscreen.isEnabled()) {
    await fullscreen.click();
    await page.waitForFunction(() => Boolean(document.fullscreenElement));
    assert.equal(await fullscreen.getAttribute('aria-pressed'), 'true');
    await page.locator('.fullscreen-exposure').waitFor();
    assert.equal(await page.locator('.site-header').isVisible(), false);
    assert.equal(await page.locator('[data-exposure-toolbar]').isVisible(), false);
    assert.equal(await page.locator('[data-section]:visible').count(), 1);
    for (const width of [375, 768, 1440, 1920]) {
      await page.setViewportSize({ width, height: width >= 1920 ? 1080 : 900 });
      const dockBounds = await page.locator('[data-fullscreen-dock]').evaluate(element => {
        const box = element.getBoundingClientRect();
        return box.left >= 0 && box.right <= innerWidth && box.bottom <= innerHeight;
      });
      assert.equal(dockBounds, true, `Controles de pantalla completa dentro del área visible a ${width}px`);
      await page.screenshot({ path: `${output}/pantalla-completa-${width}.png` });
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('[data-fullscreen-dock] [data-next]').click();
    assert.equal(await page.locator('[data-fullscreen-indicator]').textContent(), '2 / 8');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('[data-fullscreen-indicator]').textContent(), '3 / 8');
    await page.keyboard.press('ArrowLeft');
    await page.locator('[data-fullscreen-dock] [data-previous]').click();
    await page.getByRole('button', { name: 'Salir de pantalla completa', exact: true }).click();
    await page.waitForFunction(() => !document.fullscreenElement);
    assert.equal(await page.locator('.site-header').isVisible(), true);
    assert.equal(await page.locator('[data-section]:visible').count(), 8);
    // Denied permissions must be announced without leaving the mode broken.
    await page.evaluate(() => { document.documentElement.requestFullscreen = () => Promise.reject(new Error('denegado')); });
    await fullscreen.click();
    await page.locator('[data-exposure-message]').waitFor();
    assert.equal(await fullscreen.getAttribute('aria-pressed'), 'false');
  }
  assert.equal(await page.getByRole('link', { name: 'Exportar PDF' }).getAttribute('href'), '/exposicion/');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: 'Descargar PPTX' }).click()]);
  assert.equal(download.suggestedFilename(), 'ecosistemas-foticos.pptx');
  await page.getByRole('button', { name: 'Ir a la sección siguiente' }).click();
  assert.equal(await page.locator('[data-section-indicator]').textContent(), '2 / 8 · Colombia');
  assert.equal(await page.locator('#colombia-heading').evaluate(element => element === document.activeElement), true);
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-pressed'), 'false');

  for (const scenario of scenarios) {
    await page.locator(`[data-scenario-button="${scenario.id}"]`).click();
    const panel = page.locator(`[data-scenario="${scenario.id}"]`);
    await panel.getByRole('button', { name: 'Contrastar respuestas' }).click();
    assert.equal(await panel.locator('.activity-error').isVisible(), true);
    for (const question of scenario.questions) {
      const control = panel.locator(`input[name="${question.id}"][value="${question.expected}"]`);
      await control.focus();
      await page.keyboard.press('Space');
    }
    await panel.getByRole('button', { name: 'Contrastar respuestas' }).focus();
    await page.keyboard.press('Enter');
    await panel.locator('.activity-feedback').waitFor();
    assert.equal(await panel.locator('.activity-feedback strong').count(), 3);
    assert.equal(await panel.locator('.activity-feedback').getAttribute('aria-live'), 'polite');
    await panel.getByRole('button', { name: 'Reiniciar' }).click();
    assert.equal(await panel.locator('input:checked').count(), 0);
    assert.equal(await panel.locator('.activity-feedback').isVisible(), false);
  }
  assert.deepEqual(errors, []);
  assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);

  const timed = await context.newPage();
  await timed.clock.install();
  await timed.goto('http://foticos.test/');
  await timed.getByText('Cronómetro de exposición · 15 minutos', { exact: true }).click();
  await timed.locator('[data-timer-root] [data-timer-toggle]').click();
  await timed.clock.fastForward(195_000);
  assert.equal(await timed.locator('[data-timer-root] [data-timer-clock]').textContent(), '11:45');
  assert.match(await timed.locator('[data-timer-announcement]').textContent() ?? '', /15 segundos/);
  await timed.clock.fastForward(15_000);
  assert.equal(await timed.locator('[data-timer-root] [data-timer-stage]').textContent(), 'Colombia y condiciones ambientales');
  await timed.locator('[data-timer-root] [data-timer-toggle]').click();
  await timed.clock.fastForward(60_000);
  assert.equal(await timed.locator('[data-timer-root] [data-timer-clock]').textContent(), '11:30');
  await timed.locator('[data-timer-reset]').click();
  await timed.locator('[data-timer-plan]').selectOption('activity');
  await timed.locator('[data-timer-root] [data-timer-toggle]').click();
  await timed.clock.fastForward(165_000);
  assert.match(await timed.locator('[data-timer-announcement]').textContent() ?? '', /15 segundos/);
  await timed.getByRole('button', { name: 'Modo exposición' }).click();
  assert.equal(await timed.locator('[data-timer-exposure-status]').isVisible(), true);
  await timed.close();

  const exported = await context.newPage();
  await exported.goto('https://foticos.test/exposicion/');
  assert.equal(await exported.locator('.export-slide').count(), preparePresentation().length);
  assert.equal(await exported.locator('[data-cover-authorship]').isVisible(), false);
  await exported.evaluate(() => { window.print = () => { document.body.dataset.printRequested = 'true'; }; });
  await exported.getByRole('button', { name: 'PDF con autoría', exact: true }).click();
  await exported.locator('[data-cover-code]').fill('incorrect-code');
  await exported.getByRole('button', { name: 'Validar e imprimir', exact: true }).click();
  await exported.getByText('El código no permite acceder a esta portada.', { exact: true }).waitFor();
  assert.equal(await exported.locator('[data-cover-authorship]').isVisible(), false);
  await exported.locator('[data-cover-code]').fill('fixture-cover-code');
  await exported.getByRole('button', { name: 'Validar e imprimir', exact: true }).click();
  await exported.locator('[data-cover-authors]').getByText('Autor de prueba', { exact: true }).waitFor();
  assert.equal(await exported.locator('[data-cover-code]').inputValue(), '');
  assert.equal(await exported.evaluate(() => localStorage.length + sessionStorage.length), 0);
  await exported.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  assert.equal(await exported.locator('[data-cover-authorship]').isVisible(), false);
  assert.equal(await exported.locator('[data-cover-authors]').textContent(), '');
  await exported.getByRole('button', { name: 'Guardar PDF' }).click();
  assert.equal(await exported.locator('body').getAttribute('data-print-requested'), 'true');
  await exported.emulateMedia({ media: 'print' });
  await exported.setViewportSize({ width: 1123, height: 632 });
  const overflowingSlides = await exported.locator('.export-slide').evaluateAll(slides => slides.filter(slide => {
    const box = slide.getBoundingClientRect();
    const header = slide.querySelector('header')!.getBoundingClientRect();
    const body = slide.querySelector('.slide-body')!.getBoundingClientRect();
    const footer = slide.querySelector('footer')!.getBoundingClientRect();
    if (header.bottom > body.top + 1 || body.bottom > footer.top + 1) return true;
    const walker = document.createTreeWalker(slide, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent?.trim() || node.parentElement?.closest('svg, [hidden]')) continue;
      const range = document.createRange(); range.selectNodeContents(node);
      for (const textBox of range.getClientRects()) {
        if (textBox.width && (textBox.left < box.left + 1 || textBox.top < box.top + 1 || textBox.right > box.right - 1 || textBox.bottom > box.bottom - 1)) return true;
        if (node.parentElement?.closest('.slide-body') && (textBox.top < body.top - 1 || textBox.bottom > footer.top - 1)) return true;
      }
    }
    return [...slide.querySelectorAll('.slide-references li, figcaption')].some(element => {
      const bounds = element.getBoundingClientRect();
      return bounds.width > 0 && bounds.bottom > footer.top - 1;
    });
  }).map(slide => slide.querySelector('h2')?.textContent));
  assert.deepEqual(overflowingSlides, [], 'Texto o gráficos fuera de la diapositiva');
  for (const number of [2, 6, 10, 14, 16]) {
    await exported.locator('.export-slide').nth(number - 1).screenshot({ path: `${output}/diapositiva-${number}.png` });
  }
  const pdf = await exported.pdf({ path: `${output}/ecosistemas-foticos.pdf`, preferCSSPageSize: true, printBackground: true });
  const count = (pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) ?? []).length;
  assert.equal(count, preparePresentation().length, 'Una página PDF por diapositiva');
  await exported.screenshot({ path: `${output}/exportacion.png`, fullPage: true });
  await exported.close();
  await context.close();
  const noScript = await browser.newContext({ javaScriptEnabled: false });
  await noScript.route('**/*', async route => {
    const path = new URL(route.request().url()).pathname;
    const target = resolve(directory, `.${path.endsWith('/') ? `${path}index.html` : path}`);
    const types: Record<string, string> = { '.html': 'text/html', '.css': 'text/css', '.svg': 'image/svg+xml' };
    await route.fulfill({ contentType: types[extname(target)] ?? 'application/octet-stream', body: await readFile(target) });
  });
  const offline = await noScript.newPage();
  await offline.goto('http://foticos.test/');
  assert.equal(await offline.locator('.scenario:visible').count(), 3);
  assert.equal(await offline.getByRole('button', { name: 'Modo exposición' }).count(), 0);
  await offline.locator('.offline-explanation').first().locator('summary').click();
  assert.equal(await offline.locator('.offline-explanation').first().locator('p').first().isVisible(), true);
  console.log('Navegador: 7 tamaños, teclado, actividad, animaciones, pantalla completa, PPTX, portada PDF general y privada, limpieza tras impresión y sin JavaScript. Archivos en test-results/revision-motion/.');
} finally {
  await browser.close();
}
