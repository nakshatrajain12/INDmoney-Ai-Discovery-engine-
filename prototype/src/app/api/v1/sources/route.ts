import { withApi } from '@/lib/api';
import { VERIFIED_SOURCES, type SourceEntry } from '@/domain/sources/library';

export const dynamic = 'force-dynamic';

const toVerified = (s: SourceEntry) => ({
  id: s.id,
  publisher: s.publisher,
  title: s.title,
  url: s.url,
  publishedDate: s.publishedDate,
  verifiedDate: s.verifiedDate,
  citationSnippet: s.citationSnippet
});

/**
 * GET /api/v1/sources[?topic=XYZ]
 * Returns verified citation sources from AMFI, SEBI, and CRISIL.
 */
export const GET = withApi(async ({ request }) => {
  const url = new URL(request.url);
  const topic = url.searchParams.get('topic');

  if (!topic) {
    return VERIFIED_SOURCES.map(toVerified);
  }

  const topicUpper = topic.toUpperCase();
  const filtered = VERIFIED_SOURCES.filter((s) =>
    s.topics.some((t) => t === topicUpper || t.includes(topicUpper))
  );

  return filtered.map(toVerified);
});
