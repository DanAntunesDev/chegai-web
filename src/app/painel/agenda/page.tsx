'use client';

import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BookingDialog } from '@/components/agenda/booking-dialog';
import { DayGrid, useNowMinute } from '@/components/agenda/day-grid';
import { DayList } from '@/components/agenda/day-list';
import { NewBookingDialog } from '@/components/agenda/new-booking-dialog';
import { WeekView } from '@/components/agenda/week-view';
import { PageHeader } from '@/components/shell/app-shell';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs } from '@/components/ui/tabs';
import { describeError } from '@/lib/api/errors';
import { formatMoney } from '@/lib/format';
import {
  addDays,
  gridWindow,
  localDateOf,
  minuteOfDay,
  rangeFor,
  STATUS_DOT,
  STATUS_LABEL,
  weekStart,
} from '@/lib/panel/agenda';
import { useBookings, useStaffList, useUnits } from '@/lib/panel/queries';
import type { Booking } from '@/lib/panel/types';

type View = 'dia' | 'semana';

const DAY_TITLE = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

export default function AgendaPage() {
  const units = useUnits();
  const staff = useStaffList();
  const [unitChoice, setUnitChoice] = useState('');
  const unit = units.data?.find((item) => item.id === unitChoice) ?? units.data?.[0];
  const timezone = unit?.timezone ?? 'America/Sao_Paulo';
  const today = localDateOf(new Date(), timezone);
  const [date, setDate] = useState(today);
  const [view, setView] = useState<View>('dia');
  const [showCanceled, setShowCanceled] = useState(false);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [creating, setCreating] = useState<{ staffId?: string } | null>(null);

  const start = view === 'dia' ? date : weekStart(date);
  const range = rangeFor(start, view === 'dia' ? 1 : 7, timezone);
  const bookings = useBookings(range.from, range.to, unit?.id ?? '');
  const nowMinute = useNowMinute(timezone, view === 'dia' && date === today);

  const visible = useMemo(
    () =>
      (bookings.data ?? []).filter(
        (booking) => showCanceled || (booking.status !== 'CANCELED' && booking.status !== 'HOLD'),
      ),
    [bookings.data, showCanceled],
  );

  const columns = useMemo(
    () =>
      (staff.data ?? []).filter(
        (member) =>
          member.units.some((item) => item.unitId === unit?.id) &&
          (member.kind === 'BARBER' || visible.some((booking) => booking.staffId === member.id)) &&
          (member.isActive || visible.some((booking) => booking.staffId === member.id)),
      ),
    [staff.data, unit?.id, visible],
  );

  const bookedWindow = gridWindow(
    visible.map((booking) => ({
      start: minuteOfDay(booking.startsAt, timezone),
      end: minuteOfDay(booking.endsAt, timezone),
    })),
  );
  const fullWindow = {
    start: Math.min(bookedWindow.start, 8 * 60),
    end: Math.max(bookedWindow.end, 20 * 60),
  };

  const revenue = visible
    .filter((booking) => booking.status !== 'CANCELED' && booking.status !== 'NO_SHOW')
    .reduce((sum, booking) => sum + booking.totalPriceCents, 0);

  const step = view === 'dia' ? 1 : 7;
  const title =
    view === 'dia'
      ? DAY_TITLE.format(new Date(`${date}T12:00:00Z`))
      : `Semana de ${
          DAY_TITLE.format(new Date(`${start}T12:00:00Z`))
            .split(',')[1]
            ?.trim() ?? start
        }`;

  return (
    <>
      <PageHeader
        title="Agenda"
        description={`${visible.filter((booking) => booking.status !== 'CANCELED').length} horários · ${formatMoney(revenue)} previstos`}
        actions={
          <Button onClick={() => setCreating({})} disabled={!unit}>
            <Plus /> Agendar
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Anterior"
            onClick={() => setDate(addDays(date, -step))}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Próximo"
            onClick={() => setDate(addDays(date, step))}
          >
            <ChevronRight />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDate(today)}
            disabled={date === today}
          >
            Hoje
          </Button>
          <label className="relative">
            <span className="sr-only">Escolher dia</span>
            <input
              type="date"
              value={date}
              onChange={(event) => event.target.value && setDate(event.target.value)}
              onClick={(event) => event.currentTarget.showPicker?.()}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            <span className="pointer-events-none inline-flex items-center gap-2 text-base font-semibold first-letter:uppercase">
              <CalendarDays className="size-4 text-muted" aria-hidden /> {title}
            </span>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {units.data && units.data.length > 1 ? (
            <Select
              aria-label="Unidade"
              value={unit?.id ?? ''}
              onChange={(event) => setUnitChoice(event.target.value)}
              className="w-44"
            >
              {units.data.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          ) : null}
          <Switch
            id="show-canceled"
            label="Cancelados"
            checked={showCanceled}
            onCheckedChange={setShowCanceled}
          />
          <div className="w-40">
            <Tabs
              label="Visualização"
              items={[
                { value: 'dia', label: 'Dia' },
                { value: 'semana', label: 'Semana' },
              ]}
              value={view}
              onValueChange={setView}
            />
          </div>
        </div>
      </div>

      <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="Legenda">
        {(['CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'NO_SHOW'] as const).map((status) => (
          <li key={status} className="flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${STATUS_DOT[status]}`} aria-hidden />{' '}
            {STATUS_LABEL[status]}
          </li>
        ))}
      </ul>

      {bookings.error ? <Alert>{describeError(bookings.error)}</Alert> : null}

      {bookings.isPending || staff.isPending || units.isPending ? (
        <Skeleton className="h-96" />
      ) : view === 'semana' ? (
        <WeekView
          start={start}
          today={today}
          bookings={visible}
          timezone={timezone}
          onSelect={setSelected}
          onPickDay={(day) => {
            setDate(day);
            setView('dia');
          }}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <DayGrid
              staff={columns}
              bookings={visible}
              window={fullWindow}
              timezone={timezone}
              nowMinute={nowMinute}
              onSelect={setSelected}
              onCreate={(staffId) => setCreating({ staffId })}
            />
            <p className="mt-2 text-xs text-muted">
              Dica: clique duas vezes num espaço livre para agendar com aquele profissional.
            </p>
          </div>
          <div className="md:hidden">
            <DayList
              staff={columns}
              bookings={visible}
              timezone={timezone}
              onSelect={setSelected}
            />
          </div>
        </>
      )}

      {selected ? (
        <BookingDialog
          key={selected.id}
          booking={selected}
          timezone={timezone}
          onClose={() => setSelected(null)}
        />
      ) : null}
      {creating && unit ? (
        <NewBookingDialog
          open
          onClose={() => setCreating(null)}
          unitId={unit.id}
          date={date}
          staff={staff.data ?? []}
          initialStaffId={creating.staffId}
        />
      ) : null}
    </>
  );
}
