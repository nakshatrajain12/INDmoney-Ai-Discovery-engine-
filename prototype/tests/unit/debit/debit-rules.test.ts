import { describe, it, expect } from 'vitest';
import { DEBIT_RULES, lookupDebitRule, getDebitRuleByCategory } from '@/domain/debit/rules';
import { evaluateDebitEvent } from '@/domain/debit/evaluator';
import { validateRetryEligibility, checkIdempotency, recordIdempotency, clearIdempotencyCache } from '@/domain/debit/retry';
import { findBannedPhrases } from '@/lib/banned-phrases';
import { PERSONAS } from '@/data/mock/fixtures';
import type { PaymentFailure, Sip } from '@/contracts/domain';
import { DebitDiagnosis } from '@/contracts/debit';

function mockSip(overrides: Partial<Sip> = {}): Sip {
  return {
    id: 'sip_test_1',
    userId: 'u_test',
    schemeName: 'Harbor Large Cap Fund',
    category: 'Large Cap · Direct Growth',
    folioMasked: '••2144',
    investmentDate: '2026-07-05',
    frequency: 'MONTHLY',
    instalmentAmountPaise: 400000,
    mandate: {
      type: 'UPI_AUTOPAY',
      status: 'ACTIVE',
      bankLabel: 'Demo Bank ••4012'
    },
    cancelledOn: null,
    declared: {
      totalInvestedPaise: 1600000,
      lastSuccessfulInstalmentDate: '2026-10-05'
    },
    isMock: true,
    dataLabel: 'DEMO DATA',
    ...overrides
  };
}

function mockFailure(overrides: Partial<PaymentFailure> = {}): PaymentFailure {
  return {
    id: 'pf_test_1',
    sipId: 'sip_test_1',
    instalmentId: 'inst_test_5',
    occurredOn: '2026-11-05',
    amountPaise: 400000,
    reasonCode: 'UPI_DAILY_LIMIT',
    providerMessage: 'Daily UPI transaction limit exceeded.',
    retry: {
      status: 'NONE',
      nextRetryDate: null,
      verified: false,
      manualRetryAllowed: true
    },
    resolved: false,
    resolvedOn: null,
    ...overrides
  };
}

describe('Module 2: Rules Matrix (debit-rules.v1.json)', () => {
  it('defines all 7 failure categories required by architecture.md Section 4.2', () => {
    const categories = DEBIT_RULES.rules.map((r) => r.category);
    expect(categories).toEqual([
      'UPI_DAILY_LIMIT',
      'INSUFFICIENT_FUNDS',
      'BANK_UNAVAILABLE',
      'MANDATE_EXPIRED',
      'MANDATE_REJECTED',
      'NETWORK_TIMEOUT',
      'GENERIC_UNKNOWN'
    ]);

    for (const cat of categories) {
      expect(getDebitRuleByCategory(cat).category).toBe(cat);
      expect(lookupDebitRule(cat).category).toBe(cat);
    }
  });

  it('every mapped category contains required human reason, status chip, and single clear action', () => {
    for (const rule of DEBIT_RULES.rules) {
      expect(rule.humanReason.length).toBeGreaterThan(10);
      expect(rule.sipStatusImpact.length).toBeGreaterThan(0);
      expect(rule.statusChip.label.length).toBeGreaterThan(0);
      expect(['emerald', 'amber', 'coral', 'blue']).toContain(rule.statusChip.variant);
      expect(['check', 'alert', 'x', 'pause']).toContain(rule.statusChip.icon);
      expect(rule.nextAction.buttonText.length).toBeGreaterThan(0);
    }
  });

  it('rules copy contains 0 banned advice, urgency, or guilt phrases', () => {
    for (const rule of DEBIT_RULES.rules) {
      const texts = [
        rule.humanReason,
        rule.sipStatusDetail,
        rule.nextAction.label,
        rule.nextAction.buttonText,
        rule.consequenceNotice ?? ''
      ].filter(Boolean);

      for (const t of texts) {
        const violations = findBannedPhrases(t);
        expect(violations, `Banned phrase in rule ${rule.ruleId}: ${t}`).toEqual([]);
      }
    }
  });
});

describe('Module 2: Debit Evaluator - Phase Gate 4 Checklist', () => {
  it('Phase Gate 4: Every mapped error code generates the correct human explanation and status chip', () => {
    const testCases: Array<{
      code: string;
      expectedCategory: string;
      expectedVariant: string;
      expectedSipActive: boolean;
      expectedRetryAllowed: boolean;
    }> = [
        { code: 'UPI_DAILY_LIMIT', expectedCategory: 'UPI_DAILY_LIMIT', expectedVariant: 'amber', expectedSipActive: true, expectedRetryAllowed: true },
        { code: 'MOCK_UPI_DAILY_LIMIT_EXCEEDED', expectedCategory: 'UPI_DAILY_LIMIT', expectedVariant: 'amber', expectedSipActive: true, expectedRetryAllowed: true },
        { code: 'INSUFFICIENT_FUNDS', expectedCategory: 'INSUFFICIENT_FUNDS', expectedVariant: 'amber', expectedSipActive: true, expectedRetryAllowed: true },
        { code: 'MOCK_INSUFFICIENT_BALANCE', expectedCategory: 'INSUFFICIENT_FUNDS', expectedVariant: 'amber', expectedSipActive: true, expectedRetryAllowed: true },
        { code: 'BANK_UNAVAILABLE', expectedCategory: 'BANK_UNAVAILABLE', expectedVariant: 'amber', expectedSipActive: true, expectedRetryAllowed: false },
        { code: 'MOCK_BANK_SERVER_UNAVAILABLE', expectedCategory: 'BANK_UNAVAILABLE', expectedVariant: 'amber', expectedSipActive: true, expectedRetryAllowed: false },
        { code: 'MANDATE_EXPIRED', expectedCategory: 'MANDATE_EXPIRED', expectedVariant: 'amber', expectedSipActive: false, expectedRetryAllowed: false },
        { code: 'MOCK_MANDATE_EXPIRED', expectedCategory: 'MANDATE_EXPIRED', expectedVariant: 'amber', expectedSipActive: false, expectedRetryAllowed: false },
        { code: 'MANDATE_REJECTED', expectedCategory: 'MANDATE_REJECTED', expectedVariant: 'coral', expectedSipActive: false, expectedRetryAllowed: false },
        { code: 'MOCK_MANDATE_REJECTED', expectedCategory: 'MANDATE_REJECTED', expectedVariant: 'coral', expectedSipActive: false, expectedRetryAllowed: false },
        { code: 'NETWORK_TIMEOUT', expectedCategory: 'NETWORK_TIMEOUT', expectedVariant: 'amber', expectedSipActive: true, expectedRetryAllowed: true },
        { code: 'MOCK_PAYMENT_TIMEOUT', expectedCategory: 'NETWORK_TIMEOUT', expectedVariant: 'amber', expectedSipActive: true, expectedRetryAllowed: true },
        { code: 'MOCK_TECHNICAL_FAILURE', expectedCategory: 'NETWORK_TIMEOUT', expectedVariant: 'amber', expectedSipActive: true, expectedRetryAllowed: true }
      ];

    for (const tc of testCases) {
      const sip = mockSip();
      if (tc.expectedCategory === 'MANDATE_EXPIRED') {
        sip.mandate.status = 'EXPIRED';
      }
      if (tc.expectedCategory === 'MANDATE_REJECTED') {
        sip.mandate.status = 'INACTIVE';
      }
      const failure = mockFailure({
        reasonCode: tc.code,
        providerMessage: 'Provider message for ' + tc.code,
        retry: {
          status: tc.expectedCategory === 'BANK_UNAVAILABLE' ? 'SCHEDULED' : 'NONE',
          nextRetryDate: tc.expectedCategory === 'BANK_UNAVAILABLE' ? '2026-11-09' : null,
          verified: tc.expectedCategory === 'BANK_UNAVAILABLE',
          manualRetryAllowed: tc.expectedRetryAllowed
        }
      });

      const diag = evaluateDebitEvent(failure, sip);
      expect(diag.category, tc.code).toBe(tc.expectedCategory);
      expect(diag.statusChip.variant, tc.code).toBe(tc.expectedVariant);
      expect(diag.isSipActive, tc.code).toBe(tc.expectedSipActive);
      expect(diag.retry.allowed, tc.code).toBe(tc.expectedRetryAllowed);
      expect(DebitDiagnosis.safeParse(diag).success).toBe(true);
    }
  });

  it('Phase Gate 4: Unmapped or unknown error codes trigger the safe fallback without failing', () => {
    const unmappedCodes = ['PSP_ERR_77', 'UNKNOWN_BANK_CODE_404', 'DECLINED_RANDOM', '', null, undefined];

    for (const code of unmappedCodes) {
      const sip = mockSip();
      const failure = mockFailure({
        reasonCode: code as string | null,
        providerMessage: code ? 'Unknown failure code ' + code : null
      });

      const diag = evaluateDebitEvent(failure, sip);
      expect(diag.category).toBe('GENERIC_UNKNOWN');
      expect(diag.humanReason).toBe('We could not confirm the exact bank failure code.');
      expect(diag.isSipActive).toBe(true);
      expect(diag.statusChip.variant).toBe('amber');
      expect(diag.statusChip.label).toBe('Active · 1 failed instalment');
      expect(DebitDiagnosis.safeParse(diag).success).toBe(true);
    }
  });

  it('Phase Gate 4: Confirmation that a failed debit never displays the SIP as cancelled unless the mandate is explicitly revoked', () => {
    // Normal debit failure (limit, balance, bank down, timeout, unknown) NEVER cancels the SIP
    const nonCancellingCodes = [
      'UPI_DAILY_LIMIT',
      'INSUFFICIENT_FUNDS',
      'BANK_UNAVAILABLE',
      'NETWORK_TIMEOUT',
      'PSP_ERR_77',
      null
    ];

    for (const code of nonCancellingCodes) {
      const sip = mockSip({ cancelledOn: null, mandate: { type: 'UPI_AUTOPAY', status: 'ACTIVE', bankLabel: 'Bank' } });
      const failure = mockFailure({ reasonCode: code });
      const diag = evaluateDebitEvent(failure, sip);

      expect(diag.isSipActive, code ?? 'null').toBe(true);
      expect(diag.isMandateRevoked, code ?? 'null').toBe(false);
      expect(diag.statusChip.variant, code ?? 'null').not.toBe('coral');
      expect(diag.sipStatus, code ?? 'null').not.toMatch(/cancelled/i);
    }

    // Only when mandate is explicitly revoked or rejected does it display cancelled
    const sipRevoked = mockSip({ mandate: { type: 'UPI_AUTOPAY', status: 'INACTIVE', bankLabel: 'Bank' } });
    const diagRevoked = evaluateDebitEvent(mockFailure({ reasonCode: 'MANDATE_REJECTED' }), sipRevoked);
    expect(diagRevoked.isSipActive).toBe(false);
    expect(diagRevoked.isMandateRevoked).toBe(true);
    expect(diagRevoked.statusChip.variant).toBe('coral');
    expect(diagRevoked.statusChip.label).toBe('Mandate Cancelled by Bank');
  });
});

describe('Module 2: Edge Cases (DE-E01 to DE-E11)', () => {
  it('DE-E01: UPI daily limit exceeded formats amount in button and confirms active status', () => {
    const diag = evaluateDebitEvent(mockFailure({ reasonCode: 'UPI_DAILY_LIMIT', amountPaise: 400000 }), mockSip());
    expect(diag.humanReason).toContain("UPI daily transaction limit was reached");
    expect(diag.isSipActive).toBe(true);
    expect(diag.nextAction.buttonText).toBe('Pay ₹4,000 manually now');
    expect(diag.retry.allowed).toBe(true);
  });

  it('DE-E02: Insufficient funds provides calm explanation with no penalty threats', () => {
    const diag = evaluateDebitEvent(mockFailure({ reasonCode: 'INSUFFICIENT_FUNDS' }), mockSip());
    expect(diag.humanReason).toContain('Account balance was insufficient');
    expect(diag.isSipActive).toBe(true);
    expect(diag.nextAction.buttonText).toBe('Add funds & retry');
    expect(findBannedPhrases(diag.humanReason)).toEqual([]);
    expect(findBannedPhrases(diag.sipStatusDetail)).toEqual([]);
  });

  it('DE-E03: Bank core banking unavailable reports auto-retry schedule and suppresses manual retry', () => {
    const failure = mockFailure({
      reasonCode: 'BANK_UNAVAILABLE',
      retry: { status: 'SCHEDULED', nextRetryDate: '2026-11-09', verified: true, manualRetryAllowed: false }
    });
    const diag = evaluateDebitEvent(failure, mockSip());
    expect(diag.retry.allowed).toBe(false);
    expect(diag.retry.autoRetryScheduled).toBe(true);
    expect(diag.retry.message).toContain('Automated retry scheduled for 2026-11-09.');
  });

  it('DE-E04: Mandate expired prompts to re-authorize UPI Autopay', () => {
    const sip = mockSip({ mandate: { type: 'UPI_AUTOPAY', status: 'EXPIRED', bankLabel: 'Bank' } });
    const diag = evaluateDebitEvent(mockFailure({ reasonCode: 'MANDATE_EXPIRED' }), sip);
    expect(diag.statusChip.label).toBe('Attention Required');
    expect(diag.isSipActive).toBe(false);
    expect(diag.nextAction.buttonText).toBe('Re-authorize Autopay');
  });

  it('DE-E05: Completely unmapped code falls back cleanly to generic technical notice', () => {
    const diag = evaluateDebitEvent(mockFailure({ reasonCode: 'UNKNOWN_GATEWAY_ERROR_999' }), mockSip());
    expect(diag.category).toBe('GENERIC_UNKNOWN');
    expect(diag.humanReason).toBe('We could not confirm the exact bank failure code.');
    expect(diag.isSipActive).toBe(true);
    expect(diag.nextAction.type).toBe('RETRY_OR_SUPPORT');
  });

  it('DE-E06: Conflicting bank signals discard conflicting text and route to safe fallback', () => {
    // Reason code is INSUFFICIENT_FUNDS, but providerMessage says bank servers down
    const failure = mockFailure({
      reasonCode: 'INSUFFICIENT_FUNDS',
      providerMessage: 'Bank core banking server unavailable and did not respond.'
    });
    const diag = evaluateDebitEvent(failure, mockSip());
    expect(diag.category).toBe('GENERIC_UNKNOWN');
    expect(diag.humanReason).toBe('We encountered an unconfirmed status from your bank. Your SIP remains active.');
    expect(diag.isSipActive).toBe(true);
  });

  it('DE-E07: Idempotency cache stores and returns identical results for repeated keys', () => {
    clearIdempotencyCache();
    const key = 'idem_key_123';
    expect(checkIdempotency(key)).toBeNull();

    const sampleResult = {
      success: true,
      eventId: 'pf_1',
      sipId: 'sip_1',
      instalmentId: 'inst_1',
      resolvedOn: '2026-11-08' as const,
      newSipStatus: 'ACTIVE' as const,
      message: 'Payment of ₹4,000 successful.',
      isMock: true as const,
      dataLabel: 'DEMO DATA' as const
    };

    recordIdempotency(key, sampleResult);
    expect(checkIdempotency(key)).toEqual(sampleResult);
  });

  it('DE-E08: Manual retry while auto-retry is scheduled flags auto-retry queue info', () => {
    const failure = mockFailure({
      reasonCode: 'INSUFFICIENT_FUNDS',
      retry: { status: 'SCHEDULED', nextRetryDate: '2026-11-12', verified: true, manualRetryAllowed: true }
    });
    const diag = evaluateDebitEvent(failure, mockSip());
    expect(diag.retry.autoRetryScheduled).toBe(true);
    expect(diag.retry.message).toBe('Automated retry scheduled for 2026-11-12.');
    expect(diag.retry.allowed).toBe(true);
  });

  it('DE-E09: Retry attempt on already settled instalment throws 409 conflict', () => {
    const failureResolved = mockFailure({ resolved: true, resolvedOn: '2026-11-07' });
    expect(() =>
      validateRetryEligibility(failureResolved, { ...mockSip(), instalments: [], failures: [], valuation: null, pause: null, reminder: null, status: 'ACTIVE', asOf: '2026-11-08', personaKey: 'p', isMock: true, dataLabel: 'DEMO DATA' }, null)
    ).toThrow(/already been successfully paid/i);
  });

  it('DE-E10: Payment confirmation in-flight disables retry and reports in-progress status', () => {
    const failurePending = mockFailure({
      retry: { status: 'PENDING', nextRetryDate: null, verified: false, manualRetryAllowed: false }
    });
    const diag = evaluateDebitEvent(failurePending, mockSip());
    expect(diag.inFlight).toBe(true);
    expect(diag.retry.allowed).toBe(false);
    expect(diag.retry.message).toContain('currently being confirmed by your bank');
  });

  it('DE-E11: 3+ consecutive debit failures displays verified mandate notice and action', () => {
    const event = mockFailure({ occurredOn: '2026-11-05' });
    const allFailures: PaymentFailure[] = [
      mockFailure({ id: 'f1', occurredOn: '2026-09-05', resolved: false }),
      mockFailure({ id: 'f2', occurredOn: '2026-10-05', resolved: false }),
      event
    ];

    const diag = evaluateDebitEvent(event, mockSip(), { allFailures });
    expect(diag.consecutiveFailures).toBe(3);
    expect(diag.consequenceNotice).toContain('3 consecutive instalments have failed');
    expect(diag.nextAction.type).toBe('VERIFY_MANDATE');
    expect(diag.nextAction.buttonText).toBe('Verify Bank Mandate');
  });
});

describe('Module 2: 30 Personas Coverage', () => {
  it('evaluates debit events across all mock personas with failures without throwing uncaught exceptions', () => {
    for (const p of PERSONAS) {
      for (const s of p.sips) {
        for (const failure of s.failures) {
          const diag = evaluateDebitEvent(failure, s.sip, {
            allFailures: s.failures,
            asOf: p.asOf
          });
          expect(DebitDiagnosis.safeParse(diag).success, `${p.key} - ${failure.id}`).toBe(true);
        }
      }
    }
  });
});
