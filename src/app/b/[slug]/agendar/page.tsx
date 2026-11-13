import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BookingFlow } from '@/components/booking/booking-flow';
import { PoweredBy, TenantHeader } from '@/components/booking/tenant-header';
import { fetchBranding, fetchProfile } from '@/lib/server/public-api';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ unidade?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const branding = await fetchBranding(slug);
  return { title: branding ? `Agendar · ${branding.displayName}` : 'Agendar' };
}

export default async function BookPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { unidade } = await searchParams;
  const [branding, profile] = await Promise.all([fetchBranding(slug), fetchProfile(slug)]);
  if (!branding || !profile) {
    notFound();
  }
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-5 py-6">
      <TenantHeader branding={branding} />
      <BookingFlow slug={branding.slug} units={profile.units} initialUnitId={unidade} />
      <PoweredBy show={branding.showPoweredBy} />
    </div>
  );
}
