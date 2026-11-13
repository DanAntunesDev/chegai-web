import { brandVariables } from '@/lib/branding';
import { fetchBranding } from '@/lib/server/public-api';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const branding = await fetchBranding(slug);
  if (!branding) {
    return new Response('Not found', { status: 404 });
  }
  const colors = brandVariables(branding.primaryColor, branding.secondaryColor);
  const icons = branding.iconUrl
    ? [
        { src: branding.iconUrl, sizes: '192x192', purpose: 'any' },
        { src: branding.iconUrl, sizes: '512x512', purpose: 'any' },
      ]
    : [];

  return Response.json(
    {
      name: branding.displayName,
      short_name: branding.displayName.slice(0, 24),
      start_url: `/b/${branding.slug}`,
      scope: `/b/${branding.slug}`,
      display: 'standalone',
      background_color: '#FFFFFF',
      theme_color: colors['--tenant-brand-light'],
      lang: 'pt-BR',
      icons,
    },
    {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=300',
      },
    },
  );
}
