'use client';

import { Store } from 'lucide-react';
import type { ReactNode } from 'react';
import { RequireAuth } from '@/components/auth/require-auth';
import { TwoFactorSetup } from '@/components/auth/two-factor-setup';
import { useMe } from '@/components/auth/use-me';
import { AppShell, type NavItem } from '@/components/shell/app-shell';
import { Spinner } from '@/components/ui/spinner';

const NAV: NavItem[] = [{ href: '/admin', label: 'Barbearias', icon: Store }];

function AdminGate({ children }: { children: ReactNode }) {
  const me = useMe();
  if (me.isPending) {
    return (
      <div className="grid place-items-center py-24 text-muted">
        <Spinner className="size-6" />
      </div>
    );
  }
  if (me.data && !me.data.user.twoFactorEnabled) {
    return <TwoFactorSetup />;
  }
  return children;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth allow={(session) => session.user.isPlatformAdmin} fallback="/">
      <AppShell nav={NAV} area="Administração">
        <AdminGate>{children}</AdminGate>
      </AppShell>
    </RequireAuth>
  );
}
