import { describe, it, expect } from 'vitest';
import { assertPaise, divRoundHalfAway, formatINR, formatPctE2, pctE2, pctE4, sumPaise } from '@/domain/returns/money';

describe('money: integer paise, no floating point', () => {
  it('rejects non-integer and unsafe amounts', () => {
    expect(() => assertPaise(10.5)).toThrow(RangeError);
    expect(() => assertPaise(Number.NaN)).toThrow(RangeError);
    expect(() => assertPaise(Number.MAX_SAFE_INTEGER + 2)).toThrow(RangeError);
    expect(assertPaise(1050)).toBe(1050);
  });

  it('sums exactly where floating point would not (0.1 + 0.2 style)', () => {
    expect(0.1 + 0.2).not.toBe(0.3); // the trap
    expect(sumPaise([10, 20])).toBe(30);
    expect(sumPaise(Array.from({ length: 1000 }, () => 10))).toBe(10_000);
    expect(() => sumPaise([1, 0.5])).toThrow(RangeError);
  });

  it.each([
    [0n, 1n, 0n],
    [1n, 2n, 1n], // 0.5 -> 1
    [-1n, 2n, -1n], // -0.5 -> -1 (half away from zero)
    [1n, 3n, 0n],
    [2n, 3n, 1n],
    [-2n, 3n, -1n],
    [5n, 10n, 1n],
    [14n, 10n, 1n],
    [15n, 10n, 2n],
    [-15n, 10n, -2n]
  ])('divRoundHalfAway(%s, %s) = %s', (n, d, want) => {
    expect(divRoundHalfAway(n, d)).toBe(want);
  });

  it.each([
    // [numerator paise, denominator paise, expected hundredths of a percent]; each is num / den * 10,000, hand-checked
    [43_000, 1_000_000, 430], // 4.3000% -> 4.30%
    [4_300_500, 100_000_000, 430], // 4.3005% = 430.05 hundredths -> 430
    [4_300_501, 100_000_000, 430], // 430.0501 -> 430
    [4_350_000, 100_000_000, 435], // 4.35%
    [1, 8_000, 1], // 1.25 hundredths -> 1
    [5, 2_000_000, 0], // 0.025 hundredths -> 0
    [1, 20_000, 1], // exactly 0.5 hundredths -> 1 (half away from zero)
    [-1, 20_000, -1], // exactly -0.5 -> -1
    [3, 20_000, 2], // 1.5 -> 2
    [-3, 20_000, -2], // -1.5 -> -2
    [-550_480, 2_500_000, -2202] // -550480 * 10000 / 2500000 = -2201.92 -> -2202
  ])('pctE2(%s, %s) = %s', (n, d, want) => {
    expect(pctE2(n, d)).toBe(want);
  });

  it('pctE4 keeps two more digits: 4.3005% = 43005', () => {
    expect(pctE4(43_005, 1_000_000)).toBe(43_005);
    expect(pctE4(1, 3)).toBe(333_333); // 33.3333% -> 333333
    expect(pctE4(2, 3)).toBe(666_667); // 66.6667% -> 666667
  });

  it('rejects a non-positive denominator', () => {
    expect(() => pctE2(10, 0)).toThrow();
    expect(() => pctE4(10, -5)).toThrow();
  });
});

describe('formatINR (Indian digit grouping)', () => {
  it.each([
    [0, '₹0.00'],
    [5, '₹0.05'],
    [100, '₹1.00'],
    [99_999, '₹999.99'],
    [100_000, '₹1,000.00'],
    [10_000_000, '₹1,00,000.00'],
    [123_456_789, '₹12,34,567.89'],
    [1_000_000_000, '₹1,00,00,000.00'],
    [-1_878_082, '-₹18,780.82'],
    [-5, '-₹0.05']
  ])('formatINR(%s) = %s', (p, s) => {
    expect(formatINR(p)).toBe(s);
  });
  it('showPlus only affects positives', () => {
    expect(formatINR(12_345, { showPlus: true })).toBe('+₹123.45');
    expect(formatINR(0, { showPlus: true })).toBe('₹0.00');
    expect(formatINR(-12_345, { showPlus: true })).toBe('-₹123.45');
  });
  it('refuses fractional paise', () => {
    expect(() => formatINR(10.5)).toThrow(RangeError);
  });
});

describe('formatPctE2', () => {
  it.each([
    [430, '4.30%'],
    [5, '0.05%'],
    [0, '0.00%'],
    [-220, '-2.20%'],
    [-5, '-0.05%'],
    [10_000, '100.00%']
  ])('formatPctE2(%s) = %s', (v, s) => expect(formatPctE2(v)).toBe(s));
  it('showPlus', () => expect(formatPctE2(430, { showPlus: true })).toBe('+4.30%'));
});
