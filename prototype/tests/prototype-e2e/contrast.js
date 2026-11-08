const { chromium } = require('playwright'); const fs = require('fs');
const url = 'file:///' + process.argv[2].split('\\').join('/') + '/index.html';
const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const SET = [['dashboard', {}], ['sipDetail', { id: 'A' }], ['coachExplain', { id: 'A' }], ['debit', { id: 'B' }], ['statuses', {}], ['pauseForm', { id: 'A' }, 'p'], ['reminder', { id: 'C' }, 'r']];
(async () => {
  const b = await chromium.launch(); const page = await (await b.newContext({ viewport: { width: 430, height: 900 } })).newPage();
  await page.goto(url); await page.waitForTimeout(150); await page.addScriptTag({ content: axeSrc });
  const seen = {};
  for (const theme of ['dark', 'light']) for (const [n, p, x] of SET) {
    await page.evaluate(([n, p, x, theme]) => { const A = window.SIPSteady, S = A.S; A.resetAll(); S.sim.noDelay = true; S.hidden = false; S.theme = theme; if (x === 'p') { S.ui.pauseSel = '2'; S.ui.ack = true; } if (x === 'r') { S.ui.rem = { on: true, opt: 'd3', date: '', channels: ['inapp'], err: null }; } A.go(n, p, { reset: true, quick: true }); document.documentElement.classList.toggle('dark', theme === 'dark'); }, [n, p, x, theme]);
    await page.waitForTimeout(40);
    const res = await page.evaluate(async () => { const r = await window.axe.run(document, { runOnly: ['color-contrast'] }); const out = []; r.violations.forEach(v => v.nodes.forEach(nd => { const d = (nd.any[0] && nd.any[0].data) || {}; out.push({ sel: nd.target.join(' '), fg: d.fgColor, bg: d.bgColor, ratio: d.contrastRatio, size: d.fontSize, text: (nd.html || '').replace(/\s+/g, ' ').slice(0, 90) }); })); return out; });
    res.forEach(r => { const k = theme + ' ' + r.fg + ' on ' + r.bg + ' ' + r.ratio + ' ' + r.size; (seen[k] = seen[k] || []).push(r.text); });
  }
  Object.entries(seen).forEach(([k, v]) => console.log(k, '| n=' + v.length, '|', [...new Set(v)].slice(0, 2).join(' || ')));
  await b.close();
})();
