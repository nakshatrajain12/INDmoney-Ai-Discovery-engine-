import { withApi } from '@/lib/api';
import { invalidInput, notFound } from '@/lib/errors';
import { AsOfParam } from '@/contracts/api';
import { DebitEventIdParam } from '@/contracts/debit';
import { getProvider } from '@/data';
import { evaluateDebitEvent } from '@/domain/debit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/debit-events/{id}/explain
 * Returns detailed diagnosis for a payment failure event.
 */
export const GET = withApi(async ({ params, request }) => {
  const idResult = DebitEventIdParam.safeParse(params.id);
  if (!idResult.success) {
    throw invalidInput('That debit event reference is not valid.');
  }

  const url = new URL(request.url);
  const asOfQuery = url.searchParams.get('asOf') ?? undefined;
  const asOfResult = AsOfParam.safeParse(asOfQuery);
  if (!asOfResult.success) {
    throw invalidInput('The asOf date must be a real ISO date (YYYY-MM-DD).');
  }

  const found = await getProvider().getDebitEvent(idResult.data);
  if (!found) {
    throw notFound('That debit event was not found.');
  }

  const diagnosis = evaluateDebitEvent(found.event, found.sip.sip, {
    allFailures: found.sip.failures,
    asOf: asOfResult.data ?? found.sip.asOf
  });

  return diagnosis;
});

