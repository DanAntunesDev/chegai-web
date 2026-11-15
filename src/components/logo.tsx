import { cn } from '@/lib/cn';

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-[17px] font-semibold tracking-tight',
        className,
      )}
    >
      <svg viewBox="0 0 32 32" aria-hidden className="size-7 shrink-0">
        <rect width="32" height="32" rx="8" className="fill-foreground" />
        <path
          d="M21 11.5a6.5 6.5 0 1 0 0 9"
          fill="none"
          className="stroke-background"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <circle cx="22.5" cy="16" r="2" fill="var(--logo)" />
      </svg>
      {compact ? null : <span>Chegaí</span>}
    </span>
  );
}
