import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PoweredBy, TenantHeader } from '@/components/booking/tenant-header';
import { CustomerHome } from '@/components/customer/customer-home';
import { fetchBranding, fetchProfile } from '@/lib/server/public-api';

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = { title: 'Minha conta' };

export default async function CustomerAreaPage({ params }: Props) {
  const { slug } = await params;
  const [branding, profile] = await Promise.all([fetchBranding(slug), fetchProfile(slug)]);
  if (!branding) {
    notFound();
  }
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-5 py-5">
      <TenantHeader branding={branding} />
      <CustomerHome
        slug={branding.slug}
        timezone={profile?.units[0]?.timezone ?? 'America/Sao_Paulo'}
      />
      <PoweredBy show={branding.showPoweredBy} />
    </div>
  );
}
