'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export type IntegrationKey = 'asaas' | 'whatsapp' | 'n8n' | 'google' | 'openai';
export type MaskedValue = string | { set: true; hint: string };
export type IntegrationValues = Record<string, MaskedValue | undefined>;

export interface IntegrationField {
  name: string;
  label: string;
  secret?: boolean;
  placeholder?: string;
  hint?: string;
}

export interface IntegrationDefinition<K extends string = IntegrationKey> {
  key: K;
  title: string;
  description: string;
  fields: IntegrationField[];
}

export const INTEGRATION_DEFS: IntegrationDefinition[] = [
  {
    key: 'asaas',
    title: 'Asaas',
    description: 'Cobranças das assinaturas e links de pagamento dos agendamentos.',
    fields: [
      { name: 'apiUrl', label: 'URL da API', placeholder: 'https://api-sandbox.asaas.com/v3' },
      { name: 'apiKey', label: 'Chave da API', secret: true },
      {
        name: 'webhookToken',
        label: 'Token do webhook',
        secret: true,
        hint: 'O mesmo token informado no painel do Asaas ao cadastrar o webhook.',
      },
    ],
  },
  {
    key: 'whatsapp',
    title: 'WhatsApp (Meta)',
    description: 'API oficial do WhatsApp Cloud para confirmações e lembretes.',
    fields: [
      { name: 'appId', label: 'App ID' },
      { name: 'appSecret', label: 'App secret', secret: true },
      { name: 'businessAccountId', label: 'ID da conta do WhatsApp Business' },
      { name: 'phoneNumberId', label: 'ID do número' },
      { name: 'accessToken', label: 'Token de acesso', secret: true },
      { name: 'verifyToken', label: 'Token de verificação do webhook', secret: true },
    ],
  },
  {
    key: 'n8n',
    title: 'n8n',
    description: 'Automações e o agente de atendimento que conversa com os clientes.',
    fields: [
      { name: 'baseUrl', label: 'URL do n8n', placeholder: 'https://n8n.suaempresa.com' },
      { name: 'apiKey', label: 'Chave da API', secret: true },
      {
        name: 'agentWebhookUrl',
        label: 'Webhook do agente',
        placeholder: 'https://n8n.suaempresa.com/webhook/…',
      },
    ],
  },
  {
    key: 'google',
    title: 'Google Agenda',
    description: 'Sincroniza os horários dos barbeiros com a agenda do Google.',
    fields: [
      { name: 'clientId', label: 'Client ID' },
      { name: 'clientSecret', label: 'Client secret', secret: true },
      {
        name: 'redirectUrl',
        label: 'URL de retorno',
        placeholder: 'https://api.chegai.com.br/v1/integrations/google/callback',
      },
    ],
  },
  {
    key: 'openai',
    title: 'OpenAI',
    description: 'Transcrição de áudios recebidos no WhatsApp.',
    fields: [
      { name: 'apiKey', label: 'Chave da API', secret: true },
      {
        name: 'transcriptionModel',
        label: 'Modelo de transcrição',
        placeholder: 'gpt-4o-mini-transcribe',
      },
    ],
  },
];

export interface WebhookEndpoint {
  id: string;
  tenantId: string | null;
  tenant?: { displayName: string } | null;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  event: string;
  attempts: number;
  statusCode: number | null;
  ok: boolean;
  error: string | null;
  createdAt: string;
}

export const EVENT_LABEL: Record<string, string> = {
  'booking.confirmed': 'Agendamento confirmado',
  'booking.rescheduled': 'Agendamento remarcado',
  'booking.canceled': 'Agendamento cancelado',
  'booking.checked_in': 'Cliente chegou',
  'booking.completed': 'Atendimento concluído',
  'booking.no_show': 'Cliente faltou',
  'payment.link_created': 'Link de pagamento gerado',
  'payment.paid': 'Pagamento recebido',
  'customer.registered': 'Cliente criou conta',
};

export type TenantIntegrationKey = 'whatsapp' | 'n8n' | 'google';

export const TENANT_INTEGRATION_DEFS: IntegrationDefinition<TenantIntegrationKey>[] = [
  {
    key: 'whatsapp',
    title: 'WhatsApp',
    description:
      'Número da barbearia na API oficial. O app da Meta fica nas integrações da plataforma.',
    fields: [
      { name: 'displayPhone', label: 'Número', placeholder: '+55 38 99999-0000' },
      { name: 'businessAccountId', label: 'ID da conta do WhatsApp Business' },
      { name: 'phoneNumberId', label: 'ID do número' },
      {
        name: 'accessToken',
        label: 'Token de acesso',
        secret: true,
        hint: 'Deixe em branco para usar o token da plataforma.',
      },
    ],
  },
  {
    key: 'n8n',
    title: 'Automações (n8n)',
    description: 'Fluxo do agente que atende os clientes desta barbearia.',
    fields: [
      {
        name: 'agentWebhookUrl',
        label: 'Webhook do agente',
        placeholder: 'https://n8n.suaempresa.com/webhook/barbearia',
      },
      { name: 'apiKey', label: 'Chave do fluxo', secret: true },
    ],
  },
  {
    key: 'google',
    title: 'Google Agenda',
    description: 'Agenda do Google onde os horários desta barbearia são espelhados.',
    fields: [
      {
        name: 'calendarId',
        label: 'ID da agenda',
        placeholder: 'barbearia@group.calendar.google.com',
      },
      { name: 'accountEmail', label: 'Conta Google', placeholder: 'contato@barbearia.com.br' },
    ],
  },
];

export function isConfigured(
  values: IntegrationValues | undefined,
  def: IntegrationDefinition<string>,
) {
  return Boolean(values) && def.fields.some((field) => values?.[field.name]);
}

const keys = {
  integrations: ['admin', 'integrations'] as const,
  webhooks: ['admin', 'webhooks'] as const,
  deliveries: (id: string) => ['admin', 'webhooks', id, 'deliveries'] as const,
  tenantPayments: (id: string) => ['admin', 'tenant', id, 'payments'] as const,
};

export function useIntegrations() {
  return useQuery({
    queryKey: keys.integrations,
    queryFn: () =>
      api<{ integrations: Partial<Record<IntegrationKey, IntegrationValues>>; events: string[] }>(
        '/v1/admin/integrations',
      ),
  });
}

export function useSaveIntegration(key: IntegrationKey) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, string>) =>
      api<IntegrationValues>(`/v1/admin/integrations/${key}`, { method: 'PUT', body }),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.integrations }),
  });
}

export function useTestIntegration(key: IntegrationKey) {
  return useMutation({
    mutationFn: () =>
      api<{ ok: boolean; detail: string }>(`/v1/admin/integrations/${key}/test`, {
        method: 'POST',
      }),
  });
}

export function useWebhooks(tenantId?: string) {
  return useQuery({
    queryKey: [...keys.webhooks, tenantId ?? 'all'],
    queryFn: () => api<WebhookEndpoint[]>('/v1/admin/webhooks', { query: { tenantId } }),
  });
}

export function useCreateWebhook() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; url: string; events: string[]; tenantId?: string }) =>
      api<WebhookEndpoint & { secret: string }>('/v1/admin/webhooks', { method: 'POST', body }),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.webhooks }),
  });
}

export function useUpdateWebhook() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Partial<Pick<WebhookEndpoint, 'isActive' | 'events' | 'name' | 'url'>>;
    }) => api<WebhookEndpoint>(`/v1/admin/webhooks/${id}`, { method: 'PATCH', body }),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.webhooks }),
  });
}

export function useDeleteWebhook() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/v1/admin/webhooks/${id}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.webhooks }),
  });
}

export function useRotateWebhookSecret() {
  return useMutation({
    mutationFn: (id: string) =>
      api<{ secret: string }>(`/v1/admin/webhooks/${id}/rotate-secret`, { method: 'POST' }),
  });
}

export function useWebhookDeliveries(id: string | null) {
  return useQuery({
    queryKey: keys.deliveries(id ?? ''),
    queryFn: () => api<WebhookDelivery[]>(`/v1/admin/webhooks/${id}/deliveries`),
    enabled: Boolean(id),
  });
}

export function usePingWebhook() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<{ ok: boolean; statusCode?: number }>(`/v1/admin/webhooks/${id}/test`, {
        method: 'POST',
      }),
    onSuccess: (_data, id) => client.invalidateQueries({ queryKey: keys.deliveries(id) }),
  });
}

export interface TenantIntegrations {
  asaas: { depositPercent: number; ownAccount: boolean };
  whatsapp: { values: IntegrationValues; updatedAt: string | null };
  n8n: { values: IntegrationValues; updatedAt: string | null };
  google: { values: IntegrationValues; updatedAt: string | null };
}

export function useTenantIntegrations(id: string) {
  return useQuery({
    queryKey: ['admin', 'tenant', id, 'integrations'],
    queryFn: () => api<TenantIntegrations>(`/v1/admin/tenants/${id}/integrations`),
  });
}

export function useSaveTenantIntegration(id: string, key: TenantIntegrationKey) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, string>) =>
      api<IntegrationValues>(`/v1/admin/tenants/${id}/integrations/${key}`, {
        method: 'PUT',
        body,
      }),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ['admin', 'tenant', id, 'integrations'] }),
  });
}

export function useTestTenantIntegration(id: string, key: TenantIntegrationKey) {
  return useMutation({
    mutationFn: () =>
      api<{ ok: boolean; detail: string }>(`/v1/admin/tenants/${id}/integrations/${key}/test`, {
        method: 'POST',
      }),
  });
}

export function useTenantPayments(id: string) {
  return useQuery({
    queryKey: keys.tenantPayments(id),
    queryFn: () =>
      api<{ depositPercent: number; ownAccount: boolean }>(`/v1/admin/tenants/${id}/payments`),
  });
}

export function useSaveTenantPayments(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { apiKey?: string | null }) =>
      api<{ depositPercent: number; ownAccount: boolean }>(`/v1/admin/tenants/${id}/payments`, {
        method: 'PUT',
        body,
      }),
    onSuccess: async (data) => {
      client.setQueryData(keys.tenantPayments(id), data);
      await client.invalidateQueries({ queryKey: ['admin', 'tenant', id, 'integrations'] });
    },
  });
}

export const WEBHOOK_EVENTS = Object.keys(EVENT_LABEL);
