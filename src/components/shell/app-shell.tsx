'use client';

import type { LucideIcon } from 'lucide-react';
import { LogOut, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/cn';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  mobile?: boolean;
}

interface AppShellProps {
  nav: NavItem[];
  moreHref?: string;
  area: string;
  headerExtra?: ReactNode;
  children: ReactNode;
}

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export function AppShell({ nav, moreHref, area, headerExtra, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useAuth();
  const mobileNav = moreHref ? nav.filter((item) => item.mobile) : nav;
  const moreActive =
    Boolean(moreHref) &&
    (pathname === moreHref || !mobileNav.some((item) => isActive(pathname, item)));

  const signOut = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-16 items-center px-5">
          <Logo />
        </div>
        <p className="px-5 pb-2 text-xs font-medium tracking-wide text-muted uppercase">{area}</p>
        <nav aria-label="Principal" className="flex flex-1 flex-col gap-0.5 px-3">
          {nav.map((item) => {
            const active = isActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand/10 text-brand'
                    : 'text-muted hover:bg-surface-2 hover:text-foreground',
                )}
              >
                <item.icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col gap-3 border-t border-border p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{session?.user.name}</p>
            <p className="truncate text-xs text-muted">{session?.user.email}</p>
          </div>
          <div className="flex items-center justify-between">
            <ThemeToggle />
            <button
              type="button"
              onClick={signOut}
              className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col pb-20 lg:pb-0">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur lg:h-16 lg:px-8">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="hidden min-w-0 lg:block">{headerExtra}</div>
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={signOut}
              className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2"
              aria-label="Sair"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </header>
        {headerExtra ? (
          <div className="border-b border-border px-4 py-2 lg:hidden">{headerExtra}</div>
        ) : null}
        <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {mobileNav.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium',
                active ? 'text-brand' : 'text-muted',
              )}
            >
              <item.icon className="size-5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
        {moreHref ? (
          <Link
            href={moreHref}
            aria-current={moreActive ? 'page' : undefined}
            className={cn(
              'flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium',
              moreActive ? 'text-brand' : 'text-muted',
            )}
          >
            <Menu className="size-5" aria-hidden />
            Mais
          </Link>
        ) : null}
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </div>
  );
}
