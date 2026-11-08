import { describe, it, expect, beforeEach } from 'vitest';
import { GET as getOptions } from '@/app/api/v1/sips/[id]/options/route';
import { POST as pauseSip } from '@/app/api/v1/sips/[id]/pause/route';
import { PATCH as resumePause } from '@/app/api/v1/pauses/[id]/resume/route';
import { POST as undoPause } from '@/app/api/v1/pauses/[id]/undo/route';
import { OptionsComparisonPayload, PauseResponse, ResumeResponse } from '@/contracts/pause';
import { resetProviderForTests, getProvider } from '@/data';

beforeEach(() => {
  resetProviderForTests();
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

const fetchOptions = (id: string, qs = '') =>
  getOptions(new Request(`http://localhost/api/v1/sips/${id}/options${qs}`), {
    params: Promise.resolve({ id })
  });

const postPause = (id: string, payload?: Record<string, unknown>, qs = '') =>
  pauseSip(
    new Request(`http://localhost/api/v1/sips/${id}/pause${qs}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload ? JSON.stringify(payload) : undefined
    }),
    { params: Promise.resolve({ id }) }
  );

const patchResume = (id: string, payload?: Record<string, unknown>, qs = '') =>
  resumePause(
    new Request(`http://localhost/api/v1/pauses/${id}/resume${qs}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: payload ? JSON.stringify(payload) : undefined
    }),
    { params: Promise.resolve({ id }) }
  );

const postUndo = (id: string, qs = '') =>
  undoPause(new Request(`http://localhost/api/v1/pauses/${id}/undo${qs}`, { method: 'POST' }), {
    params: Promise.resolve({ id })
  });

describe('GET /api/v1/sips/{id}/options (Phase 5 Task 4)', () => {
  it('returns schema-valid 3-option comparison for an active SIP', async () => {
    const { res, body } = await call<OptionsComparisonPayload>(fetchOptions('cashflow-pause_s1'));
    expect(res.status).toBe(200);
    expect(body.data).toBeDefined();

    const parsed = OptionsComparisonPayload.safeParse(body.data);
    expect(parsed.success).toBe(true);

    expect(body.data!.sipId).toBe('cashflow-pause_s1');
    expect(body.data!.options).toHaveLength(3);
    const types = body.data!.options.map((o) => o.type);
    expect(types).toEqual(['PAUSE', 'REDUCE', 'CANCEL']);
  });

  it('returns 404 for non-existent SIP', async () => {
    const { res, body } = await call(fetchOptions('non-existent-sip'));
    expect(res.status).toBe(404);
    expect(body.error?.code).toBe('NOT_FOUND');
  });

  it('returns 400 for invalid SIP ID format', async () => {
    const { res, body } = await call(fetchOptions('INVALID!!SIP??'));
    expect(res.status).toBe(400);
    expect(body.error?.code).toBe('INVALID_INPUT');
  });
});

describe('POST /api/v1/sips/{id}/pause (Phase 5 Task 4)', () => {
  it('pauses an active SIP and strictly preserves mandate status (Phase Gate 5)', async () => {
    const { res, body } = await call<PauseResponse>(
      postPause('cashflow-pause_s1', {
        durationMonths: 2,
        optInReminder: true
      })
    );

    expect(res.status).toBe(200);
    expect(body.data).toBeDefined();

    const parsed = PauseResponse.safeParse(body.data);
    expect(parsed.success).toBe(true);

    expect(body.data!.status).toBe('PAUSED');
    expect(body.data!.lifecycleState).toBe('PAUSED');
    expect(body.data!.pause.state).toBe('ACTIVE');
    expect(body.data!.reminder).not.toBeNull();
    expect(body.data!.reminder?.optedIn).toBe(true);

    // CRITICAL: Phase Gate 5 check: mandate status MUST remain ACTIVE
    const sipDetail = await getProvider().getSip('cashflow-pause_s1');
    expect(sipDetail).not.toBeNull();
    expect(sipDetail!.sip.mandate.status).toBe('ACTIVE');
    expect(sipDetail!.status).toBe('PAUSED');
  });

  it('creates scheduled pause if start date is in the future', async () => {
    const { res, body } = await call<PauseResponse>(
      postPause('positive_s1', {
        startDate: '2026-11-20',
        durationMonths: 1,
        optInReminder: false
      })
    );

    expect(res.status).toBe(200);
    expect(body.data!.pause.state).toBe('SCHEDULED');
    expect(body.data!.lifecycleState).toBe('SCHEDULED_PAUSE');
    expect(body.data!.reminder).toBeNull();
  });

  it('PR-E01: returns 400 when start date is in the past', async () => {
    const { res, body } = await call(
      postPause('cashflow-pause_s1', {
        startDate: '2026-10-01',
        durationMonths: 1
      })
    );

    expect(res.status).toBe(400);
    expect(body.error?.message).toMatch(/Pause start date cannot be in the past/i);
  });

  it('PR-E02: returns 400 when end date precedes start date', async () => {
    const { res, body } = await call(
      postPause('cashflow-pause_s1', {
        startDate: '2026-11-15',
        endDate: '2026-11-10'
      })
    );

    expect(res.status).toBe(400);
    expect(body.error?.message).toMatch(/Resume date must be at least one day after the pause start date/i);
  });

  it('PR-E05: returns 400 when pause duration exceeds 6 months', async () => {
    const { res, body } = await call(
      postPause('cashflow-pause_s1', {
        durationMonths: 8
      })
    );

    expect(res.status).toBe(400);
    expect(body.error?.message).toMatch(/SIPs can be paused for up to 6 months at a time/i);
  });

  it('PR-E06: returns 409 conflict when attempting to pause an already paused SIP', async () => {
    // paused_s1 is already paused in fixtures
    const { res, body } = await call(
      postPause('paused_s1', { durationMonths: 2 })
    );

    expect(res.status).toBe(409);
    expect(body.error?.code).toBe('CONFLICT');
    expect(body.error?.message).toMatch(/This SIP is already paused/i);
  });
});

describe('PATCH /api/v1/pauses/{id}/resume (Phase 5 Task 4)', () => {
  it('resumes a paused SIP back to ACTIVE status and cancels pending reminder', async () => {
    // Setup: Pause SIP first
    const { body: pauseBody } = await call<PauseResponse>(
      postPause('cashflow-pause_s1', {
        durationMonths: 2,
        optInReminder: true
      })
    );

    const pauseId = pauseBody.data!.pause.id;

    // Execute Resume
    const { res, body } = await call<ResumeResponse>(patchResume(pauseId));
    expect(res.status).toBe(200);
    expect(body.data).toBeDefined();

    const parsed = ResumeResponse.safeParse(body.data);
    expect(parsed.success).toBe(true);

    expect(body.data!.status).toBe('ACTIVE');
    expect(body.data!.lifecycleState).toBe('ACTIVE');
    expect(body.data!.previousState).toBe('ACTIVE');
    expect(body.data!.message).toMatch(/Your SIP has resumed/i);

    // Verify in provider that reminder is cancelled and status is ACTIVE
    const sipDetail = await getProvider().getSip('cashflow-pause_s1');
    expect(sipDetail!.status).toBe('ACTIVE');
    expect(sipDetail!.pause?.state).toBe('ENDED');
    expect(sipDetail!.reminder?.status).toBe('CANCELLED');
  });

  it('returns 409 conflict when trying to resume a SIP that is not currently paused', async () => {
    const { res, body } = await call(patchResume('cashflow-pause_s1'));
    expect(res.status).toBe(409);
    expect(body.error?.message).toMatch(/This SIP is not currently paused/i);
  });

  it('PR-E08: returns 409 conflict when trying to resume a permanently cancelled SIP', async () => {
    const { res, body } = await call(patchResume('cancelled_s1'));
    expect(res.status).toBe(409);
    expect(body.error?.message).toMatch(/This SIP has been permanently cancelled and cannot be resumed/i);
  });
});

describe('POST /api/v1/pauses/{id}/undo (PR-E10 Instant Undo)', () => {
  it('instantly undoes a pause, reverting status to ACTIVE', async () => {
    // Setup: Pause SIP
    const { body: pauseBody } = await call<PauseResponse>(
      postPause('cashflow-pause_s1', { durationMonths: 1 })
    );
    const pauseId = pauseBody.data!.pause.id;

    // Undo pause
    const { res, body } = await call<PauseResponse>(postUndo(pauseId));
    expect(res.status).toBe(200);
    expect(body.data!.status).toBe('ACTIVE');
    expect(body.data!.message).toMatch(/Pause cancelled\. Your SIP remains active as originally scheduled\./i);

    // Verify SIP in provider
    const sipDetail = await getProvider().getSip('cashflow-pause_s1');
    expect(sipDetail!.status).toBe('ACTIVE');
    expect(sipDetail!.pause).toBeNull();
  });
});
