'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { describeError } from '@/lib/api/errors';
import { formatMoney } from '@/lib/format';
import { minuteOfDay, timeLabel } from '@/lib/panel/agenda';
import { type PublicBooking, publicApi } from '@/lib/public/client';
import { clearCustomerSession } from '@/lib/public/session';
import { AccountAccess } from './account-access';
import { useCustomerSession } from './use-customer-session';

export function MyBookings({ slug, timezone }: { slug: string; timezone: string }) {
  const base = `/v1/public/tenants/${slug}`;
  const [bookings, setBookings] = useState<PublicBooking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const session = useCustomerSession(slug);

  const load = useCallback(async () => {
    try {
      setBookings(await publicApi<PublicBooking[]>(`${base}/bookings`));
    } catch (failure) {
      clearCustomerSession(slug);
      setBookings(null);
      setError(describeError(failure));
    }
  }, [base, slug]);

  useEffect(() => {
    if (session) {
      const frame = requestAnimationFrame(() => void load());
      return () => cancelAnimationFrame(frame);
    }
  }, [session, load]);

  const cancel = async (id: string) => {
    setBusy(id);
    setError(null);
    try {
      await publicApi(`${base}/bookings/${id}/cancel`, { method: 'POST' });
      await load();
    } catch (failure) {
      setError(describeError(failure));
    } finally {
      setBusy(null);
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col gap-3">
        {error ? <Alert>{error}</Alert> : null}
        <AccountAccess slug={slug} />
      </div>
    );
  }
  if (!bookings) {
    return <p className="py-8 text-center text-sm text-muted">Carregando…</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center justify-between text-sm text-muted">
        <span>
          Olá, <strong className="text-foreground">{session.customer.name}</strong>
        </span>
        <button
          type="button"
          className="hover:text-foreground"
          onClick={() => clearCustomerSession(slug)}
        >
          Sair
        </button>
      </p>
      {error ? <Alert>{error}</Alert> : null}
      {bookings.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">Você não tem horários marcados.</p>
      ) : null}
      {bookings.map((booking) => (
        <div
          key={booking.id}
          className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium first-letter:uppercase">
              {new Intl.DateTimeFormat('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                timeZone: timezone,
              }).format(new Date(booking.startsAt))}{' '}
              · {timeLabel(minuteOfDay(booking.startsAt, timezone))}
            </p>
            <p className="text-sm text-muted">
              {booking.items.map((item) => item.name).join(' + ')} com {booking.staff.name} ·{' '}
              {formatMoney(booking.totalPriceCents)}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            loading={busy === booking.id}
            onClick={() => void cancel(booking.id)}
          >
            Cancelar
          </Button>
        </div>
      ))}
    </div>
  );
}
