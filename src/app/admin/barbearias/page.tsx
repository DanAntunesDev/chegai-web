'use client';

import { ChevronRight, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useDeferredValue, useState } from 'react';
import { PageHeader } from '@/components/shell/app-shell';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { STATUS_LABEL, STATUS_TONE } from '@/lib/admin/labels';
import { useTenants } from '@/lib/admin/queries';
import { describeError } from '@/lib/api/errors';
import { TENANT_STATUSES, type TenantStatus } from '@/lib/api/types';
import { formatDate } from '@/lib/format';

export default function TenantsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TenantStatus | ''>('');
  const deferred = useDeferredValue(search.trim());
  const tenants = useTenants(deferred, status);

  return (
    <>
      <PageHeader
        title="Barbearias"
        description="Clientes da plataforma, plano e situação de cada um."
        actions={
          <Link href="/admin/barbearias/nova" className={buttonVariants()}>
            <Plus /> Nova barbearia
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Buscar por nome ou endereço"
            aria-label="Buscar barbearias"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          aria-label="Filtrar por situação"
          value={status}
          onChange={(event) => setStatus(event.target.value as TenantStatus | '')}
          className="sm:w-48"
        >
          <option value="">Todas as situações</option>
          {TENANT_STATUSES.map((item) => (
            <option key={item} value={item}>
              {STATUS_LABEL[item]}
            </option>
          ))}
        </Select>
      </div>

      {tenants.error ? <Alert>{describeError(tenants.error)}</Alert> : null}

      {tenants.isPending ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-18" />
          ))}
        </div>
      ) : tenants.data?.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="font-medium">Nenhuma barbearia encontrada</p>
          <p className="mt-1 text-sm text-muted">Cadastre a primeira para começar.</p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {tenants.data?.map((tenant) => (
            <li key={tenant.id}>
              <Link
                href={`/admin/barbearias/${tenant.id}`}
                className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-brand/40"
              >
                <span
                  aria-hidden
                  className="grid size-10 shrink-0 place-items-center rounded-lg font-display font-bold text-white"
                  style={{ background: tenant.branding?.primaryColor ?? '#D62839' }}
                >
                  {tenant.displayName.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{tenant.displayName}</span>
                    <Badge tone={STATUS_TONE[tenant.status]}>{STATUS_LABEL[tenant.status]}</Badge>
                  </div>
                  <p className="truncate text-sm text-muted">
                    /{tenant.slug} · {tenant.plan.name} · {tenant.unitsCount}{' '}
                    {tenant.unitsCount === 1 ? 'unidade' : 'unidades'}
                  </p>
                </div>
                <span className="hidden text-sm text-muted sm:block">
                  desde {formatDate(tenant.createdAt)}
                </span>
                <ChevronRight className="size-4 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
