'use client';

import type { LucideIcon } from 'lucide-react';
import { ChevronDown, LogOut, Menu, Monitor, Moon, PanelLeft, Sun } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/cn';

export interface NavChild {
  href: string;
  label: string;
}

export interface NavItem {
  href?: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  mobile?: boolean;
  children?: NavChild[];
}

interface AppShellProps {
  nav: NavItem[];
  moreHref?: string;
  area: string;
  headerExtra?: ReactNode;
  children: ReactNode;
}

const COLLAPSE_KEY = 'chegai.sidebar.collapsed';

function matches(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function isActive(pathname: string, item: NavItem) {
  if (item.children) {
    return item.children.some((child) => matches(pathname, child.href));
  }
  return item.href ? matches(pathname, item.href, item.exact) : false;
}

function writeCollapsed(value: boolean) {
  try {
    window.localStorage.setItem(COLLAPSE_KEY, value ? '1' : '0');
  } catch {
    return false;
  }
  return true;
}

function readCollapsed() {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}

function SidebarGroup({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem & { children: NavChild[] };
  pathname: string;
  collapsed: boolean;
}) {
  const active = isActive(pathname, item);
  const [open, setOpen] = useState(active);
  const [flyout, setFlyout] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!flyout) {
      return;
    }
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setFlyout(false);
      }
    };
    const escape = (event: KeyboardEvent) => event.key === 'Escape' && setFlyout(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [flyout]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={collapsed ? flyout : open}
        title={collapsed ? item.label : undefined}
        onClick={() => (collapsed ? setFlyout((value) => !value) : setOpen((value) => !value))}
        className={cn(
          'flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm transition-colors',
          active
            ? 'font-semibold text-foreground'
            : 'text-muted hover:bg-surface-2 hover:text-foreground',
          collapsed && 'justify-center px-0',
        )}
      >
        <item.icon className="size-[18px] shrink-0" aria-hidden />
        {collapsed ? null : (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronDown
              className={cn('size-4 transition-transform duration-200', open && 'rotate-180')}
              aria-hidden
            />
          </>
        )}
      </button>

      {collapsed ? (
        <div
          role="menu"
          className={cn(
            'absolute top-0 left-full z-40 ml-2 min-w-48 origin-left rounded-xl border border-border bg-surface p-1.5 shadow-lg transition-all duration-150',
            flyout ? 'visible translate-x-0 opacity-100' : 'invisible -translate-x-1 opacity-0',
          )}
        >
          <p className="px-2.5 pt-1 pb-1.5 text-xs font-medium text-muted">{item.label}</p>
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              role="menuitem"
              onClick={() => setFlyout(false)}
              className={cn(
                'block rounded-md px-2.5 py-2 text-sm',
                matches(pathname, child.href)
                  ? 'bg-surface-2 font-medium text-foreground'
                  : 'text-muted hover:bg-surface-2 hover:text-foreground',
              )}
            >
              {child.label}
            </Link>
          ))}
        </div>
      ) : (
        <div
          className={cn(
            'grid transition-[grid-template-rows] duration-200 ease-out',
            open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          )}
        >
          <div className="overflow-hidden">
            <div className="ml-[21px] flex flex-col gap-0.5 border-l border-border py-1 pl-3">
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  tabIndex={open ? undefined : -1}
                  aria-current={matches(pathname, child.href) ? 'page' : undefined}
                  className={cn(
                    'rounded-md px-2.5 py-1.5 text-sm transition-colors',
                    matches(pathname, child.href)
                      ? 'bg-surface-2 font-medium text-foreground'
                      : 'text-muted hover:text-foreground',
                  )}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { session, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const escape = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  const themes = [
    { value: 'light', label: 'Claro', Icon: Sun },
    { value: 'dark', label: 'Escuro', Icon: Moon },
    { value: 'system', label: 'Sistema', Icon: Monitor },
  ] as const;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold hover:bg-surface-2"
      >
        <span className="grid size-7 place-items-center rounded-full bg-surface-2 text-xs font-semibold">
          {session?.user.name.charAt(0)}
        </span>
        <span className="hidden max-w-40 truncate sm:block">{session?.user.name}</span>
        <ChevronDown className="size-4 text-muted" aria-hidden />
      </button>
      <div
        role="menu"
        className={cn(
          'absolute top-full right-0 z-40 mt-2 w-64 origin-top-right rounded-xl border border-border bg-surface p-1.5 shadow-lg transition-all duration-150',
          open ? 'visible scale-100 opacity-100' : 'invisible scale-95 opacity-0',
        )}
      >
        <div className="px-2.5 py-2">
          <p className="truncate text-sm font-semibold">{session?.user.name}</p>
          <p className="truncate text-xs text-muted">{session?.user.email}</p>
        </div>
        <div className="my-1 border-t border-border" />
        <p className="px-2.5 pt-1 pb-1.5 text-xs font-medium text-muted">Tema</p>
        <div className="grid grid-cols-3 gap-1 px-1.5 pb-1.5">
          {themes.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={theme === value}
              onClick={() => setTheme(value)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-md py-2 text-xs',
                theme === value ? 'bg-surface-2 font-medium' : 'text-muted hover:bg-surface-2',
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>
        <div className="my-1 border-t border-border" />
        <button
          type="button"
          role="menuitem"
          onClick={async () => {
            await logout();
            router.replace(
              window.location.pathname.startsWith('/admin') ? '/login/admin' : '/login/barbearia',
            );
          }}
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-danger hover:bg-surface-2"
        >
          <LogOut className="size-4" aria-hidden /> Sair
        </button>
      </div>
    </div>
  );
}

export function AppShell({ nav, moreHref, area, headerExtra, children }: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = readCollapsed();
    if (stored) {
      const frame = requestAnimationFrame(() => setCollapsed(true));
      return () => cancelAnimationFrame(frame);
    }
  }, []);

  const toggle = () => {
    setCollapsed((value) => {
      writeCollapsed(!value);
      return !value;
    });
  };

  const flat = nav.filter((item) => item.href);
  const mobileNav = moreHref ? flat.filter((item) => item.mobile) : flat;
  const moreActive =
    Boolean(moreHref) &&
    (pathname === moreHref || !mobileNav.some((item) => isActive(pathname, item)));

  return (
    <div className="flex min-h-dvh">
      <aside
        className={cn(
          'sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 ease-out lg:flex',
          collapsed ? 'w-[72px]' : 'w-64',
        )}
      >
        <div
          className={cn(
            'flex h-16 items-center gap-2 px-4',
            collapsed ? 'justify-center' : 'justify-between',
          )}
        >
          {collapsed ? null : <Logo />}
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground"
          >
            <PanelLeft className="size-[18px]" />
          </button>
        </div>
        {collapsed ? null : (
          <p className="px-6 pt-2 pb-2 text-[11px] font-medium tracking-wider text-muted uppercase">
            {area}
          </p>
        )}
        <nav
          aria-label="Principal"
          className={cn('flex flex-1 flex-col gap-0.5', collapsed ? 'px-3 pt-2' : 'px-3')}
        >
          {nav.map((item) =>
            item.children ? (
              <SidebarGroup
                key={item.label}
                item={item as NavItem & { children: NavChild[] }}
                pathname={pathname}
                collapsed={collapsed}
              />
            ) : (
              <Link
                key={item.href}
                href={item.href ?? '#'}
                title={collapsed ? item.label : undefined}
                aria-current={isActive(pathname, item) ? 'page' : undefined}
                className={cn(
                  'flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors',
                  isActive(pathname, item)
                    ? 'bg-surface-2 font-semibold text-foreground'
                    : 'text-muted hover:bg-surface-2 hover:text-foreground',
                  collapsed && 'justify-center px-0',
                )}
              >
                <item.icon className="size-[18px] shrink-0" aria-hidden />
                {collapsed ? null : item.label}
              </Link>
            ),
          )}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="lg:hidden">
              <Logo compact />
            </span>
            <div className="min-w-0">{headerExtra}</div>
          </div>
          <UserMenu />
        </header>
        <main id="conteudo" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {mobileNav.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href ?? '#'}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium',
                active ? 'text-foreground' : 'text-muted',
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
              moreActive ? 'text-foreground' : 'text-muted',
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
        <h1 className="text-2xl font-semibold sm:text-[28px]">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
