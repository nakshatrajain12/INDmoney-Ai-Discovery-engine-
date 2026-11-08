import { withApi } from '@/lib/api';
import { getProvider } from '@/data';
import { AsOfParam, SipIdParam } from '@/contracts/api';
import { invalidInput, notFound } from '@/lib/errors';
import { computeMetrics } from '@/domain/returns/engine';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/sips/{id}/metrics[?asOf=YYYY-MM-DD]: computes financial metrics using the deterministic Phase 2 engine.
 */
export const GET = withApi(async ({ request, params }) => {
  const id = SipIdParam.safeParse(params.id);
  if (!id.success) throw invalidInput('That SIP reference is not valid.');
  const asOf = AsOfParam.safeParse(new URL(request.url).searchParams.get('asOf') ?? undefined);
  if (!asOf.success) throw invalidInput('That date is not valid. Use YYYY-MM-DD.');

  const sip = await getProvider().getSip(id.data, asOf.data);
  if (!sip) throw notFound('We could not find that SIP.');

  const bundle = {
    sip: sip.sip,
    instalments: sip.instalments,
    valuation: sip.valuation,
    failures: sip.failures,
    pause: sip.pause,
    reminder: sip.reminder
  };

  const effectiveAsOf = asOf.data || sip.asOf;
  const result = computeMetrics(bundle, effectiveAsOf);

  return {
    sipId: id.data,
    asOf: effectiveAsOf,
    metrics: result.metrics,
    detail: result.detail
  };
});

