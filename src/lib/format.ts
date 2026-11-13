const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });

export function formatMoney(cents: number): string {
  return money.format(cents / 100);
}

export function formatPercent(ratio: number): string {
  return percent.format(ratio);
}

export function formatDate(value: string | Date, timeZone = 'America/Sao_Paulo'): string {
  const date =
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T12:00:00Z`)
      : new Date(value);
  return new Intl.DateTimeFormat('pt-BR', { timeZone, dateStyle: 'short' }).format(date);
}

export function formatDateTime(value: string | Date, timeZone = 'America/Sao_Paulo'): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function centsFromInput(value: string): number | null {
  const normalized = value
    .replace(/\s|R\$/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  return Math.round(Number(normalized) * 100);
}

export function currentMonth(now = new Date(), timeZone = 'America/Sao_Paulo'): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit' })
    .formatToParts(now)
    .reduce<Record<string, string>>((acc, part) => ({ ...acc, [part.type]: part.value }), {});
  return `${parts.year}-${parts.month}`;
}

export function shiftMonth(month: string, delta: number): string {
  const [year, value] = month.split('-').map(Number) as [number, number];
  const date = new Date(Date.UTC(year, value - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}
