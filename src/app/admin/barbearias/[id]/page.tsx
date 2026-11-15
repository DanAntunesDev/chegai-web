'use client';

import { ArrowLeft, ExternalLink, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { BillingPanel } from '@/components/admin/billing-panel';
import { BrandingEditor } from '@/components/admin/branding-editor';
import { InviteForm } from '@/components/admin/invite-form';
import { TenantDetailsForm } from '@/components/admin/tenant-details-form';
import { TenantPaymentsPanel } from '@/components/admin/tenant-payments-panel';
import { TenantPlanForm } from '@/components/admin/tenant-plan-form';
import { PageHeader } from '@/components/shell/app-shell';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/components/auth/auth-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs } from '@/components/ui/tabs';
import { STATUS_LABEL, STATUS_TONE } from '@/lib/admin/labels';
import { useTenant } from '@/lib/admin/queries';
import { describeError } from '@/lib/api/errors';

type Section = 'dados' | 'plano' | 'marca' | 'cobranca' | 'recebimentos' | 'equipe';

const SECTIONS: { value: Section; label: string }[] = [
  { value: 'dados', label: 'Dados' },
  { value: 'plano', label: 'Plano e limites' },
  { value: 'marca', label: 'Marca' },
  { value: 'cobranca', label: 'Cobrança' },
  { value: 'recebimentos', label: 'Recebimentos' },
  { value: 'equipe', label: 'Equipe' },
];

export default function TenantPage() {
  const { id } = useParams<{ id: string }>();
  const tenant = useTenant(id);
  const router = useRouter();
  const { switchTenant } = useAuth();
  const [opening, setOpening] = useState(false);
  const [section, setSection] = useState<Section>('dados');

  return (
    <>
      <Link
        href="/admin/barbearias"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Barbearias
      </Link>

      {tenant.isPending ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64" />
        </div>
      ) : tenant.error ? (
        <Alert>{describeError(tenant.error)}</Alert>
      ) : (
        <>
          <PageHeader
            title={tenant.data.displayName}
            description={`/${tenant.data.slug} · ${tenant.data.plan.name} · ${tenant.data.membersCount} ${
              tenant.data.membersCount === 1 ? 'pessoa' : 'pessoas'
            }`}
            actions={
              <>
                <Badge tone={STATUS_TONE[tenant.data.status]} className="self-center">
                  {STATUS_LABEL[tenant.data.status]}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  loading={opening}
                  onClick={async () => {
                    setOpening(true);
                    try {
                      await switchTenant(tenant.data.slug);
                      router.push('/painel');
                    } finally {
                      setOpening(false);
                    }
                  }}
                >
                  <LayoutDashboard /> Abrir painel
                </Button>
                <a
                  href={`/b/${tenant.data.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  Página pública <ExternalLink />
                </a>
              </>
            }
          />
          <div className="mb-5">
            <Tabs
              label="Seções da barbearia"
              items={SECTIONS}
              value={section}
              onValueChange={setSection}
            />
          </div>
          {section === 'dados' ? <TenantDetailsForm tenant={tenant.data} /> : null}
          {section === 'plano' ? <TenantPlanForm tenant={tenant.data} /> : null}
          {section === 'marca' ? <BrandingEditor tenant={tenant.data} /> : null}
          {section === 'cobranca' ? <BillingPanel tenantId={tenant.data.id} /> : null}
          {section === 'recebimentos' ? <TenantPaymentsPanel tenantId={tenant.data.id} /> : null}
          {section === 'equipe' ? <InviteForm tenantId={tenant.data.id} /> : null}
        </>
      )}
    </>
  );
}
