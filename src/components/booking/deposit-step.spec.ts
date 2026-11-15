import { describe, expect, it } from 'vitest';
import { remainingLabel } from './deposit-step';

describe('deposit countdown', () => {
  it('shows minutes and seconds left and stops at zero', () => {
    const now = Date.parse('2026-11-15T12:00:00Z');
    expect(remainingLabel('2026-11-15T12:29:05Z', now)).toBe('29:05');
    expect(remainingLabel('2026-11-15T11:59:00Z', now)).toBe('0:00');
  });
});
