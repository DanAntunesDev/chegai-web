import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';
import { brandVariables } from '@/lib/branding';
import { fetchBranding } from '@/lib/server/public-api';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const branding = await fetchBranding(slug);
  if (!branding) {
    return { title: 'Barbearia não encontrada' };
  }
  return {
    title: { absolute: branding.displayName },
    description: `Agende seu horário na ${branding.displayName}.`,
    manifest: `/b/${branding.slug}/manifest.webmanifest`,
    icons: branding.iconUrl ? { icon: branding.iconUrl, apple: branding.iconUrl } : undefined,
    appleWebApp: { capable: true, title: branding.displayName, statusBarStyle: 'default' },
    robots: { index: true, follow: true },
  };
}

export default async function TenantLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Params;
}) {
  const { slug } = await params;
  const branding = await fetchBranding(slug);
  if (!branding || branding.status === 'BLOCKED') {
    notFound();
  }

  return (
    <div
      data-brand
      style={brandVariables(branding.primaryColor, branding.secondaryColor) as CSSProperties}
      className="min-h-dvh bg-background text-foreground"
    >
      {children}
    </div>
  );
}
