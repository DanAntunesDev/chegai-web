import { describe, expect, it } from 'vitest';
import { slugify } from './slug';

describe('slugify', () => {
  it('builds url friendly names', () => {
    expect(slugify('Barbearia do Zé & Filhos')).toBe('barbearia-do-ze-filhos');
    expect(slugify('  --Corte Fino--  ')).toBe('corte-fino');
    expect(slugify('a'.repeat(80))).toHaveLength(60);
  });
});
