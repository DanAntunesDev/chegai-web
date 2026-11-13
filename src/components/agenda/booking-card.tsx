import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';
import { minuteOfDay, STATUS_LABEL, STATUS_STYLE, timeLabel } from '@/lib/panel/agenda';
import type { Booking } from '@/lib/panel/types';

export function BookingCard({
  booking,
  timezone,
  compact = false,
  style,
  onSelect,
}: {
  booking: Booking;
  timezone: string;
  compact?: boolean;
  style?: CSSProperties;
  onSelect: (booking: Booking) => void;
}) {
  const start = minuteOfDay(booking.startsAt, timezone);
  const end = minuteOfDay(booking.endsAt, timezone);
  const services = booking.items.map((item) => item.name).join(' + ');
  return (
    <button
      type="button"
      onClick={() => onSelect(booking)}
      style={style}
      title={`${timeLabel(start)}–${timeLabel(end)} · ${booking.customer?.name ?? 'Sem cliente'} · ${services} · ${STATUS_LABEL[booking.status]}`}
      className={cn(
        'flex w-full flex-col overflow-hidden rounded-lg border px-2 py-1 text-left text-xs transition-shadow hover:shadow-md focus-visible:z-10',
        STATUS_STYLE[booking.status],
      )}
    >
      <span className="truncate font-semibold">{booking.customer?.name ?? 'Sem cliente'}</span>
      {compact ? null : (
        <span className="truncate text-[11px] opacity-80">
          {timeLabel(start)} · {services}
        </span>
      )}
    </button>
  );
}
