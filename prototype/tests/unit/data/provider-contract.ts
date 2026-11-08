import { describe, it, expect, afterEach } from 'vitest';
import { PersonaSummary, SipDetail, SipSummary } from '@/contracts/api';
import { setDemoToday } from '@/lib/clock';
import { PERSONAS } from '@/data/mock/fixtures';
import type { SipDataProvider } from '@/data/provider';

/**
 * Contract suite for any SipDataProvider. It runs against MockProvider now and must also pass for a future
 * INDmoney adapter (using that adapter's own fixtures or a sandbox). Expectations come from the declared
 * persona expectations, not from the provider's own code.
 */
export function runProviderContract(name: string, make: () => SipDataProvider) {
  describe(`SipDataProvider contract: ${name}`, () => {
    afterEach(() => setDemoToday(null));

    it('lists personas that satisfy the schema, each labelled mock', async () => {
      const list = await make().listPersonas();
      expect(list.length).toBe(PERSONAS.length);
      for (const p of list) {
        expect(PersonaSummary.safeParse(p).success, p.key).toBe(true);
        expect(p.isMock).toBe(true);
      }
    });

    it('returns null / empty for unknown references', async () => {
      const p = make();
      expect(await p.getUserForPersona('no-such-persona')).toBeNull();
      expect(await p.listSips('u_no_such_user')).toEqual([]);
      expect(await p.getSip('no_such_sip')).toBeNull();
    });

    it('lists SIPs whose derived status matches the declared expectation, for every persona', async () => {
      const p = make();
      for (const persona of PERSONAS) {
        const user = await p.getUserForPersona(persona.key);
        expect(user?.id).toBe(persona.user.id);
        const sips = await p.listSips(user!.id);
        expect(sips).toHaveLength(persona.sips.length);
        for (const s of sips) {
          expect(SipSummary.safeParse(s).success, s.id).toBe(true);
          expect(s.status, s.id).toBe(persona.expectations[s.id]!.status);
          expect(s.dataLabel).toBe('DEMO DATA');
        }
      }
    });

    it('returns a schema-valid detail for every SIP, with the same status as the summary', async () => {
      const p = make();
      for (const persona of PERSONAS)
        for (const b of persona.sips) {
          const d = await p.getSip(b.sip.id);
          expect(d, b.sip.id).not.toBeNull();
          expect(SipDetail.safeParse(d).success, b.sip.id).toBe(true);
          expect(d!.status).toBe(persona.expectations[b.sip.id]!.status);
          expect(d!.personaKey).toBe(persona.key);
          expect(d!.instalments.length).toBe(b.instalments.length);

          // Direct entity queries defined in Phase 1
          const insts = await p.getInstalments(b.sip.id);
          expect(insts.length).toBe(b.instalments.length);

          const valuation = await p.getValuation(b.sip.id);
          if (b.valuation) {
            expect(valuation).not.toBeNull();
            expect(valuation?.asOfDate).toBe(b.valuation.asOfDate);
          }

          const debitEvents = await p.getDebitEvents(b.sip.id);
          expect(debitEvents.length).toBe(b.failures.length);

          const pauseRecord = await p.getPauseRecord(b.sip.id);
          if (b.pause) {
            expect(pauseRecord).not.toBeNull();
            expect(pauseRecord?.state).toBe(b.pause.state);
          }
        }
    });

    it('returns copies: mutating a result never changes later results', async () => {
      const p = make();
      const a = await p.getSip('early-flat_s1');
      a!.instalments.length = 0;
      a!.sip.schemeName = 'TAMPERED';
      a!.status = 'CANCELLED';
      const b = await p.getSip('early-flat_s1');
      expect(b!.instalments.length).toBe(5);
      expect(b!.sip.schemeName).toBe('Northstar Flexi Cap Fund');
      expect(b!.status).toBe('ACTIVE');
    });

    it('status follows the as-of date: an explicit date wins, then the demo clock, then the fixture date', async () => {
      const p = make();
      // restart-pending persona: paused until 19 Nov 2026
      const id = 'restart-pending_s1';
      expect((await p.getSip(id))!.status).toBe('RESTART_PENDING');
      expect((await p.getSip(id, '2026-11-20'))!.status).toBe('ACTIVE'); // pause has ended
      expect((await p.getSip(id, '2026-09-01'))!.status).toBe('PAUSED'); // far from the restart date

      setDemoToday('2026-11-20');
      expect((await p.getSip(id))!.status).toBe('ACTIVE'); // demo clock applies
      expect((await p.getSip(id, '2026-09-01'))!.status).toBe('PAUSED'); // explicit date still wins
      expect((await p.getSip(id))!.asOf).toBe('2026-11-20');
    });

    it('a scheduled pause starts affecting status only from its start date', async () => {
      const p = make();
      const id = 'pause-scheduled_s1';
      expect((await p.getSip(id))!.status).toBe('ACTIVE');
      expect((await p.getSip(id, '2026-11-20'))!.status).toBe('PAUSED');
      expect((await p.getSip(id, '2026-12-20'))!.status).toBe('ACTIVE');
    });

    it('a cancelled SIP stays cancelled whatever failures it carries', async () => {
      const d = await make().getSip('cancelled-with-failure_s1');
      expect(d!.status).toBe('CANCELLED');
      expect(d!.failures.some((f) => !f.resolved)).toBe(true);
    });

    it('exposes capabilities and says they are mock', () => {
      const c = make().capabilities();
      expect(c.source).toBe('MOCK');
    });
  });
}
