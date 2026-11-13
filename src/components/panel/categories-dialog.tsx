'use client';

import { Check, Pencil, Trash2 } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { describeError } from '@/lib/api/errors';
import { useDeleteCategory, useSaveCategory } from '@/lib/panel/queries';
import type { Category } from '@/lib/panel/types';

export function CategoriesDialog({
  categories,
  open,
  onClose,
}: {
  categories: Category[];
  open: boolean;
  onClose: () => void;
}) {
  const save = useSaveCategory();
  const remove = useDeleteCategory();
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  const create = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (name.trim().length < 2) {
      return;
    }
    save.mutate(
      { body: { name: name.trim(), position: categories.length } },
      { onSuccess: () => setName('') },
    );
  };

  const error = save.error ?? remove.error;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Categorias"
      description="Agrupam os serviços na página de agendamento."
    >
      <div className="flex flex-col gap-4">
        <form onSubmit={create} className="flex gap-2">
          <Input
            aria-label="Nova categoria"
            placeholder="Ex.: Tratamentos"
            maxLength={60}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Button type="submit" loading={save.isPending && !editing}>
            Adicionar
          </Button>
        </form>
        {error ? <Alert>{describeError(error)}</Alert> : null}
        <ul className="divide-y divide-border">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center gap-2 py-2">
              {editing?.id === category.id ? (
                <form
                  className="flex flex-1 gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (editing.name.trim().length >= 2) {
                      save.mutate(
                        { id: category.id, body: { name: editing.name.trim() } },
                        { onSuccess: () => setEditing(null) },
                      );
                    }
                  }}
                >
                  <Input
                    aria-label="Nome da categoria"
                    value={editing.name}
                    autoFocus
                    onChange={(event) => setEditing({ id: category.id, name: event.target.value })}
                  />
                  <Button type="submit" size="icon" aria-label="Salvar categoria">
                    <Check />
                  </Button>
                </form>
              ) : (
                <>
                  <span className="flex-1 text-sm">{category.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Renomear ${category.name}`}
                    onClick={() => setEditing({ id: category.id, name: category.name })}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Excluir ${category.name}`}
                    className="text-danger"
                    onClick={() => remove.mutate(category.id)}
                  >
                    <Trash2 />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Dialog>
  );
}
