'use client';

import { Clock, ExternalLink, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { type PublicBooking, publicApi } from '@/lib/public/client';

export function remainingLabel(expiresAt: string, now: number) {
  const seconds = Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

export function DepositStep({
  slug,
  booking,
  when,
  onPaid,
  onExpired,
}: {
  slug: string;
  booking: PublicBooking & { payment: NonNullable<PublicBooking['payment']> };
  when: string;
  onPaid: () => void;
  onExpired: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const expired = new Date(booking.payment.expiresAt).getTime() <= now;

  useEffect(() => {
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const mine = await publicApi<PublicBooking[]>(`/v1/public/tenants/${slug}/bookings`);
        if (active && mine.some((item) => item.id === booking.id)) {
          onPaid();
        }
      } catch {
        return;
      }
    };
    const poll = setInterval(() => void check(), 4000);
    const onFocus = () => void check();
    window.addEventListener('focus', onFocus);
    return () => {
      active = false;
      clearInterval(poll);
      window.removeEventListener('focus', onFocus);
    };
  }, [slug, booking.id, onPaid]);

  if (expired) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-5 py-6 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-surface-2 text-muted">
          <Clock className="size-8" aria-hidden />
        </span>
        <div>
          <h2 className="font-[family-name:var(--font-sign)] text-3xl font-bold">
            O tempo da reserva acabou
          </h2>
          <p className="mt-2 text-muted">
            Sem o sinal, o horário foi liberado. Se você já pagou, ele será confirmado e aparece em
            Meus horários.
          </p>
        </div>
        <Button size="lg" className="h-12 rounded-xl" onClick={onExpired}>
          Escolher outro horário
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 py-4">
      <div className="text-center">
        <h2 className="font-[family-name:var(--font-sign)] text-4xl font-bold">Falta só o sinal</h2>
        <p className="mt-2 text-muted">
          Seu horário de {when} está reservado. Ele é confirmado assim que o pagamento cair.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-muted">Sinal para confirmar</span>
          <span className="text-3xl font-semibold tabular-nums">
            {formatMoney(booking.payment.amountCents)}
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-3 text-sm text-muted">
          <span>Restante, pago na barbearia</span>
          <span className="tabular-nums">
            {formatMoney(booking.totalPriceCents - booking.payment.amountCents)}
          </span>
        </div>
        <a
          href={booking.payment.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ size: 'lg' }), 'mt-5 h-14 w-full rounded-xl text-base')}
        >
          Pagar com Pix ou cartão <ExternalLink />
        </a>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
          <ShieldCheck className="size-3.5" aria-hidden /> Pagamento processado pelo Asaas
        </p>
      </div>
      <p className="text-center text-sm text-muted" role="status" aria-live="polite">
        <Spinner className="mr-2 inline size-4 align-[-3px]" />
        Aguardando o pagamento. Reserva válida por{' '}
        <span className="font-medium text-foreground tabular-nums">
          {remainingLabel(booking.payment.expiresAt, now)}
        </span>
      </p>
    </div>
  );
}
