'use client';

import { Building2, MapPin, Pencil, Phone, Plus } from 'lucide-react';
import { useState } from 'react';
import { UnitDialog } from '@/components/panel/unit-dialog';
import { PageHeader } from '@/components/shell/app-shell';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { describeError } from '@/lib/api/errors';
import { useDeleteUnit, useUnits } from '@/lib/panel/queries';
import type { Unit } from '@/lib/panel/types';
import { formatPhone } from '@/lib/phone';

function address(unit: Unit) {
  return [
    [unit.street, unit.number].filter(Boolean).join(', '),
    unit.district,
    unit.city && unit.state ? `${unit.city}/${unit.state}` : unit.city,
  ]
    .filter(Boolean)
    .join(' · ');
}

export default function UnitsPage() {
  const units = useUnits();
  const remove = useDeleteUnit();
  const [editing, setEditing] = useState<Unit | null>(null);
  const [open, setOpen] = useState(false);

  const openDialog = (unit: Unit | null) => {
    setEditing(unit);
    setOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Unidades"
        description="Endereços e regras de agendamento de cada unidade."
        actions={
          <Button onClick={() => openDialog(null)}>
            <Plus /> Nova unidade
          </Button>
        }
      />
      {units.error ? <Alert>{describeError(units.error)}</Alert> : null}
      {remove.error ? <Alert className="mb-3">{describeError(remove.error)}</Alert> : null}
      {units.isPending ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : units.data?.length === 0 ? (
        <EmptyState icon={Building2} title="Nenhuma unidade" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {units.data?.map((unit) => (
            <Card key={unit.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{unit.name}</h2>
                  <p className="text-xs text-muted">/{unit.slug}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => openDialog(unit)}>
                  <Pencil /> Editar
                </Button>
              </div>
              {address(unit) ? (
                <p className="flex items-start gap-2 text-sm text-muted">
                  <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden /> {address(unit)}
                </p>
              ) : null}
              {unit.phone ? (
                <p className="flex items-center gap-2 text-sm text-muted">
                  <Phone className="size-4" aria-hidden /> {formatPhone(unit.phone)}
                </p>
              ) : null}
              <dl className="grid grid-cols-3 gap-2 rounded-lg bg-surface-2 p-3 text-center text-xs">
                <div>
                  <dt className="text-muted">Intervalo</dt>
                  <dd className="font-semibold">{unit.slotIntervalMinutes} min</dd>
                </div>
                <div>
                  <dt className="text-muted">Agenda</dt>
                  <dd className="font-semibold">{unit.maxAdvanceDays} dias</dd>
                </div>
                <div>
                  <dt className="text-muted">Falta após</dt>
                  <dd className="font-semibold">{unit.noShowAfterMinutes} min</dd>
                </div>
              </dl>
              <div className="flex justify-end">
                <ConfirmButton
                  label="Excluir"
                  title={`Excluir ${unit.name}?`}
                  description="Os horários dos profissionais nessa unidade também saem."
                  onConfirm={() => remove.mutateAsync(unit.id)}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
      {open ? (
        <UnitDialog
          key={editing?.id ?? 'new'}
          unit={editing}
          open={open}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
