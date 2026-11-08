const { spawn } = require('child_process');
const { chromium } = require('playwright');
const path = require('path');
const root = process.argv[2];
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const p = spawn(process.execPath, [path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next'), 'dev', '-p', '3110'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = ''; p.stdout.on('data', d => out += d); p.stderr.on('data', d => out += d);
  let up = false;
  for (let i = 0; i < 80 && !up; i++) { try { const r = await fetch('http://localhost:3110/api/v1/health'); up = r.status === 200; } catch (e) { /* wait */ } await sleep(500); }
  console.log('dev server up:', up);
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 430, height: 900 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push('pageerror: ' + e.message)); page.on('console', m => { if (['error', 'warning'].includes(m.type())) errs.push(m.type() + ': ' + m.text().slice(0, 200)); });
  await page.goto('http://localhost:3110/'); await page.waitForFunction(() => /Backend connected/.test(document.getElementById('health-status')?.innerText || ''), null, { timeout: 30000 });
  console.log('page shows backend connected:', true);
  await page.getByRole('button', { name: /Switch to light mode/ }).click();
  console.log('theme toggle works in dev:', await page.evaluate(() => !document.documentElement.classList.contains('dark')));
  console.log('console errors/warnings:', JSON.stringify(errs));
  console.log('hydration warnings in server log:', /hydrat/i.test(out));
  await browser.close(); p.kill();
  process.exit(up && errs.length === 0 ? 0 : 1);
})();
