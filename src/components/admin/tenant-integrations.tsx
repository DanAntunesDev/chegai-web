'use client';

import { IntegrationForm } from '@/components/admin/integrations/integration-card';
import { TenantPaymentsPanel } from '@/components/admin/tenant-payments-panel';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  type IntegrationDefinition,
  type IntegrationValues,
  TENANT_INTEGRATION_DEFS,
  type TenantIntegrationKey,
  useSaveTenantIntegration,
  useTenantIntegrations,
  useTestTenantIntegration,
} from '@/lib/admin/integrations';
import { describeError } from '@/lib/api/errors';

function TenantIntegrationCard({
  tenantId,
  def,
  values,
}: {
  tenantId: string;
  def: IntegrationDefinition<TenantIntegrationKey>;
  values: IntegrationValues | undefined;
}) {
  const save = useSaveTenantIntegration(tenantId, def.key);
  const test = useTestTenantIntegration(tenantId, def.key);
  return <IntegrationForm def={def} values={values} save={save} test={test} />;
}

export function TenantIntegrations({ tenantId }: { tenantId: string }) {
  const integrations = useTenantIntegrations(tenantId);

  if (integrations.isPending) {
    return (
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (integrations.error) {
    return <Alert>{describeError(integrations.error)}</Alert>;
  }

  return (
    <div className="grid items-start gap-4 xl:grid-cols-2">
      <TenantPaymentsPanel tenantId={tenantId} />
      {TENANT_INTEGRATION_DEFS.map((def) => (
        <TenantIntegrationCard
          key={def.key}
          tenantId={tenantId}
          def={def}
          values={integrations.data[def.key].values}
        />
      ))}
    </div>
  );
}
