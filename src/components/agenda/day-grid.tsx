'use client';

import { useEffect, useRef, useState } from 'react';
import { canDrag, minuteOfDay, snapMinute, timeLabel } from '@/lib/panel/agenda';
import type { Booking, ScheduleBlock, Staff } from '@/lib/panel/types';
import { BookingCard } from './booking-card';

const PX_PER_MINUTE = 1.6;

interface DayGridProps {
  staff: Staff[];
  bookings: Booking[];
  window: { start: number; end: number };
  timezone: string;
  nowMinute: number | null;
  blocks?: Record<string, ScheduleBlock[]>;
  dayStart?: string;
  dayEnd?: string;
  onSelect: (booking: Booking) => void;
  onCreate: (staffId: string, minute: number) => void;
  onMove?: (booking: Booking, staffId: string, minute: number) => void;
}

const BLOCK_LABEL: Record<ScheduleBlock['kind'], string> = {
  DAY_OFF: 'Folga',
  VACATION: 'Férias',
  BREAK: 'Pausa',
  BLOCK: 'Bloqueado',
};

export function DayGrid({
  staff,
  bookings,
  window,
  timezone,
  nowMinute,
  blocks = {},
  dayStart,
  dayEnd,
  onSelect,
  onCreate,
  onMove,
}: DayGridProps) {
  const [dragging, setDragging] = useState<Booking | null>(null);
  const [hover, setHover] = useState<{ staffId: string; minute: number } | null>(null);
  const dragOffset = useRef(0);
  const clampMinute = (iso: string, edge: 'start' | 'end') => {
    if (edge === 'start' && dayStart && iso < dayStart) {
      return window.start;
    }
    if (edge === 'end' && dayEnd && iso > dayEnd) {
      return window.end;
    }
    return minuteOfDay(iso, timezone);
  };
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
            onDragOver={(event) => {
              if (!dragging) {
                return;
              }
              event.preventDefault();
              const rect = event.currentTarget.getBoundingClientRect();
              const offset = event.clientY - rect.top - dragOffset.current;
              const minute = snapMinute(offset, window.start, PX_PER_MINUTE);
              if (hover?.staffId !== member.id || hover.minute !== minute) {
                setHover({ staffId: member.id, minute });
              }
            }}
            onDragLeave={() => setHover(null)}
            onDrop={(event) => {
              event.preventDefault();
              if (dragging && hover) {
                onMove?.(dragging, hover.staffId, hover.minute);
              }
              setDragging(null);
              setHover(null);
            }}
          >
            {(blocks[member.id] ?? []).map((block) => {
              const start = Math.max(window.start, clampMinute(block.startsAt, 'start'));
              const end = Math.min(window.end, clampMinute(block.endsAt, 'end'));
              if (end <= start) {
                return null;
              }
              return (
                <div
                  key={block.id}
                  className="pointer-events-none absolute inset-x-0 flex items-start justify-end bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,var(--surface-2)_6px,var(--surface-2)_12px)] p-1 text-[10px] font-medium text-muted"
                  style={{
                    top: (start - window.start) * PX_PER_MINUTE,
                    height: (end - start) * PX_PER_MINUTE,
                  }}
                >
                  {block.reason || BLOCK_LABEL[block.kind]}
                </div>
              );
            })}
            {dragging && hover?.staffId === member.id ? (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-1 z-20 rounded-lg border-2 border-dashed border-brand bg-brand/10 px-2 text-xs font-semibold text-brand"
                style={{
                  top: (hover.minute - window.start) * PX_PER_MINUTE,
                  height:
                    (minuteOfDay(dragging.endsAt, timezone) -
                      minuteOfDay(dragging.startsAt, timezone)) *
                    PX_PER_MINUTE,
                }}
              >
                {timeLabel(hover.minute)}
              </div>
            ) : null}
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
                const movable = Boolean(onMove) && canDrag(booking.status);
                return (
                  <div
                    key={booking.id}
                    className={`absolute inset-x-1 ${movable ? 'cursor-grab active:cursor-grabbing' : ''} ${dragging?.id === booking.id ? 'opacity-40' : ''}`}
                    style={{ top: top + 1, height: blockHeight }}
                    draggable={movable}
                    onDragStart={(event) => {
                      dragOffset.current =
                        event.clientY - event.currentTarget.getBoundingClientRect().top;
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', booking.id);
                      setDragging(booking);
                    }}
                    onDragEnd={() => {
                      setDragging(null);
                      setHover(null);
                    }}
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
