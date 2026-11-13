'use client';

import { CalendarClock, Check, LogIn, MessageCircle, UserX, X } from 'lucide-react';
import { useState } from 'react';
import { useMe } from '@/components/auth/use-me';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { describeError } from '@/lib/api/errors';
import { formatDateTime, formatMoney } from '@/lib/format';
import { localDateOf, minuteOfDay, STATUS_LABEL, timeLabel } from '@/lib/panel/agenda';
import { type BookingAction, useBookingAction, useBookingEvents } from '@/lib/panel/queries';
import type { Booking } from '@/lib/panel/types';
import { formatPhone, whatsappLink } from '@/lib/phone';
import { type PickedSlot, SlotPicker } from './slot-picker';

const SOURCE: Record<Booking['source'], string> = {
  PANEL: 'Painel',
  PUBLIC: 'Link de agendamento',
  WHATSAPP: 'WhatsApp',
};

const TONE = {
  HOLD: 'neutral',
  CONFIRMED: 'info',
  CHECKED_IN: 'warning',
  COMPLETED: 'success',
  CANCELED: 'neutral',
  NO_SHOW: 'danger',
} as const;

type Mode = 'view' | 'cancel' | 'reschedule';

export function BookingDialog({
  booking,
  timezone,
  onClose,
}: {
  booking: Booking;
  timezone: string;
  onClose: () => void;
}) {
  const me = useMe();
  const action = useBookingAction();
  const events = useBookingEvents(booking.id);
  const [mode, setMode] = useState<Mode>('view');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(localDateOf(booking.startsAt, timezone));
  const [slot, setSlot] = useState<PickedSlot | null>(null);

  const permissions = me.data?.permissions ?? [];
  const canManage =
    permissions.includes('bookings.manage.any') || permissions.includes('bookings.manage.own');
  const active = booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN';

  const run = (name: BookingAction, body?: Record<string, unknown>) =>
    action.mutate({ id: booking.id, action: name, body }, { onSuccess: onClose });

  const start = timeLabel(minuteOfDay(booking.startsAt, timezone));
  const end = timeLabel(minuteOfDay(booking.endsAt, timezone));

  return (
    <Dialog
      open
      onClose={onClose}
      title={booking.customer?.name ?? 'Agendamento'}
      description={`${formatDateTime(booking.startsAt, timezone).split(' ')[0]} · ${start}–${end} com ${booking.staff.nickname || booking.staff.name}`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={TONE[booking.status]}>{STATUS_LABEL[booking.status]}</Badge>
          <Badge>{SOURCE[booking.source]}</Badge>
          {booking.customer ? (
            <a
              href={whatsappLink(booking.customer.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-sm text-success hover:underline"
            >
              <MessageCircle className="size-4" /> {formatPhone(booking.customer.phone)}
            </a>
          ) : null}
        </div>

        <ul className="divide-y divide-border rounded-lg border border-border">
          {booking.items.map((item) => (
            <li key={item.id} className="flex justify-between px-3 py-2 text-sm">
              <span>
                {item.name} <span className="text-muted">· {item.durationMinutes} min</span>
              </span>
              <span className="tabular-nums">{formatMoney(item.priceCents)}</span>
            </li>
          ))}
          <li className="flex justify-between px-3 py-2 text-sm font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatMoney(booking.totalPriceCents)}</span>
          </li>
        </ul>

        {booking.notes ? (
          <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm">{booking.notes}</p>
        ) : null}
        {booking.cancelReason ? (
          <p className="text-sm text-muted">Motivo do cancelamento: {booking.cancelReason}</p>
        ) : null}

        {canManage && mode === 'view' ? (
          <div className="flex flex-wrap gap-2">
            {booking.status === 'CONFIRMED' ? (
              <Button
                variant="secondary"
                loading={action.isPending}
                onClick={() => run('check-in')}
              >
                <LogIn /> Chegou
              </Button>
            ) : null}
            {active ? (
              <Button loading={action.isPending} onClick={() => run('complete')}>
                <Check /> Concluir
              </Button>
            ) : null}
            {booking.status === 'CONFIRMED' ? (
              <>
                <Button variant="outline" onClick={() => setMode('reschedule')}>
                  <CalendarClock /> Remarcar
                </Button>
                <Button variant="outline" loading={action.isPending} onClick={() => run('no-show')}>
                  <UserX /> Faltou
                </Button>
              </>
            ) : null}
            {active ? (
              <Button variant="ghost" className="text-danger" onClick={() => setMode('cancel')}>
                <X /> Cancelar
              </Button>
            ) : null}
          </div>
        ) : null}

        {mode === 'cancel' ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              run('cancel', reason.trim().length >= 2 ? { reason: reason.trim() } : {});
            }}
          >
            <Field label="Motivo (opcional)" htmlFor="cancel-reason">
              <Input
                id="cancel-reason"
                maxLength={300}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </Field>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setMode('view')}>
                Voltar
              </Button>
              <Button type="submit" variant="danger" loading={action.isPending}>
                Cancelar agendamento
              </Button>
            </div>
          </form>
        ) : null}

        {mode === 'reschedule' ? (
          <div className="flex flex-col gap-3">
            <Field label="Novo dia" htmlFor="reschedule-date">
              <Input
                id="reschedule-date"
                type="date"
                value={date}
                onChange={(event) => {
                  setSlot(null);
                  setDate(event.target.value);
                }}
              />
            </Field>
            <SlotPicker
              unitId={booking.unitId}
              date={date}
              serviceIds={booking.items.map((item) => item.serviceId)}
              staffId={booking.staffId}
              value={slot}
              onChange={setSlot}
            />
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setMode('view')}>
                Voltar
              </Button>
              <Button
                disabled={!slot}
                loading={action.isPending}
                onClick={() =>
                  slot && run('reschedule', { startsAt: slot.startsAt, staffId: booking.staffId })
                }
              >
                Remarcar para {slot?.time ?? '…'}
              </Button>
            </div>
          </div>
        ) : null}

        {action.error ? <Alert>{describeError(action.error)}</Alert> : null}

        {events.data && events.data.length > 0 ? (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted">Histórico</summary>
            <ol className="mt-2 flex flex-col gap-1">
              {events.data.map((event) => (
                <li key={event.id} className="flex justify-between gap-3 text-xs">
                  <span>
                    {STATUS_LABEL[event.toStatus as Booking['status']] ?? event.toStatus}
                    {event.reason === 'RESCHEDULED' ? ' (remarcado)' : ''}
                  </span>
                  <span className="text-muted">{formatDateTime(event.createdAt, timezone)}</span>
                </li>
              ))}
            </ol>
          </details>
        ) : null}
      </div>
    </Dialog>
  );
}
