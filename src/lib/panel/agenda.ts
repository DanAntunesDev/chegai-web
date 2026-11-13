export type BookingStatus =
  'HOLD' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW';

function parts(ms: number, timeZone: string) {
  const values = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
    .formatToParts(new Date(ms))
    .reduce<Record<string, number>>((acc, part) => {
      if (part.type !== 'literal') {
        acc[part.type] = Number(part.value);
      }
      return acc;
    }, {});
  return values as Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', number>;
}

function offsetAt(ms: number, timeZone: string): number {
  const p = parts(ms, timeZone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - ms;
}

export function zonedToUtc(date: string, time: string, timeZone: string): Date {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  const [hour, minute] = time.split(':').map(Number) as [number, number];
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const first = guess - offsetAt(guess, timeZone);
  return new Date(guess - offsetAt(first, timeZone));
}

export function localDateOf(value: Date | string, timeZone: string): string {
  const p = parts(new Date(value).getTime(), timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

export function minuteOfDay(value: Date | string, timeZone: string): number {
  const p = parts(new Date(value).getTime(), timeZone);
  return p.hour * 60 + p.minute;
}

export function timeLabel(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function weekdayOf(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

export function weekStart(date: string): string {
  const weekday = weekdayOf(date);
  return addDays(date, weekday === 0 ? -6 : 1 - weekday);
}

export function rangeFor(date: string, days: number, timeZone: string) {
  return {
    from: zonedToUtc(date, '00:00', timeZone).toISOString(),
    to: zonedToUtc(addDays(date, days), '00:00', timeZone).toISOString(),
  };
}

export const STATUS_LABEL: Record<BookingStatus, string> = {
  HOLD: 'Reservando',
  CONFIRMED: 'Confirmado',
  CHECKED_IN: 'Chegou',
  COMPLETED: 'Concluído',
  CANCELED: 'Cancelado',
  NO_SHOW: 'Faltou',
};

export const STATUS_STYLE: Record<BookingStatus, string> = {
  HOLD: 'border-dashed border-muted/60 bg-surface-2 text-muted',
  CONFIRMED: 'border-brand-2/40 bg-brand-2/12 text-foreground',
  CHECKED_IN: 'border-warning/50 bg-warning/15 text-foreground',
  COMPLETED: 'border-success/40 bg-success/12 text-foreground',
  CANCELED: 'border-border bg-surface-2 text-muted line-through',
  NO_SHOW: 'border-danger/40 bg-danger/10 text-foreground',
};

export const STATUS_DOT: Record<BookingStatus, string> = {
  HOLD: 'bg-muted',
  CONFIRMED: 'bg-brand-2',
  CHECKED_IN: 'bg-warning',
  COMPLETED: 'bg-success',
  CANCELED: 'bg-muted',
  NO_SHOW: 'bg-danger',
};

export function gridWindow(
  ranges: { start: number; end: number }[],
  fallback = { start: 8 * 60, end: 20 * 60 },
) {
  if (ranges.length === 0) {
    return fallback;
  }
  const start = Math.min(...ranges.map((item) => item.start));
  const end = Math.max(...ranges.map((item) => item.end));
  return { start: Math.floor(start / 60) * 60, end: Math.min(24 * 60, Math.ceil(end / 60) * 60) };
}
