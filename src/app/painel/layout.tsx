'use client';

import { CreditCard, LayoutDashboard, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { RequireAuth } from '@/components/auth/require-auth';
import { AppShell, type NavItem } from '@/components/shell/app-shell';
import { Select } from '@/components/ui/select';

const NAV: NavItem[] = [
  { href: '/painel', label: 'Visão geral', icon: LayoutDashboard, exact: true },
  { href: '/painel/assinatura', label: 'Assinatura', icon: CreditCard },
  { href: '/painel/seguranca', label: 'Segurança', icon: ShieldCheck },
];

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

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth allow={(session) => Boolean(session.tenant)} fallback="/">
      <AppShell nav={NAV} area="Barbearia" headerExtra={<TenantSwitcher />}>
        {children}
      </AppShell>
    </RequireAuth>
  );
}
