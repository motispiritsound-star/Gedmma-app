import { describe, expect, it } from 'vitest';
import { formatDate, formatDuration, formatMoney, pickName } from './format';

describe('formatters', () => {
  it('shows dirhams without centimes, which is how prices are quoted', () => {
    const formatted = formatMoney(450_000, 'fr');
    expect(formatted.replace(/[^\d]/g, '')).toBe('4500');
    expect(formatted).toContain('MAD');
  });

  it('renders an em dash rather than a zero for a missing amount', () => {
    expect(formatMoney(null, 'fr')).toBe('—');
    expect(formatDate(null, 'ar')).toBe('—');
  });

  it('formats a date in each language', () => {
    const date = '2026-03-15T10:00:00.000Z';
    expect(formatDate(date, 'fr')).toContain('2026');
    expect(formatDate(date, 'en')).toContain('2026');
    expect(formatDate(date, 'ar').length).toBeGreaterThan(0);
  });

  it('collapses a response time into minutes, hours or days', () => {
    expect(formatDuration(42, 'fr')).toBe('42 min');
    expect(formatDuration(180, 'fr')).toBe('3 h');
    expect(formatDuration(2880, 'fr')).toBe('2 j');
    expect(formatDuration(null, 'fr')).toBeNull();
  });

  it('picks the column matching the language', () => {
    const row = { nameFr: 'Plomberie', nameAr: 'السباكة', nameEn: 'Plumbing' };
    expect(pickName(row, 'fr')).toBe('Plomberie');
    expect(pickName(row, 'ar')).toBe('السباكة');
    expect(pickName(row, 'en')).toBe('Plumbing');
  });
});
