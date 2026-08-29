import { describe, expect, it } from 'vitest';
import { applyVat, eurosToCents, formatBudgetRange, formatCents } from './money.js';

describe('applyVat', () => {
  it('splits a net price into the invoice lines a Dutch business needs', () => {
    const breakdown = applyVat(eurosToCents(89));
    expect(breakdown.netCents).toBe(8_900);
    expect(breakdown.vatCents).toBe(1_869);
    expect(breakdown.grossCents).toBe(10_769);
    expect(breakdown.vatRate).toBe(0.21);
  });

  it('rounds the tax to the nearest cent', () => {
    // €33.33 at 21% is €6.9993 of VAT, which must land on a whole cent.
    const breakdown = applyVat(3_333);
    expect(breakdown.vatCents).toBe(700);
    expect(breakdown.grossCents).toBe(4_033);
  });
});

describe('formatting', () => {
  it('formats cents as euros', () => {
    // The group separator depends on the ICU data shipped with the runtime, so
    // assert on the digits, the decimal comma and the currency rather than it.
    const formatted = formatCents(125_000, 'nl');
    expect(formatted.replace(/[^\d,]/g, '')).toBe('1250,00');
    expect(formatted).toContain('€');
  });

  it('collapses a budget range when both ends match', () => {
    const formatted = formatBudgetRange(500_00, 500_00, 'nl');
    expect(formatted).not.toContain('–');
    expect(formatted?.replace(/[^\d]/g, '')).toBe('500');
  });

  it('returns null when no budget was given', () => {
    expect(formatBudgetRange(null, null, 'nl')).toBeNull();
  });
});
