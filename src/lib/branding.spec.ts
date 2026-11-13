import { describe, expect, it } from 'vitest';
import { brandVariables, DEFAULT_PRIMARY, modeVariables } from './branding';

describe('brandVariables', () => {
  it('keeps colors that already read well', () => {
    const vars = brandVariables('#1E4FD8', '#D62839');
    expect(vars['--tenant-brand-light']).toBe('#1E4FD8');
    expect(vars['--tenant-brand-2-light']).toBe('#D62839');
  });

  it('falls back to the platform colors for invalid input', () => {
    const vars = brandVariables('javascript:alert(1)', null);
    expect(vars['--tenant-brand-light']).toBe(DEFAULT_PRIMARY);
  });

  it('lightens dark brands for the dark theme', () => {
    const vars = brandVariables('#101030', undefined);
    expect(vars['--tenant-brand-dark']).not.toBe('#101030');
  });
});

describe('modeVariables', () => {
  it('picks the colors for each theme', () => {
    const light = modeVariables('#D62839', '#1E4FD8', 'light');
    const dark = modeVariables('#D62839', '#1E4FD8', 'dark');
    expect(light['--brand']).toBe('#D62839');
    expect(dark['--on-brand']).toMatch(/^#/);
  });
});
