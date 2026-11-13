'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { RequireAuth } from '@/components/auth/require-auth';
import { useMe } from '@/components/auth/use-me';
import { navFor } from '@/components/panel/nav';
import { AppShell } from '@/components/shell/app-shell';
import { Select } from '@/components/ui/select';

function TenantSwitcher() {
  const { session, switchTenant } = useAuth();
  if (!session?.tenant) {
    return null;
  }
  if (session.tenants.length < 2) {
    return (
      <span className="truncate font-display font-semibold">{session.tenant.displayName}</span>
    );
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
  return (
    <AppShell
      nav={navFor(me.data?.permissions)}
      moreHref="/painel/mais"
      area="Barbearia"
      headerExtra={<TenantSwitcher />}
    >
      {children}
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
