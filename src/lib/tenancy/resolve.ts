export interface TenancyConfig {
  appHosts: string[];
  baseDomain: string | null;
}

export type Target =
  { kind: 'app' } | { kind: 'slug'; slug: string } | { kind: 'domain'; host: string };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED = new Set(['www', 'app', 'api', 'admin', 'painel', 'static']);

export function normalizeHost(raw: string | null | undefined): string {
  return (raw ?? '').split(',')[0]!.trim().toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');
}

export function isValidSlug(value: string): boolean {
  return value.length >= 3 && value.length <= 60 && SLUG.test(value);
}

export function parseConfig(appHosts: string | undefined, baseDomain: string | undefined) {
  return {
    appHosts: (appHosts ?? 'localhost,127.0.0.1')
      .split(',')
      .map((item) => normalizeHost(item))
      .filter(Boolean),
    baseDomain: baseDomain ? normalizeHost(baseDomain) : null,
  } satisfies TenancyConfig;
}

export function resolveTarget(rawHost: string, config: TenancyConfig): Target {
  const host = normalizeHost(rawHost);
  if (!host || config.appHosts.includes(host)) {
    return { kind: 'app' };
  }
  if (config.baseDomain) {
    if (host === config.baseDomain || host === `www.${config.baseDomain}`) {
      return { kind: 'app' };
    }
    if (host.endsWith(`.${config.baseDomain}`)) {
      const label = host.slice(0, -config.baseDomain.length - 1);
      if (!label.includes('.') && !RESERVED.has(label) && isValidSlug(label)) {
        return { kind: 'slug', slug: label };
      }
      return { kind: 'app' };
    }
  }
  return { kind: 'domain', host };
}

export function publicPath(slug: string, pathname: string): string {
  const prefix = `/b/${slug}`;
  if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
    return pathname;
  }
  return pathname === '/' ? prefix : `${prefix}${pathname}`;
}
