import { describe, expect, it } from 'vitest';
import { formatDate, formatDuration, formatMoney, pickName } from './format';

describe('formatters', () => {
  it('shows whole euros, which is how prices are quoted', () => {
    const formatted = formatMoney(450_000, 'nl');
    expect(formatted.replace(/[^\d]/g, '')).toBe('4500');
    expect(formatted).toContain('€');
  });

  it('renders an em dash rather than a zero for a missing amount', () => {
    expect(formatMoney(null, 'nl')).toBe('—');
    expect(formatDate(null, 'en')).toBe('—');
  });

  it('formats a date in each language', () => {
    const date = '2026-03-15T10:00:00.000Z';
    expect(formatDate(date, 'nl')).toContain('2026');
    expect(formatDate(date, 'en')).toContain('2026');
    expect(formatDate(date, 'en').length).toBeGreaterThan(0);
  });

  it('collapses a response time into minutes, hours or days', () => {
    expect(formatDuration(42, 'nl')).toBe('42 min');
    expect(formatDuration(180, 'nl')).toBe('3 h');
    expect(formatDuration(2880, 'nl')).toBe('2 d');
    expect(formatDuration(null, 'nl')).toBeNull();
  });

  it('picks the column matching the language', () => {
    const row = { nameNl: 'Loodgieter', nameEn: 'Plumbing' };
    expect(pickName(row, 'nl')).toBe('Loodgieter');
        expect(pickName(row, 'en')).toBe('Plumbing');
  });
});
