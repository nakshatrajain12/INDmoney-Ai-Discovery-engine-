const { chromium } = require('playwright'); const path = require('path');
const url = 'file:///' + process.argv[2].split('\\').join('/') + '/index.html'; const out = process.argv[3];
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 430, height: 2300 } });
  for (const theme of ['dark', 'light']) {
    const page = await ctx.newPage(); await page.goto(url);
    await page.evaluate(t => { localStorage.setItem('ind_theme', t); }, theme); await page.reload(); await page.waitForTimeout(200);
    await page.evaluate(() => { window.SIPSteady.S.sim.noDelay = true; });
    const snap = async (name) => { await page.waitForTimeout(120); await page.locator('#phone').screenshot({ path: path.join(out, name + '-' + theme + '.png') }); };
    const run = (fn) => page.evaluate(fn);
    await snap('01-sip-dashboard');
    await run(() => window.SIPSteady.go('sipDetail', { id: 'A' })); await snap('02-sip-detail');
    await run(() => { window.SIPSteady.S.ui.sel = 'A'; window.SIPSteady.go('coachEntry', {}, { reset: true }); }); await snap('03-return-coach-select');
    await run(() => window.SIPSteady.ACT.openCoachFor({ id: 'A' }));
    await run(() => { window.SIPSteady.S.ui.xirrOpen = true; window.SIPSteady.ACT.ask({ id: 'How does XIRR differ from absolute return?' }); window.SIPSteady.ACT.ask({ id: 'What happens if I stay invested for 3 years?' }); });
    await snap('04-return-coach-explanation');
    await run(() => window.SIPSteady.ACT.openCoachFor({ id: 'F' })); await snap('05-return-coach-not-sure');
    await run(() => { window.SIPSteady.S.ui.filter = 'all'; window.SIPSteady.go('ledger', {}, { reset: true }); }); await snap('06-recent-transactions');
    await run(() => window.SIPSteady.ACT.openDebit({ id: 'B' })); await snap('07-failed-debit-explainer');
    await run(() => { window.SIPSteady.ACT.nextStep({ id: 'PAY', sip: 'B' }); }); await snap('08-pay-confirm-sheet');
    await run(() => { window.SIPSteady.ACT.payConfirm(); }); await page.waitForTimeout(150); await snap('09-pay-success');
    await run(() => { window.SIPSteady.ACT.payDone(); window.SIPSteady.go('statuses', {}, { reset: true }); }); await snap('10-sip-management');
    await run(() => { window.SIPSteady.ACT.openManage({ id: 'A' }); window.SIPSteady.S.ui.optSel = 'pause'; window.SIPSteady.render(); }); await snap('11-pause-options');
    await run(() => { window.SIPSteady.S.ui.pauseSel = '2'; window.SIPSteady.S.ui.ack = true; window.SIPSteady.go('pauseForm', { id: 'A' }); }); await snap('12-pause-select-date-confirm');
    await run(() => window.SIPSteady.ACT.confirmPause()); await page.waitForTimeout(150); await snap('13-pause-success');
    await run(() => { window.SIPSteady.ACT.openReminder({ id: 'A' }); window.SIPSteady.S.ui.rem.on = true; window.SIPSteady.S.ui.rem.opt = 'd3'; window.SIPSteady.render(); }); await snap('14-restart-reminder');
    await run(() => window.SIPSteady.ACT.saveReminder({ id: 'A' })); await snap('15-reminder-saved');
    await run(() => window.SIPSteady.ACT.goStatuses()); await snap('16-updated-sip-status');
    await run(() => { window.SIPSteady.ACT.clock({ id: 'rem' }); window.SIPSteady.ACT.clock({ id: 'rem' }); window.SIPSteady.ACT.openInbox(); }); await snap('17-inbox-reminder');
    await run(() => { window.SIPSteady.S.sim.errorNext = true; window.SIPSteady.go('ledger'); }); await snap('18-error-state');
    await run(() => { window.SIPSteady.go('account', {}, { reset: true }); }); await snap('19-account');
    await page.close();
  }
  await b.close();
})();
