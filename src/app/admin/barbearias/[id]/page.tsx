'use client';

import {
  ArrowLeft,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  type LucideIcon,
  Palette,
  ScrollText,
  Store,
  Unplug,
  UsersRound,
  Webhook,
  Gauge,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { BillingPanel } from '@/components/admin/billing-panel';
import { BrandingEditor } from '@/components/admin/branding-editor';
import { WebhooksSection } from '@/components/admin/integrations/webhooks-section';
import { InviteForm } from '@/components/admin/invite-form';
import { LogsView } from '@/components/admin/logs/logs-view';
import { TenantDetailsForm } from '@/components/admin/tenant-details-form';
import { TenantIntegrations } from '@/components/admin/tenant-integrations';
import { TenantPlanForm } from '@/components/admin/tenant-plan-form';
import { useAuth } from '@/components/auth/auth-provider';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { STATUS_LABEL, STATUS_TONE } from '@/lib/admin/labels';
import { WEBHOOK_EVENTS } from '@/lib/admin/integrations';
import { useTenant } from '@/lib/admin/queries';
import { describeError } from '@/lib/api/errors';
import { cn } from '@/lib/cn';

type Section =
  'dados' | 'plano' | 'marca' | 'cobranca' | 'integracoes' | 'webhooks' | 'equipe' | 'logs';

const SECTIONS: { value: Section; label: string; icon: LucideIcon; hint: string }[] = [
  { value: 'dados', label: 'Dados gerais', icon: Store, hint: 'Razão social, contato e situação' },
  { value: 'plano', label: 'Plano e limites', icon: Gauge, hint: 'Plano contratado e exceções' },
  { value: 'marca', label: 'Marca', icon: Palette, hint: 'Logo, cores e domínio' },
  { value: 'cobranca', label: 'Assinatura', icon: CreditCard, hint: 'Faturas do Chegaí' },
  {
    value: 'integracoes',
    label: 'Integrações',
    icon: Unplug,
    hint: 'Asaas, WhatsApp, n8n e Google',
  },
  { value: 'webhooks', label: 'Webhooks', icon: Webhook, hint: 'Avisos para outros sistemas' },
  { value: 'equipe', label: 'Equipe', icon: UsersRound, hint: 'Convites de acesso' },
  { value: 'logs', label: 'Logs', icon: ScrollText, hint: 'Requisições e alterações' },
];

const isSection = (value: string | null): value is Section =>
  SECTIONS.some((section) => section.value === value);

export default function TenantPage() {
  return (
    <Suspense>
      <TenantDetail />
    </Suspense>
  );
}

function TenantDetail() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const tenant = useTenant(id);
  const router = useRouter();
  const { switchTenant } = useAuth();
  const [opening, setOpening] = useState(false);
  const initial = params.get('secao');
  const [section, setSection] = useState<Section>(isSection(initial) ? initial : 'dados');

  const select = (value: Section) => {
    setSection(value);
    router.replace(`/admin/barbearias/${id}?secao=${value}`, { scroll: false });
  };

  if (tenant.isPending) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (tenant.error) {
    return <Alert>{describeError(tenant.error)}</Alert>;
  }

  const data = tenant.data;
  const current = SECTIONS.find((item) => item.value === section) ?? { label: '', hint: '' };

  return (
    <>
      <Link
        href="/admin/barbearias"
        className="mb-5 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Barbearias
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <aside className="flex flex-col gap-5 lg:sticky lg:top-6 lg:w-60 lg:shrink-0">
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-foreground text-lg font-bold text-background">
              {data.displayName.charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{data.displayName}</p>
              <p className="truncate text-xs text-muted">
                /{data.slug} · {data.plan.name}
              </p>
              <Badge tone={STATUS_TONE[data.status]} className="mt-1">
                {STATUS_LABEL[data.status]}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2 lg:flex-col">
            <Button
              variant="outline"
              size="sm"
              className="lg:justify-start"
              loading={opening}
              onClick={async () => {
                setOpening(true);
                try {
                  await switchTenant(data.slug);
                  router.push('/barbearia');
                } finally {
                  setOpening(false);
                }
              }}
            >
              <LayoutDashboard /> Abrir painel
            </Button>
            <a
              href={`/b/${data.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'lg:justify-start')}
            >
              <ExternalLink /> Página pública
            </a>
          </div>
          <nav
            aria-label="Seções da barbearia"
            className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
          >
            {SECTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-current={section === value ? 'page' : undefined}
                onClick={() => select(value)}
                className={cn(
                  'flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors',
                  section === value
                    ? 'bg-surface-2 font-medium text-foreground'
                    : 'text-muted hover:bg-surface-2/60 hover:text-foreground',
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="mb-5">
            <h1 className="text-2xl font-semibold">{current.label}</h1>
            <p className="text-sm text-muted">{current.hint}</p>
          </header>
          {section === 'dados' ? <TenantDetailsForm tenant={data} /> : null}
          {section === 'plano' ? <TenantPlanForm tenant={data} /> : null}
          {section === 'marca' ? <BrandingEditor tenant={data} /> : null}
          {section === 'cobranca' ? <BillingPanel tenantId={data.id} /> : null}
          {section === 'integracoes' ? <TenantIntegrations tenantId={data.id} /> : null}
          {section === 'webhooks' ? (
            <WebhooksSection
              events={WEBHOOK_EVENTS}
              tenantId={data.id}
              description="Eventos desta barbearia enviados para o n8n ou outros sistemas."
            />
          ) : null}
          {section === 'equipe' ? <InviteForm tenantId={data.id} /> : null}
          {section === 'logs' ? <LogsView tenantId={data.id} /> : null}
        </section>
      </div>
    </>
  );
}
