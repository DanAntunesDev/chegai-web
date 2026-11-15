import { afterEach, describe, expect, it, vi } from 'vitest';
import { lookupCep, maskCep } from './cep';

describe('cep', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('masks while typing', () => {
    expect(maskCep('39400')).toBe('39400');
    expect(maskCep('39400123')).toBe('39400-123');
    expect(maskCep('39.400-12399')).toBe('39400-123');
  });

  it('fills the address from viacep', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          logradouro: 'Rua A',
          bairro: 'Centro',
          localidade: 'Montes Claros',
          uf: 'MG',
        }),
      ),
    );
    vi.stubGlobal('fetch', fetcher);
    await expect(lookupCep('39400-123')).resolves.toEqual({
      street: 'Rua A',
      district: 'Centro',
      city: 'Montes Claros',
      state: 'MG',
    });
    expect(fetcher).toHaveBeenCalledWith('https://viacep.com.br/ws/39400123/json/', {
      signal: undefined,
    });
  });

  it('ignores incomplete or unknown ceps', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ erro: 'true' }))),
    );
    await expect(lookupCep('3940')).resolves.toBeNull();
    await expect(lookupCep('00000000')).resolves.toBeNull();
  });
});
