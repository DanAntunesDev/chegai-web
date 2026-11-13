'use client';

import { ExternalLink } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { INVOICE_LABEL, INVOICE_TONE } from '@/lib/admin/labels';
import { useStartSubscription, useTenantBilling } from '@/lib/admin/queries';
import { describeError } from '@/lib/api/errors';
import type { BillingSummary } from '@/lib/api/types';
import { formatDate, formatMoney } from '@/lib/format';

export function InvoiceList({
  invoices,
  onPay,
}: {
  invoices: BillingSummary['invoices'];
  onPay?: (invoice: BillingSummary['invoices'][number]) => void;
}) {
  if (invoices.length === 0) {
    return <p className="text-sm text-muted">Nenhuma fatura emitida ainda.</p>;
  }
  return (
    <ul className="divide-y divide-border">
      {invoices.map((invoice) => (
        <li key={invoice.id} className="flex flex-wrap items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{invoice.description}</p>
            <p className="text-xs text-muted">
              Vence em {formatDate(invoice.dueDate)}
              {invoice.paidAt ? ` · paga em ${formatDate(invoice.paidAt)}` : ''}
            </p>
          </div>
          <span className="text-sm font-semibold tabular-nums">
            {formatMoney(invoice.amountCents)}
          </span>
          <Badge tone={INVOICE_TONE[invoice.status]}>{INVOICE_LABEL[invoice.status]}</Badge>
          {onPay && (invoice.status === 'PENDING' || invoice.status === 'OVERDUE') ? (
            <Button size="sm" onClick={() => onPay(invoice)}>
              Pagar com Pix
            </Button>
          ) : invoice.paymentUrl && invoice.status !== 'PAID' ? (
            <a
              href={invoice.paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-2 hover:underline"
            >
              Pagar <ExternalLink className="size-3.5" aria-hidden />
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function BillingPanel({ tenantId }: { tenantId: string }) {
  const billing = useTenantBilling(tenantId);
  const start = useStartSubscription(tenantId);
  const [billingDay, setBillingDay] = useState('10');
  const [chargeSetupFee, setChargeSetupFee] = useState(true);
  const dayNumber = Number(billingDay);
  const validDay = Number.isInteger(dayNumber) && dayNumber >= 1 && dayNumber <= 28;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validDay) {
      start.mutate({ billingDay: dayNumber, chargeSetupFee });
    }
  };

  if (billing.isPending) {
    return <Skeleton className="h-48" />;
  }
  if (billing.error) {
    return <Alert>{describeError(billing.error)}</Alert>;
  }

  const subscription = billing.data.subscription;

  return (
    <div className="flex flex-col gap-4">
      {subscription ? (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Assinatura ativa</CardTitle>
            <CardDescription>
              Cobrança todo dia {subscription.billingDay}, desde{' '}
              {formatDate(subscription.startedAt)}.
            </CardDescription>
          </div>
          {subscription.canceledAt ? <Badge tone="neutral">Cancelada</Badge> : null}
        </Card>
      ) : (
        <Card>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <CardTitle>Iniciar assinatura</CardTitle>
              <CardDescription>
                As faturas são geradas no Asaas 7 dias antes do vencimento e vão por e-mail.
              </CardDescription>
            </div>
            <Field
              label="Dia do vencimento"
              htmlFor="billingDay"
              error={validDay ? undefined : 'Escolha um dia entre 1 e 28.'}
              className="max-w-40"
            >
              <Input
                id="billingDay"
                type="number"
                min={1}
                max={28}
                value={billingDay}
                onChange={(event) => setBillingDay(event.target.value)}
              />
            </Field>
            <Switch
              id="chargeSetupFee"
              label="Cobrar taxa de implantação"
              checked={chargeSetupFee}
              onCheckedChange={setChargeSetupFee}
            />
            {start.error ? <Alert>{describeError(start.error)}</Alert> : null}
            <Button type="submit" loading={start.isPending} disabled={!validDay} className="w-fit">
              Iniciar assinatura
            </Button>
          </form>
        </Card>
      )}

      <Card>
        <CardTitle className="mb-2">Faturas</CardTitle>
        <InvoiceList invoices={billing.data.invoices} />
      </Card>
    </div>
  );
}
