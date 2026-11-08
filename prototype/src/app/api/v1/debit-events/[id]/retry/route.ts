import { withApi } from '@/lib/api';
import { invalidInput } from '@/lib/errors';
import { AsOfParam } from '@/contracts/api';
import { DebitEventIdParam, RetryRequest } from '@/contracts/debit';
import { getProvider } from '@/data';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/debit-events/{id}/retry
 * Body: { idempotencyKey?: string }
 * Executes mock payment retry on a failed debit event.
 */
export const POST = withApi(async ({ params, request }) => {
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

  let body: Record<string, unknown> = {};
  try {
    const text = await request.text();
    if (text && text.trim().length > 0) {
      body = JSON.parse(text);
    }
  } catch {
    throw invalidInput('Request payload must be valid JSON.');
  }

  const reqResult = RetryRequest.safeParse(body);
  if (!reqResult.success) {
    throw invalidInput('Retry request parameters are not valid.');
  }

  const result = await getProvider().retryDebitEvent(
    idResult.data,
    reqResult.data.idempotencyKey,
    asOfResult.data
  );

  return result;
});

