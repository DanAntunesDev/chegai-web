'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';

export interface DayPoint {
  date: string;
  revenueCents: number;
  completedBookings: number;
}

const DAY = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

function niceMax(value: number) {
  if (value <= 0) {
    return 10000;
  }
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((item) => item * magnitude >= value) ?? 10;
  return step * magnitude;
}

export function RevenueChart({ days, today }: { days: DayPoint[]; today: string }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(...days.map((day) => day.revenueCents), 0));
  const ticks = [max, max / 2, 0];
  const focused = active === null ? null : days[active];

  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold">Faturamento por dia</span>
        <span className="text-xs text-muted" aria-live="polite">
          {focused
            ? `${DAY.format(new Date(`${focused.date}T12:00:00Z`))} · ${formatMoney(focused.revenueCents)} · ${focused.completedBookings} atendimentos`
            : 'Passe o mouse ou toque nas barras'}
        </span>
      </figcaption>
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <div
          className="flex h-48 flex-col justify-between text-right text-[11px] text-muted tabular-nums"
          aria-hidden
        >
          {ticks.map((tick) => (
            <span key={tick} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {formatMoney(tick).replace(',00', '')}
            </span>
          ))}
        </div>
        <div className="relative h-48">
          <div aria-hidden className="absolute inset-0 flex flex-col justify-between">
            {ticks.map((tick) => (
              <div key={tick} className="border-t border-border/70" />
            ))}
          </div>
          <div
            className="absolute inset-0 flex items-end gap-[2px]"
            onMouseLeave={() => setActive(null)}
            role="list"
            aria-label="Faturamento diário"
          >
            {days.map((day, index) => {
              const height = (day.revenueCents / max) * 100;
              const isFuture = day.date > today;
              return (
                <button
                  key={day.date}
                  type="button"
                  role="listitem"
                  aria-label={`${day.date.slice(8)}: ${formatMoney(day.revenueCents)}`}
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                  onClick={() => setActive(index)}
                  className="group relative flex h-full flex-1 items-end focus-visible:outline-none"
                >
                  <span
                    className={cn(
                      'block w-full rounded-t-[4px] transition-colors',
                      isFuture ? 'bg-surface-2' : 'bg-brand-2/75',
                      active === index && 'bg-brand-2',
                      'group-focus-visible:ring-2 group-focus-visible:ring-brand-2',
                    )}
                    style={{ height: `${Math.max(height, day.revenueCents > 0 ? 2 : 0)}%` }}
                  />
                </button>
              );
            })}
          </div>
        </div>
        <span />
        <div className="flex justify-between text-[11px] text-muted tabular-nums" aria-hidden>
          <span>{days[0]?.date.slice(8)}</span>
          <span>{days[Math.floor(days.length / 2)]?.date.slice(8)}</span>
          <span>{days.at(-1)?.date.slice(8)}</span>
        </div>
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer text-muted">Ver em tabela</summary>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr className="text-muted">
              <th className="py-1 font-medium">Dia</th>
              <th className="py-1 text-right font-medium">Atendimentos</th>
              <th className="py-1 text-right font-medium">Faturamento</th>
            </tr>
          </thead>
          <tbody>
            {days
              .filter((day) => day.revenueCents > 0)
              .map((day) => (
                <tr key={day.date} className="border-t border-border">
                  <td className="py-1">{DAY.format(new Date(`${day.date}T12:00:00Z`))}</td>
                  <td className="py-1 text-right tabular-nums">{day.completedBookings}</td>
                  <td className="py-1 text-right tabular-nums">{formatMoney(day.revenueCents)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
