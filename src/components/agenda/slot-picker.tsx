'use client';

import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { describeError } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { useAvailability } from '@/lib/panel/queries';

export interface PickedSlot {
  startsAt: string;
  time: string;
  staffId: string;
  staffName: string;
}

export function SlotPicker({
  unitId,
  date,
  serviceIds,
  staffId,
  value,
  onChange,
}: {
  unitId: string;
  date: string;
  serviceIds: string[];
  staffId: string;
  value: PickedSlot | null;
  onChange: (slot: PickedSlot) => void;
}) {
  const availability = useAvailability(unitId, date, serviceIds, staffId || undefined);

  if (serviceIds.length === 0) {
    return <p className="text-sm text-muted">Escolha os serviços para ver os horários.</p>;
  }
  if (availability.isPending) {
    return <Skeleton className="h-24" />;
  }
  if (availability.error) {
    return <Alert>{describeError(availability.error)}</Alert>;
  }
  const slots = availability.data.slots.filter((slot) => slot.staff.length > 0);
  if (slots.length === 0) {
    return <p className="text-sm text-muted">Nenhum horário livre nesse dia.</p>;
  }
  return (
    <div
      className="grid grid-cols-4 gap-2 sm:grid-cols-6"
      role="radiogroup"
      aria-label="Horários livres"
    >
      {slots.map((slot) => {
        const first = slot.staff[0]!;
        const selected = value?.startsAt === slot.startsAt;
        return (
          <button
            key={slot.startsAt}
            type="button"
            role="radio"
            aria-checked={selected}
            title={slot.staff.map((item) => item.name).join(', ')}
            onClick={() =>
              onChange({
                startsAt: slot.startsAt,
                time: slot.time,
                staffId: first.id,
                staffName: first.name,
              })
            }
            className={cn(
              'rounded-lg border px-2 py-2 text-sm font-medium tabular-nums transition-colors',
              selected
                ? 'border-brand bg-brand text-on-brand'
                : 'border-border hover:border-brand/50',
            )}
          >
            {slot.time}
          </button>
        );
      })}
    </div>
  );
}
