import { describe, expect, it } from 'vitest';
import { parseConfig, publicPath, resolveTarget, servesStaffOnTenantHost } from './resolve';

const config = parseConfig('localhost,app.chegai.com.br', 'chegai.com.br');

describe('resolveTarget', () => {
  it('keeps the app hosts on the panel', () => {
    expect(resolveTarget('localhost:3000', config)).toEqual({ kind: 'app' });
    expect(resolveTarget('APP.chegai.com.br', config)).toEqual({ kind: 'app' });
    expect(resolveTarget('chegai.com.br', config)).toEqual({ kind: 'app' });
  });

  it('reads the barbershop from a subdomain', () => {
    expect(resolveTarget('barbearia-do-ze.chegai.com.br', config)).toEqual({
      kind: 'slug',
      slug: 'barbearia-do-ze',
    });
  });

  it('ignores reserved or malformed subdomains', () => {
    expect(resolveTarget('admin.chegai.com.br', config)).toEqual({ kind: 'app' });
    expect(resolveTarget('a.b.chegai.com.br', config)).toEqual({ kind: 'app' });
    expect(resolveTarget('evilchegai.com.br', config)).toEqual({
      kind: 'domain',
      host: 'evilchegai.com.br',
    });
  });

  it('treats anything else as a custom domain', () => {
    expect(resolveTarget('agenda.barbeariadoze.com.br', config)).toEqual({
      kind: 'domain',
      host: 'agenda.barbeariadoze.com.br',
    });
  });
});

describe('wildcard app hosts', () => {
  it('treats dev tunnels as the panel', () => {
    const tunnels = parseConfig('localhost,*.devtunnels.ms', undefined);
    expect(resolveTarget('abc-3000.brs.devtunnels.ms', tunnels)).toEqual({ kind: 'app' });
    expect(resolveTarget('devtunnels.ms', tunnels)).toEqual({
      kind: 'domain',
      host: 'devtunnels.ms',
    });
  });
});

describe('publicPath', () => {
  it('prefixes paths once', () => {
    expect(publicPath('ze', '/')).toBe('/b/ze');
    expect(publicPath('ze', '/agendar')).toBe('/b/ze/agendar');
    expect(publicPath('ze', '/b/ze/manifest.webmanifest')).toBe('/b/ze/manifest.webmanifest');
  });
});

describe('barbershop address', () => {
  it('keeps the panel and its login on the barbershop host', () => {
    expect(servesStaffOnTenantHost('/barbearia')).toBe(true);
    expect(servesStaffOnTenantHost('/barbearia/agenda')).toBe(true);
    expect(servesStaffOnTenantHost('/login/barbearia')).toBe(true);
    expect(servesStaffOnTenantHost('/login/cliente')).toBe(false);
    expect(servesStaffOnTenantHost('/barbearias')).toBe(false);
    expect(servesStaffOnTenantHost('/admin')).toBe(false);
  });

  it('maps the customer login to the barbershop pages', () => {
    expect(publicPath('joaodocorte', '/login/cliente')).toBe('/b/joaodocorte/login/cliente');
    expect(publicPath('joaodocorte', '/cliente')).toBe('/b/joaodocorte/cliente');
  });
});
