import type { VerifiedSource } from '@/contracts/domain';
import type { TenureStage, ReturnSituation } from '@/contracts/domain';
import { VERIFIED_SOURCES, getSourceById, type SourceEntry } from './library';

export interface SourceSelectCriteria {
  situation: ReturnSituation;
  stage: TenureStage;
  shortPeriodXirr?: boolean;
  topic?: string;
}

function toVerifiedSource(entry: SourceEntry): VerifiedSource {
  return {
    id: entry.id,
    publisher: entry.publisher,
    title: entry.title,
    url: entry.url,
    publishedDate: entry.publishedDate,
    verifiedDate: entry.verifiedDate,
    citationSnippet: entry.citationSnippet
  };
}

/**
 * Deterministically select verified sources based on financial situation, tenure stage, and context.
 * Guaranteed to return only verified sources with full metadata.
 */
export function selectSources(criteria: SourceSelectCriteria): VerifiedSource[] {
  const { situation, stage, shortPeriodXirr, topic } = criteria;
  const selectedIds = new Set<string>();

  if (topic) {
    const topicUpper = topic.toUpperCase();
    const matched = VERIFIED_SOURCES.filter((s) => s.topics.some((t) => t === topicUpper || t.includes(topicUpper)));
    return matched.map(toVerifiedSource);
  }

  // Mandatory regulatory disclosure for short-period XIRR (< 12 months)
  if (shortPeriodXirr) {
    selectedIds.add('SRC_SEBI_XIRR_DISCLAIMER');
  }

  switch (situation) {
    case 'NEGATIVE':
    case 'SMALL_NEGATIVE':
      selectedIds.add('SRC_AMFI_RCA');
      selectedIds.add('SRC_SEBI_INVESTOR_GUIDE');
      if (['M1', 'M1_3', 'M3_6', 'M6_12'].includes(stage)) {
        selectedIds.add('SRC_CRISIL_TENURE_STUDY');
      }
      break;

    case 'FLAT':
      selectedIds.add('SRC_AMFI_RCA');
      selectedIds.add('SRC_CRISIL_TENURE_STUDY');
      break;

    case 'POSITIVE':
    case 'SMALL_POSITIVE':
      selectedIds.add('SRC_AMFI_SIP_POWER');
      selectedIds.add('SRC_AMFI_RCA');
      break;

    case 'INSUFFICIENT_DATA':
    default:
      selectedIds.add('SRC_AMFI_RCA');
      break;
  }

  const results: VerifiedSource[] = [];
  for (const id of selectedIds) {
    const src = getSourceById(id);
    if (src) {
      results.push(toVerifiedSource(src));
    }
  }

  return results;
}
