import { withApi } from '@/lib/api';
import { getProvider } from '@/data';
import { AsOfParam, SipIdParam } from '@/contracts/api';
import { invalidInput, notFound } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/sips/{id}[?asOf=YYYY-MM-DD]: one SIP with instalments, valuation, payment failures, pause and reminder.
 * Returns raw data only. Financial metrics (returns, XIRR, tenure) come from the Phase 2 engine, never from this route.
 * Next 16: dynamic route params arrive as a Promise; withApi resolves them into ctx.params.
 */
export const GET = withApi(async ({ request, params }) => {
  const id = SipIdParam.safeParse(params.id);
  if (!id.success) throw invalidInput('That SIP reference isn’t valid.');
  const asOf = AsOfParam.safeParse(new URL(request.url).searchParams.get('asOf') ?? undefined);
  if (!asOf.success) throw invalidInput('That date isn’t valid. Use YYYY-MM-DD.');

  const sip = await getProvider().getSip(id.data, asOf.data);
  if (!sip) throw notFound('We couldn’t find that SIP.');
  return sip;
});
