'use client';

import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { TwoFactorSetup } from '@/components/auth/two-factor-setup';
import { useMe } from '@/components/auth/use-me';
import { PageHeader } from '@/components/shell/app-shell';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function SecurityPage() {
  const me = useMe();
  const [done, setDone] = useState(false);
  const enabled = done || me.data?.user.twoFactorEnabled;

  return (
    <>
      <PageHeader title="Segurança" description="Proteja o acesso à sua conta." />
      {me.isPending ? (
        <Skeleton className="h-40" />
      ) : enabled ? (
        <Card className="flex items-center gap-4">
          <span className="grid size-11 place-items-center rounded-xl bg-success/12 text-success">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <CardTitle>Verificação em duas etapas ativa</CardTitle>
            <CardDescription>Seu login pede o código do aplicativo autenticador.</CardDescription>
          </div>
        </Card>
      ) : (
        <TwoFactorSetup
          onDone={() => setDone(true)}
          description="Além da senha, o login vai pedir um código do aplicativo autenticador (Google Authenticator, Authy, 1Password)."
        />
      )}
    </>
  );
}
