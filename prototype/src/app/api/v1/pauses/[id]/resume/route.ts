import { withApi } from '@/lib/api';
import { invalidInput } from '@/lib/errors';
import { AsOfParam } from '@/contracts/api';
import { PauseIdParam, ResumeRequest } from '@/contracts/pause';
import { getProvider } from '@/data';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/v1/pauses/{id}/resume
 * Resumes an active or scheduled pause.
 */
export const PATCH = withApi(async ({ params, request }) => {
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

  let body: Record<string, unknown> = {};
  try {
    const text = await request.text();
    if (text && text.trim().length > 0) {
      body = JSON.parse(text);
    }
  } catch {
    throw invalidInput('Request payload must be valid JSON.');
  }

  const reqResult = ResumeRequest.safeParse(body);
  if (!reqResult.success) {
    throw invalidInput('Resume request parameters are not valid.');
  }

  const result = await getProvider().resumePause(
    idResult.data,
    asOfResult.data
  );

  return result;
});

