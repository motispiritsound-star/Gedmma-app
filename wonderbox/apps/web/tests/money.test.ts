import { describe, expect, it } from 'vitest';
import {
  CurrencyMismatchError,
  add,
  applyPercentage,
  formatCents,
  money,
  multiply,
  subtract,
  sum,
} from '../src/lib/money.ts';
import { VAT_RATE_PERCENT, line, priceOrder } from '../src/server/pricing.ts';

describe('money is stored and computed in minor units', () => {
  it('refuses fractional cents rather than rounding silently', () => {
    expect(() => money(19.99)).toThrow(TypeError);
    expect(money(1999).cents).toBe(1999);
  });

  it('adds and subtracts without floating-point drift', () => {
    // 0.1 + 0.2 in floats is the classic failure. In cents it is just 30.
    const total = sum([money(10), money(20)]);
    expect(total.cents).toBe(30);
    expect(subtract(money(1000), money(1)).cents).toBe(999);
  });

  it('refuses to mix currencies', () => {
    const euros = money(100, 'EUR');
    const fake = { cents: 100, currency: 'USD' as unknown as 'EUR' };
    expect(() => add(euros, fake)).toThrow(CurrencyMismatchError);
  });

  it('multiplies only by whole quantities', () => {
    expect(multiply(money(3495), 3).cents).toBe(10485);
    expect(() => multiply(money(100), 1.5)).toThrow(TypeError);
  });

  it('rounds a percentage half-up in exactly one place', () => {
    expect(applyPercentage(money(1000), 21).cents).toBe(210);
    // 1005 * 21% = 211.05 → 211
    expect(applyPercentage(money(1005), 21).cents).toBe(211);
  });

  it('formats for the market, not for the developer', () => {
    expect(formatCents(3495, 'EUR', 'nl-NL')).toContain('34,95');
  });
});

describe('order pricing', () => {
  it('extracts VAT from a gross total instead of adding it on top', () => {
    const breakdown = priceOrder(
      [line({ sku: 'A', name: 'Box', quantity: 1, unitPriceCents: 3495 })],
      495,
    );
    expect(breakdown.subtotal.cents).toBe(3495);
    expect(breakdown.total.cents).toBe(3990);
    // The customer pays 39.90 and the VAT is inside it: 3990 * 21/121.
    expect(breakdown.tax.cents).toBe(Math.round((3990 * VAT_RATE_PERCENT) / 121));
    expect(breakdown.tax.cents).toBeLessThan(breakdown.total.cents);
  });

  it('scales line totals by quantity', () => {
    const breakdown = priceOrder(
      [line({ sku: 'A', name: 'Box', quantity: 3, unitPriceCents: 2995 })],
      0,
    );
    expect(breakdown.subtotal.cents).toBe(8985);
    expect(breakdown.total.cents).toBe(8985);
  });
});
