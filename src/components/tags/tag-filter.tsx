'use client';

import { Tags, X } from 'lucide-react';
import { useTags } from '@/lib/panel/queries';
import type { TagScope } from '@/lib/panel/types';

export function TagFilter({
  value,
  onChange,
  target,
}: {
  value: string;
  onChange: (value: string) => void;
  target: Exclude<TagScope, 'ALL'>;
}) {
  const tags = useTags();
  const options = (tags.data ?? []).filter((tag) => tag.scope === 'ALL' || tag.scope === target);
  const selected = options.find((tag) => tag.id === value);

  if (options.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <Tags
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        style={{ color: selected?.color }}
        aria-hidden
      />
      <select
        aria-label="Filtrar por tag"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full appearance-none rounded-lg border border-border bg-surface pr-9 pl-9 text-sm sm:w-48"
      >
        <option value="">Todas as tags</option>
        {options.map((tag) => (
          <option key={tag.id} value={tag.id}>
            {tag.name}
          </option>
        ))}
      </select>
      {value ? (
        <button
          type="button"
          aria-label="Limpar filtro de tag"
          onClick={() => onChange('')}
          className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
