'use client';

import { useState, useSyncExternalStore } from 'react';
import { CopyField } from '@/components/admin/copy-field';
import { IntegrationCard } from '@/components/admin/integrations/integration-card';
import { WebhooksSection } from '@/components/admin/integrations/webhooks-section';
import { PageHeader } from '@/components/shell/app-shell';
import { Alert } from '@/components/ui/alert';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs } from '@/components/ui/tabs';
import { INTEGRATION_DEFS, useIntegrations } from '@/lib/admin/integrations';
import { describeError } from '@/lib/api/errors';

type Section = 'apis' | 'webhooks';

const SECTIONS: { value: Section; label: string }[] = [
  { value: 'apis', label: 'APIs' },
  { value: 'webhooks', label: 'Webhooks e automações' },
];

export default function IntegrationsPage() {
  const integrations = useIntegrations();
  const [section, setSection] = useState<Section>('apis');
  const origin = useSyncExternalStore(
    () => () => undefined,
    () => window.location.origin,
    () => '',
  );

  return (
    <>
      <PageHeader
        title="Integrações da plataforma"
        description="Credenciais compartilhadas por todas as barbearias. O que é de cada barbearia fica na página dela, em Integrações."
      />
      <div className="mb-5">
        <Tabs
          label="Seções de integrações"
          items={SECTIONS}
          value={section}
          onValueChange={setSection}
        />
      </div>
      {integrations.isPending ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : integrations.error ? (
        <Alert>{describeError(integrations.error)}</Alert>
      ) : section === 'apis' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {INTEGRATION_DEFS.map((def) => (
            <IntegrationCard
              key={def.key}
              def={def}
              values={integrations.data.integrations[def.key]}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3">
            <div>
              <CardTitle>Webhook do Asaas</CardTitle>
              <CardDescription>
                Cadastre esse endereço no Asaas, com o mesmo token salvo na aba APIs, para os
                pagamentos serem baixados sozinhos.
              </CardDescription>
            </div>
            <CopyField label="URL" value={`${origin}/v1/webhooks/asaas`} />
          </Card>
          <WebhooksSection events={integrations.data.events} />
        </div>
      )}
    </>
  );
}
