'use client';

import { useQuery } from '@tanstack/react-query';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { describeError } from '@/lib/api/errors';
import type { Invoice } from '@/lib/api/types';
import { formatDate, formatMoney } from '@/lib/format';

interface PixCode {
  image: string;
  payload: string;
  expiresAt: string | null;
}

export function PixDialog({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const pix = useQuery({
    queryKey: ['tenant', 'billing', invoice.id, 'pix'],
    queryFn: () => api<PixCode>(`/v1/tenant/billing/invoices/${invoice.id}/pix`),
    staleTime: 5 * 60_000,
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Pagar ${formatMoney(invoice.amountCents)}`}
      description={`${invoice.description} · vence em ${formatDate(invoice.dueDate)}`}
    >
      <div className="flex flex-col items-center gap-4">
        {pix.isPending ? <Skeleton className="size-56" /> : null}
        {pix.error ? <Alert className="w-full">{describeError(pix.error)}</Alert> : null}
        {pix.data ? (
          <>
            <img
              src={`data:image/png;base64,${pix.data.image}`}
              alt="QR code Pix"
              width={224}
              height={224}
              className="rounded-xl bg-white p-2"
            />
            <p className="text-center text-sm text-muted">
              Abra o app do banco, escolha Pix e leia o QR code. Ou copie o código abaixo.
            </p>
            <code className="w-full rounded-lg bg-surface-2 px-3 py-2 font-mono text-xs break-all">
              {pix.data.payload}
            </code>
            <Button
              className="w-full"
              onClick={async () => {
                await navigator.clipboard.writeText(pix.data.payload);
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
              }}
            >
              {copied ? <Check /> : <Copy />} {copied ? 'Código copiado' : 'Copiar código Pix'}
            </Button>
            <p className="text-center text-xs text-muted">
              A confirmação chega em segundos e o acesso é liberado automaticamente.
            </p>
          </>
        ) : null}
      </div>
    </Dialog>
  );
}
