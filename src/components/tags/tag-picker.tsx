'use client';

import { Check, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { useTags } from '@/lib/panel/queries';
import type { TagScope } from '@/lib/panel/types';

export function TagPicker({
  value,
  onChange,
  target,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  target: Exclude<TagScope, 'ALL'>;
}) {
  const tags = useTags();
  const available = (tags.data ?? []).filter((tag) => tag.scope === 'ALL' || tag.scope === target);

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 flex w-full items-center justify-between text-sm font-medium">
        Tags
        <Link
          href="/barbearia/tags"
          className="inline-flex items-center gap-1 text-xs font-normal text-muted hover:text-foreground"
        >
          <Settings2 className="size-3.5" /> Gerenciar
        </Link>
      </legend>
      {available.length === 0 ? (
        <p className="text-xs text-muted">Nenhuma tag criada ainda. Crie em Cadastros, Tags.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {available.map((tag) => {
            const active = value.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                aria-pressed={active}
                title={tag.note ?? undefined}
                onClick={() =>
                  onChange(active ? value.filter((id) => id !== tag.id) : [...value, tag.id])
                }
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
                  active ? 'font-medium' : 'border-border text-muted hover:bg-surface-2',
                )}
                style={
                  active
                    ? {
                        borderColor: tag.color,
                        backgroundColor: `${tag.color}1f`,
                        color: 'var(--foreground)',
                      }
                    : undefined
                }
              >
                {active ? (
                  <Check className="size-3.5" style={{ color: tag.color }} />
                ) : (
                  <span className="size-2 rounded-full" style={{ backgroundColor: tag.color }} />
                )}
                {tag.name}
              </button>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
