import { cn } from '@/lib/cn';

const METHOD: Record<string, string> = {
  GET: 'bg-brand-2/12 text-brand-2',
  POST: 'bg-success/12 text-success',
  PUT: 'bg-[#7c3aed]/12 text-[#7c3aed] dark:text-[#a78bfa]',
  PATCH: 'bg-warning/12 text-warning',
  DELETE: 'bg-danger/12 text-danger',
};

export function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className={cn(
        'inline-flex w-16 justify-center rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold',
        METHOD[method] ?? 'bg-surface-2 text-muted',
      )}
    >
      {method}
    </span>
  );
}

export function StatusPill({ code }: { code: number }) {
  return (
    <span
      className={cn(
        'inline-flex w-12 justify-center justify-self-start rounded-full py-0.5 font-mono text-xs font-semibold tabular-nums',
        code >= 500
          ? 'bg-danger/12 text-danger'
          : code >= 400
            ? 'bg-warning/12 text-warning'
            : 'bg-success/12 text-success',
      )}
    >
      {code}
    </span>
  );
}
