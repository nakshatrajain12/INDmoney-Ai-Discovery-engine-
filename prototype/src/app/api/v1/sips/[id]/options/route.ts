import { withApi } from '@/lib/api';
import { invalidInput, notFound } from '@/lib/errors';
import { AsOfParam, SipIdParam } from '@/contracts/api';
import { getProvider } from '@/data';
import { getOptionsComparison } from '@/domain/pause/options';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/sips/{id}/options
 * Returns the 3-option comparison payload (Pause vs Reduce vs Cancel).
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

  const detail = await getProvider().getSip(idResult.data, asOfResult.data);
  if (!detail) {
    throw notFound('That SIP was not found.');
  }

  const options = getOptionsComparison(detail.sip, {
    asOf: asOfResult.data ?? detail.asOf
  });

  return options;
});

