import { withApi } from '@/lib/api';
import { invalidInput } from '@/lib/errors';
import { AsOfParam, SipIdParam } from '@/contracts/api';
import { PauseRequest } from '@/contracts/pause';
import { getProvider } from '@/data';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/sips/{id}/pause
 * Creates a scheduled or immediate pause on an active SIP.
 */
export const POST = withApi(async ({ params, request }) => {
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

  let body: Record<string, unknown> = {};
  try {
    const text = await request.text();
    if (text && text.trim().length > 0) {
      body = JSON.parse(text);
    }
  } catch {
    throw invalidInput('Request payload must be valid JSON.');
  }

  const reqResult = PauseRequest.safeParse(body);
  if (!reqResult.success) {
    const msg = reqResult.error.issues[0]?.message ?? 'Invalid pause request parameters.';
    throw invalidInput(msg);
  }

  const result = await getProvider().pauseSip(
    idResult.data,
    reqResult.data,
    asOfResult.data
  );

  return result;
});

