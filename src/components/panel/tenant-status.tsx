'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Lock } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { TenantStatus } from '@/lib/api/types';

interface CurrentTenant {
  id: string;
  status: TenantStatus;
  trialEndsAt: string | null;
  displayName: string;
}

const ALWAYS_OPEN = ['/painel/assinatura', '/painel/seguranca'];

export function useCurrentTenant() {
  return useQuery({
    queryKey: ['tenant', 'current'],
    queryFn: () => api<CurrentTenant>('/v1/tenant'),
    staleTime: 60_000,
  });
}

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export function TenantStatusGate({ children }: { children: ReactNode }) {
  const tenant = useCurrentTenant();
  const pathname = usePathname();
  const status = tenant.data?.status;

  if (status === 'BLOCKED' && !ALWAYS_OPEN.some((path) => pathname.startsWith(path))) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-danger/12 text-danger">
          <Lock className="size-6" aria-hidden />
        </span>
        <h1 className="text-2xl font-bold">Acesso suspenso</h1>
        <p className="text-muted">
          Há uma fatura em atraso. A agenda online continua guardada e volta a funcionar assim que o
          pagamento for confirmado.
        </p>
        <Link href="/painel/assinatura" className={buttonVariants({ size: 'lg' })}>
          Pagar agora com Pix
        </Link>
      </div>
    );
  }

  return (
    <>
      {status === 'PAST_DUE' ? (
        <div
          role="alert"
          className="mb-5 flex items-center gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm"
        >
          <AlertTriangle className="size-5 shrink-0 text-warning" aria-hidden />
          <span className="flex-1">
            Sua fatura está em atraso. Pague para evitar a suspensão do acesso.
          </span>
          <Link href="/painel/assinatura" className="font-semibold text-foreground underline">
            Pagar
          </Link>
        </div>
      ) : null}
      {status === 'TRIAL' && tenant.data?.trialEndsAt && daysUntil(tenant.data.trialEndsAt) <= 7 ? (
        <div className="mb-5 rounded-xl border border-brand-2/40 bg-brand-2/10 px-4 py-3 text-sm">
          Seu teste grátis termina em {Math.max(0, daysUntil(tenant.data.trialEndsAt))} dias.
        </div>
      ) : null}
      {children}
    </>
  );
}
