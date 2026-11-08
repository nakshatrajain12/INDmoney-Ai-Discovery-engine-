import { describe, it, expect, afterEach } from 'vitest';
import { GET as getPersonas } from '@/app/api/v1/personas/route';
import { GET as getSips } from '@/app/api/v1/sips/route';
import { GET as getSip } from '@/app/api/v1/sips/[id]/route';
import { PersonaSummary, SipDetail, SipSummary } from '@/contracts/api';
import { setDemoToday } from '@/lib/clock';

afterEach(() => setDemoToday(null));

interface Envelope<T> {
  requestId: string;
  data?: T;
  error?: { code: string; message: string };
}
const call = async <T>(pending: Promise<Response> | Response) => {
  const res = await pending;
  const body = JSON.parse(await res.text()) as Envelope<T>;
  return { res, body };
};
const listSips = (qs: string) => getSips(new Request('http://localhost/api/v1/sips' + qs));
const sipById = (id: string, qs = '') => getSip(new Request('http://localhost/api/v1/sips/' + id + qs), { params: Promise.resolve({ id }) });

describe('GET /api/v1/personas', () => {
  it('returns every persona, schema-valid and labelled as demo data', async () => {
    const { res, body } = await call<unknown[]>(getPersonas(new Request('http://localhost/api/v1/personas')));
    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(30);
    for (const p of body.data!) expect(PersonaSummary.safeParse(p).success).toBe(true);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });
});

describe('GET /api/v1/sips?persona=', () => {
  it('returns the persona SIPs with derived status', async () => {
    const { res, body } = await call<Array<{ id: string; status: string }>>(listSips('?persona=multi-sip'));
    expect(res.status).toBe(200);
    expect(body.data!.map((s) => [s.id, s.status])).toEqual([
      ['multi-sip_s1', 'ACTIVE'],
      ['multi-sip_s2', 'ACTIVE'],
      ['multi-sip_s3', 'PAYMENT_FAILED']
    ]);
    for (const s of body.data!) expect(SipSummary.safeParse(s).success).toBe(true);
  });

  it('applies the asOf parameter', async () => {
    const { body } = await call<Array<{ status: string; asOf: string }>>(listSips('?persona=restart-pending&asOf=2026-11-20'));
    expect(body.data![0]!.status).toBe('ACTIVE');
    expect(body.data![0]!.asOf).toBe('2026-11-20');
  });

  it.each([
    ['', 400, 'INVALID_INPUT'],
    ['?persona=', 400, 'INVALID_INPUT'],
    ['?persona=../etc/passwd', 400, 'INVALID_INPUT'],
    ['?persona=UPPER', 400, 'INVALID_INPUT'],
    ['?persona=early-flat&asOf=2026-02-30', 400, 'INVALID_INPUT'],
    ['?persona=early-flat&asOf=tomorrow', 400, 'INVALID_INPUT'],
    ['?persona=no-such-persona', 404, 'NOT_FOUND']
  ])('rejects %j with %i %s and a calm message', async (qs, status, code) => {
    const { res, body } = await call(listSips(qs));
    expect(res.status).toBe(status);
    expect(body.error!.code).toBe(code);
    expect(body.error!.message).not.toMatch(/zod|regex|expected|stack|undefined/i);
  });
});

describe('GET /api/v1/sips/{id}', () => {
  it('returns the full detail for an early-flat SIP, including raw instalments and valuation, with no computed metrics', async () => {
    const { res, body } = await call<Record<string, unknown>>(sipById('early-flat_s1'));
    expect(res.status).toBe(200);
    expect(SipDetail.safeParse(body.data).success).toBe(true);
    expect((body.data as { instalments: unknown[] }).instalments).toHaveLength(5);
    // Phase 1 serves data only: financial metrics come from the Phase 2 engine, never from this route.
    for (const k of ['xirr', 'xirrPct', 'absoluteReturnPct', 'absoluteReturnPaise', 'tenureMonths']) expect(body.data).not.toHaveProperty(k);
  });

  it('shows a failed instalment and its failure record', async () => {
    const { body } = await call<{ status: string; failures: Array<{ reasonCode: string; resolved: boolean }> }>(sipById('debit-upi-limit_s1'));
    expect(body.data!.status).toBe('PAYMENT_FAILED');
    expect(body.data!.failures[0]).toMatchObject({ reasonCode: 'MOCK_UPI_DAILY_LIMIT_EXCEEDED', resolved: false });
  });

  it('shows a paused SIP with its pause schedule and an opted-in reminder', async () => {
    const { body } = await call<{ status: string; pause: { skippedDueDates: string[] }; reminder: { optedIn: boolean; remindOn: string } }>(sipById('restart-pending_s1'));
    expect(body.data!.status).toBe('RESTART_PENDING');
    expect(body.data!.reminder).toMatchObject({ optedIn: true, remindOn: '2026-11-17' });
    expect(body.data!.pause.skippedDueDates).toEqual(['2026-07-20', '2026-08-20', '2026-09-20', '2026-10-20']);
  });

  it('reports a missing valuation as null, never an estimate', async () => {
    const { body } = await call<{ valuation: { currentValuePaise: number | null; currentNavE4: number | null } }>(sipById('missing-valuation_s1'));
    expect(body.data!.valuation.currentValuePaise).toBeNull();
    expect(body.data!.valuation.currentNavE4).toBeNull();
  });

  it('applies the demo clock when no asOf is given', async () => {
    setDemoToday('2026-11-20');
    const { body } = await call<{ status: string; asOf: string }>(sipById('restart-pending_s1'));
    expect(body.data!.status).toBe('ACTIVE');
    expect(body.data!.asOf).toBe('2026-11-20');
  });

  it.each([
    ['no_such_sip', '', 404, 'NOT_FOUND'],
    ['early-flat_s1', '?asOf=2026-13-01', 400, 'INVALID_INPUT'],
    ['BAD ID', '', 400, 'INVALID_INPUT'],
    ['../secret', '', 400, 'INVALID_INPUT']
  ])('rejects id %j%s with %i %s', async (id, qs, status, code) => {
    const { res, body } = await call(sipById(id, qs));
    expect(res.status).toBe(status);
    expect(body.error!.code).toBe(code);
  });

  it('never exposes anything resembling a secret, real name or personal identifier', async () => {
    const text = await (await sipById('early-flat_s1')).text();
    expect(text).not.toMatch(/api[_-]?key|secret|password|@[a-z]+\.[a-z]+/i);
    expect(text).toContain('DEMO DATA');
  });
});
