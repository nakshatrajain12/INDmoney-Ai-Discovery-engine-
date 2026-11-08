import { describe, it, expect } from 'vitest';
import { POST as postCoach } from '@/app/api/v1/sips/[id]/coach/route';
import { GET as getTerm } from '@/app/api/v1/terms/[key]/route';
import { GET as getSources } from '@/app/api/v1/sources/route';
import { CoachResponse, TermDefinition } from '@/contracts/coach';
import { VerifiedSource } from '@/contracts/domain';

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

describe('API Routes for Return Coach (Phase 3)', () => {
  describe('POST /api/v1/sips/[id]/coach', () => {
    it('returns structured 3-block narrative for a valid SIP', async () => {
      const request = new Request('http://localhost/api/v1/sips/early-flat_s1/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: 'EXPLAIN_RETURN' })
      });

      const { res, body } = await call<CoachResponse>(postCoach(request, { params: Promise.resolve({ id: 'early-flat_s1' }) }));
      expect(res.status).toBe(200);
      expect(body.data).toBeDefined();

      const parsed = CoachResponse.safeParse(body.data);
      expect(parsed.success).toBe(true);
      expect(body.data?.isRefusal).toBe(false);
      expect(body.data?.blocks?.figures.investedFormatted).toBe('₹25,000.00');
      expect(body.data?.disclaimer).toBe('Explains your SIP figures. Not investment advice.');
    });

    it('returns non-advice refusal when prompt seeks investment advice', async () => {
      const request = new Request('http://localhost/api/v1/sips/early-flat_s1/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Should I stop my SIP and sell my mutual fund?' })
      });

      const { res, body } = await call<CoachResponse>(postCoach(request, { params: Promise.resolve({ id: 'early-flat_s1' }) }));
      expect(res.status).toBe(200);
      expect(body.data?.isRefusal).toBe(true);
      expect(body.data?.refusal?.reason).toBe('INVESTMENT_ADVICE_REQUESTED');
      expect(body.data?.refusal?.message).toContain("I can't tell you whether to continue, stop, buy or sell");
      expect(body.data?.blocks).toBeNull();
    });

    it('returns 404 for unknown SIP', async () => {
      const request = new Request('http://localhost/api/v1/sips/non-existent-sip/coach', {
        method: 'POST',
        body: JSON.stringify({})
      });

      const { res, body } = await call(postCoach(request, { params: Promise.resolve({ id: 'non-existent-sip' }) }));
      expect(res.status).toBe(404);
      expect(body.error?.code).toBe('NOT_FOUND');
    });

    it('returns 400 for invalid request body', async () => {
      const request = new Request('http://localhost/api/v1/sips/early-flat_s1/coach', {
        method: 'POST',
        body: 'invalid json {'
      });

      const { res, body } = await call(postCoach(request, { params: Promise.resolve({ id: 'early-flat_s1' }) }));
      expect(res.status).toBe(400);
      expect(body.error?.code).toBe('INVALID_INPUT');
    });
  });

  describe('GET /api/v1/terms/[key]', () => {
    it('returns definition for XIRR including short period note', async () => {
      const request = new Request('http://localhost/api/v1/terms/xirr');
      const { res, body } = await call<TermDefinition>(getTerm(request, { params: Promise.resolve({ key: 'xirr' }) }));

      expect(res.status).toBe(200);
      expect(body.data?.key).toBe('XIRR');
      expect(body.data?.title).toBe('Extended Internal Rate of Return (XIRR)');
      expect(body.data?.shortPeriodNote).toContain('less than 12 months');
      expect(TermDefinition.safeParse(body.data).success).toBe(true);
    });

    it('returns definition for Absolute Return', async () => {
      const request = new Request('http://localhost/api/v1/terms/absolute_return');
      const { res, body } = await call<TermDefinition>(getTerm(request, { params: Promise.resolve({ key: 'absolute_return' }) }));

      expect(res.status).toBe(200);
      expect(body.data?.key).toBe('ABSOLUTE_RETURN');
    });

    it('returns 404 for unknown term', async () => {
      const request = new Request('http://localhost/api/v1/terms/cryptocurrency');
      const { res, body } = await call(getTerm(request, { params: Promise.resolve({ key: 'cryptocurrency' }) }));

      expect(res.status).toBe(404);
      expect(body.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/v1/sources', () => {
    it('returns all verified sources', async () => {
      const request = new Request('http://localhost/api/v1/sources');
      const { res, body } = await call<VerifiedSource[]>(getSources(request));

      expect(res.status).toBe(200);
      expect(body.data?.length).toBeGreaterThanOrEqual(4);
      for (const s of body.data!) {
        expect(VerifiedSource.safeParse(s).success).toBe(true);
      }
    });

    it('filters sources by topic', async () => {
      const request = new Request('http://localhost/api/v1/sources?topic=RUPEE_COST_AVERAGING');
      const { res, body } = await call<VerifiedSource[]>(getSources(request));

      expect(res.status).toBe(200);
      expect(body.data?.length).toBeGreaterThanOrEqual(1);
      expect(body.data?.some((s) => s.id === 'SRC_AMFI_RCA')).toBe(true);
    });
  });
});

