'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { PageHeader } from '@/components/shell/app-shell';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs } from '@/components/ui/tabs';
import { STATUS_LABEL, STATUS_TONE } from '@/lib/admin/labels';
import { usePlans } from '@/lib/admin/queries';
import { api } from '@/lib/api';
import { describeError } from '@/lib/api/errors';
import { TENANT_STATUSES, type TenantStatus } from '@/lib/api/types';
import { formatMoney } from '@/lib/format';
import { addDays } from '@/lib/panel/agenda';

interface Metrics {
  tenants: {
    total: number;
    byStatus: Record<TenantStatus, number>;
    mrrCents: number;
    newInPeriod: number;
  };
  bookings: {
    completed: number;
    gmvCents: number;
    canceled: number;
    noShow: number;
    bySource: { PUBLIC: number; WHATSAPP: number; PANEL: number };
  };
  billing: { paidCents: number; overdueCount: number; overdueCents: number };
  daily: { date: string; completedBookings: number; gmvCents: number }[];
  topTenants: {
    id: string;
    displayName: string;
    status: TenantStatus;
    plan: string;
    completedBookings: number;
    gmvCents: number;
  }[];
}

type Preset = '7' | '30' | 'mes' | 'custom';

const today = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());

function rangeFor(preset: Preset, custom: { from: string; to: string }) {
  const end = today();
  if (preset === '7') return { from: addDays(end, -6), to: end };
  if (preset === '30') return { from: addDays(end, -29), to: end };
  if (preset === 'mes') return { from: `${end.slice(0, 7)}-01`, to: end };
  return custom;
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </Card>
  );
}

export default function AdminDashboard() {
  const plans = usePlans();
  const [preset, setPreset] = useState<Preset>('30');
  const [custom, setCustom] = useState({ from: addDays(today(), -29), to: today() });
  const [status, setStatus] = useState<TenantStatus | ''>('');
  const [planCode, setPlanCode] = useState('');
  const range = rangeFor(preset, custom);
  const validRange = range.from <= range.to;

  const metrics = useQuery({
    queryKey: ['admin', 'metrics', range.from, range.to, status, planCode],
    queryFn: () =>
      api<Metrics>('/v1/admin/metrics', {
        query: { ...range, status: status || undefined, planCode: planCode || undefined },
      }),
    enabled: validRange,
    placeholderData: (previous) => previous,
  });
  const data = metrics.data;
  const totalSource = data
    ? data.bookings.bySource.PUBLIC + data.bookings.bySource.WHATSAPP + data.bookings.bySource.PANEL
    : 0;

  return (
    <>
      <PageHeader title="Dashboard" description="Como a plataforma está indo." />

      <Card className="mb-6 flex flex-col gap-4 p-4 lg:flex-row lg:items-end">
        <div className="w-full lg:w-96">
          <span className="mb-1.5 block text-sm font-medium">Período</span>
          <Tabs
            label="Período"
            value={preset}
            onValueChange={setPreset}
            items={[
              { value: '7', label: '7 dias' },
              { value: '30', label: '30 dias' },
              { value: 'mes', label: 'Este mês' },
              { value: 'custom', label: 'Outro' },
            ]}
          />
        </div>
        {preset === 'custom' ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="De" htmlFor="metrics-from">
              <Input
                id="metrics-from"
                type="date"
                value={custom.from}
                onChange={(event) => setCustom((value) => ({ ...value, from: event.target.value }))}
              />
            </Field>
            <Field label="Até" htmlFor="metrics-to">
              <Input
                id="metrics-to"
                type="date"
                value={custom.to}
                onChange={(event) => setCustom((value) => ({ ...value, to: event.target.value }))}
              />
            </Field>
          </div>
        ) : null}
        <Field label="Situação" htmlFor="metrics-status" className="lg:w-48">
          <Select
            id="metrics-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as TenantStatus | '')}
          >
            <option value="">Todas</option>
            {TENANT_STATUSES.map((item) => (
              <option key={item} value={item}>
                {STATUS_LABEL[item]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Plano" htmlFor="metrics-plan" className="lg:w-48">
          <Select
            id="metrics-plan"
            value={planCode}
            onChange={(event) => setPlanCode(event.target.value)}
          >
            <option value="">Todos</option>
            {plans.data?.map((plan) => (
              <option key={plan.id} value={plan.code}>
                {plan.name}
              </option>
            ))}
          </Select>
        </Field>
      </Card>

      {!validRange ? (
        <Alert className="mb-4">A data inicial precisa ser antes da final.</Alert>
      ) : null}
      {metrics.error ? <Alert className="mb-4">{describeError(metrics.error)}</Alert> : null}

      {!data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Receita recorrente (MRR)"
              value={formatMoney(data.tenants.mrrCents)}
              hint="Ativas e em atraso"
            />
            <Stat
              label="Barbearias"
              value={String(data.tenants.total)}
              hint={`${data.tenants.newInPeriod} novas no período`}
            />
            <Stat label="Recebido no período" value={formatMoney(data.billing.paidCents)} />
            <Stat
              label="Inadimplência"
              value={formatMoney(data.billing.overdueCents)}
              hint={`${data.billing.overdueCount} faturas vencidas`}
            />
            <Stat
              label="Atendimentos concluídos"
              value={data.bookings.completed.toLocaleString('pt-BR')}
            />
            <Stat label="Movimentado nas barbearias" value={formatMoney(data.bookings.gmvCents)} />
            <Stat label="Cancelamentos" value={data.bookings.canceled.toLocaleString('pt-BR')} />
            <Stat label="Faltas" value={data.bookings.noShow.toLocaleString('pt-BR')} />
          </section>

          <section className="grid gap-3 lg:grid-cols-[2fr_1fr]">
            <Card>
              <RevenueChart
                title="Movimentado por dia"
                today={today()}
                days={data.daily.map((day) => ({
                  date: day.date,
                  revenueCents: day.gmvCents,
                  completedBookings: day.completedBookings,
                }))}
              />
            </Card>
            <Card className="flex flex-col gap-5">
              <div>
                <h2 className="mb-3 text-sm font-semibold">Barbearias por situação</h2>
                <ul className="flex flex-col gap-2">
                  {TENANT_STATUSES.map((item) => (
                    <li key={item} className="flex items-center justify-between text-sm">
                      <Badge tone={STATUS_TONE[item]}>{STATUS_LABEL[item]}</Badge>
                      <span className="font-semibold tabular-nums">
                        {data.tenants.byStatus[item]}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="mb-3 text-sm font-semibold">De onde vêm os agendamentos</h2>
                <ul className="flex flex-col gap-3">
                  {(
                    [
                      ['PUBLIC', 'Link de agendamento'],
                      ['WHATSAPP', 'WhatsApp'],
                      ['PANEL', 'Painel'],
                    ] as const
                  ).map(([key, label]) => {
                    const value = data.bookings.bySource[key];
                    const share = totalSource ? Math.round((value / totalSource) * 100) : 0;
                    return (
                      <li key={key} className="flex flex-col gap-1 text-sm">
                        <span className="flex justify-between">
                          <span>{label}</span>
                          <span className="tabular-nums">
                            {value} <span className="text-muted">· {share}%</span>
                          </span>
                        </span>
                        <span className="h-1.5 rounded-full bg-surface-2" aria-hidden>
                          <span
                            className="block h-1.5 rounded-full bg-foreground/70"
                            style={{ width: `${share}%` }}
                          />
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Card>
          </section>

          <Card className="p-0">
            <h2 className="px-5 pt-4 pb-2 text-sm font-semibold">
              Barbearias que mais movimentaram
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th className="px-5 py-2 font-medium">Barbearia</th>
                    <th className="px-5 py-2 font-medium">Plano</th>
                    <th className="px-5 py-2 font-medium">Situação</th>
                    <th className="px-5 py-2 text-right font-medium">Atendimentos</th>
                    <th className="px-5 py-2 text-right font-medium">Movimentado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topTenants.map((tenant) => (
                    <tr key={tenant.id} className="border-t border-border">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/barbearias/${tenant.id}`}
                          className="font-medium hover:underline"
                        >
                          {tenant.displayName}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-muted">{tenant.plan}</td>
                      <td className="px-5 py-3">
                        <Badge tone={STATUS_TONE[tenant.status]}>
                          {STATUS_LABEL[tenant.status]}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {tenant.completedBookings}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {formatMoney(tenant.gmvCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
