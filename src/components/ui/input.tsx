import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-lg border border-border bg-background px-3 text-sm transition-colors outline-none placeholder:text-muted focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25 disabled:opacity-60 aria-[invalid=true]:border-danger',
        className,
      )}
      {...props}
    />
  );
}
