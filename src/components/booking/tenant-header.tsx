import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import type { PublicBranding, PublicUnit } from '@/lib/api/types';
import { cn } from '@/lib/cn';

export function unitAddress(unit: PublicUnit) {
  const line = [unit.street, unit.number].filter(Boolean).join(', ');
  const place = [unit.district, unit.city && unit.state ? `${unit.city}/${unit.state}` : unit.city]
    .filter(Boolean)
    .join(', ');
  return [line, place].filter(Boolean).join(' – ');
}

function Mark({ branding, size }: { branding: PublicBranding; size: 'sm' | 'lg' }) {
  const box = size === 'lg' ? 'size-16 text-3xl rounded-2xl' : 'size-10 text-xl rounded-xl';
  if (branding.logoUrl) {
    return (
      <>
        <img
          src={branding.logoUrl}
          alt={branding.displayName}
          className={cn('w-auto object-contain dark:hidden', size === 'lg' ? 'h-16' : 'h-10')}
        />
        <img
          src={branding.logoDarkUrl ?? branding.logoUrl}
          alt={branding.displayName}
          className={cn('hidden w-auto object-contain dark:block', size === 'lg' ? 'h-16' : 'h-10')}
        />
      </>
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center bg-brand font-[family-name:var(--font-sign)] font-bold text-on-brand',
        box,
      )}
    >
      {branding.displayName.charAt(0)}
    </span>
  );
}

export function TenantHeader({ branding }: { branding: PublicBranding }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <Link href={`/b/${branding.slug}`} className="flex items-center gap-3">
        <Mark branding={branding} size="sm" />
        {branding.logoUrl ? null : (
          <span className="font-[family-name:var(--font-sign)] text-2xl leading-none font-semibold tracking-tight">
            {branding.displayName}
          </span>
        )}
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href={`/b/${branding.slug}/meus-horarios`}
          className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground"
        >
          Meus horários
        </Link>
        <ThemeToggle className="hidden sm:inline-flex" />
      </div>
    </header>
  );
}

export function TenantHero({ branding, unit }: { branding: PublicBranding; unit?: PublicUnit }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-brand px-6 pt-8 pb-7 text-on-brand sm:px-10 sm:pt-12 sm:pb-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-6 h-[140%] w-40 rotate-12 bg-[repeating-linear-gradient(180deg,currentColor_0_14px,transparent_14px_28px)] opacity-[0.08]"
      />
      <h1 className="relative max-w-[14ch] font-[family-name:var(--font-sign)] text-5xl leading-[0.95] font-bold tracking-tight sm:text-7xl">
        {branding.displayName}
      </h1>
      {unit && unitAddress(unit) ? (
        <p className="relative mt-4 flex items-start gap-1.5 text-sm opacity-85">
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden /> {unitAddress(unit)}
        </p>
      ) : null}
    </section>
  );
}

export function PoweredBy({ show }: { show: boolean }) {
  return show ? (
    <footer className="mt-auto pt-12 pb-4 text-center text-xs text-muted">
      Agenda por <span className="font-semibold text-foreground">Chegaí</span>
    </footer>
  ) : null;
}
