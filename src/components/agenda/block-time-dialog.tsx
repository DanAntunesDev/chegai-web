'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';
import { describeError } from '@/lib/api/errors';
import { toMinutes } from '@/lib/panel/schedule';
import { zonedToUtc } from '@/lib/panel/agenda';
import type { Staff } from '@/lib/panel/types';

export function BlockTimeDialog({
  staff,
  date,
  timezone,
  onClose,
}: {
  staff: Staff[];
  date: string;
  timezone: string;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [staffId, setStaffId] = useState(staff[0]?.id ?? '');
  const [day, setDay] = useState(date);
  const [start, setStart] = useState('12:00');
  const [end, setEnd] = useState('13:00');
  const [reason, setReason] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      api(`/v1/staff/${staffId}/blocks`, {
        method: 'POST',
        body: {
          kind: 'BLOCK',
          startsAt: zonedToUtc(day, start, timezone).toISOString(),
          endsAt: zonedToUtc(day, end, timezone).toISOString(),
          reason: reason.trim() || undefined,
        },
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['panel', 'staff', staffId, 'blocks'] });
      onClose();
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!staffId || toMinutes(start) >= toMinutes(end)) {
      setProblem('O fim precisa ser depois do início.');
      return;
    }
    setProblem(null);
    create.mutate();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Bloquear horário"
      description="O horário some da agenda online e do WhatsApp."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="block-time-form" loading={create.isPending}>
            Bloquear
          </Button>
        </>
      }
    >
      <form id="block-time-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Profissional" htmlFor="block-staff" className="sm:col-span-2">
          <Select
            id="block-staff"
            value={staffId}
            onChange={(event) => setStaffId(event.target.value)}
          >
            {staff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.nickname || member.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Dia" htmlFor="block-day" className="sm:col-span-2">
          <Input
            id="block-day"
            type="date"
            value={day}
            onChange={(event) => setDay(event.target.value)}
          />
        </Field>
        <Field label="Das" htmlFor="block-from">
          <Input
            id="block-from"
            type="time"
            step={900}
            value={start}
            onChange={(event) => setStart(event.target.value)}
          />
        </Field>
        <Field label="Até" htmlFor="block-to">
          <Input
            id="block-to"
            type="time"
            step={900}
            value={end}
            onChange={(event) => setEnd(event.target.value)}
          />
        </Field>
        <Field label="Motivo (opcional)" htmlFor="block-why" className="sm:col-span-2">
          <Input
            id="block-why"
            maxLength={200}
            placeholder="Almoço, médico…"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
        {problem ? <Alert className="sm:col-span-2">{problem}</Alert> : null}
        {create.error ? (
          <Alert className="sm:col-span-2">{describeError(create.error)}</Alert>
        ) : null}
      </form>
    </Dialog>
  );
}
