import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PoweredBy, TenantHeader } from '@/components/booking/tenant-header';
import { CustomerLogin } from '@/components/customer/customer-login';
import { fetchBranding } from '@/lib/server/public-api';

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = { title: 'Entrar' };

export default async function CustomerLoginPage({ params }: Props) {
  const { slug } = await params;
  const branding = await fetchBranding(slug);
  if (!branding) {
    notFound();
  }
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-5 py-5">
      <TenantHeader branding={branding} />
      <div>
        <h1 className="font-[family-name:var(--font-sign)] text-4xl font-bold">
          {branding.displayName}
        </h1>
        <p className="text-sm text-muted">
          Entre ou crie sua conta para marcar e acompanhar seus horários.
        </p>
      </div>
      <CustomerLogin slug={branding.slug} />
      <PoweredBy show={branding.showPoweredBy} />
    </div>
  );
}
