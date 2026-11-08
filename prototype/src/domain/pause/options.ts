import type { Sip } from '@/contracts/domain';
import { DATA_LABEL } from '@/contracts/domain';
import type { OptionsComparisonPayload, OptionsComparisonItem } from '@/contracts/pause';
import { formatINR } from '@/domain/returns/money';
import { nthDueDate, type ISODate } from '@/lib/dates';

/**
 * Options Comparison Logic (architecture.md Section 4.3.1 & implementation-plan.md Phase 5 Task 1).
 * Presents three equally weighted, transparent, non-judgmental choices:
 *  1. Pause SIP (temporarily halt debits, keep mandate active)
 *  2. Reduce Amount / Step-Down (lower monthly commitment, keep continuity)
 *  3. Cancel SIP (revoke mandate, keep existing folio units compounding)
 */
export function getOptionsComparison(
  sip: Sip,
  options: { asOf?: ISODate; nextScheduledDebit?: ISODate | null } = {}
): OptionsComparisonPayload {
  const currentPaise = sip.instalmentAmountPaise;
  // Standard AMC minimum is ₹500 (50,000 paise) or ₹1,000 (100,000 paise)
  const minimumPaise = currentPaise > 100000 ? 50000 : Math.min(50000, currentPaise);

  const nextDebit = options.nextScheduledDebit !== undefined
    ? options.nextScheduledDebit
    : nthDueDate(sip.investmentDate, sip.frequency, 1);

  const formattedCurrent = formatINR(currentPaise);
  const formattedMin = formatINR(minimumPaise);

  const items: OptionsComparisonItem[] = [
    {
      type: 'PAUSE',
      title: 'Pause SIP',
      subtitle: 'Temporarily halt upcoming debits',
      badge: 'Flexible pause',
      consequences: {
        whatHappens: 'Upcoming instalments are paused for your chosen duration. Resume whenever you are ready.',
        mandateStatus: 'Bank Autopay remains registered and active. No need to set up a new mandate upon restart.',
        existingInvestments: 'All accumulated units remain invested in your folio and continue to compound with market movements.',
        penalties: 'Zero penalties, bank charges, or modification fees.',
        resumption: 'Resumes automatically on your selected restart date, or earlier whenever you choose.'
      },
      primaryAction: {
        label: 'Pause this SIP',
        actionUrl: `/sip/${sip.id}/pause/confirm`
      }
    },
    {
      type: 'REDUCE',
      title: 'Reduce monthly amount',
      subtitle: 'Lower your instalment to fit cash flow',
      badge: 'Keep momentum',
      consequences: {
        whatHappens: `Reduce your monthly instalment from ${formattedCurrent} down to ${formattedMin} or another amount to ease monthly cash flow while keeping investment continuity.`,
        mandateStatus: 'Bank Autopay remains active with the adjusted instalment amount.',
        existingInvestments: 'Existing units stay invested and new units continue to accumulate steadily at the lower instalment.',
        penalties: 'Zero step-down fees or modification charges.',
        resumption: 'Step back up to your original instalment amount at any time when cash flow eases.'
      },
      primaryAction: {
        label: `Reduce to ${formattedMin}/mo`,
        actionUrl: `/sip/${sip.id}/reduce`
      }
    },
    {
      type: 'CANCEL',
      title: 'Cancel SIP',
      subtitle: 'Stop all future instalments completely',
      badge: 'Stop debits',
      consequences: {
        whatHappens: 'Completely halts all upcoming debits and cancels future scheduled instalments.',
        mandateStatus: 'Bank Autopay mandate is permanently revoked with your bank.',
        existingInvestments: 'All units purchased to date remain safely invested in your folio and continue to compound. Your capital is not withdrawn.',
        penalties: 'Zero cancellation fees, penalties, or exit loads from stopping the SIP schedule.',
        resumption: 'A cancelled SIP schedule cannot be restarted directly. You can start a fresh SIP anytime.'
      },
      primaryAction: {
        label: 'Cancel this SIP',
        actionUrl: `/sip/${sip.id}/cancel`
      }
    }
  ];

  return {
    sipId: sip.id,
    schemeName: sip.schemeName,
    currentAmountPaise: currentPaise,
    minimumAmountPaise: minimumPaise,
    nextScheduledDebit: nextDebit,
    mandateStatus: sip.mandate.status,
    options: items,
    isMock: true,
    dataLabel: DATA_LABEL
  };
}

