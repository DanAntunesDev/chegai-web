import { describe, expect, it } from 'vitest';
import { formatPhone, whatsappLink } from './phone';

describe('phone helpers', () => {
  it('formats brazilian numbers', () => {
    expect(formatPhone('+5538991110001')).toBe('(38) 99111-0001');
    expect(formatPhone('3832210000')).toBe('(38) 3221-0000');
    expect(formatPhone(null)).toBe('');
  });

  it('builds whatsapp links', () => {
    expect(whatsappLink('+55 38 99111-0001')).toBe('https://wa.me/5538991110001');
  });
});
