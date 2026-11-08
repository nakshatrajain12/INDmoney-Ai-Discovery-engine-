import { withApi } from '@/lib/api';
import { invalidInput, notFound } from '@/lib/errors';
import { getTerm } from '@/content/terms';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/terms/{key}
 * Returns vetted financial term definition (XIRR, ABSOLUTE_RETURN, NAV, VOLATILITY, UNREALISED_RETURN).
 */
export const GET = withApi(async ({ params }) => {
  const key = typeof params.key === 'string' ? params.key : Array.isArray(params.key) ? params.key[0] : '';
  if (!key) {
    throw invalidInput('Term key is required.');
  }

  const term = getTerm(key);
  if (!term) {
    throw notFound(`Financial term '${key}' was not found in the verified glossary.`);
  }

  return term;
});

