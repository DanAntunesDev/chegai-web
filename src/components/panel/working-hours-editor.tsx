'use client';

import { Copy, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { describeError } from '@/lib/api/errors';
import { useSaveWorkingHours } from '@/lib/panel/queries';
import {
  copyDay,
  formatHours,
  scheduleProblem,
  sortIntervals,
  WEEKDAYS,
  weeklyMinutes,
} from '@/lib/panel/schedule';
import type { StaffDetail, Unit, WorkingInterval } from '@/lib/panel/types';

const ORDER = [1, 2, 3, 4, 5, 6, 0];

export function WorkingHoursEditor({ staff, units }: { staff: StaffDetail; units: Unit[] }) {
  const save = useSaveWorkingHours(staff.id);
  const staffUnits = units.filter((unit) => staff.units.some((item) => item.unitId === unit.id));
  const [unitId, setUnitId] = useState(staffUnits[0]?.id ?? '');
  const [intervals, setIntervals] = useState<WorkingInterval[]>(() =>
    sortIntervals(
      staff.workingHours.map(({ unitId: unit, weekday, start, end }) => ({
        unitId: unit,
        weekday,
        start,
        end,
      })),
    ),
  );
  const [problem, setProblem] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const update = (next: WorkingInterval[]) => {
    setIntervals(next);
    setSaved(false);
  };

  const indexed = intervals.map((interval, index) => ({ interval, index }));

  const submit = () => {
    const found = scheduleProblem(intervals);
    setProblem(found);
    if (!found) {
      save.mutate(intervals, { onSuccess: () => setSaved(true) });
    }
  };

  if (staffUnits.length === 0) {
    return (
      <Alert tone="info">Associe o profissional a uma unidade antes de montar o expediente.</Alert>
    );
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {formatHours(weeklyMinutes(intervals.filter((item) => item.unitId === unitId)))} por
          semana
          {staffUnits.length > 1 ? ' nesta unidade' : ''}
        </p>
        {staffUnits.length > 1 ? (
          <Select
            aria-label="Unidade"
            value={unitId}
            onChange={(event) => setUnitId(event.target.value)}
            className="w-56"
          >
            {staffUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </Select>
        ) : null}
      </div>

      <ul className="flex flex-col divide-y divide-border">
        {ORDER.map((weekday) => {
          const items = indexed.filter(
            ({ interval }) => interval.unitId === unitId && interval.weekday === weekday,
          );
          return (
            <li key={weekday} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start">
              <span className="w-24 shrink-0 pt-2 text-sm font-medium">{WEEKDAYS[weekday]}</span>
              <div className="flex flex-1 flex-col gap-2">
                {items.length === 0 ? <span className="pt-2 text-sm text-muted">Folga</span> : null}
                {items.map(({ interval, index }) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="time"
                      aria-label={`Início ${WEEKDAYS[weekday]}`}
                      value={interval.start}
                      onChange={(event) =>
                        update(
                          intervals.map((item, position) =>
                            position === index ? { ...item, start: event.target.value } : item,
                          ),
                        )
                      }
                      className="w-32"
                    />
                    <span className="text-muted">até</span>
                    <Input
                      type="time"
                      aria-label={`Fim ${WEEKDAYS[weekday]}`}
                      value={interval.end}
                      onChange={(event) =>
                        update(
                          intervals.map((item, position) =>
                            position === index ? { ...item, end: event.target.value } : item,
                          ),
                        )
                      }
                      className="w-32"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remover intervalo"
                      onClick={() => update(intervals.filter((_, position) => position !== index))}
                    >
                      <X />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-1 sm:pt-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const last = items.at(-1)?.interval;
                    update(
                      sortIntervals([
                        ...intervals,
                        last
                          ? {
                              unitId,
                              weekday,
                              start: last.end,
                              end: last.end < '19:00' ? '19:00' : '23:59',
                            }
                          : { unitId, weekday, start: '09:00', end: '18:00' },
                      ]),
                    );
                  }}
                >
                  <Plus /> Intervalo
                </Button>
                {items.length > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Copiar para os outros dias com expediente igual"
                    onClick={() => update(copyDay(intervals, unitId, weekday, [1, 2, 3, 4, 5, 6]))}
                  >
                    <Copy /> Seg a sáb
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {problem ? <Alert>{problem}</Alert> : null}
      {save.error ? <Alert>{describeError(save.error)}</Alert> : null}
      {saved ? <Alert tone="success">Expediente salvo.</Alert> : null}
      <Button onClick={submit} loading={save.isPending} className="w-fit">
        Salvar expediente
      </Button>
    </Card>
  );
}
