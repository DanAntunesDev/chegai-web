'use client';

import { type KeyboardEvent, useId } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem<T extends string> {
  value: T;
  label: string;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  label: string;
}

export function Tabs<T extends string>({ items, value, onValueChange, label }: TabsProps<T>) {
  const id = useId();

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = items.findIndex((item) => item.value === value);
    const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!offset) {
      return;
    }
    event.preventDefault();
    const next = items[(index + offset + items.length) % items.length];
    if (next) {
      onValueChange(next.value);
      document.getElementById(`${id}-${next.value}`)?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="flex gap-1 overflow-x-auto rounded-lg bg-surface-2 p-1"
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            id={`${id}-${item.value}`}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onValueChange(item.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
              selected ? 'bg-background shadow-xs' : 'text-muted hover:text-foreground',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
