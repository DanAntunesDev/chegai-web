'use client';

import { Check, Copy, ExternalLink, Link2, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { describeError } from '@/lib/api/errors';
import { formatDateTime, formatMoney } from '@/lib/format';
import {
  type BookingPayment,
  depositCents,
  KIND_LABEL,
  type PaymentKind,
  paymentMessage,
  useCreatePaymentLink,
  usePaymentSettings,
  usePaymentSummary,
  whatsappMessageLink,
} from '@/lib/panel/payments';

const STATUS = {
  PENDING: { label: 'Aguardando', tone: 'warning' },
  PAID: { label: 'Pago', tone: 'success' },
  CANCELED: { label: 'Cancelado', tone: 'neutral' },
} as const;

function whenLabel(startsAt: string, timezone: string) {
  const date = new Date(startsAt);
  const day = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    timeZone: timezone,
  }).format(date);
  const time = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  }).format(date);
  return `${day} às ${time}`;
}

interface PaymentPanelProps {
  booking: {
    id: string;
    startsAt: string;
    totalPriceCents: number;
    customer: { name: string; phone: string } | null;
  };
  timezone: string;
  canCharge: boolean;
}

export function PaymentPanel({ booking, timezone, canCharge }: PaymentPanelProps) {
  const { session } = useAuth();
  const summary = usePaymentSummary(booking.id);
  const settings = usePaymentSettings();
  const create = useCreatePaymentLink(booking.id);
  const [copied, setCopied] = useState<string | null>(null);

  if (summary.isPending) {
    return <Skeleton className="h-24" />;
  }

  const data = summary.data;
  const payments = data?.payments ?? [];
  const paid = data?.paidCents ?? 0;
  const due = data?.dueCents ?? booking.totalPriceCents;
  const percent = settings.data?.depositPercent ?? 50;
  const pending = payments.filter((payment) => payment.status === 'PENDING');

  const message = (payment: BookingPayment) =>
    paymentMessage({
      customerName: booking.customer?.name,
      shopName: session?.tenant?.displayName,
      when: whenLabel(booking.startsAt, timezone),
      kind: payment.kind,
      amountCents: payment.amountCents,
      url: payment.paymentUrl ?? '',
    });

  const copy = async (payment: BookingPayment) => {
    await navigator.clipboard.writeText(message(payment));
    setCopied(payment.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const options: { kind: PaymentKind; amount: number; label: string }[] =
    paid > 0
      ? [{ kind: 'REMAINDER', amount: due, label: `Restante · ${formatMoney(due)}` }]
      : [
          {
            kind: 'DEPOSIT',
            amount: depositCents(booking.totalPriceCents, percent),
            label: `Sinal de ${percent}% · ${formatMoney(depositCents(booking.totalPriceCents, percent))}`,
          },
          {
            kind: 'FULL',
            amount: booking.totalPriceCents,
            label: `Valor total · ${formatMoney(booking.totalPriceCents)}`,
          },
        ];
  const available = options.filter(
    (option) => option.amount >= 500 && !pending.some((payment) => payment.kind === option.kind),
  );

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">Pagamento</h3>
        <span className="text-sm text-muted tabular-nums">
          {paid > 0 ? `${formatMoney(paid)} pago · ` : ''}
          {due > 0 ? `${formatMoney(due)} em aberto` : 'Quitado'}
        </span>
      </div>

      {payments.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {payments.map((payment) => (
            <li key={payment.id} className="flex flex-col gap-2 rounded-md bg-surface-2 px-3 py-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{KIND_LABEL[payment.kind]}</span>
                <span className="tabular-nums">{formatMoney(payment.amountCents)}</span>
                <Badge tone={STATUS[payment.status].tone} className="ml-auto">
                  {STATUS[payment.status].label}
                </Badge>
              </div>
              {payment.status === 'PAID' && payment.paidAt ? (
                <p className="text-xs text-muted">
                  Pago em {formatDateTime(payment.paidAt, timezone)}
                </p>
              ) : null}
              {payment.status === 'PENDING' && payment.paymentUrl ? (
                <div className="flex flex-wrap gap-2">
                  {booking.customer ? (
                    <Button
                      size="sm"
                      onClick={() =>
                        window.open(
                          whatsappMessageLink(booking.customer?.phone ?? '', message(payment)),
                          '_blank',
                          'noopener,noreferrer',
                        )
                      }
                    >
                      <MessageCircle /> Enviar no WhatsApp
                    </Button>
                  ) : null}
                  <Button size="sm" variant="outline" onClick={() => copy(payment)}>
                    {copied === payment.id ? <Check /> : <Copy />}
                    {copied === payment.id ? 'Copiado' : 'Copiar mensagem'}
                  </Button>
                  <a
                    href={payment.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 self-center text-xs text-muted hover:text-foreground"
                  >
                    <ExternalLink className="size-3.5" /> Abrir link
                  </a>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">
          Gere um link de Pix ou cartão e mande para o cliente pelo WhatsApp.
        </p>
      )}

      {canCharge && due > 0 && available.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {available.map((option) => (
            <Button
              key={option.kind}
              size="sm"
              variant={option.kind === 'FULL' ? 'outline' : 'secondary'}
              loading={create.isPending && create.variables === option.kind}
              disabled={create.isPending}
              onClick={() => create.mutate(option.kind)}
            >
              <Link2 /> {option.label}
            </Button>
          ))}
        </div>
      ) : null}

      {create.error ? <Alert>{describeError(create.error)}</Alert> : null}
    </section>
  );
}
