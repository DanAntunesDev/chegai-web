import { formatMoney } from '@/lib/format';

export interface StaffPoint {
  staffId: string;
  name: string;
  revenueCents: number;
  completedBookings: number;
}

export function StaffRanking({ staff }: { staff: StaffPoint[] }) {
  const max = Math.max(...staff.map((item) => item.revenueCents), 1);
  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="text-sm font-semibold">Faturamento por barbeiro</figcaption>
      {staff.length === 0 ? (
        <p className="text-sm text-muted">Nenhum atendimento concluído no mês.</p>
      ) : null}
      <ol className="flex flex-col gap-3">
        {staff.map((item) => (
          <li key={item.staffId} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium">{item.name}</span>
              <span className="tabular-nums">
                {formatMoney(item.revenueCents)}
                <span className="ml-1 text-xs text-muted">· {item.completedBookings}</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-2" aria-hidden>
              <div
                className="h-2 rounded-full bg-brand-2/80"
                style={{ width: `${(item.revenueCents / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ol>
    </figure>
  );
}
