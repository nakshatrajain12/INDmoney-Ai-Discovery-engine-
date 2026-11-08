import { describe, it, expect } from 'vitest';
import { VERIFIED_SOURCES, getSourceById } from '@/domain/sources/library';
import { selectSources } from '@/domain/sources/select';
import { isValidISODate } from '@/lib/dates';
import { VerifiedSource } from '@/contracts/domain';

describe('Verified Sources Library & Selection (Phase 3)', () => {
  it('every source conforms to the VerifiedSource schema with valid URLs and ISO dates', () => {
    expect(VERIFIED_SOURCES.length).toBeGreaterThanOrEqual(4);

    for (const source of VERIFIED_SOURCES) {
      const parsed = VerifiedSource.safeParse(source);
      expect(parsed.success, `Source ${source.id} failed schema validation: ${parsed.error?.message}`).toBe(true);

      expect(isValidISODate(source.publishedDate)).toBe(true);
      expect(isValidISODate(source.verifiedDate)).toBe(true);
      expect(source.url.startsWith('https://')).toBe(true);
      expect(source.citationSnippet.trim().length).toBeGreaterThan(20);
      expect(['AMFI', 'SEBI', 'CRISIL', 'RESERVE_BANK_OF_INDIA']).toContain(source.publisher);
    }
  });

  it('selects AMFI Rupee Cost Averaging and SEBI guides for negative returns', () => {
    const sources = selectSources({ situation: 'NEGATIVE', stage: 'M3_6' });
    const ids = sources.map((s) => s.id);
    expect(ids).toContain('SRC_AMFI_RCA');
    expect(ids).toContain('SRC_SEBI_INVESTOR_GUIDE');
    expect(ids).toContain('SRC_CRISIL_TENURE_STUDY');
  });

  it('includes SEBI XIRR disclaimer whenever shortPeriodXirr is true', () => {
    const sourcesWithShortXirr = selectSources({ situation: 'SMALL_POSITIVE', stage: 'M3_6', shortPeriodXirr: true });
    expect(sourcesWithShortXirr.some((s) => s.id === 'SRC_SEBI_XIRR_DISCLAIMER')).toBe(true);

    const sourcesWithoutShortXirr = selectSources({ situation: 'SMALL_POSITIVE', stage: 'OVER_12', shortPeriodXirr: false });
    expect(sourcesWithoutShortXirr.some((s) => s.id === 'SRC_SEBI_XIRR_DISCLAIMER')).toBe(false);
  });

  it('filters sources by topic correctly', () => {
    const rcaSources = selectSources({ situation: 'FLAT', stage: 'M3_6', topic: 'RUPEE_COST_AVERAGING' });
    expect(rcaSources.length).toBeGreaterThan(0);
    expect(rcaSources.every((s) => s.id === 'SRC_AMFI_RCA')).toBe(true);
  });

  it('getSourceById retrieves source by id', () => {
    const src = getSourceById('SRC_AMFI_RCA');
    expect(src).toBeDefined();
    expect(src?.publisher).toBe('AMFI');
  });
});

