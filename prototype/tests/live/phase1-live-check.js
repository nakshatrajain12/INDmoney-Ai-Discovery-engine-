// Usage: node tests/live/phase1-live-check.js   (run from the project root after `npm run build`)
// Boots the production server and exercises the Phase 1 data API over real HTTP.
const { spawn } = require('child_process');
const path = require('path');
const root = process.cwd();
const PORT = 3121;
const base = `http://localhost:${PORT}`;
let failures = 0;
const ok = (c, m) => { if (!c) { failures++; console.log('FAIL: ' + m); } else console.log('ok:   ' + m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (p) => { const r = await fetch(base + p); const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { /* not json */ } return { r, t, j }; };

(async () => {
  const srv = spawn(process.execPath, [path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next'), 'start', '-p', String(PORT)], { cwd: root, env: { ...process.env, NODE_ENV: 'production', LLM_ENABLED: 'false' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = ''; srv.stdout.on('data', (d) => (logs += d)); srv.stderr.on('data', (d) => (logs += d));
  let up = false;
  for (let i = 0; i < 60 && !up; i++) { try { up = (await fetch(base + '/api/v1/health')).status === 200; } catch (e) { await sleep(500); } }
  ok(up, 'server starts');

  const personas = await get('/api/v1/personas');
  ok(personas.r.status === 200 && personas.j.data.length === 30, 'GET /personas returns 30 demo personas');
  ok(personas.j.data.every((p) => p.isMock === true && p.dataLabel === 'DEMO DATA'), 'every persona is labelled DEMO DATA');
  ok(!!personas.j.requestId && personas.r.headers.get('x-request-id') === personas.j.requestId, 'request id in body and header');

  const multi = await get('/api/v1/sips?persona=multi-sip');
  ok(multi.j.data.map((s) => s.status).join() === 'ACTIVE,ACTIVE,PAYMENT_FAILED', 'multi-sip statuses: ACTIVE, ACTIVE, PAYMENT_FAILED');

  const early = await get('/api/v1/sips/early-flat_s1');
  const d = early.j.data;
  ok(d.sip.schemeName === 'Northstar Flexi Cap Fund' && d.instalments.length === 5 && d.status === 'ACTIVE', 'early-flat detail: fictional scheme, 5 instalments, ACTIVE');
  ok(d.sip.declared.totalInvestedPaise === 2500000 && d.valuation.currentValuePaise > 2440000 && d.valuation.currentValuePaise < 2450000, 'early-flat money in paise: invested 2,500,000; value between 2,440,000 and 2,450,000');
  ok(d.valuation.providerXirrBps === -914, 'provider XIRR supplied as -914 bp for early-flat');
  ok(!('xirrPct' in d) && !('absoluteReturnPct' in d), 'no computed metrics are served by the data API (Phase 2 owns them)');

  const per = { 'debit-insufficient-balance': 'MOCK_INSUFFICIENT_BALANCE', 'debit-upi-limit': 'MOCK_UPI_DAILY_LIMIT_EXCEEDED', 'debit-mandate-expired': 'MOCK_MANDATE_EXPIRED', 'debit-bank-unavailable': 'MOCK_BANK_SERVER_UNAVAILABLE', 'debit-timeout': 'MOCK_PAYMENT_TIMEOUT', 'debit-technical': 'MOCK_TECHNICAL_FAILURE', 'debit-unknown': 'PSP_ERR_77' };
  for (const [k, code] of Object.entries(per)) {
    const x = await get(`/api/v1/sips/${k}_s1`);
    ok(x.j.data.status === 'PAYMENT_FAILED' && x.j.data.failures[0].reasonCode === code, `${k}: PAYMENT_FAILED with code ${code}`);
  }
  const nr = await get('/api/v1/sips/debit-no-reason_s1');
  ok(nr.j.data.failures[0].reasonCode === null && nr.j.data.failures[0].providerMessage === null, 'debit-no-reason: code and message are null (never invented)');
  const tech = await get('/api/v1/sips/debit-technical_s1');
  ok(tech.j.data.failures[0].retry.nextRetryDate === '2026-11-11' && tech.j.data.failures[0].retry.verified === false, 'unverified retry date is present but flagged verified:false');

  const paused = await get('/api/v1/sips/paused_s1');
  ok(paused.j.data.status === 'PAUSED' && paused.j.data.pause.skippedDueDates.length === 3 && paused.j.data.reminder === null, 'paused: PAUSED, three skipped dates, no reminder');
  const rp = await get('/api/v1/sips/restart-pending_s1');
  ok(rp.j.data.status === 'RESTART_PENDING' && rp.j.data.reminder.remindOn === '2026-11-17', 'restart-pending: RESTART_PENDING with reminder on 2026-11-17');
  const rp2 = await get('/api/v1/sips/restart-pending_s1?asOf=2026-11-20');
  ok(rp2.j.data.status === 'ACTIVE', 'asOf=2026-11-20: the pause has ended so the SIP is ACTIVE');
  const canc = await get('/api/v1/sips/cancelled-with-failure_s1');
  ok(canc.j.data.status === 'CANCELLED', 'cancelled-with-failure: CANCELLED (failure never overrides)');
  const mv = await get('/api/v1/sips/missing-valuation_s1');
  ok(mv.j.data.valuation.currentValuePaise === null, 'missing-valuation: value is null, not estimated');

  const e1 = await get('/api/v1/sips/nope_s9'); ok(e1.r.status === 404 && e1.j.error.code === 'NOT_FOUND', 'unknown SIP -> 404 NOT_FOUND');
  const e2 = await get('/api/v1/sips?persona=../etc'); ok(e2.r.status === 400 && e2.j.error.code === 'INVALID_INPUT', 'path-traversal persona -> 400');
  const e3 = await get('/api/v1/sips'); ok(e3.r.status === 400, 'missing persona -> 400');
  const e4 = await get('/api/v1/sips?persona=early-flat&asOf=2026-02-30'); ok(e4.r.status === 400, 'impossible date -> 400');
  const e5 = await get('/api/v1/sips/early-flat_s1?asOf=2026-13-01'); ok(e5.r.status === 400, 'invalid asOf on detail -> 400');
  ok(![e1, e2, e3, e4, e5].some((e) => /zod|regex|stack|at \w+\.\w+ \(/i.test(e.t)), 'error bodies leak no internals');

  const everything = personas.t + multi.t + early.t;
  ok(!/@[a-z]+\.[a-z]+|api[_-]?key|secret|password/i.test(everything), 'no secrets or personal identifiers in any response');
  ok(!/\b(parag|mirae|hdfc|icici)\b/i.test(everything), 'no real fund or bank names');
  ok(!logs.includes('Invalid mock fixtures'), 'server log shows no fixture validation failure');

  srv.kill();
  console.log(failures ? `\n${failures} FAILURE(S)` : '\nPHASE 1 LIVE API CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
