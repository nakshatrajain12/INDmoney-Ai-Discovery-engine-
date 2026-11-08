import { withApi } from '@/lib/api';
import { invalidInput, notFound } from '@/lib/errors';
import { AsOfParam, SipIdParam } from '@/contracts/api';
import { DATA_LABEL } from '@/contracts/domain';
import { DebitEventSummary } from '@/contracts/debit';
import { getProvider } from '@/data';
import { evaluateDebitEvent } from '@/domain/debit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/sips/{id}/debit-events
 * Lists past debit events for a SIP with status chips and diagnosis summaries.
 */
export const GET = withApi(async ({ params, request }) => {
  const idResult = SipIdParam.safeParse(params.id);
  if (!idResult.success) {
    throw invalidInput('That SIP reference is not valid.');
  }

  const url = new URL(request.url);
  const asOfQuery = url.searchParams.get('asOf') ?? undefined;
  const asOfResult = AsOfParam.safeParse(asOfQuery);
  if (!asOfResult.success) {
    throw invalidInput('The asOf date must be a real ISO date (YYYY-MM-DD).');
  }

  const sip = await getProvider().getSip(idResult.data, asOfResult.data);
  if (!sip) {
    throw notFound('That SIP reference was not found.');
  }

  const summaries: DebitEventSummary[] = sip.failures.map((failure) => {
    const diag = evaluateDebitEvent(failure, sip.sip, {
      allFailures: sip.failures,
      asOf: asOfResult.data ?? sip.asOf
    });

    return DebitEventSummary.parse({
      id: failure.id,
      sipId: sip.sip.id,
      instalmentId: failure.instalmentId,
      occurredOn: failure.occurredOn,
      amountPaise: failure.amountPaise,
      amountFormatted: diag.amountFormatted,
      reasonCode: failure.reasonCode,
      category: diag.category,
      humanReason: diag.humanReason,
      statusChip: diag.statusChip,
      resolved: failure.resolved,
      resolvedOn: failure.resolvedOn,
      retryAllowed: diag.retry.allowed,
      nextRetryDate: diag.retry.nextRetryDate,
      isMock: true,
      dataLabel: DATA_LABEL
    });
  });

  return summaries;
});

