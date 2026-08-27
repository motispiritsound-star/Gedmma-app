import { describe, expect, it } from 'vitest';
import { applyVat, dirhamsToCentimes, formatBudgetRange, formatCentimes } from './money.js';

describe('applyVat', () => {
  it('splits a net price into the HT / TVA / TTC lines of an invoice', () => {
    const breakdown = applyVat(dirhamsToCentimes(599));
    expect(breakdown.netCentimes).toBe(59_900);
    expect(breakdown.vatCentimes).toBe(11_980);
    expect(breakdown.grossCentimes).toBe(71_880);
  });

  it('rounds the tax to the nearest centime', () => {
    // 33.33 MAD at 20% is 6.666 MAD of VAT, which must land on a whole centime.
    const breakdown = applyVat(3_333);
    expect(breakdown.vatCentimes).toBe(667);
    expect(breakdown.grossCentimes).toBe(4_000);
  });
});

describe('formatting', () => {
  it('formats centimes as dirhams', () => {
    // The group separator depends on the ICU data shipped with the runtime, so
    // assert on the digits, the decimal comma and the currency rather than it.
    const formatted = formatCentimes(125_000, 'fr');
    expect(formatted.replace(/[^\d,]/g, '')).toBe('1250,00');
    expect(formatted).toContain('MAD');
  });

  it('collapses a budget range when both ends match', () => {
    const formatted = formatBudgetRange(500_00, 500_00, 'fr');
    expect(formatted).not.toContain('\u2013');
    expect(formatted?.replace(/[^\d]/g, '')).toBe('500');
  });

  it('returns null when no budget was given', () => {
    expect(formatBudgetRange(null, null, 'fr')).toBeNull();
  });
});
