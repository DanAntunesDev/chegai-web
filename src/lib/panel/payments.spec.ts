import { describe, expect, it } from 'vitest';
import { depositCents, paymentMessage, whatsappMessageLink } from './payments';

describe('booking payments', () => {
  it('splits the deposit from the total', () => {
    expect(depositCents(5000, 50)).toBe(2500);
    expect(depositCents(4500, 30)).toBe(1350);
  });

  it('writes a friendly message with the link', () => {
    const text = paymentMessage({
      customerName: 'Carlos Souza',
      shopName: 'Barbearia Centro',
      when: 'sexta, 21/11 às 10:00',
      kind: 'DEPOSIT',
      amountCents: 2500,
      url: 'https://pay.test/abc',
    });
    expect(text).toContain('Olá, Carlos!');
    expect(text).toContain('na Barbearia Centro');
    expect(text).toContain('R$');
    expect(text).toContain('https://pay.test/abc');
  });

  it('adds the country code for brazilian numbers', () => {
    expect(whatsappMessageLink('(38) 99746-3513', 'oi')).toBe(
      'https://wa.me/5538997463513?text=oi',
    );
    expect(whatsappMessageLink('5538997463513', 'oi')).toBe('https://wa.me/5538997463513?text=oi');
  });
});
