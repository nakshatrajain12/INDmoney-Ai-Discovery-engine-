import { DATA_LABEL, type Instalment, type PauseSchedule, type PaymentFailure, type PersonaFixture, type RestartReminder, type User } from '@/contracts/domain';
import type { PersonaSummary, SipDetail, SipSummary } from '@/contracts/api';
import type { RetryResult } from '@/contracts/debit';
import type { PauseRequest, PauseResponse, ResumeResponse } from '@/contracts/pause';
import { getDemoOverride } from '@/lib/clock';
import type { ISODate } from '@/lib/dates';
import { conflict, notFound } from '@/lib/errors';
import { buildRetryResult, checkIdempotency, recordIdempotency, validateRetryEligibility } from '@/domain/debit/retry';
import { calculatePauseDates, getPauseLifecycleState, getUpcomingDueDates, validateTransition } from '@/domain/pause/machine';
import { deriveSipStatus } from '../status';
import type { SipDataProvider } from '../provider';
import { PERSONAS } from './fixtures';
import { validateAll } from './validate';

/**
 * Read-only mock provider over the fixture personas. Fails fast at construction if any fixture is invalid.
 * Effective date precedence: explicit `asOf` argument, then the demo clock, then the fixture's own date.
 * Everything returned is a deep copy, so callers can never mutate the fixtures.
 */
export class MockProvider implements SipDataProvider {
  private readonly personas: ReadonlyArray<PersonaFixture>;

  constructor(personas: ReadonlyArray<PersonaFixture> = PERSONAS) {
    const issues = validateAll(personas);
    if (issues.length) throw new Error('Invalid mock fixtures:\n' + issues.join('\n'));
    this.personas = structuredClone(personas) as PersonaFixture[];
  }

  private effectiveAsOf(fixtureAsOf: ISODate, asOf?: ISODate): ISODate {
    return asOf ?? getDemoOverride() ?? fixtureAsOf;
  }

  async listPersonas(): Promise<PersonaSummary[]> {
    return this.personas.map((p) => ({
      key: p.key,
      label: p.label,
      description: p.description,
      tags: [...p.tags],
      userId: p.user.id,
      sipCount: p.sips.length,
      asOf: p.asOf,
      isMock: true as const,
      dataLabel: DATA_LABEL
    }));
  }

  async getUserForPersona(personaKey: string): Promise<User | null> {
    const p = this.personas.find((x) => x.key === personaKey);
    return p ? structuredClone(p.user) : null;
  }

  async listSips(userId: string, asOf?: ISODate): Promise<SipSummary[]> {
    const p = this.personas.find((x) => x.user.id === userId);
    if (!p) return [];
    const when = this.effectiveAsOf(p.asOf, asOf);
    return p.sips.map((b) => ({
      id: b.sip.id,
      userId: b.sip.userId,
      schemeName: b.sip.schemeName,
      category: b.sip.category,
      frequency: b.sip.frequency,
      instalmentAmountPaise: b.sip.instalmentAmountPaise,
      investmentDate: b.sip.investmentDate,
      lastSuccessfulInstalmentDate: b.sip.declared.lastSuccessfulInstalmentDate,
      status: deriveSipStatus(b.sip, b.failures, b.pause, when),
      asOf: when,
      isMock: true as const,
      dataLabel: DATA_LABEL
    }));
  }

  async getSip(sipId: string, asOf?: ISODate): Promise<SipDetail | null> {
    for (const p of this.personas) {
      const b = p.sips.find((x) => x.sip.id === sipId);
      if (!b) continue;
      const when = this.effectiveAsOf(p.asOf, asOf);
      return structuredClone({
        ...b,
        status: deriveSipStatus(b.sip, b.failures, b.pause, when),
        asOf: when,
        personaKey: p.key,
        isMock: true as const,
        dataLabel: DATA_LABEL
      });
    }
    return null;
  }

  async getInstalments(sipId: string, asOf?: ISODate) {
    const detail = await this.getSip(sipId, asOf);
    return detail ? detail.instalments : [];
  }

  async getValuation(sipId: string, asOf?: ISODate) {
    const detail = await this.getSip(sipId, asOf);
    return detail ? detail.valuation : null;
  }

  async getDebitEvents(sipId: string) {
    const detail = await this.getSip(sipId);
    return detail ? detail.failures : [];
  }

  async getDebitEvent(eventId: string): Promise<{ event: PaymentFailure; sip: SipDetail; instalment: Instalment | null } | null> {
    for (const p of this.personas) {
      for (const b of p.sips) {
        const failure = b.failures.find((f) => f.id === eventId);
        if (!failure) continue;
        const detail = await this.getSip(b.sip.id);
        if (!detail) continue;
        const instalment = detail.instalments.find((i) => i.id === failure.instalmentId) ?? null;
        return {
          event: structuredClone(failure),
          sip: detail,
          instalment: instalment ? structuredClone(instalment) : null
        };
      }
    }
    return null;
  }

  async retryDebitEvent(eventId: string, idempotencyKey?: string, asOf?: ISODate): Promise<RetryResult> {
    const cached = checkIdempotency(idempotencyKey);
    if (cached) return cached;

    for (const p of this.personas) {
      for (const b of p.sips) {
        const failure = b.failures.find((f) => f.id === eventId);
        if (!failure) continue;

        const sipDetail = await this.getSip(b.sip.id, asOf);
        if (!sipDetail) continue;

        const instalment = b.instalments.find((i) => i.id === failure.instalmentId) ?? null;
        validateRetryEligibility(failure, sipDetail, instalment);

        const effectiveDate = this.effectiveAsOf(b.sip.investmentDate, asOf);

        // Mutate mock fixture state
        failure.resolved = true;
        failure.resolvedOn = effectiveDate;

        if (instalment) {
          instalment.status = 'SUCCESS';
          instalment.settledOn = effectiveDate;
          if (!instalment.navE4 && b.valuation?.currentNavE4) {
            instalment.navE4 = b.valuation.currentNavE4;
          }
        }

        b.sip.declared.lastSuccessfulInstalmentDate = effectiveDate;
        b.sip.declared.totalInvestedPaise += failure.amountPaise;

        const updatedDetail = (await this.getSip(b.sip.id, asOf))!;
        const result = buildRetryResult(failure, updatedDetail, effectiveDate);
        recordIdempotency(idempotencyKey, result);
        return result;
      }
    }

    throw notFound('That debit event was not found.');
  }

  async getPauseRecord(sipId: string) {
    const detail = await this.getSip(sipId);
    return detail ? detail.pause : null;
  }

  async pauseSip(sipId: string, req: PauseRequest, asOf?: ISODate): Promise<PauseResponse> {
    for (const p of this.personas) {
      const b = p.sips.find((s) => s.sip.id === sipId);
      if (!b) continue;

      const effectiveDate = this.effectiveAsOf(p.asOf, asOf);

      // Check if SIP is permanently cancelled (PR-E08)
      if (b.sip.cancelledOn !== null && b.sip.cancelledOn <= effectiveDate) {
        validateTransition('CANCELLED', 'PAUSED');
      }

      // Check if already active pause exists (PR-E06)
      const currentLifecycle = getPauseLifecycleState(b.sip, b.pause, effectiveDate);
      if (currentLifecycle === 'PAUSED' || currentLifecycle === 'RESTART_PENDING') {
        validateTransition(currentLifecycle, 'PAUSED', {
          pauseEndDate: b.pause?.pauseEnd,
          schemeName: b.sip.schemeName
        });
      }

      const calc = calculatePauseDates(req, b.sip, effectiveDate, {
        inFlightFailures: b.failures
      });

      const isImmediate = calc.startDate <= effectiveDate;
      const pauseId = `pause-${sipId}-${Date.now()}`;

      const newPause: PauseSchedule = {
        id: pauseId,
        sipId,
        requestedOn: effectiveDate,
        pauseStart: calc.startDate,
        pauseEnd: calc.endDate,
        state: isImmediate ? 'ACTIVE' : 'SCHEDULED',
        skippedDueDates: calc.skippedDueDates,
        resumedOn: null,
        cancelledOn: null
      };

      let newReminder: RestartReminder | null = null;
      if (req.optInReminder) {
        newReminder = {
          id: `rem-${pauseId}`,
          pauseId,
          optedIn: true,
          remindOn: req.reminderDate ?? calc.endDate,
          channels: req.reminderChannels ?? ['IN_APP'],
          status: 'SCHEDULED',
          sentOn: null
        };
      }

      // Mutate mock fixture state while strictly preserving mandate status
      b.pause = newPause;
      b.reminder = newReminder;

      const newStatus = deriveSipStatus(b.sip, b.failures, b.pause, effectiveDate);
      const lifecycleState = getPauseLifecycleState(b.sip, b.pause, effectiveDate);

      const message = isImmediate
        ? `Your SIP has been paused. Debits will resume on ${calc.resumeDate ?? 'when you resume'}.`
        : `Your pause is scheduled to begin on ${calc.startDate}. Debits will resume on ${calc.resumeDate ?? 'when you resume'}.`;

      return {
        pause: structuredClone(newPause),
        reminder: newReminder ? structuredClone(newReminder) : null,
        status: newStatus,
        lifecycleState,
        message,
        mandateWarning: calc.mandateWarning,
        inFlightWarning: calc.inFlightWarning,
        undoExpiresAt: new Date(Date.now() + 60_000).toISOString(),
        isMock: true,
        dataLabel: DATA_LABEL
      };
    }

    throw notFound('That SIP was not found.');
  }

  async resumePause(pauseId: string, asOf?: ISODate): Promise<ResumeResponse> {
    for (const p of this.personas) {
      for (const b of p.sips) {
        if (b.pause?.id === pauseId || b.sip.id === pauseId) {
          const effectiveDate = this.effectiveAsOf(p.asOf, asOf);

          if (b.sip.cancelledOn !== null && b.sip.cancelledOn <= effectiveDate) {
            // PR-E08: Resuming a Cancelled SIP
            throw conflict('This SIP has been permanently cancelled and cannot be resumed. You can start a new SIP anytime.');
          }

          if (!b.pause || b.pause.state === 'ENDED' || b.pause.state === 'CANCELLED_BY_USER') {
            throw conflict('This SIP is not currently paused.');
          }

          const previousState = b.pause.state;
          b.pause.state = 'ENDED';
          b.pause.resumedOn = effectiveDate;

          // PR-E13: Resuming cancels any pending reminder
          if (b.reminder) {
            b.reminder.status = 'CANCELLED';
          }

          const status = deriveSipStatus(b.sip, b.failures, b.pause, effectiveDate);
          const lifecycleState = getPauseLifecycleState(b.sip, b.pause, effectiveDate);

          const nextDebits = getUpcomingDueDates(b.sip.investmentDate, b.sip.frequency, effectiveDate, 1);
          const nextDebitDate = nextDebits[0] ?? null;

          return {
            sipId: b.sip.id,
            pauseId: b.pause.id,
            previousState,
            resumedOn: effectiveDate,
            status,
            lifecycleState,
            message: 'Your SIP has resumed. Upcoming debits will occur as scheduled.',
            nextDebitDate,
            isMock: true,
            dataLabel: DATA_LABEL
          };
        }
      }
    }

    throw notFound('That pause record was not found.');
  }

  async undoPause(pauseId: string, asOf?: ISODate): Promise<PauseResponse> {
    for (const p of this.personas) {
      for (const b of p.sips) {
        if (b.pause?.id === pauseId || b.sip.id === pauseId) {
          const effectiveDate = this.effectiveAsOf(p.asOf, asOf);

          if (!b.pause) {
            throw conflict('There is no active or scheduled pause to undo.');
          }

          b.pause.state = 'CANCELLED_BY_USER';
          b.pause.cancelledOn = effectiveDate;

          if (b.reminder) {
            b.reminder.status = 'CANCELLED';
          }

          const undonePause = structuredClone(b.pause);
          b.pause = null;

          const newStatus = deriveSipStatus(b.sip, b.failures, null, effectiveDate);
          const lifecycleState = getPauseLifecycleState(b.sip, null, effectiveDate);

          return {
            pause: undonePause,
            reminder: null,
            status: newStatus,
            lifecycleState,
            message: 'Pause cancelled. Your SIP remains active as originally scheduled.',
            isMock: true,
            dataLabel: DATA_LABEL
          };
        }
      }
    }

    throw notFound('That pause record was not found.');
  }

  capabilities() {
    // Mock capabilities. The real platform's support for pause-with-date, manual retry and mandate pause is unconfirmed
    // (docs/product-requirements.md section 12), so these describe the prototype, not INDmoney.
    return { source: 'MOCK' as const, pauseWithDate: true, manualRetry: true, pauseMandate: true };
  }
}

/** Implementation alias per implementation plan specification. */
export const MockDataProvider = MockProvider;
