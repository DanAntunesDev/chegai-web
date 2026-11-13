import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import type { PublicBranding } from '@/lib/api/types';

export function TenantHeader({ branding }: { branding: PublicBranding }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <Link href={`/b/${branding.slug}`} className="flex items-center gap-3">
        {branding.logoUrl ? (
          <>
            <img
              src={branding.logoUrl}
              alt={branding.displayName}
              className="h-10 w-auto dark:hidden"
            />
            <img
              src={branding.logoDarkUrl ?? branding.logoUrl}
              alt={branding.displayName}
              className="hidden h-10 w-auto dark:block"
            />
          </>
        ) : (
          <>
            <span className="grid size-10 place-items-center rounded-xl bg-brand font-display text-lg font-bold text-on-brand">
              {branding.displayName.charAt(0)}
            </span>
            <span className="font-display font-semibold">{branding.displayName}</span>
          </>
        )}
      </Link>
      <ThemeToggle />
    </header>
  );
}

export function PoweredBy({ show }: { show: boolean }) {
  return show ? (
    <footer className="mt-auto pt-12 text-center text-xs text-muted">
      Agenda por <span className="font-semibold text-foreground">Chegaí</span>
    </footer>
  ) : null;
}
