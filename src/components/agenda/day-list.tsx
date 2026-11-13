'use client';

import { useState } from 'react';
import { Tabs } from '@/components/ui/tabs';
import { formatMoney } from '@/lib/format';
import { minuteOfDay, STATUS_DOT, STATUS_LABEL, timeLabel } from '@/lib/panel/agenda';
import type { Booking, Staff } from '@/lib/panel/types';
import { cn } from '@/lib/cn';

export function DayList({
  staff,
  bookings,
  timezone,
  onSelect,
}: {
  staff: Staff[];
  bookings: Booking[];
  timezone: string;
  onSelect: (booking: Booking) => void;
}) {
  const [staffId, setStaffId] = useState('all');
  const items = [
    { value: 'all', label: 'Todos' },
    ...staff.map((member) => ({ value: member.id, label: member.nickname || member.name })),
  ];
  const visible = bookings.filter((booking) => staffId === 'all' || booking.staffId === staffId);

  return (
    <div className="flex flex-col gap-3">
      <Tabs label="Profissional" items={items} value={staffId} onValueChange={setStaffId} />
      {visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">Nenhum horário marcado.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((booking) => (
            <li key={booking.id}>
              <button
                type="button"
                onClick={() => onSelect(booking)}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left"
              >
                <span className="w-12 shrink-0 text-center">
                  <span className="block font-display text-base font-semibold tabular-nums">
                    {timeLabel(minuteOfDay(booking.startsAt, timezone))}
                  </span>
                  <span className="text-[11px] text-muted tabular-nums">
                    {timeLabel(minuteOfDay(booking.endsAt, timezone))}
                  </span>
                </span>
                <span
                  className={cn('h-10 w-1 shrink-0 rounded-full', STATUS_DOT[booking.status])}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block truncate font-medium',
                      booking.status === 'CANCELED' && 'line-through',
                    )}
                  >
                    {booking.customer?.name ?? 'Sem cliente'}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {booking.items.map((item) => item.name).join(' + ')}
                    {staffId === 'all' ? ` · ${booking.staff.nickname || booking.staff.name}` : ''}
                  </span>
                </span>
                <span className="text-right text-xs">
                  <span className="block font-semibold tabular-nums">
                    {formatMoney(booking.totalPriceCents)}
                  </span>
                  <span className="text-muted">{STATUS_LABEL[booking.status]}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
