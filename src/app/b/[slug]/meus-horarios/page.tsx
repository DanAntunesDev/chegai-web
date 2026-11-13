import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MyBookings } from '@/components/booking/my-bookings';
import { PoweredBy, TenantHeader } from '@/components/booking/tenant-header';
import { fetchBranding, fetchProfile } from '@/lib/server/public-api';

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = { title: 'Meus horários' };

export default async function MyBookingsPage({ params }: Props) {
  const { slug } = await params;
  const [branding, profile] = await Promise.all([fetchBranding(slug), fetchProfile(slug)]);
  if (!branding) {
    notFound();
  }
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-5 py-6">
      <TenantHeader branding={branding} />
      <div>
        <h1 className="text-2xl font-bold">Meus horários</h1>
        <p className="text-sm text-muted">
          Confirme seu WhatsApp para ver e cancelar seus horários.
        </p>
      </div>
      <MyBookings
        slug={branding.slug}
        timezone={profile?.units[0]?.timezone ?? 'America/Sao_Paulo'}
      />
      <Link
        href={`/b/${branding.slug}/agendar`}
        className="text-center text-sm font-medium text-brand-2 hover:underline"
      >
        Agendar outro horário
      </Link>
      <PoweredBy show={branding.showPoweredBy} />
    </div>
  );
}
