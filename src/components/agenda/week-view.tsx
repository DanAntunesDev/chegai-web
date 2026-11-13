import { cn } from '@/lib/cn';
import {
  addDays,
  localDateOf,
  minuteOfDay,
  STATUS_DOT,
  timeLabel,
  weekdayOf,
} from '@/lib/panel/agenda';
import { WEEKDAYS_SHORT } from '@/lib/panel/schedule';
import type { Booking } from '@/lib/panel/types';

export function WeekView({
  start,
  today,
  bookings,
  timezone,
  onSelect,
  onPickDay,
}: {
  start: string;
  today: string;
  bookings: Booking[];
  timezone: string;
  onSelect: (booking: Booking) => void;
  onPickDay: (date: string) => void;
}) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  return (
    <div className="grid gap-2 md:grid-cols-7">
      {days.map((date) => {
        const items = bookings.filter(
          (booking) => localDateOf(booking.startsAt, timezone) === date,
        );
        return (
          <section
            key={date}
            className={cn(
              'flex min-h-32 flex-col gap-1.5 rounded-xl border border-border bg-surface p-2',
              date === today && 'border-brand/50',
            )}
          >
            <button
              type="button"
              onClick={() => onPickDay(date)}
              className="flex items-baseline justify-between rounded-md px-1 text-left hover:bg-surface-2"
            >
              <span className="text-xs font-medium text-muted uppercase">
                {WEEKDAYS_SHORT[weekdayOf(date)]}
              </span>
              <span
                className={cn('font-display text-lg font-semibold', date === today && 'text-brand')}
              >
                {date.slice(8)}
              </span>
            </button>
            {items.length === 0 ? <span className="px-1 text-xs text-muted">Livre</span> : null}
            {items.map((booking) => (
              <button
                key={booking.id}
                type="button"
                onClick={() => onSelect(booking)}
                className="flex items-center gap-1.5 rounded-md px-1 py-0.5 text-left text-xs hover:bg-surface-2"
              >
                <span
                  className={cn('size-2 shrink-0 rounded-full', STATUS_DOT[booking.status])}
                  aria-hidden
                />
                <span className="text-muted tabular-nums">
                  {timeLabel(minuteOfDay(booking.startsAt, timezone))}
                </span>
                <span className={cn('truncate', booking.status === 'CANCELED' && 'line-through')}>
                  {booking.customer?.name ?? 'Sem cliente'}
                </span>
              </button>
            ))}
          </section>
        );
      })}
    </div>
  );
}
