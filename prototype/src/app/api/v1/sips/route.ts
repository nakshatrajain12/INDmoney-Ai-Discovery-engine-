import { withApi } from '@/lib/api';
import { getProvider } from '@/data';
import { AsOfParam, PersonaKeyParam } from '@/contracts/api';
import { invalidInput, notFound } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/** GET /api/v1/sips?persona=early-flat[&asOf=YYYY-MM-DD]: SIP summaries with derived status. */
export const GET = withApi(async ({ request }) => {
  const url = new URL(request.url);
  const rawPersona = url.searchParams.get('persona') ?? '';
  const normalizedKey = rawPersona.replace(/_s\d+$/, '');
  const persona = PersonaKeyParam.safeParse(normalizedKey);
  if (!persona.success) throw invalidInput('Choose a demo persona.');
  const asOf = AsOfParam.safeParse(url.searchParams.get('asOf') ?? undefined);
  if (!asOf.success) throw invalidInput('That date isn’t valid. Use YYYY-MM-DD.');

  const provider = getProvider();
  const user = await provider.getUserForPersona(persona.data);
  if (!user) throw notFound('We couldn’t find that demo persona.');
  return provider.listSips(user.id, asOf.data);
});
