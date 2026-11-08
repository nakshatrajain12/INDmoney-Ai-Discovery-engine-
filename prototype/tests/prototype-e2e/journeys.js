// Headless end-to-end test of the three journeys using Playwright + the real files.
const { chromium } = require('playwright');
const path = require('path');
const url = 'file:///' + process.argv[2].replace(/\\/g, '/') + '/index.html';
const shots = process.argv[3];
let failures = 0;
const ok = (c, m) => { if (!c) { failures++; console.log('FAIL: ' + m); } else console.log('ok:   ' + m); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 430, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(url);
  await page.evaluate(() => { window.SIPSteady.S.sim.noDelay = true; });
  const txt = async () => (await page.locator('#screen').innerText());
  const click = async sel => { await page.locator(sel).first().click(); await page.waitForTimeout(60); };
  const shot = async n => { if (shots) await page.screenshot({ path: path.join(shots, n + '.png') }); };
  await page.waitForTimeout(150);

  // ---------- Dashboard ----------
  let t = await txt();
  ok(/Total invested/i.test(t) && /Current value/i.test(t), 'dashboard shows portfolio figures');
  await shot('01-dashboard-dark');

  // ---------- Journey A ----------
  await click('[data-act=openCoachEntry][data-id=A]');
  t = await txt();
  ok(/Select a SIP to understand/.test(t), 'A: select-a-SIP screen');
  await click('[data-act=selectSip][data-id=A]');
  await click('[data-act=explain]');
  t = await txt();
  ok(/Your figures/.test(t) && /What this means at month 5/.test(t) && /What it does not mean/.test(t), 'A: coach explanation blocks present');
  ok(/₹25,000/.test(t) && /₹24,450/.test(t), 'A: figures ₹25,000 / ₹24,450 shown');
  ok(/−₹550/.test(t) && /−2\.20%/.test(t), 'A: net movement −₹550 (−2.20%)');
  ok(/MEDIUM confidence/i.test(t), 'A: confidence label shown (MEDIUM, demo source)');
  ok(/Not investment advice/.test(t), 'A: disclaimer shown');
  await shot('02-coach-explanation-dark');
  await click('[data-act=toggleXirr]');
  t = await txt();
  ok(/annualised, money-weighted/.test(t), 'A: XIRR explanation expands');
  await click('[data-act=ask][data-id*="NAV change"], [data-act=ask]:nth-of-type(1)');
  t = await txt();
  ok(/How the NAV moved/.test(t), 'A: follow-up chip answered (NAV)');
  await page.fill('#fu-input', 'Should I stop my SIP?');
  await page.locator('[data-act=askTyped]').click(); await page.waitForTimeout(60);
  t = await txt();
  ok(/I can’t advise on that/.test(t) && /SEBI-registered adviser/.test(t), 'A: advice request refused');
  await page.fill('#fu-input', 'what is the weather');
  await page.locator('[data-act=askTyped]').click(); await page.waitForTimeout(60);
  t = await txt();
  ok(/not sure about that/i.test(t), 'A: out-of-scope question -> not sure');
  await page.fill('#fu-input', 'What happens if I stay invested for 3 years?');
  await page.locator('[data-act=askTyped]').click(); await page.waitForTimeout(60);
  ok((await page.locator('.bubble.refuse').count()) >= 2, 'A: prediction question refused');
  await shot('03-coach-followup-dark');
  await click('[data-act=doneCoach]');
  t = await txt();
  ok(/Active SIPs/.test(t), 'A: returned to dashboard');
  let j = await page.evaluate(() => window.SIPSteady.S.journey.A);
  ok(j.dash && j.select && j.coach && j.xirr && j.follow && j.home, 'A: all journey steps marked ' + JSON.stringify(j));

  // ---------- Journey B ----------
  await click('[data-act=openLedger]');
  t = await txt();
  ok(/Failed · tap to see why/.test(t), 'B: ledger shows failed instalment');
  await click('[data-act=openDebit]');
  t = await txt();
  ok(/Why it failed/.test(t) && /balance was not enough/.test(t), 'B: reason shown from rules');
  ok(/Is my SIP still active/.test(t) && /still active/.test(t), 'B: SIP status shown');
  ok(!/penalt/i.test(t) && !/100% safe/i.test(t), 'B: no unverified penalty/safety claims');
  ok(/12 Nov 2026/.test(t), 'B: retry date shown');
  await shot('04-debit-explainer-dark');
  await click('[data-act=sheet][data-id=charges]');
  ok(/don’t have verified information/.test(await page.locator('.sheet').innerText()), 'B: charges question -> not verified');
  await click('[data-act=closeSheet]');
  await click('[data-act=nextStep][data-id=PAY]');
  await click('[data-act=payConfirm]'); await page.waitForTimeout(120);
  const sheet = await page.locator('.sheet').innerText();
  ok(/Instalment paid \(demo\)/.test(sheet) && /No real money moved/.test(sheet), 'B: payment success state');
  await shot('05-pay-success-dark');
  await click('[data-act=payDone]');
  t = await txt();
  ok(!/An instalment failed/.test(t), 'B: failure banner gone after payment');
  await click('[data-act=openLedger]'); await click('[data-act=filter][data-id=failed]');
  t = await txt();
  ok(/No failed instalments/.test(t), 'B: empty state for failed filter after recovery');
  j = await page.evaluate(() => window.SIPSteady.S.journey.B);
  ok(j.dash && j.ledger && j.failed && j.reason && j.step && j.home, 'B: all journey steps marked ' + JSON.stringify(j));

  // ---------- Journey C ----------
  await page.evaluate(() => window.SIPSteady.ACT.home());
  await page.waitForTimeout(60);
  await click('[data-act=tab][data-id=statuses]');
  t = await txt();
  ok(/Total monthly commitment/.test(t), 'C: SIP management screen');
  await shot('06-statuses-dark');
  await click('[data-act=openManage][data-id=A]');
  ok(!(await page.locator('.opt[aria-checked=true]').count()), 'C: no option preselected');
  ok(await page.locator('[data-act=optContinue]').isDisabled(), 'C: Continue disabled until an option is chosen');
  await click('[data-act=opt][data-id=pause]');
  await click('[data-act=optContinue]');
  t = await txt();
  ok(/Pause duration/.test(t), 'C: pause form');
  ok(await page.locator('[data-act=confirmPause]').isDisabled(), 'C: Confirm disabled before selection');
  await click('[data-act=pauseSel][data-id=custom]');
  await page.fill('#cs', '2026-11-01'); await page.locator('#cs').dispatchEvent('change'); await page.waitForTimeout(60);
  await page.fill('#ce', '2026-12-01'); await page.locator('#ce').dispatchEvent('change'); await page.waitForTimeout(60);
  ok(/Choose a start date from today onwards/.test(await txt()), 'C: past start date rejected');
  await page.fill('#cs', '2026-11-20'); await page.locator('#cs').dispatchEvent('change'); await page.waitForTimeout(60);
  await page.fill('#ce', '2026-11-25'); await page.locator('#ce').dispatchEvent('change'); await page.waitForTimeout(60);
  ok(/No instalment falls in this period/.test(await txt()), 'C: window with no instalment rejected');
  await page.fill('#ce', '2026-11-10'); await page.locator('#ce').dispatchEvent('change'); await page.waitForTimeout(60);
  ok(/must be after the start date/.test(await txt()), 'C: end before start rejected');
  await click('[data-act=pauseSel][data-id="2"]');
  t = await txt();
  ok(/15 Nov 2026, 15 Dec 2026/.test(t) && /15 Jan 2027/.test(t), 'C: 2-month pause skips 15 Nov & 15 Dec, resumes 15 Jan');
  await shot('07-pause-form-dark');
  ok(await page.locator('[data-act=confirmPause]').isDisabled(), 'C: Confirm disabled until acknowledged');
  await click('[data-act=ack]');
  await click('[data-act=confirmPause]'); await page.waitForTimeout(150);
  t = await txt();
  ok(/Your pause is set/i.test(t) && /Paused until 15 Jan 2027/i.test(t), 'C: pause success state');
  await shot('08-pause-done-dark');
  await click('[data-act=openReminder]');
  t = await txt();
  ok(await page.locator('.toggle').getAttribute('aria-checked') === 'false', 'C: reminder OFF by default');
  await click('[data-act=remToggle]');
  ok(!(await page.locator('.opt[aria-checked=true]').count()), 'C: no reminder timing preselected');
  await click('[data-act=saveReminder]');
  ok(/Choose when/.test(await txt()), 'C: saving without a timing is blocked');
  await click('[data-act=remOpt][data-id=d3]');
  await shot('09-reminder-dark');
  await click('[data-act=saveReminder]');
  t = await txt();
  ok(/Reminder saved/.test(t) && /12 Jan 2027/.test(t), 'C: reminder saved for 12 Jan 2027');
  await click('[data-act=goStatuses]');
  t = await txt();
  ok(/Paused until 15 Jan 2027/i.test(t) && /Reminder on 12 Jan 2027/i.test(t), 'C: updated SIP status visible');
  await shot('10-updated-status-dark');
  j = await page.evaluate(() => window.SIPSteady.S.journey.C);
  ok(j.dash && j.mgmt && j.pause && j.confirm && j.reminder && j.status, 'C: all journey steps marked ' + JSON.stringify(j));

  // ---------- demo clock + reminder delivery ----------
  await page.evaluate(() => window.SIPSteady.ACT.clock({ id: 'rem' }));
  await page.evaluate(() => window.SIPSteady.ACT.clock({ id: 'rem' }));
  let inbox = await page.evaluate(() => window.SIPSteady.S.inbox.map(m => m.title + ' | ' + m.kind));
  ok(inbox.length >= 1, 'Clock: reminder delivered to in-app inbox -> ' + JSON.stringify(inbox));
  await page.evaluate(() => window.SIPSteady.ACT.clock({ id: 'rem' }));
  const before = await page.evaluate(() => window.SIPSteady.S.inbox.length);
  await page.evaluate(() => window.SIPSteady.ACT.clock({ id: '+1' }));
  const after = await page.evaluate(() => window.SIPSteady.S.inbox.length);
  ok(before === after, 'Clock: no duplicate reminder after another day passes');
  await click('[data-act=openInbox]');
  t = await txt();
  ok(/Resume/.test(t) && /Extend/.test(t) && /Leave paused/.test(t), 'Inbox: reminder shows three equal actions');
  await shot('11-inbox-dark');

  // ---------- no-opt-in property: pause then advance past resume => no reminder ----------
  await page.evaluate(() => window.SIPSteady.ACT.reset());
  await page.waitForTimeout(80);
  await page.evaluate(() => {
    const A = window.SIPSteady; const s = A.S.data.sips.find(x => x.id === 'A');
    const calc = A.computePause(s, '1', {}); s.status = 'PAUSED'; s.pause = { start: calc.start, end: calc.end, resume: calc.resume, skipped: calc.skipped, reminder: { on: false, mode: null, remindOn: null, daysBefore: null, channels: ['inapp'], sent: false } };
    A.setToday('2026-12-20');
  });
  inbox = await page.evaluate(() => window.SIPSteady.S.inbox.map(m => m.kind + ':' + m.sip));
  ok(!inbox.some(x => x.startsWith('reminder:A')), 'No reminder ever sent without opt-in -> ' + JSON.stringify(inbox));

  // ---------- states: error + loading + empty inbox ----------
  await page.evaluate(() => { const A = window.SIPSteady; A.resetAll(); A.S.sim.noDelay = false; A.S.sim.errorNext = true; A.go('ledger'); });
  await page.waitForTimeout(700);
  t = await txt();
  ok(/can.t load this right now/i.test(t), 'State: simulated network error shown');
  await shot('12-error-dark');
  await click('[data-act=retry]'); await page.waitForTimeout(700);
  ok(/Processed|Failed/.test(await txt()), 'State: Retry recovers');
  await page.evaluate(() => { const A = window.SIPSteady; A.S.sim.slow = true; A.go('statuses'); });
  await page.waitForTimeout(150);
  ok((await page.locator('.skel').count()) > 0, 'State: loading skeleton visible');
  await shot('13-loading-dark');
  await page.evaluate(() => { const A = window.SIPSteady; A.S.sim.slow = false; A.S.sim.noDelay = true; A.go('inbox'); });
  await page.waitForTimeout(100);
  ok(/Nothing here/.test(await txt()), 'State: empty inbox');

  // ---------- unknown reason + payment failure path ----------
  await page.evaluate(() => { const A = window.SIPSteady; A.resetAll(); A.S.sim.noDelay = true; A.S.sim.reason = 'UNKNOWN'; A.ACT.openDebit({ id: 'B' }); });
  await page.waitForTimeout(100);
  t = await txt();
  ok(/don’t have a reason to share yet/.test(t), 'Debit: unknown reason -> generic message, no guessed cause');
  ok(!/insufficient/i.test(t.replace(/Reason code[^\n]*/, '')), 'Debit: no invented reason in unknown case');
  await page.evaluate(() => { const A = window.SIPSteady; A.S.sim.reason = 'INSUFFICIENT_BALANCE'; A.ACT.openDebit({ id: 'B' }); A.S.sim.payFails = true; });
  await page.waitForTimeout(100);
  await click('[data-act=nextStep][data-id=PAY]'); await click('[data-act=payConfirm]'); await page.waitForTimeout(120);
  ok(/didn’t go through/.test(await page.locator('.sheet').innerText()), 'Debit: failed payment state');

  // ---------- light mode ----------
  await page.evaluate(() => { const A = window.SIPSteady; A.resetAll(); A.S.sim.noDelay = true; A.render(); });
  await click('[data-act=theme]');
  ok(await page.evaluate(() => !document.documentElement.classList.contains('dark')), 'Theme: light mode applied');
  ok(await page.evaluate(() => localStorage.getItem('ind_theme')) === 'light', 'Theme: choice persisted');
  await shot('14-dashboard-light');
  await page.evaluate(() => window.SIPSteady.ACT.openCoachFor({ id: 'A' })); await page.waitForTimeout(80);
  await shot('15-coach-light');
  await page.evaluate(() => { window.SIPSteady.ACT.openDebit({ id: 'B' }); }); await page.waitForTimeout(80);
  await shot('16-debit-light');
  await page.evaluate(() => { window.SIPSteady.ACT.openManage({ id: 'A' }); }); await page.waitForTimeout(80);
  await shot('17-manage-light');
  // reload keeps light mode
  await page.reload(); await page.waitForTimeout(200);
  ok(await page.evaluate(() => !document.documentElement.classList.contains('dark')), 'Theme: light persists after reload');

  // ---------- desktop layout + guide ----------
  const p2 = await ctx.newPage(); await p2.setViewportSize({ width: 1280, height: 900 }); await p2.goto(url); await p2.waitForTimeout(300);
  if (shots) await p2.screenshot({ path: path.join(shots, '18-desktop-guide.png') });
  ok(await p2.locator('#guide').isVisible(), 'Desktop: demo guide visible');

  // ---------- QA regression checks ----------
  await page.evaluate(() => { const A = window.SIPSteady; A.resetAll(); A.S.sim.noDelay = true; A.go('dashboard', {}, { reset: true, quick: true }); });
  // Undo pause (was a crash)
  await page.evaluate(() => { const A = window.SIPSteady; A.go('manage', { id: 'F' }, { quick: true }); A.S.ui.pauseSel = '1'; A.S.ui.ack = true; A.go('pauseForm', { id: 'F' }, { quick: true }); });
  await click('[data-act=confirmPause]'); await page.waitForTimeout(120);
  ok(/Your pause is set/i.test(await txt()), 'QA: pause F confirmed');
  await click('[data-act=undoPause]'); await page.waitForTimeout(120);
  ok(/Active SIPs/.test(await txt()) && (await page.evaluate(() => window.SIPSteady.S.data.sips.find(x => x.id === 'F').status)) === 'ACTIVE', 'QA: Undo pause works and returns to dashboard');
  // Pause failure leaves state unchanged and shows an error
  await page.evaluate(() => { const A = window.SIPSteady; A.S.sim.pauseFails = true; A.S.ui.pauseSel = '1'; A.S.ui.ack = true; A.go('pauseForm', { id: 'F' }, { quick: true }); });
  await click('[data-act=confirmPause]'); await page.waitForTimeout(120);
  ok(/pause wasn.t set up/i.test(await txt()) && (await page.evaluate(() => window.SIPSteady.S.data.sips.find(x => x.id === 'F').status)) === 'ACTIVE', 'QA: pause failure shows error, SIP unchanged');
  await page.evaluate(() => { window.SIPSteady.S.sim.pauseFails = false; });
  // Status chips distinguish failed / paused / cancelled
  await page.evaluate(() => { window.SIPSteady.resetAll(); window.SIPSteady.S.sim.noDelay = true; window.SIPSteady.go('statuses', {}, { reset: true, quick: true }); });
  const classOf = async label => page.evaluate(l => { const c = [...document.querySelectorAll('#screen .chip')].find(x => x.innerText.trim().toUpperCase().startsWith(l)); return c ? c.className : null; }, label);
  ok(/info/.test(await classOf('PAUSED')), 'QA: Paused chip uses info (blue)');
  ok(/fail/.test(await classOf('CANCELLED')), 'QA: Cancelled chip uses coral');
  ok(/warn/.test(await classOf('ACTIVE · 1 FAILED')), 'QA: Active with failed instalment uses amber, not coral');
  ok(/active/.test(await classOf('ACTIVE')), 'QA: Plain Active chip uses green');
  ok(/What the labels mean/.test(await txt()), 'QA: status legend present');
  // Hide amounts masks currency in explanation text
  await page.evaluate(() => { const A = window.SIPSteady; A.S.hidden = true; A.ACT.openCoachFor({ id: 'A' }); }); await page.waitForTimeout(80);
  const hiddenText = (await txt()).replace(/₹\d+\.\d\d/g, '');
  ok(!/₹\s?\d/.test(hiddenText), 'QA: hide-amounts masks every rupee amount on the Coach screen');
  await page.evaluate(() => { window.SIPSteady.S.hidden = false; });
  // Browser Back stays inside the prototype
  await page.evaluate(() => { const A = window.SIPSteady; A.resetAll(); A.S.sim.noDelay = true; A.go('dashboard', {}, { reset: true, quick: true }); A.go('ledger', {}, { quick: true }); });
  await page.goBack(); await page.waitForTimeout(120);
  ok((await page.evaluate(() => window.SIPSteady.S.stack.map(x => x.name).join('>'))) === 'dashboard', 'QA: browser Back returns to the previous screen');
  // Focus management
  await page.evaluate(() => { const A = window.SIPSteady; A.go('ledger', {}, { quick: true }); }); await page.waitForTimeout(60);
  ok((await page.evaluate(() => document.activeElement.id)) === 'screen', 'QA: focus moves to the new screen');
  await page.evaluate(() => { window.SIPSteady.ACT.sheet({ id: 'charges' }); }); await page.waitForTimeout(40);
  ok(await page.evaluate(() => !!document.activeElement.closest('.sheet')), 'QA: focus moves into an opened sheet');
  await page.keyboard.press('Escape'); await page.waitForTimeout(40);
  ok(!(await page.locator('.sheet').count()), 'QA: Escape closes the sheet');
  // Empty follow-up gives feedback; Coach opens with a summary
  await page.evaluate(() => { window.SIPSteady.resetAll(); window.SIPSteady.S.sim.noDelay = true; window.SIPSteady.ACT.openCoachFor({ id: 'A' }); }); await page.waitForTimeout(80);
  ok(/In short/i.test(await txt()), 'QA: Coach opens with an In short summary');
  await page.locator('[data-act=askTyped]').click(); await page.waitForTimeout(60);
  ok(/Type a question first/.test(await txt()), 'QA: empty follow-up shows a message');

  // ---------- every button has a handler ----------
  const missing = await page.evaluate(() => { const A = window.SIPSteady; A.resetAll(); const names = []; ['dashboard', 'statuses', 'coachEntry', 'ledger', 'account', 'explore'].forEach(r => { A.go(r, {}, { reset: true, quick: true }); document.querySelectorAll('[data-act]').forEach(e => { if (!A.ACT[e.dataset.act]) names.push(r + ':' + e.dataset.act); }); }); return names; });
  ok(missing.length === 0, 'Every data-act has a handler ' + JSON.stringify(missing));
  ok(errors.length === 0, 'No console/page errors ' + JSON.stringify(errors));
  await browser.close();
  console.log(failures ? '\n' + failures + ' FAILURE(S)' : '\nALL CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(2); });
