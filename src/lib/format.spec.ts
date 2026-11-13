import { describe, expect, it } from 'vitest';
import { centsFromInput, currentMonth, formatDate, formatMoney, shiftMonth } from './format';

describe('format', () => {
  it('formats money in reais', () => {
    expect(formatMoney(12345).replace(/\s/g, ' ')).toBe('R$ 123,45');
  });

  it('reads money typed by people', () => {
    expect(centsFromInput('49,90')).toBe(4990);
    expect(centsFromInput('R$ 1.299,00')).toBe(129900);
    expect(centsFromInput('10')).toBe(1000);
    expect(centsFromInput('abc')).toBeNull();
  });

  it('keeps plain dates on the same day', () => {
    expect(formatDate('2026-11-20')).toBe('20/11/2026');
  });

  it('walks months across years', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(currentMonth(new Date('2026-11-01T01:00:00Z'))).toBe('2026-10');
  });
});
