import Link from 'next/link';
import { type ReactNode, Suspense } from 'react';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';

export function LoginScreen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background px-5 py-6">
      <div className="flex items-center justify-between">
        <Link href="/" aria-label="Chegaí">
          <Logo />
        </Link>
        <ThemeToggle />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-10">
        <div className="w-full max-w-[400px] rounded-2xl border border-border bg-surface p-8 shadow-sm">
          <Suspense>{children}</Suspense>
        </div>
        {footer}
      </div>
      <p className="text-center text-xs text-muted">© {new Date().getFullYear()} Chegaí</p>
    </div>
  );
}
