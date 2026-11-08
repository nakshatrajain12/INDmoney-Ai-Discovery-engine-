import { withApi } from '@/lib/api';
import { getProvider } from '@/data';

export const dynamic = 'force-dynamic';

/** Lists the demo personas (every record is labelled DEMO DATA). */
export const GET = withApi(async () => getProvider().listPersonas());
