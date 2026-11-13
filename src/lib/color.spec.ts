import { describe, expect, it } from 'vitest';
import { contrast, ensureContrast, mix, parseHex, readableOn, toHex } from './color';

describe('color', () => {
  it('parses and prints hex colors', () => {
    expect(parseHex('#D62839')).toEqual({ r: 214, g: 40, b: 57 });
    expect(toHex({ r: 214, g: 40, b: 57 })).toBe('#D62839');
    expect(() => parseHex('red')).toThrow();
  });

  it('measures contrast like WCAG', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contrast('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('mixes toward a target', () => {
    expect(mix('#000000', '#FFFFFF', 0.5)).toBe('#808080');
  });

  it('adjusts colors that would disappear on the background', () => {
    const fixed = ensureContrast('#FFF3A0', '#FFFFFF', 3);
    expect(contrast(fixed, '#FFFFFF')).toBeGreaterThanOrEqual(3);
    expect(ensureContrast('#1E4FD8', '#FFFFFF', 3)).toBe('#1E4FD8');
    const onDark = ensureContrast('#1A1A40', '#0B0B0F', 3);
    expect(contrast(onDark, '#0B0B0F')).toBeGreaterThanOrEqual(3);
  });

  it('picks readable text for a fill', () => {
    expect(readableOn('#D62839')).toBe('#FFFFFF');
    expect(readableOn('#FFE066')).toBe('#0B0B0F');
  });
});
