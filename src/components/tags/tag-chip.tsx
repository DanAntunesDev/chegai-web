import { cn } from '@/lib/cn';
import type { TagRef } from '@/lib/panel/types';

export function TagChip({
  tag,
  className,
  size = 'sm',
}: {
  tag: Pick<TagRef, 'name' | 'color'>;
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className,
      )}
      style={{
        borderColor: `${tag.color}55`,
        backgroundColor: `${tag.color}14`,
        color: `color-mix(in oklab, ${tag.color} 75%, var(--foreground))`,
      }}
    >
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: tag.color }}
        aria-hidden
      />
      <span className="truncate">{tag.name}</span>
    </span>
  );
}
