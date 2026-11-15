'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { RequireAuth } from '@/components/auth/require-auth';
import { useMe } from '@/components/auth/use-me';
import { navFor } from '@/components/panel/nav';
import { TenantStatusGate } from '@/components/panel/tenant-status';
import { AppShell } from '@/components/shell/app-shell';
import { Select } from '@/components/ui/select';

function TenantSwitcher() {
  const { session, switchTenant } = useAuth();
  if (!session?.tenant) {
    return null;
  }
  if (session.user.isPlatformAdmin) {
    return (
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Admin
        </Link>
        <span className="truncate text-sm font-semibold">{session.tenant.displayName}</span>
      </div>
    );
  }
  if (session.tenants.length < 2) {
    return <span className="truncate text-sm font-semibold">{session.tenant.displayName}</span>;
  }
  return (
    <Select
      aria-label="Barbearia"
      value={session.tenant.slug}
      onChange={(event) => void switchTenant(event.target.value)}
      className="w-full lg:w-64"
    >
      {session.tenants.map((tenant) => (
        <option key={tenant.id} value={tenant.slug}>
          {tenant.displayName}
        </option>
      ))}
    </Select>
  );
}

function PanelShell({ children }: { children: ReactNode }) {
  const me = useMe();
  const { session } = useAuth();
  return (
    <AppShell
      nav={navFor(me.data?.permissions, session?.user.isPlatformAdmin ?? false)}
      moreHref="/painel/mais"
      area="Barbearia"
      headerExtra={<TenantSwitcher />}
    >
      <TenantStatusGate>{children}</TenantStatusGate>
    </AppShell>
  );
}

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth allow={(session) => Boolean(session.tenant)} fallback="/">
      <PanelShell>{children}</PanelShell>
    </RequireAuth>
  );
}
