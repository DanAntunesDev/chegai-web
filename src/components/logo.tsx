import { cn } from '@/lib/cn';

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-flex items-center gap-2 font-display text-lg font-bold', className)}
    >
      <span
        aria-hidden
        className="grid size-8 place-items-center rounded-lg bg-brand text-sm text-on-brand"
      >
        C
      </span>
      <span>
        Chega<span className="text-brand">í</span>
      </span>
    </span>
  );
}
