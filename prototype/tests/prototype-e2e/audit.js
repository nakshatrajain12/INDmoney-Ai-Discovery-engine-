// QA audit harness for the SIP Steady clickable prototype. Prints JSON findings.
const { chromium } = require('playwright');
const fs = require('fs');
const url = 'file:///' + process.argv[2].split('\\').join('/') + '/index.html';
const outFile = process.argv[3];
const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const R = { nav: [], dead: [], figures: [], xirr: [], terms: {}, advice: [], axe: [], small: [], focus: [], texts: {}, errors: [] };

const SETUPS = [
  ['dashboard', {}, null], ['sipDetail', { id: 'A' }, null], ['sipDetail', { id: 'B' }, null], ['sipDetail', { id: 'C' }, null], ['sipDetail', { id: 'E' }, null], ['sipDetail', { id: 'F' }, null],
  ['coachEntry', {}, 'sel'], ['coachExplain', { id: 'A' }, null], ['coachExplain', { id: 'F' }, null], ['ledger', {}, null], ['debit', { id: 'B' }, null], ['statuses', {}, null],
  ['manage', { id: 'A' }, 'opt'], ['pauseForm', { id: 'A' }, 'pause2'], ['reduce', { id: 'A' }, null], ['reminder', { id: 'C' }, 'remon'], ['inbox', {}, 'inbox'], ['account', {}, null], ['explore', {}, null], ['mandate', { id: 'B' }, 'mand'],
  ['pauseDone', { id: 'A' }, 'paused'], ['reminderDone', { id: 'C' }, null]
];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 430, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => R.errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/CORS policy|ERR_FAILED/.test(m.text())) R.errors.push('console: ' + m.text()); });
  await page.goto(url); await page.waitForTimeout(150);
  await page.evaluate(() => { window.SIPSteady.S.sim.noDelay = true; });

  const prep = async (name, p, extra, theme) => {
    await page.evaluate(([n, p, extra, theme]) => {
      const A = window.SIPSteady, S = A.S; A.resetAll(); S.sim.noDelay = true; S.theme = theme; S.sheet = null; S.hidden = false;
      if (extra === 'sel') S.ui.sel = 'A';
      if (extra === 'opt') S.ui.optSel = 'pause';
      if (extra === 'pause2') { S.ui.pauseSel = '2'; S.ui.ack = true; }
      if (extra === 'paused') { const s = S.data.sips.find(x => x.id === 'A'); const c = A.computePause(s, '2', {}); s.status = 'PAUSED'; s.pause = { start: c.start, end: c.end, resume: c.resume, skipped: c.skipped, reminder: { on: false, mode: null, remindOn: null, daysBefore: null, channels: ['inapp'], sent: false } }; }
      if (extra === 'remon') { S.ui.rem = { on: true, opt: 'd3', date: '', channels: ['inapp'], err: null }; }
      if (extra === 'inbox') { A.setToday('2026-11-17'); }
      if (extra === 'mand') { S.data.sips.find(x => x.id === 'B').mandate = 'EXPIRED'; }
      A.go(n, p, { reset: true, quick: true });
    }, [name, p, extra, theme]);
    await page.waitForTimeout(40);
  };

  // ---- 1. Click-everything crawl (dead buttons, errors) + text capture ----
  for (const [name, p, extra] of SETUPS) {
    await prep(name, p, extra, 'dark');
    const key = name + ':' + JSON.stringify(p);
    R.texts[key] = await page.locator('#phone').innerText();
    const n = await page.locator('[data-act]').count();
    const hasBack = await page.locator('.header [data-act=back]').count();
    const hasNav = await page.locator('.nav').count();
    if (!hasBack && !hasNav) R.nav.push(key + ': no back and no nav (dead end)');
    for (let i = 0; i < n; i++) {
      await prep(name, p, extra, 'dark');
      const el = page.locator('[data-act]').nth(i);
      const info = await el.evaluate(e => ({ act: e.dataset.act, id: e.dataset.id || '', text: (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 40), disabled: e.hasAttribute('disabled'), visible: !!(e.offsetWidth || e.offsetHeight) }));
      if (info.disabled || !info.visible) continue;
      const before = await page.evaluate(() => document.getElementById('phone').innerHTML + document.getElementById('portal').innerHTML + document.getElementById('guide').innerHTML.length);
      try { await el.click({ timeout: 2000 }); } catch (e) { R.dead.push(key + ' #' + i + ' ' + info.act + ': click failed ' + e.message.split('\n')[0]); continue; }
      await page.waitForTimeout(30);
      const after = await page.evaluate(() => document.getElementById('phone').innerHTML + document.getElementById('portal').innerHTML + document.getElementById('guide').innerHTML.length);
      if (before === after) R.dead.push(key + ' #' + i + ' [' + info.act + ':' + info.id + '] "' + info.text + '": no visible change');
    }
  }

  // ---- 2. Figure consistency + independent XIRR ----
  const fig = await page.evaluate(() => {
    const A = window.SIPSteady, S = A.S; A.resetAll(); const out = [];
    const nf = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
    S.data.sips.forEach(s => { const c = A.calcSip(s, S.today); out.push({ id: s.id, inv: nf.format(Math.round(c.investedP / 100)), val: nf.format(Math.round(c.valueP / 100)), abs: nf.format(Math.round(Math.abs(c.absP) / 100)), pct: c.absPct == null ? null : Math.abs(c.absPct).toFixed(2), x: c.xirr, flows: c.flows, paid: c.paid.length, invP: c.investedP, valP: c.valueP, monthNo: c.monthNo }); });
    return out;
  });
  const indepXirr = flows => { const d0 = Date.parse(flows[0].d); const f = r => flows.reduce((a, x) => a + x.c / Math.pow(1 + r, (Date.parse(x.d) - d0) / 86400000 / 365), 0); let r = 0.05; for (let i = 0; i < 200; i++) { const h = 1e-6; const d = (f(r + h) - f(r - h)) / (2 * h); const nr = r - f(r) / d; if (!isFinite(nr)) break; if (Math.abs(nr - r) < 1e-12) { r = nr; break; } r = nr; } return r * 100; };
  fig.forEach(s => { if (s.x != null) { const ix = indepXirr(s.flows); R.xirr.push({ id: s.id, app: +s.x.toFixed(4), indep: +ix.toFixed(4), ok: Math.abs(ix - s.x) < 0.01 }); } });
  const expectIn = { 'sipDetail:{"id":"A"}': 'A', 'coachExplain:{"id":"A"}': 'A', 'sipDetail:{"id":"B"}': 'B', 'sipDetail:{"id":"C"}': 'C' };
  for (const k of Object.keys(expectIn)) { const s = fig.find(f => f.id === expectIn[k]); const t = R.texts[k]; ['₹' + s.inv, '₹' + s.val].forEach(str => { if (!t.includes(str)) R.figures.push(k + ' missing ' + str); }); if (s.pct && !t.includes(s.pct + '%')) R.figures.push(k + ' missing pct ' + s.pct); }
  const dashT = R.texts['dashboard:{}'];
  fig.filter(s => ['A', 'B', 'F'].includes(s.id)).forEach(s => { if (!dashT.includes('₹' + s.val)) R.figures.push('dashboard missing value of ' + s.id + ' ₹' + s.val); });
  const hero = await page.evaluate(() => { const A = window.SIPSteady; return A.S.data.sips.filter(s => s.status !== 'CANCELLED').reduce((a, s) => { const c = A.calcSip(s, A.S.today); a.inv += c.investedP; a.val += c.valueP; a.sumRoundedVal += Math.round(c.valueP / 100); return a; }, { inv: 0, val: 0, sumRoundedVal: 0 }); });
  R.hero = { totalValueRounded: Math.round(hero.val / 100), sumOfRoundedValues: hero.sumRoundedVal };

  // ---- 3. Terminology ----
  const all = Object.values(R.texts).join('\n');
  const count = rx => (all.match(rx) || []).length;
  R.terms = {
    instalment_uk: count(/instalment/gi), installment_us: count(/installment/gi),
    failed: count(/\bfailed\b/gi), unsuccessful: count(/unsuccessful/gi), missed: count(/\bmissed\b/gi), didnt_go_through: count(/didn.t go through/gi),
    net_return: count(/net return/gi), net_movement: count(/net movement/gi), absolute_return: count(/absolute return/gi), return_plain: count(/\breturn\b/gi),
    avg_nav: count(/avg purchase nav|average purchase nav/gi), mandate: count(/mandate/gi), autopay: count(/autopay/gi), pause: count(/\bpaus/gi), skip: count(/\bskip/gi),
    resume: count(/\bresume/gi), restart: count(/\brestart/gi), cancel: count(/cancel/gi), stop: count(/\bstop/gi)
  };

  // ---- 4. Advice scan ----
  const adviceRx = /(you should|we recommend|recommend|consider (pausing|stopping|continuing)|better to|you may want|avoid (pausing|stopping)|don.t panic|stay invested|keep (your )?sip|keep sip|good time|bad time|wait for the (market|nav)|it.s normal to|nothing to worry|will recover|likely to|expected to|should (continue|stop|pause))/gi;
  Object.entries(R.texts).forEach(([k, t]) => { (t.match(adviceRx) || []).forEach(m => R.advice.push(k + ': "' + m + '"')); });


  // ---- 4b. Hide-amounts leak scan + readability ----
  R.maskLeaks = [];
  for (const [name, p, extra] of SETUPS) {
    await prep(name, p, extra, 'dark');
    await page.evaluate(() => { window.SIPSteady.S.hidden = true; window.SIPSteady.render(); });
    const t = (await page.locator('#phone').innerText()).replace(/₹\d+\.\d\d/g, '');
    const m = t.match(/₹\s?\d[\d,]*/g); if (m) R.maskLeaks.push(name + ':' + JSON.stringify(p) + ' -> ' + [...new Set(m)].slice(0, 4).join(' '));
    await page.evaluate(() => { window.SIPSteady.S.hidden = false; });
  }
  const syl = w => { w = w.toLowerCase().replace(/[^a-z]/g, ''); if (!w) return 0; const m = w.replace(/e$/, '').match(/[aeiouy]+/g); return Math.max(1, m ? m.length : 1); };
  const flesch = txt => { const sents = txt.split(/[.!?]+\s/).filter(x => x.trim().length > 3); const words = txt.split(/\s+/).filter(Boolean); const sy = words.reduce((a, w) => a + syl(w), 0); return +(206.835 - 1.015 * (words.length / sents.length) - 84.6 * (sy / words.length)).toFixed(1); };
  await prep('coachExplain', { id: 'A' }, null, 'dark');
  const paras = await page.evaluate(() => [...document.querySelectorAll('#screen p, #screen .note span')].map(e => e.innerText).filter(t => t.length > 60));
  R.readability = { fleschReadingEase: flesch(paras.join(' ')), paragraphs: paras.length, sample: paras.slice(0, 2) };

  // ---- 5. Axe a11y, both themes ----
  for (const theme of ['dark', 'light']) {
    for (const [name, p, extra] of SETUPS) {
      await prep(name, p, extra, theme);
      await page.evaluate(() => { document.documentElement.classList.toggle('dark', window.SIPSteady.S.theme === 'dark'); }); await page.waitForTimeout(350);
      await page.addScriptTag({ content: axeSrc }).catch(() => {});
      const res = await page.evaluate(async () => { const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'] } }); return r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes.slice(0, 2).map(n => n.target.join(' ') + ' :: ' + (n.failureSummary || '').split('\n').slice(1, 2).join(' ')) })); });
      res.forEach(v => R.axe.push({ screen: name + ':' + JSON.stringify(p), theme, ...v }));
    }
  }

  // ---- 6. Target sizes (<44px) ----
  await prep('statuses', {}, null, 'dark');
  R.small = await page.evaluate(() => [...document.querySelectorAll('button, a, input, select, [role=button], [role=radio], [role=checkbox], [role=switch]')].filter(e => e.offsetWidth).map(e => { const r = e.getBoundingClientRect(); return { t: (e.innerText || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 28), w: Math.round(r.width), h: Math.round(r.height) }; }).filter(x => x.h < 44 || x.w < 44));

  // ---- 7. Focus management ----
  await prep('dashboard', {}, null, 'dark');
  await page.locator('[data-act=openLedger]').click(); await page.waitForTimeout(60);
  R.focus.push({ afterNavigation_activeElement: await page.evaluate(() => document.activeElement && (document.activeElement.id || document.activeElement.tagName)) });
  await page.evaluate(() => { window.SIPSteady.ACT.sheet({ id: 'charges' }); }); await page.waitForTimeout(40);
  R.focus.push({ afterSheetOpen_activeInsideSheet: await page.evaluate(() => !!document.activeElement.closest('.sheet')) });
  await page.keyboard.press('Escape'); await page.waitForTimeout(40);
  R.focus.push({ afterSheetClose_returnedToTrigger: await page.evaluate(() => document.activeElement && document.activeElement.tagName !== 'BODY') });
  R.focus.push({ documentTitle: await page.title() });
  R.focus.push({ liveRegionForRouteChange: await page.locator('[aria-live]').count() });

  // ---- 8. Browser back button ----
  await prep('dashboard', {}, null, 'dark');
  await page.locator('[data-act=openLedger]').click(); await page.waitForTimeout(60);
  await page.goBack().catch(() => {}); await page.waitForTimeout(150);
  R.browserBack = { stillInApp: (await page.url()).includes('index.html'), title: await page.evaluate(() => window.SIPSteady ? window.SIPSteady.S.stack.map(x => x.name).join('>') : 'left app') };

  fs.writeFileSync(outFile, JSON.stringify(R, null, 1));
  await browser.close();
  console.log('written', outFile);
})().catch(e => { console.error('AUDIT ERROR', e); process.exit(2); });
