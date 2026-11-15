'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../api';

export type LogActor = 'admin' | 'staff' | 'customer' | 'webhook' | 'anonymous';

interface Named {
  tenant: { id: string; displayName: string; slug: string } | null;
  user: { id: string; name: string; email: string } | null;
}

export interface RequestLogRow extends Named {
  id: string;
  tenantId: string | null;
  userId: string | null;
  actor: LogActor;
  method: string;
  path: string;
  statusCode: number;
  errorCode: string | null;
  durationMs: number;
  ip: string | null;
  createdAt: string;
}

export interface RequestLogDetail extends RequestLogRow {
  route: string | null;
  query: unknown;
  payload: unknown;
  headers: unknown;
  responseBody: unknown;
  errorMessage: string | null;
  userAgent: string | null;
}

export interface AuditLogRow extends Named {
  id: string;
  tenantId: string | null;
  actorUserId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  ip: string | null;
  createdAt: string;
}

export interface RequestLogFilters {
  search?: string;
  method?: string;
  status?: 'success' | 'client_error' | 'server_error';
  actor?: LogActor;
  from?: string;
  to?: string;
  tenantId?: string;
}

export interface AuditLogFilters {
  search?: string;
  action?: string;
  from?: string;
  to?: string;
  tenantId?: string;
}

interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const LOG_PAGE_SIZE = 15;

export function useRequestLogs(filters: RequestLogFilters, page: number) {
  return useQuery({
    queryKey: ['admin', 'logs', 'requests', filters, page],
    queryFn: () =>
      api<Paged<RequestLogRow>>('/v1/admin/logs/requests', {
        query: { ...filters, page, pageSize: LOG_PAGE_SIZE },
      }),
    placeholderData: keepPreviousData,
  });
}

export function useRequestLog(id: string | null) {
  return useQuery({
    queryKey: ['admin', 'logs', 'request', id],
    queryFn: () => api<RequestLogDetail>(`/v1/admin/logs/requests/${id}`),
    enabled: Boolean(id),
  });
}

export function useAuditLogs(filters: AuditLogFilters, page: number) {
  return useQuery({
    queryKey: ['admin', 'logs', 'audit', filters, page],
    queryFn: () =>
      api<Paged<AuditLogRow> & { actions: string[] }>('/v1/admin/logs/audit', {
        query: { ...filters, page, pageSize: LOG_PAGE_SIZE },
      }),
    placeholderData: keepPreviousData,
  });
}

export const ACTOR_LABEL: Record<LogActor, string> = {
  admin: 'Administração',
  staff: 'Barbearia',
  customer: 'Cliente',
  webhook: 'Webhook',
  anonymous: 'Sem login',
};

export const ACTION_LABEL: Record<string, string> = {
  'tenant.created': 'Barbearia criada',
  'tenant.updated': 'Barbearia alterada',
  'tenant.renamed': 'Nome da barbearia alterado',
  'branding.updated': 'Marca alterada',
  'plan.updated': 'Plano alterado',
  'tag.created': 'Tag criada',
  'tag.updated': 'Tag alterada',
  'tag.deleted': 'Tag excluída',
  'integration.updated': 'Integração da barbearia alterada',
  'platform_integration.updated': 'Integração da plataforma alterada',
  'payments.updated': 'Recebimentos alterados',
  'webhook.created': 'Webhook criado',
  'webhook.updated': 'Webhook alterado',
  'webhook.deleted': 'Webhook excluído',
  'webhook.secret_rotated': 'Chave do webhook trocada',
};

export function actionLabel(action: string) {
  return (
    ACTION_LABEL[action] ??
    action
      .toLowerCase()
      .split(/[._]/)
      .join(' ')
      .replace(/^./, (letter) => letter.toUpperCase())
  );
}

export interface FieldChange {
  field: string;
  before: unknown;
  after: unknown;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function diffFields(before: unknown, after: unknown): FieldChange[] {
  const left = isObject(before) ? before : {};
  const right = isObject(after) ? after : {};
  const fields = [...new Set([...Object.keys(left), ...Object.keys(right)])];
  return fields
    .filter((field) => JSON.stringify(left[field]) !== JSON.stringify(right[field]))
    .map((field) => ({ field, before: left[field], after: right[field] }));
}

export function statusTone(code: number) {
  if (code >= 500) {
    return 'danger' as const;
  }
  if (code >= 400) {
    return 'warning' as const;
  }
  return 'success' as const;
}
