import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Alert({
  tone = 'danger',
  children,
  className,
}: {
  tone?: 'danger' | 'success' | 'info';
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(
        'rounded-lg border px-3 py-2 text-sm',
        tone === 'danger' && 'border-danger/30 bg-danger/8 text-danger',
        tone === 'success' && 'border-success/30 bg-success/8 text-success',
        tone === 'info' && 'border-brand-2/30 bg-brand-2/8 text-brand-2',
        className,
      )}
    >
      {children}
    </div>
  );
}
