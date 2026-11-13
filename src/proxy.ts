import { type NextRequest, NextResponse } from 'next/server';
import { TtlCache } from './lib/tenancy/domain-cache';
import { isValidSlug, parseConfig, publicPath, resolveTarget } from './lib/tenancy/resolve';

const tenancy = parseConfig(process.env.APP_HOSTS, process.env.APP_BASE_DOMAIN);
const apiUrl = (process.env.API_URL ?? 'http://localhost:3333').replace(/\/$/, '');
const domains = new TtlCache<string | null>(5 * 60 * 1000);

async function slugForDomain(host: string): Promise<string | null> {
  const cached = domains.get(host);
  if (cached !== undefined) {
    return cached;
  }
  let slug: string | null = null;
  try {
    const response = await fetch(`${apiUrl}/v1/public/resolve?host=${encodeURIComponent(host)}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(2000),
    });
    if (response.ok) {
      const body = (await response.json()) as { slug?: unknown };
      slug = typeof body.slug === 'string' && isValidSlug(body.slug) ? body.slug : null;
    }
  } catch {
    return null;
  }
  domains.set(host, slug);
  return slug;
}

export async function proxy(request: NextRequest) {
  const target = resolveTarget(request.headers.get('host') ?? '', tenancy);
  if (target.kind === 'app') {
    return NextResponse.next();
  }

  const slug = target.kind === 'slug' ? target.slug : await slugForDomain(target.host);
  if (!slug) {
    return new NextResponse('Barbearia não encontrada', { status: 404 });
  }

  const url = request.nextUrl.clone();
  url.pathname = publicPath(slug, url.pathname);
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next/|v1/|favicon.ico|robots.txt).*)'],
};
