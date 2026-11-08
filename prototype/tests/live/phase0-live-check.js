// Usage: node tests/live/phase0-live-check.js <project root> <screenshot folder>  (needs: npm run build, and playwright installed)
// Phase 0 live verification: boots the production server and checks health, headers, env handling, page and theme.
const { spawn } = require('child_process');
const { chromium } = require('playwright');
const path = require('path');
const root = process.argv[2];
let failures = 0;
const ok = (c, m) => { if (!c) { failures++; console.log('FAIL: ' + m); } else console.log('ok:   ' + m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function boot(port, env) {
  const p = spawn(process.execPath, [path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next'), 'start', '-p', String(port)], { cwd: root, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = ''; p.stdout.on('data', d => out += d); p.stderr.on('data', d => out += d);
  return { p, logs: () => out };
}
async function waitUp(port) { for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://localhost:${port}/api/v1/health`); if (r) return true; } catch (e) { /* not yet */ } await sleep(500); } return false; }

(async () => {
  // ---- 1. normal environment ----
  const s1 = boot(3101, { LLM_ENABLED: 'false', LLM_API_KEY: '', APP_ENV: 'production', NODE_ENV: 'production' });
  ok(await waitUp(3101), 'server starts');
  const r = await fetch('http://localhost:3101/api/v1/health');
  const body = await r.json();
  ok(r.status === 200 && body.data.status === 'ok', 'health endpoint returns 200 and status ok');
  ok(!!body.requestId && r.headers.get('x-request-id') === body.requestId, 'health has a request id (body and header)');
  ok(body.data.llm.enabled === false, 'LLM is off by default');
  ok(r.headers.get('x-content-type-options') === 'nosniff' && r.headers.get('x-frame-options') === 'DENY', 'security headers present');
  ok(!r.headers.get('x-powered-by'), 'x-powered-by removed');
  const echo = await fetch('http://localhost:3101/api/v1/health', { headers: { 'x-request-id': 'demo-req-1' } });
  ok((await echo.json()).requestId === 'demo-req-1', 'supplied request id is echoed');
  const nf = await fetch('http://localhost:3101/api/v1/nope');
  ok(nf.status === 404, 'unknown route is 404');

  // ---- 2. page + frontend/backend link + theme, in a real browser ----
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 430, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://localhost:3101/');
  await page.waitForSelector('#health-status');
  await page.waitForFunction(() => /Backend connected/.test(document.getElementById('health-status').innerText), null, { timeout: 10000 });
  const status = await page.locator('#health-status').innerText();
  ok(/Backend connected · sip-steady v0\.1\.0 · production · LLM off \(templates only\)/.test(status), 'frontend shows live backend status: ' + status);
  ok(await page.evaluate(() => document.documentElement.classList.contains('dark')), 'default theme is dark');
  const btn = page.getByRole('button', { name: /Switch to light mode/ });
  ok(await btn.count() === 1, 'theme toggle has an accessible name');
  const box = await btn.boundingBox();
  ok(box.width >= 44 && box.height >= 44, `theme toggle is at least 44px (${Math.round(box.width)}x${Math.round(box.height)})`);
  await btn.click();
  ok(await page.evaluate(() => !document.documentElement.classList.contains('dark')), 'toggle switches to light');
  ok(await page.evaluate(() => localStorage.getItem('ind_theme')) === 'light', 'choice stored under ind_theme');
  await page.reload(); await page.waitForSelector('#health-status');
  ok(await page.evaluate(() => !document.documentElement.classList.contains('dark')), 'light mode persists after reload (no flash)');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  ok(bg === 'rgb(244, 246, 249)', 'light canvas colour token applied: ' + bg);
  await page.evaluate(() => localStorage.setItem('ind_theme', 'dark')); await page.reload(); await page.waitForSelector('#health-status');
  const bgd = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  ok(bgd === 'rgb(11, 14, 20)', 'dark canvas colour token applied: ' + bgd);
  await page.screenshot({ path: path.join(process.argv[3], 'phase0-dark.png') });
  await page.getByRole('button', { name: /Switch to light mode/ }).click();
  await page.screenshot({ path: path.join(process.argv[3], 'phase0-light.png') });
  const html = await page.content();
  ok(!/sk-|LLM_API_KEY/.test(html), 'no secret or key name appears in the rendered HTML');
  ok(errors.length === 0, 'no browser console or page errors ' + JSON.stringify(errors));
  await browser.close();
  s1.p.kill();
  await sleep(500);

  // ---- 3. invalid environment fails safely ----
  const s2 = boot(3102, { LLM_ENABLED: 'true', LLM_PROVIDER: '', LLM_MODEL: '', LLM_API_KEY: '', NODE_ENV: 'production' });
  ok(await waitUp(3102), 'server still starts with an invalid LLM configuration');
  const bad = await fetch('http://localhost:3102/api/v1/health');
  const bb = await bad.json();
  ok(bad.status === 500 && bb.error.code === 'CONFIG_ERROR', 'invalid config -> calm CONFIG_ERROR (500)');
  ok(!JSON.stringify(bb).includes('LLM_API_KEY'), 'error response does not name secret variables');
  s2.p.kill();

  // ---- 4. a real key never reaches the client or the response ----
  const s3 = boot(3103, { LLM_ENABLED: 'true', LLM_PROVIDER: 'demo', LLM_MODEL: 'demo', LLM_API_KEY: 'sk-test-DO-NOT-LEAK-12345', NODE_ENV: 'production' });
  ok(await waitUp(3103), 'server starts with LLM enabled and a key');
  const t = await (await fetch('http://localhost:3103/api/v1/health')).text();
  const page3 = await (await fetch('http://localhost:3103/')).text();
  ok(!t.includes('sk-test-DO-NOT-LEAK') && !page3.includes('sk-test-DO-NOT-LEAK'), 'key is absent from API response and HTML');
  ok(JSON.parse(t).data.llm.enabled === true && JSON.parse(t).data.llm.configured === true, 'health reports configured without the value');
  ok(!s3.logs().includes('sk-test-DO-NOT-LEAK'), 'key is absent from server logs');
  s3.p.kill();

  console.log(failures ? `\n${failures} FAILURE(S)` : '\nPHASE 0 LIVE CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(2); });
