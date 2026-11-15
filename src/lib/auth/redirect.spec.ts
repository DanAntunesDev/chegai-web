import { describe, expect, it } from 'vitest';
import type { Session } from '../api/types';
import { destinationAfterLogin, homeFor, loginPathFor, safeNext } from './redirect';

const session = (overrides: Partial<Session> = {}): Session => ({
  accessToken: 't',
  expiresIn: 900,
  user: { id: 'u', name: 'Dan', email: 'dan@x.com', isPlatformAdmin: false },
  tenant: { id: 't', slug: 'barbearia', displayName: 'Barbearia' },
  tenants: [],
  ...overrides,
});

describe('login redirects', () => {
  it('only follows same-site paths', () => {
    expect(safeNext('/admin')).toBe('/admin');
    expect(safeNext('//evil.com')).toBeNull();
    expect(safeNext('https://evil.com')).toBeNull();
    expect(safeNext('/\\evil.com')).toBeNull();
    expect(safeNext(null)).toBeNull();
  });

  it('sends people to their own area', () => {
    expect(homeFor(session())).toBe('/barbearia');
    expect(
      homeFor(session({ tenant: null, user: { ...session().user, isPlatformAdmin: true } })),
    ).toBe('/admin');
    expect(homeFor(session({ tenant: null }))).toBe('/sem-acesso');
  });

  it('ignores areas the account cannot open', () => {
    expect(destinationAfterLogin(session(), '/admin/tenants')).toBe('/barbearia');
    expect(destinationAfterLogin(session(), '/barbearia/agenda')).toBe('/barbearia/agenda');
  });
});

describe('login path', () => {
  it('sends each area to its own login', () => {
    expect(loginPathFor('/admin/integracoes')).toBe('/login/admin?next=%2Fadmin%2Fintegracoes');
    expect(loginPathFor('/barbearia/agenda')).toBe('/login/barbearia?next=%2Fbarbearia%2Fagenda');
  });
});
