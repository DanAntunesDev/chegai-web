'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, ShieldCheck } from 'lucide-react';
import QRCode from 'qrcode';
import { type FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { describeError } from '@/lib/api/errors';
import type { Session, TotpSetup } from '@/lib/api/types';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useAuth } from './auth-provider';

export function TwoFactorSetup({
  onDone,
  description = 'A área administrativa exige um código do aplicativo autenticador (Google Authenticator, Authy, 1Password) além da senha.',
}: {
  onDone?: () => void;
  description?: string;
}) {
  const { replaceSession } = useAuth();
  const queryClient = useQueryClient();
  const [setup, setSetup] = useState<TotpSetup | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  const start = useMutation({
    mutationFn: () => api<TotpSetup>('/v1/auth/2fa/setup', { method: 'POST' }),
    onSuccess: async (data) => {
      setSetup(data);
      setQr(
        await QRCode.toDataURL(data.otpauthUrl, {
          margin: 1,
          width: 220,
          errorCorrectionLevel: 'M',
        }),
      );
    },
  });

  const enable = useMutation({
    mutationFn: (value: string) =>
      api<Session>('/v1/auth/2fa/enable', { method: 'POST', body: { code: value } }),
    onSuccess: async (session) => {
      replaceSession(session);
      await queryClient.invalidateQueries();
      onDone?.();
    },
  });

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (/^\d{6}$/.test(code)) {
      enable.mutate(code);
    }
  };

  return (
    <Card className="mx-auto max-w-lg">
      <span className="mb-4 grid size-11 place-items-center rounded-xl bg-brand/10 text-brand">
        <ShieldCheck className="size-5" />
      </span>
      <CardTitle className="text-xl">Ative a verificação em duas etapas</CardTitle>
      <CardDescription className="mt-1">{description}</CardDescription>

      {!setup ? (
        <div className="mt-6 flex flex-col gap-3">
          {start.error ? <Alert>{describeError(start.error)}</Alert> : null}
          <Button onClick={() => start.mutate()} loading={start.isPending}>
            Gerar QR code
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 flex flex-col gap-5">
          <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm text-muted">
            <li>Escaneie o QR code com o aplicativo.</li>
            <li>Digite o código de 6 números que aparecer.</li>
          </ol>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
            {qr ? (
              <img
                src={qr}
                alt="QR code para o aplicativo autenticador"
                width={176}
                height={176}
                className="rounded-lg bg-white p-2"
              />
            ) : null}
            <div className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
              <span className="text-muted">Sem câmera? Digite a chave:</span>
              <code className="rounded-md bg-surface-2 px-2 py-1.5 font-mono text-xs break-all">
                {setup.secret}
              </code>
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={async () => {
                  await navigator.clipboard.writeText(setup.secret);
                  setCopied(true);
                }}
              >
                <Copy /> {copied ? 'Copiada' : 'Copiar chave'}
              </Button>
            </div>
          </div>
          <Field label="Código do aplicativo" htmlFor="totp">
            <Input
              id="totp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              className="text-center font-mono text-lg tracking-[0.5em]"
            />
          </Field>
          {enable.error ? <Alert>{describeError(enable.error)}</Alert> : null}
          <Button type="submit" loading={enable.isPending} disabled={code.length !== 6}>
            Ativar
          </Button>
        </form>
      )}
    </Card>
  );
}
