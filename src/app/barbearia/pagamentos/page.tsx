'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shell/app-shell';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { describeError } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { depositCents, usePaymentSettings, useSavePaymentSettings } from '@/lib/panel/payments';

const PRESETS = [20, 30, 50, 100];

export default function PaymentsPage() {
  const settings = usePaymentSettings();
  const save = useSavePaymentSettings();
  const [picked, setPercent] = useState<number | null>(null);
  const percent = picked ?? settings.data?.depositPercent ?? 50;

  const changed = settings.data && settings.data.depositPercent !== percent;
  const required = settings.data?.depositRequired ?? true;

  return (
    <>
      <PageHeader
        title="Pagamentos"
        description="Como você cobra o cliente pelos links enviados no WhatsApp."
      />
      {settings.isPending ? (
        <Skeleton className="h-56" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
          <Card className="flex flex-col gap-5">
            <Switch
              id="deposit-required"
              label="Exigir o sinal para agendar pelo link"
              description={
                required
                  ? 'O horário do cliente só é confirmado depois que o sinal é pago. Sem pagamento em 30 minutos, a vaga é liberada.'
                  : 'O cliente agenda pelo link sem pagar nada antes. Você ainda pode mandar um link de cobrança pela agenda.'
              }
              checked={required}
              disabled={save.isPending}
              onCheckedChange={(checked) => save.mutate({ depositRequired: checked })}
            />
            <div className="border-t border-border pt-5">
              <CardTitle>Valor do sinal</CardTitle>
              <CardDescription>
                Ao marcar pela agenda você pode mandar um link só do sinal ou do valor total. O
                restante fica para pagar na hora ou em outro link.
              </CardDescription>
            </div>
            <div
              className="flex flex-wrap gap-2"
              role="radiogroup"
              aria-label="Percentual do sinal"
            >
              {PRESETS.map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={percent === value}
                  onClick={() => setPercent(value)}
                  className={cn(
                    'h-10 rounded-lg border px-4 text-sm font-medium tabular-nums transition-colors',
                    percent === value
                      ? 'border-brand bg-brand text-on-brand'
                      : 'border-border hover:bg-surface-2',
                  )}
                >
                  {value === 100 ? 'Valor cheio' : `${value}%`}
                </button>
              ))}
            </div>
            <label className="flex flex-col gap-2 text-sm">
              <span className="flex justify-between">
                <span className="font-medium">Ajuste fino</span>
                <span className="text-muted tabular-nums">{percent}%</span>
              </span>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={percent}
                onChange={(event) => setPercent(Number(event.target.value))}
                className="accent-[var(--brand)]"
              />
            </label>
            {save.error ? <Alert>{describeError(save.error)}</Alert> : null}
            <div>
              <Button
                disabled={!changed}
                loading={save.isPending}
                onClick={() => save.mutate({ depositPercent: percent })}
              >
                Salvar
              </Button>
            </div>
          </Card>
          <Card className="flex flex-col gap-3">
            <CardTitle>Exemplo</CardTitle>
            <dl className="flex flex-col gap-2 text-sm">
              {[3500, 5000, 8000].map((total) => (
                <div key={total} className="flex justify-between">
                  <dt className="text-muted">Atendimento de {formatMoney(total)}</dt>
                  <dd className="font-medium tabular-nums">
                    {formatMoney(depositCents(total, percent))}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-muted">
              {settings.data?.ownAccount
                ? 'Os valores caem direto na conta Asaas da barbearia.'
                : 'Para receber direto na sua conta Asaas, peça ao suporte para vincular a chave da API.'}
            </p>
          </Card>
        </div>
      )}
    </>
  );
}
