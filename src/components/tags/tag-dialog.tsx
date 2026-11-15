'use client';

import { type FormEvent, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { describeError } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { useSaveTag } from '@/lib/panel/queries';
import type { Tag, TagScope } from '@/lib/panel/types';
import { TagChip } from './tag-chip';

export const TAG_COLORS = [
  '#d62839',
  '#ea580c',
  '#b45309',
  '#15803d',
  '#0f766e',
  '#1e4fd8',
  '#7c3aed',
  '#be185d',
  '#64748b',
  '#18181b',
];

const SCOPES: { value: TagScope; label: string; hint: string }[] = [
  { value: 'ALL', label: 'Clientes e equipe', hint: 'Aparece nos dois cadastros' },
  { value: 'CUSTOMERS', label: 'Só clientes', hint: 'Ex.: VIP, mensalista' },
  { value: 'STAFF', label: 'Só equipe', hint: 'Ex.: aprendiz, especialista' },
];

export function TagDialog({ tag, onClose }: { tag: Tag | null; onClose: () => void }) {
  const save = useSaveTag();
  const [name, setName] = useState(tag?.name ?? '');
  const [color, setColor] = useState(tag?.color ?? TAG_COLORS[5] ?? '#1e4fd8');
  const [note, setNote] = useState(tag?.note ?? '');
  const [scope, setScope] = useState<TagScope>(tag?.scope ?? 'ALL');
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Dê um nome para a tag.');
      return;
    }
    setError(null);
    save.mutate(
      { id: tag?.id, body: { name: name.trim(), color, note: note.trim() || null, scope } },
      { onSuccess: onClose },
    );
  };

  const losing =
    tag &&
    ((scope === 'CUSTOMERS' && tag.staffCount > 0) ||
      (scope === 'STAFF' && tag.customersCount > 0));

  return (
    <Dialog
      open
      onClose={onClose}
      title={tag ? 'Editar tag' : 'Nova tag'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="tag-form" loading={save.isPending}>
            {tag ? 'Salvar' : 'Criar tag'}
          </Button>
        </>
      }
    >
      <form id="tag-form" onSubmit={submit} noValidate className="flex flex-col gap-5">
        <div className="grid place-items-center rounded-xl bg-surface-2 py-5">
          <TagChip tag={{ name: name.trim() || 'Nome da tag', color }} size="md" />
        </div>
        <Field label="Nome" htmlFor="tag-name" required>
          <Input
            id="tag-name"
            maxLength={30}
            placeholder="VIP"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
        </Field>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-medium">Cor</legend>
          <div className="flex flex-wrap items-center gap-2">
            {TAG_COLORS.map((swatch) => (
              <button
                key={swatch}
                type="button"
                aria-label={`Cor ${swatch}`}
                aria-pressed={color.toLowerCase() === swatch}
                onClick={() => setColor(swatch)}
                className={cn(
                  'size-8 rounded-full ring-offset-2 ring-offset-surface transition-shadow',
                  color.toLowerCase() === swatch
                    ? 'ring-2 ring-foreground'
                    : 'hover:ring-2 hover:ring-border',
                )}
                style={{ backgroundColor: swatch }}
              />
            ))}
            <label className="relative ml-1 flex items-center gap-2 text-xs text-muted">
              <input
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className="size-8 cursor-pointer rounded-full border border-border bg-transparent p-0"
                aria-label="Escolher outra cor"
              />
              Outra
            </label>
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-medium">Onde usar</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {SCOPES.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={scope === option.value}
                onClick={() => setScope(option.value)}
                className={cn(
                  'flex flex-col items-start rounded-lg border px-3 py-2 text-left text-sm',
                  scope === option.value
                    ? 'border-foreground bg-surface-2'
                    : 'border-border hover:bg-surface-2',
                )}
              >
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted">{option.hint}</span>
              </button>
            ))}
          </div>
          {losing ? (
            <p className="text-xs text-warning">
              Ao salvar, a tag sai de quem não faz mais parte desse grupo.
            </p>
          ) : null}
        </fieldset>
        <Field label="Observação" htmlFor="tag-note" hint="Aparece ao passar o mouse sobre a tag.">
          <Textarea
            id="tag-note"
            maxLength={500}
            placeholder="Para que serve essa tag"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
        {error ? <Alert>{error}</Alert> : null}
        {save.error ? <Alert>{describeError(save.error)}</Alert> : null}
      </form>
    </Dialog>
  );
}
