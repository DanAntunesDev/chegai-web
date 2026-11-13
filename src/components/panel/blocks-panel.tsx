'use client';

import { CalendarOff, Trash2 } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { describeError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/format';
import { useBlocks, useCreateBlock, useDeleteBlock } from '@/lib/panel/queries';
import type { BlockKind } from '@/lib/panel/types';

const KIND: Record<BlockKind, string> = {
  DAY_OFF: 'Folga',
  VACATION: 'Férias',
  BREAK: 'Pausa',
  BLOCK: 'Bloqueio',
};

function dayRange() {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 90);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function BlocksPanel({ staffId }: { staffId: string }) {
  const [range] = useState(dayRange);
  const blocks = useBlocks(staffId, range.from, range.to);
  const create = useCreateBlock(staffId);
  const remove = useDeleteBlock(staffId);
  const [kind, setKind] = useState<BlockKind>('DAY_OFF');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [reason, setReason] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (
      !startsAt ||
      !endsAt ||
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start >= end
    ) {
      setProblem('O fim precisa ser depois do início.');
      return;
    }
    setProblem(null);
    create.mutate(
      {
        kind,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        reason: reason.trim() || undefined,
      },
      {
        onSuccess: () => {
          setStartsAt('');
          setEndsAt('');
          setReason('');
        },
      },
    );
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card className="flex flex-col gap-3">
        <CardTitle>Próximos 90 dias</CardTitle>
        {blocks.error ? <Alert>{describeError(blocks.error)}</Alert> : null}
        {blocks.data?.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <CalendarOff className="size-4" aria-hidden /> Nenhuma folga ou bloqueio marcado.
          </p>
        ) : null}
        <ul className="flex flex-col divide-y divide-border">
          {blocks.data?.map((block) => (
            <li key={block.id} className="flex items-center gap-3 py-2">
              <Badge tone="warning">{KIND[block.kind]}</Badge>
              <span className="flex-1 text-sm">
                {formatDateTime(block.startsAt)} → {formatDateTime(block.endsAt)}
                {block.reason ? (
                  <span className="block text-xs text-muted">{block.reason}</span>
                ) : null}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remover"
                className="text-danger"
                onClick={() => remove.mutate(block.id)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <CardTitle>Marcar ausência</CardTitle>
          <Field label="Tipo" htmlFor="block-kind">
            <Select
              id="block-kind"
              value={kind}
              onChange={(event) => setKind(event.target.value as BlockKind)}
            >
              {Object.entries(KIND).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Início" htmlFor="block-start">
            <Input
              id="block-start"
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
            />
          </Field>
          <Field label="Fim" htmlFor="block-end">
            <Input
              id="block-end"
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
            />
          </Field>
          <Field label="Motivo (opcional)" htmlFor="block-reason">
            <Input
              id="block-reason"
              maxLength={200}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </Field>
          {problem ? <Alert>{problem}</Alert> : null}
          {create.error ? <Alert>{describeError(create.error)}</Alert> : null}
          <Button type="submit" loading={create.isPending}>
            Marcar
          </Button>
        </form>
      </Card>
    </div>
  );
}
