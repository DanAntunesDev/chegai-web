'use client';

import { KeyRound, Plus, Send, Webhook } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { CopyField } from '@/components/admin/copy-field';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  EVENT_LABEL,
  useCreateWebhook,
  useDeleteWebhook,
  usePingWebhook,
  useRotateWebhookSecret,
  useUpdateWebhook,
  useWebhookDeliveries,
  useWebhooks,
  type WebhookEndpoint,
} from '@/lib/admin/integrations';
import { describeError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/format';

function SecretDialog({ secret, onClose }: { secret: string; onClose: () => void }) {
  return (
    <Dialog
      open
      onClose={onClose}
      title="Guarde a chave de assinatura"
      description="Ela aparece só agora. Use para validar o cabeçalho X-Chegai-Signature."
      footer={<Button onClick={onClose}>Já guardei</Button>}
    >
      <div className="flex flex-col gap-3">
        <CopyField label="Chave" value={secret} />
        <p className="text-xs text-muted">
          A assinatura é o HMAC SHA-256 de <code>timestamp.corpo</code> com essa chave, enviada como{' '}
          <code>sha256=…</code>. O timestamp vem em X-Chegai-Timestamp.
        </p>
      </div>
    </Dialog>
  );
}

function CreateWebhookDialog({
  events,
  onClose,
  onCreated,
}: {
  events: string[];
  onClose: () => void;
  onCreated: (secret: string) => void;
}) {
  const create = useCreateWebhook();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selected, setSelected] = useState<string[]>(['booking.confirmed', 'booking.canceled']);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    create.mutate(
      { name: name.trim(), url: url.trim(), events: selected },
      { onSuccess: (endpoint) => onCreated(endpoint.secret) },
    );
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Novo webhook"
      description="Avisamos esse endereço sempre que um dos eventos acontecer."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="webhook-form"
            loading={create.isPending}
            disabled={name.trim().length < 2 || !url.trim() || selected.length === 0}
          >
            Criar webhook
          </Button>
        </>
      }
    >
      <form id="webhook-form" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field label="Nome" htmlFor="webhook-name" required>
          <Input
            id="webhook-name"
            placeholder="Fluxo de lembretes no n8n"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field
          label="URL"
          htmlFor="webhook-url"
          required
          hint="Precisa ser https e acessível pela internet."
        >
          <Input
            id="webhook-url"
            type="url"
            placeholder="https://n8n.suaempresa.com/webhook/chegai"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
        </Field>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Eventos</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {events.map((item) => (
              <label
                key={item}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  className="accent-[var(--brand)]"
                  checked={selected.includes(item)}
                  onChange={(event) =>
                    setSelected((current) =>
                      event.target.checked
                        ? [...current, item]
                        : current.filter((value) => value !== item),
                    )
                  }
                />
                {EVENT_LABEL[item] ?? item}
              </label>
            ))}
          </div>
        </fieldset>
        {create.error ? <Alert>{describeError(create.error)}</Alert> : null}
      </form>
    </Dialog>
  );
}

function Deliveries({ id }: { id: string }) {
  const deliveries = useWebhookDeliveries(id);
  if (deliveries.isPending) {
    return <Skeleton className="h-16" />;
  }
  if (!deliveries.data?.length) {
    return <p className="text-xs text-muted">Nenhum envio ainda.</p>;
  }
  return (
    <ol className="flex flex-col divide-y divide-border text-xs">
      {deliveries.data.map((delivery) => (
        <li key={delivery.id} className="flex flex-wrap items-center gap-2 py-1.5">
          <Badge tone={delivery.ok ? 'success' : 'danger'}>
            {delivery.statusCode ?? (delivery.ok ? 'ok' : 'falhou')}
          </Badge>
          <span className="font-medium">{EVENT_LABEL[delivery.event] ?? delivery.event}</span>
          {delivery.error ? <span className="text-danger">{delivery.error}</span> : null}
          <span className="ml-auto text-muted">
            {delivery.attempts > 1 ? `${delivery.attempts} tentativas · ` : ''}
            {formatDateTime(delivery.createdAt)}
          </span>
        </li>
      ))}
    </ol>
  );
}

function WebhookRow({
  endpoint,
  onSecret,
}: {
  endpoint: WebhookEndpoint;
  onSecret: (secret: string) => void;
}) {
  const update = useUpdateWebhook();
  const remove = useDeleteWebhook();
  const ping = usePingWebhook();
  const rotate = useRotateWebhookSecret();
  const [open, setOpen] = useState(false);

  return (
    <li className="flex flex-col gap-3 py-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{endpoint.name}</p>
          <p className="truncate font-mono text-xs text-muted">{endpoint.url}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {endpoint.tenant ? <Badge tone="info">{endpoint.tenant.displayName}</Badge> : null}
            {endpoint.events.map((item) => (
              <Badge key={item}>{EVENT_LABEL[item] ?? item}</Badge>
            ))}
          </div>
        </div>
        <div className="w-40">
          <Switch
            id={`webhook-${endpoint.id}`}
            label={endpoint.isActive ? 'Ativo' : 'Pausado'}
            checked={endpoint.isActive}
            disabled={update.isPending}
            onCheckedChange={(checked) =>
              update.mutate({ id: endpoint.id, body: { isActive: checked } })
            }
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          loading={ping.isPending}
          onClick={() => ping.mutate(endpoint.id, { onSuccess: () => setOpen(true) })}
        >
          <Send /> Enviar teste
        </Button>
        <Button
          size="sm"
          variant="ghost"
          loading={rotate.isPending}
          onClick={() => rotate.mutate(endpoint.id, { onSuccess: (data) => onSecret(data.secret) })}
        >
          <KeyRound /> Nova chave
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen((value) => !value)}>
          {open ? 'Ocultar envios' : 'Ver envios'}
        </Button>
        <span className="ml-auto">
          <ConfirmButton
            label="Excluir"
            title="Excluir webhook"
            description={`O endereço ${endpoint.url} deixa de receber eventos.`}
            onConfirm={() => remove.mutateAsync(endpoint.id)}
          />
        </span>
      </div>
      {ping.data ? (
        <Alert tone={ping.data.ok ? 'success' : 'danger'}>
          {ping.data.ok
            ? `Recebido com status ${ping.data.statusCode}`
            : 'O endereço não respondeu com sucesso.'}
        </Alert>
      ) : null}
      {open ? <Deliveries id={endpoint.id} /> : null}
    </li>
  );
}

export function WebhooksSection({ events }: { events: string[] }) {
  const webhooks = useWebhooks();
  const [creating, setCreating] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <CardTitle>Webhooks de saída</CardTitle>
          <CardDescription>
            Mande os eventos da plataforma para o n8n ou qualquer sistema que precise reagir a eles.
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus /> Novo webhook
        </Button>
      </div>
      {webhooks.isPending ? (
        <Skeleton className="h-24" />
      ) : webhooks.data?.length ? (
        <ul className="divide-y divide-border">
          {webhooks.data.map((endpoint) => (
            <WebhookRow key={endpoint.id} endpoint={endpoint} onSecret={setSecret} />
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted">
          <Webhook className="size-5" />
          Nenhum webhook cadastrado.
        </div>
      )}
      {creating ? (
        <CreateWebhookDialog
          events={events}
          onClose={() => setCreating(false)}
          onCreated={(value) => {
            setCreating(false);
            setSecret(value);
          }}
        />
      ) : null}
      {secret ? <SecretDialog secret={secret} onClose={() => setSecret(null)} /> : null}
    </Card>
  );
}
