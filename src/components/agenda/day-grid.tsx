'use client';

import { useEffect, useState } from 'react';
import { minuteOfDay, timeLabel } from '@/lib/panel/agenda';
import type { Booking, Staff } from '@/lib/panel/types';
import { BookingCard } from './booking-card';

const PX_PER_MINUTE = 1.6;

interface DayGridProps {
  staff: Staff[];
  bookings: Booking[];
  window: { start: number; end: number };
  timezone: string;
  nowMinute: number | null;
  onSelect: (booking: Booking) => void;
  onCreate: (staffId: string, minute: number) => void;
}

export function DayGrid({
  staff,
  bookings,
  window,
  timezone,
  nowMinute,
  onSelect,
  onCreate,
}: DayGridProps) {
  const height = (window.end - window.start) * PX_PER_MINUTE;
  const hours: number[] = [];
  for (let minute = window.start; minute < window.end; minute += 60) {
    hours.push(minute);
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <div
        className="grid min-w-fit"
        style={{ gridTemplateColumns: `56px repeat(${staff.length}, minmax(168px, 1fr))` }}
      >
        <div className="sticky top-0 left-0 z-20 border-b border-border bg-surface" />
        {staff.map((member) => (
          <div
            key={member.id}
            className="sticky top-0 z-10 border-b border-l border-border bg-surface px-3 py-2 text-sm font-semibold"
          >
            {member.nickname || member.name}
          </div>
        ))}

        <div className="sticky left-0 z-10 bg-surface" style={{ height }}>
          {hours.map((minute) => (
            <span
              key={minute}
              className={`absolute pl-2 text-[11px] text-muted tabular-nums ${minute === window.start ? 'translate-y-0.5' : '-translate-y-2'}`}
              style={{ top: (minute - window.start) * PX_PER_MINUTE }}
            >
              {timeLabel(minute)}
            </span>
          ))}
        </div>

        {staff.map((member) => (
          <div
            key={member.id}
            className="relative border-l border-border"
            style={{ height }}
            onDoubleClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const minute = window.start + (event.clientY - rect.top) / PX_PER_MINUTE;
              onCreate(member.id, Math.floor(minute / 15) * 15);
            }}
          >
            {hours.map((minute) => (
              <div
                key={minute}
                aria-hidden
                className="absolute inset-x-0 border-t border-border/60"
                style={{ top: (minute - window.start) * PX_PER_MINUTE }}
              />
            ))}
            {bookings
              .filter((booking) => booking.staffId === member.id)
              .map((booking) => {
                const start = Math.max(window.start, minuteOfDay(booking.startsAt, timezone));
                const end = Math.min(window.end, minuteOfDay(booking.endsAt, timezone));
                const top = (start - window.start) * PX_PER_MINUTE;
                const blockHeight = Math.max(22, (end - start) * PX_PER_MINUTE - 2);
                return (
                  <div
                    key={booking.id}
                    className="absolute inset-x-1"
                    style={{ top: top + 1, height: blockHeight }}
                  >
                    <BookingCard
                      booking={booking}
                      timezone={timezone}
                      compact={blockHeight < 40}
                      style={{ height: '100%' }}
                      onSelect={onSelect}
                    />
                  </div>
                );
              })}
            {nowMinute !== null && nowMinute >= window.start && nowMinute <= window.end ? (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-brand"
                style={{ top: (nowMinute - window.start) * PX_PER_MINUTE }}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function useNowMinute(timezone: string, active: boolean): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!active) {
      return;
    }
    const tick = () => setNow(minuteOfDay(new Date(), timezone));
    tick();
    const timer = setInterval(tick, 60_000);
    return () => {
      clearInterval(timer);
      setNow(null);
    };
  }, [timezone, active]);
  return active ? now : null;
}
