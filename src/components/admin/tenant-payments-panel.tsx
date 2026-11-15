'use client';

import { type FormEvent, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useSaveTenantPayments, useTenantPayments } from '@/lib/admin/integrations';
import { describeError } from '@/lib/api/errors';

export function TenantPaymentsPanel({ tenantId }: { tenantId: string }) {
  const payments = useTenantPayments(tenantId);
  const save = useSaveTenantPayments(tenantId);
  const [apiKey, setApiKey] = useState('');

  if (payments.isPending) {
    return <Skeleton className="h-48" />;
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    save.mutate({ apiKey: apiKey.trim() }, { onSuccess: () => setApiKey('') });
  };

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <CardTitle>Asaas (recebimentos)</CardTitle>
          <CardDescription>
            Os links de pagamento dos agendamentos usam a conta Asaas da barbearia quando houver
            chave. Sem chave, usam a conta da plataforma.
          </CardDescription>
        </div>
        <Badge tone={payments.data?.ownAccount ? 'success' : 'neutral'}>
          {payments.data?.ownAccount ? 'Conta própria' : 'Conta da plataforma'}
        </Badge>
      </div>
      <p className="text-sm text-muted">
        Sinal padrão: {payments.data?.depositPercent ?? 50}% do atendimento.
      </p>
      <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
        <Field
          label="Chave da API do Asaas da barbearia"
          htmlFor="tenant-asaas-key"
          hint="Validamos a chave com o Asaas antes de salvar."
        >
          <Input
            id="tenant-asaas-key"
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
        </Field>
        {save.error ? <Alert>{describeError(save.error)}</Alert> : null}
        {save.isSuccess ? <Alert tone="success">Recebimentos atualizados.</Alert> : null}
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            loading={save.isPending && Boolean(apiKey)}
            disabled={!apiKey.trim()}
          >
            Salvar chave
          </Button>
          {payments.data?.ownAccount ? (
            <Button
              type="button"
              variant="ghost"
              className="text-danger"
              loading={save.isPending && !apiKey}
              onClick={() => save.mutate({ apiKey: null })}
            >
              Voltar para a conta da plataforma
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
