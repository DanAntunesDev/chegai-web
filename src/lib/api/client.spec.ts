import { describe, expect, it, vi } from 'vitest';
import { buildUrl, createClient } from './client';
import { ApiError } from './errors';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('api client', () => {
  it('skips empty query values', () => {
    expect(buildUrl('/v1/x', { a: 'b', c: undefined, d: '', e: 0 })).toBe('/v1/x?a=b&e=0');
  });

  it('sends the bearer token and json body', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json(200, { ok: true }));
    const request = createClient({
      fetch: fetcher,
      getToken: () => 'abc',
      refresh: () => Promise.resolve(null),
      onSessionLost: () => undefined,
    });

    await expect(request('/v1/x', { method: 'POST', body: { a: 1 } })).resolves.toEqual({
      ok: true,
    });
    const init = fetcher.mock.calls[0]?.[1];
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer abc' });
    expect(init?.body).toBe('{"a":1}');
  });

  it('refreshes once on an expired token and retries', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json(401, { code: 'INVALID_TOKEN', message: 'expired' }))
      .mockResolvedValueOnce(json(200, { id: 1 }));
    const refresh = vi.fn().mockResolvedValue('fresh');
    const request = createClient({
      fetch: fetcher,
      getToken: () => 'old',
      refresh,
      onSessionLost: () => undefined,
    });

    await expect(request('/v1/x')).resolves.toEqual({ id: 1 });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[1]?.[1]?.headers).toMatchObject({ Authorization: 'Bearer fresh' });
  });

  it('drops the session when refresh fails', async () => {
    const onSessionLost = vi.fn();
    const request = createClient({
      fetch: vi
        .fn<typeof fetch>()
        .mockResolvedValue(json(401, { code: 'INVALID_TOKEN', message: 'expired' })),
      getToken: () => 'old',
      refresh: () => Promise.resolve(null),
      onSessionLost,
    });

    await expect(request('/v1/x')).rejects.toBeInstanceOf(ApiError);
    expect(onSessionLost).toHaveBeenCalledTimes(1);
  });

  it('does not refresh on login errors', async () => {
    const refresh = vi.fn();
    const request = createClient({
      fetch: vi
        .fn<typeof fetch>()
        .mockResolvedValue(json(401, { code: 'TOTP_REQUIRED', message: 'code' })),
      getToken: () => null,
      refresh,
      onSessionLost: () => undefined,
    });

    await expect(request('/v1/auth/login')).rejects.toMatchObject({ code: 'TOTP_REQUIRED' });
    expect(refresh).not.toHaveBeenCalled();
  });

  it('reports network failures with a code', async () => {
    const request = createClient({
      fetch: vi.fn<typeof fetch>().mockRejectedValue(new TypeError('failed')),
      getToken: () => null,
      refresh: () => Promise.resolve(null),
      onSessionLost: () => undefined,
    });

    await expect(request('/v1/x')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });
});
