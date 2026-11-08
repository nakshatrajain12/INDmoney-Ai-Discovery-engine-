import { describe, it, expect } from 'vitest';
import { getOptionsComparison } from '@/domain/pause/options';
import type { Sip } from '@/contracts/domain';
import { findBannedPhrases } from '@/lib/banned-phrases';
import { OptionsComparisonPayload } from '@/contracts/pause';

const mockSip: Sip = {
  id: 'sip-test-options',
  userId: 'usr-1',
  schemeName: 'Northstar Flexi Cap Fund',
  category: 'Flexi Cap · Direct Growth',
  folioMasked: '••9019',
  investmentDate: '2026-01-15',
  frequency: 'MONTHLY',
  instalmentAmountPaise: 500000, // ₹5,000
  mandate: {
    type: 'UPI_AUTOPAY',
    status: 'ACTIVE',
    bankLabel: 'Demo Bank ••4012'
  },
  cancelledOn: null,
  declared: {
    totalInvestedPaise: 5000000,
    lastSuccessfulInstalmentDate: '2026-10-15'
  },
  isMock: true,
  dataLabel: 'DEMO DATA'
};

describe('Options Comparison Logic (Phase 5 Task 1)', () => {
  it('constructs side-by-side data comparing Pause, Reduce Amount, and Cancel', () => {
    const payload = getOptionsComparison(mockSip, { asOf: '2026-11-09' });

    // Validate with Zod schema
    const parsed = OptionsComparisonPayload.safeParse(payload);
    expect(parsed.success).toBe(true);

    expect(payload.sipId).toBe(mockSip.id);
    expect(payload.schemeName).toBe('Northstar Flexi Cap Fund');
    expect(payload.currentAmountPaise).toBe(500000);
    expect(payload.minimumAmountPaise).toBe(50000); // ₹500
    expect(payload.options).toHaveLength(3);

    const [pauseOpt, reduceOpt, cancelOpt] = payload.options;

    // Pause option checks
    expect(pauseOpt?.type).toBe('PAUSE');
    expect(pauseOpt?.title).toBe('Pause SIP');
    expect(pauseOpt?.consequences.mandateStatus).toMatch(/Autopay remains registered and active/i);
    expect(pauseOpt?.consequences.penalties).toMatch(/Zero penalties/i);
    expect(pauseOpt?.consequences.existingInvestments).toMatch(/remain invested in your folio/i);

    // Reduce option checks
    expect(reduceOpt?.type).toBe('REDUCE');
    expect(reduceOpt?.title).toMatch(/Reduce monthly amount/i);
    expect(reduceOpt?.consequences.whatHappens).toMatch(/Reduce your monthly instalment from ₹5,000\.00 down to ₹500\.00/i);
    expect(reduceOpt?.consequences.mandateStatus).toMatch(/Autopay remains active/i);

    // Cancel option checks
    expect(cancelOpt?.type).toBe('CANCEL');
    expect(cancelOpt?.title).toBe('Cancel SIP');
    expect(cancelOpt?.consequences.mandateStatus).toMatch(/permanently revoked/i);
    expect(cancelOpt?.consequences.existingInvestments).toMatch(/remain safely invested in your folio and continue to compound/i);
    expect(cancelOpt?.consequences.resumption).toMatch(/cannot be restarted directly/i);
  });

  it('verifies all option texts pass banned-phrase and pressure linter with 0 violations', () => {
    const payload = getOptionsComparison(mockSip, { asOf: '2026-11-09' });

    for (const opt of payload.options) {
      const textToScan = [
        opt.title,
        opt.subtitle,
        opt.badge,
        opt.primaryAction.label,
        opt.consequences.whatHappens,
        opt.consequences.mandateStatus,
        opt.consequences.existingInvestments,
        opt.consequences.penalties,
        opt.consequences.resumption
      ].filter(Boolean).join('. ');

      const violations = findBannedPhrases(textToScan);
      expect(violations, `Violations found in ${opt.type}: ${JSON.stringify(violations)}`).toEqual([]);
    }
  });
});

