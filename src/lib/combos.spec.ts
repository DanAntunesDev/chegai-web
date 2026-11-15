import { describe, expect, it } from 'vitest';
import { applyCombos, comboSavings } from './combos';

const services = [
  { id: 'corte', priceCents: 4500 },
  { id: 'barba', priceCents: 3500 },
  { id: 'sobrancelha', priceCents: 1500 },
  { id: 'combo', priceCents: 7500, includes: ['corte', 'barba'] },
];

describe('combos', () => {
  it('turns corte and barba into the combo', () => {
    expect(applyCombos(['corte', 'barba'], services)).toEqual(['combo']);
    expect(applyCombos(['barba', 'sobrancelha', 'corte'], services)).toEqual([
      'combo',
      'sobrancelha',
    ]);
  });

  it('does not double charge a service inside a chosen combo', () => {
    expect(applyCombos(['combo', 'corte'], services)).toEqual(['combo']);
  });

  it('computes how much the customer saves', () => {
    expect(comboSavings('combo', services)).toBe(500);
    expect(comboSavings('corte', services)).toBe(0);
  });
});
