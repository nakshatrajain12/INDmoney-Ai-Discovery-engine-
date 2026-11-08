import type { ProviderCapabilities, PersonaSummary, SipDetail, SipSummary } from '@/contracts/api';
import type { Instalment, PauseSchedule, PaymentFailure, User, Valuation } from '@/contracts/domain';
import type { RetryResult } from '@/contracts/debit';
import type { PauseRequest, PauseResponse, ResumeResponse } from '@/contracts/pause';
import type { ISODate } from '@/lib/dates';

/**
 * All SIP data enters the application through this interface (docs/architecture.md section 13).
 * Today only MockProvider implements it. A future INDmoney adapter implements the same contract, and the
 * contract test suite (tests/unit/data/provider-contract.test.ts) runs against any implementation.
 * Pause, resume and retry mutations are added in Phases 4 and 5.
 */
export interface SipDataProvider {
  listPersonas(): Promise<PersonaSummary[]>;
  getUserForPersona(personaKey: string): Promise<User | null>;
  /** SIP summaries for a user; status is derived as of `asOf`. */
  listSips(userId: string, asOf?: ISODate): Promise<SipSummary[]>;
  /** Everything known about one SIP; null if it does not exist. */
  getSip(sipId: string, asOf?: ISODate): Promise<SipDetail | null>;
  /** Direct query for settled/scheduled instalments of a SIP. */
  getInstalments(sipId: string, asOf?: ISODate): Promise<Instalment[]>;
  /** Direct query for the current valuation snapshot of a SIP. */
  getValuation(sipId: string, asOf?: ISODate): Promise<Valuation | null>;
  /** Direct query for payment/debit failure events of a SIP. */
  getDebitEvents(sipId: string): Promise<PaymentFailure[]>;
  /** Direct lookup for a specific debit event, its parent SIP and associated instalment. */
  getDebitEvent(eventId: string): Promise<{ event: PaymentFailure; sip: SipDetail; instalment: Instalment | null } | null>;
  /** Executes a mock payment retry on a failed debit event. */
  retryDebitEvent(eventId: string, idempotencyKey?: string, asOf?: ISODate): Promise<RetryResult>;
  /** Direct query for active or scheduled pause schedule of a SIP. */
  getPauseRecord(sipId: string): Promise<PauseSchedule | null>;
  /** Pauses an active SIP schedule according to the request payload (Phase 5). */
  pauseSip(sipId: string, req: PauseRequest, asOf?: ISODate): Promise<PauseResponse>;
  /** Resumes an active or scheduled pause (Phase 5). */
  resumePause(pauseId: string, asOf?: ISODate): Promise<ResumeResponse>;
  /** Undoes a newly initiated pause within 60 seconds (PR-E10). */
  undoPause(pauseId: string, asOf?: ISODate): Promise<PauseResponse>;
  capabilities(): ProviderCapabilities;
}
