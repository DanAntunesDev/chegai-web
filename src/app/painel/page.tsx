'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/shell/app-shell';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { ApiError, describeError } from '@/lib/api/errors';
import type { AnalyticsSummary } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { currentMonth, formatMoney, shiftMonth } from '@/lib/format';

const MONTH = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });

function monthLabel(month: string) {
  return MONTH.format(new Date(`${month}-01T12:00:00Z`));
}

function Change({ value, inverse = false }: { value: number | null; inverse?: boolean }) {
  if (value === null) {
    return <span className="text-xs text-muted">sem base no mês anterior</span>;
  }
  if (value === 0) {
    return <span className="text-xs text-muted">igual ao mês anterior</span>;
  }
  const good = inverse ? value < 0 : value > 0;
  const Icon = value > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium',
        good ? 'text-success' : 'text-danger',
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {Math.abs(value).toLocaleString('pt-BR')}% vs mês anterior
    </span>
  );
}

export default function OverviewPage() {
  const [month, setMonth] = useState(() => currentMonth());
  const summary = useQuery({
    queryKey: ['analytics', month],
    queryFn: () => api<AnalyticsSummary>('/v1/analytics/summary', { query: { month } }),
  });
  const isCurrent = month === currentMonth();

  const data = summary.data;
  const tiles = data
    ? [
        {
          label: 'Faturamento',
          value: formatMoney(data.current.revenueCents),
          change: data.change.revenue,
        },
        {
          label: 'Atendimentos',
          value: data.current.completedBookings.toLocaleString('pt-BR'),
          change: data.change.completedBookings,
        },
        {
          label: 'Ticket médio',
          value: formatMoney(data.current.averageTicketCents),
          change: data.change.averageTicket,
        },
        {
          label: 'Ocupação da agenda',
          value: `${data.current.occupancyRate.toLocaleString('pt-BR')}%`,
          change: data.change.occupancy,
        },
        {
          label: 'Faltas',
          value: `${data.current.noShowRate.toLocaleString('pt-BR')}%`,
          change: data.change.noShow,
          inverse: true,
        },
        {
          label: 'Clientes novos',
          value: data.current.newCustomers.toLocaleString('pt-BR'),
          change: null,
          hideChange: true,
        },
      ]
    : [];

  return (
    <>
      <PageHeader
        title="Visão geral"
        description="Como a barbearia está indo no mês."
        actions={
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              aria-label="Mês anterior"
              onClick={() => setMonth((value) => shiftMonth(value, -1))}
            >
              <ChevronLeft />
            </Button>
            <span className="min-w-36 text-center text-sm font-medium capitalize">
              {monthLabel(month)}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Próximo mês"
              disabled={isCurrent}
              onClick={() => setMonth((value) => shiftMonth(value, 1))}
            >
              <ChevronRight />
            </Button>
          </div>
        }
      />

      {summary.error ? (
        <Alert>
          {summary.error instanceof ApiError && summary.error.code === 'PERMISSION_DENIED'
            ? 'Seu papel não tem acesso aos números da barbearia.'
            : describeError(summary.error)}
        </Alert>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {summary.isPending
          ? [0, 1, 2, 3, 4, 5].map((item) => <Skeleton key={item} className="h-28" />)
          : tiles.map((tile) => (
              <Card key={tile.label} className="flex flex-col gap-1 p-4">
                <span className="text-sm text-muted">{tile.label}</span>
                <span className="font-display text-2xl font-bold tabular-nums sm:text-3xl">
                  {tile.value}
                </span>
                {tile.hideChange ? null : <Change value={tile.change} inverse={tile.inverse} />}
              </Card>
            ))}
      </div>
      {data ? (
        <p className="mt-4 text-xs text-muted">
          {data.current.canceledBookings.toLocaleString('pt-BR')} cancelamentos no mês.
        </p>
      ) : null}
    </>
  );
}
