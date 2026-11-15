'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { InvoiceList } from '@/components/admin/billing-panel';
import { PixDialog } from '@/components/panel/pix-dialog';
import { PageHeader } from '@/components/shell/app-shell';
import { Alert } from '@/components/ui/alert';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { describeError } from '@/lib/api/errors';
import type { BillingSummary, Invoice } from '@/lib/api/types';
import { formatDate } from '@/lib/format';

export default function SubscriptionPage() {
  const billing = useQuery({
    queryKey: ['tenant', 'billing'],
    queryFn: () => api<BillingSummary>('/v1/tenant/billing'),
  });
  const overdue = billing.data?.invoices.some((invoice) => invoice.status === 'OVERDUE');
  const [paying, setPaying] = useState<Invoice | null>(null);

  return (
    <>
      <PageHeader title="Assinatura" description="Faturas do Chegaí para a sua barbearia." />
      {billing.isPending ? <Skeleton className="h-48" /> : null}
      {billing.error ? <Alert>{describeError(billing.error)}</Alert> : null}
      {billing.data ? (
        <div className="flex flex-col gap-4">
          {overdue ? (
            <Alert>Há fatura vencida. Pague para evitar a suspensão do acesso.</Alert>
          ) : null}
          <Card>
            <CardTitle>
              {billing.data.subscription
                ? `Vencimento todo dia ${billing.data.subscription.billingDay}`
                : 'Assinatura ainda não iniciada'}
            </CardTitle>
            {billing.data.subscription ? (
              <CardDescription>
                Cliente desde {formatDate(billing.data.subscription.startedAt)}.
              </CardDescription>
            ) : null}
          </Card>
          <Card>
            <CardTitle className="mb-2">Faturas</CardTitle>
            <InvoiceList invoices={billing.data.invoices} onPay={setPaying} />
          </Card>
        </div>
      ) : null}
      {paying ? <PixDialog invoice={paying} onClose={() => setPaying(null)} /> : null}
    </>
  );
}
