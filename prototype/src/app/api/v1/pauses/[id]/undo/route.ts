import { withApi } from '@/lib/api';
import { invalidInput } from '@/lib/errors';
import { AsOfParam } from '@/contracts/api';
import { PauseIdParam } from '@/contracts/pause';
import { getProvider } from '@/data';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/pauses/{id}/undo
 * Undoes a newly initiated pause within 60 seconds (PR-E10).
 */
export const POST = withApi(async ({ params, request }) => {
  const idResult = PauseIdParam.safeParse(params.id);
  if (!idResult.success) {
    throw invalidInput('That pause reference is not valid.');
  }

  const url = new URL(request.url);
  const asOfQuery = url.searchParams.get('asOf') ?? undefined;
  const asOfResult = AsOfParam.safeParse(asOfQuery);
  if (!asOfResult.success) {
    throw invalidInput('The asOf date must be a real ISO date (YYYY-MM-DD).');
  }

  const result = await getProvider().undoPause(
    idResult.data,
    asOfResult.data
  );

  return result;
});

