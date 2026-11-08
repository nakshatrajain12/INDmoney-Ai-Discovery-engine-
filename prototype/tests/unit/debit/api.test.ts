import { describe, it, expect, beforeEach } from 'vitest';
import { GET as getDebitEvents } from '@/app/api/v1/sips/[id]/debit-events/route';
import { GET as explainDebitEvent } from '@/app/api/v1/debit-events/[id]/explain/route';
import { GET as explainDebitEventAlias } from '@/app/api/v1/debit-events/[id]/explanation/route';
import { POST as retryDebitEvent } from '@/app/api/v1/debit-events/[id]/retry/route';
import { DebitDiagnosis, DebitEventSummary, RetryResult } from '@/contracts/debit';
import { resetProviderForTests } from '@/data';
import { clearIdempotencyCache } from '@/domain/debit/retry';

beforeEach(() => {
  resetProviderForTests();
  clearIdempotencyCache();
});

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

const debitEventsForSip = (id: string, qs = '') =>
  getDebitEvents(new Request(`http://localhost/api/v1/sips/${id}/debit-events${qs}`), {
    params: Promise.resolve({ id })
  });

const explainEvent = (id: string, qs = '') =>
  explainDebitEvent(new Request(`http://localhost/api/v1/debit-events/${id}/explain${qs}`), {
    params: Promise.resolve({ id })
  });

const explainEventAlias = (id: string, qs = '') =>
  explainDebitEventAlias(new Request(`http://localhost/api/v1/debit-events/${id}/explanation${qs}`), {
    params: Promise.resolve({ id })
  });

const retryEvent = (id: string, payload?: Record<string, unknown>) =>
  retryDebitEvent(
    new Request(`http://localhost/api/v1/debit-events/${id}/retry`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload ? JSON.stringify(payload) : undefined
    }),
    { params: Promise.resolve({ id }) }
  );

describe('GET /api/v1/sips/{id}/debit-events', () => {
  it('returns debit events list with status chips for a failed SIP', async () => {
    const { res, body } = await call<DebitEventSummary[]>(debitEventsForSip('debit-upi-limit_s1'));
    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);

    const event = body.data![0]!;
    expect(DebitEventSummary.safeParse(event).success).toBe(true);
    expect(event.category).toBe('UPI_DAILY_LIMIT');
    expect(event.statusChip.label).toBe('Active · 1 failed instalment');
    expect(event.statusChip.variant).toBe('amber');
    expect(event.retryAllowed).toBe(true);
  });

  it('returns empty array when SIP has zero debit failures', async () => {
    const { res, body } = await call<DebitEventSummary[]>(debitEventsForSip('positive_s1'));
    expect(res.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it('rejects invalid SIP id with 400', async () => {
    const { res, body } = await call(debitEventsForSip('invalid/id'));
    expect(res.status).toBe(400);
    expect(body.error!.code).toBe('INVALID_INPUT');
  });

  it('returns 404 for unknown SIP', async () => {
    const { res, body } = await call(debitEventsForSip('non_existent_sip_s1'));
    expect(res.status).toBe(404);
    expect(body.error!.code).toBe('NOT_FOUND');
  });
});

describe('GET /api/v1/debit-events/{id}/explain', () => {
  it('returns structured diagnosis for a mapped failure event', async () => {
    const { res, body } = await call<DebitDiagnosis>(explainEvent('debit-upi-limit_s1_f1'));
    expect(res.status).toBe(200);
    expect(DebitDiagnosis.safeParse(body.data).success).toBe(true);

    const diag = body.data!;
    expect(diag.category).toBe('UPI_DAILY_LIMIT');
    expect(diag.isSipActive).toBe(true);
    expect(diag.statusChip.variant).toBe('amber');
    expect(diag.humanReason).toContain('UPI daily transaction limit was reached');
    expect(diag.nextAction.buttonText).toBe('Pay ₹4,000 manually now');
    expect(diag.audit.ruleId).toBe('DE-RULE-001');
    expect(diag.audit.ruleVersion).toBe('debit-rules.v1');
  });

  it('returns structured diagnosis for an unmapped error code (generic fallback)', async () => {
    const { res, body } = await call<DebitDiagnosis>(explainEvent('debit-unknown_s1_f1'));
    expect(res.status).toBe(200);
    expect(DebitDiagnosis.safeParse(body.data).success).toBe(true);

    const diag = body.data!;
    expect(diag.category).toBe('GENERIC_UNKNOWN');
    expect(diag.humanReason).toBe('We could not confirm the exact bank failure code.');
    expect(diag.isSipActive).toBe(true);
    expect(diag.statusChip.variant).toBe('amber');
  });

  it('returns structured diagnosis for no reason supplied (null reason code)', async () => {
    const { res, body } = await call<DebitDiagnosis>(explainEvent('debit-no-reason_s1_f1'));
    expect(res.status).toBe(200);
    expect(DebitDiagnosis.safeParse(body.data).success).toBe(true);

    const diag = body.data!;
    expect(diag.category).toBe('GENERIC_UNKNOWN');
    expect(diag.reasonCode).toBeNull();
    expect(diag.isSipActive).toBe(true);
  });

  it('alias route GET /api/v1/debit-events/{id}/explanation returns identical diagnosis', async () => {
    const { res, body } = await call<DebitDiagnosis>(explainEventAlias('debit-upi-limit_s1_f1'));
    expect(res.status).toBe(200);
    expect(body.data!.category).toBe('UPI_DAILY_LIMIT');
  });

  it('returns 404 for non-existent debit event', async () => {
    const { res, body } = await call(explainEvent('non_existent_event_f1'));
    expect(res.status).toBe(404);
    expect(body.error!.code).toBe('NOT_FOUND');
  });
});

describe('POST /api/v1/debit-events/{id}/retry', () => {
  it('successfully retries an eligible payment failure and settles instalment', async () => {
    const { res, body } = await call<RetryResult>(
      retryEvent('debit-upi-limit_s1_f1', { idempotencyKey: 'idem_retry_1' })
    );

    expect(res.status).toBe(200);
    expect(RetryResult.safeParse(body.data).success).toBe(true);

    const result = body.data!;
    expect(result.success).toBe(true);
    expect(result.newSipStatus).toBe('ACTIVE');
    expect(result.message).toContain('Payment of ₹4,000 successful');

    // Confirm subsequent diagnosis reports resolved
    const diagRes = await call<DebitDiagnosis>(explainEvent('debit-upi-limit_s1_f1'));
    expect(diagRes.body.data!.resolved).toBe(true);
    expect(diagRes.body.data!.statusChip.label).toBe('Resolved · Paid');
  });

  it('idempotency: repeating identical retry returns cached result without duplicate error', async () => {
    const key = 'idem_key_repeatable_99';
    const first = await call<RetryResult>(retryEvent('debit-insufficient-balance_s1_f1', { idempotencyKey: key }));
    expect(first.res.status).toBe(200);

    const second = await call<RetryResult>(retryEvent('debit-insufficient-balance_s1_f1', { idempotencyKey: key }));
    expect(second.res.status).toBe(200);
    expect(second.body.data).toEqual(first.body.data);
  });

  it('returns 409 conflict when retrying an already settled instalment without idempotency key', async () => {
    // Settle it first
    await retryEvent('debit-upi-limit_s1_f1');

    // Try again without idempotency key
    const second = await call(retryEvent('debit-upi-limit_s1_f1'));
    expect(second.res.status).toBe(409);
    expect(second.body.error!.code).toBe('CONFLICT');
    expect(second.body.error!.message).toContain('already been successfully paid');
  });

  it('returns 409 conflict when manual retry is not allowed (e.g. bank unavailable or mandate expired)', async () => {
    const resBank = await call(retryEvent('debit-bank-unavailable_s1_f1'));
    expect(resBank.res.status).toBe(409);
    expect(resBank.body.error!.code).toBe('CONFLICT');

    const resMandate = await call(retryEvent('debit-mandate-expired_s1_f1'));
    expect(resMandate.res.status).toBe(409);
    expect(resMandate.body.error!.code).toBe('CONFLICT');
  });

  it('returns 404 for unknown debit event retry', async () => {
    const { res, body } = await call(retryEvent('unknown_debit_event_f1'));
    expect(res.status).toBe(404);
    expect(body.error!.code).toBe('NOT_FOUND');
  });
});
