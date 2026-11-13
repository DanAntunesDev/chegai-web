'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type {
  AdminTenant,
  BillingSummary,
  Branding,
  Invitation,
  Plan,
  TenantStatus,
} from '../api/types';

export const adminKeys = {
  plans: ['admin', 'plans'] as const,
  tenants: (search: string, status: string) => ['admin', 'tenants', search, status] as const,
  tenant: (id: string) => ['admin', 'tenant', id] as const,
  billing: (id: string) => ['admin', 'tenant', id, 'billing'] as const,
};

export function usePlans() {
  return useQuery({ queryKey: adminKeys.plans, queryFn: () => api<Plan[]>('/v1/admin/plans') });
}

export function useTenants(search: string, status: TenantStatus | '') {
  return useQuery({
    queryKey: adminKeys.tenants(search, status),
    queryFn: () =>
      api<AdminTenant[]>('/v1/admin/tenants', { query: { search, status: status || undefined } }),
    placeholderData: (previous) => previous,
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: adminKeys.tenant(id),
    queryFn: () => api<AdminTenant>(`/v1/admin/tenants/${id}`),
  });
}

export function useTenantBilling(id: string) {
  return useQuery({
    queryKey: adminKeys.billing(id),
    queryFn: () => api<BillingSummary>(`/v1/admin/tenants/${id}/billing`),
  });
}

export interface CreateTenantBody {
  slug: string;
  legalName: string;
  displayName: string;
  document?: string;
  email: string;
  phone?: string;
  planCode: string;
  status: TenantStatus;
  trialDays: number;
  unit: { name: string; slug?: string; city?: string; state?: string };
  owner: { email: string; name: string };
}

export function useCreateTenant() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTenantBody) =>
      api<{ tenant: AdminTenant; invitation: Invitation }>('/v1/admin/tenants', {
        method: 'POST',
        body: { ...body },
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['admin', 'tenants'] }),
  });
}

function useTenantMutation<T, B extends Record<string, unknown>>(
  id: string,
  request: (body: B) => Promise<T>,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: adminKeys.tenant(id) });
      await client.invalidateQueries({ queryKey: ['admin', 'tenants'] });
    },
  });
}

export function useUpdateTenant(id: string) {
  return useTenantMutation(id, (body: Record<string, unknown>) =>
    api<AdminTenant>(`/v1/admin/tenants/${id}`, { method: 'PATCH', body }),
  );
}

export function useUpdateBranding(id: string) {
  return useTenantMutation(id, (body: Record<string, unknown>) =>
    api<Branding>(`/v1/admin/tenants/${id}/branding`, { method: 'PUT', body }),
  );
}

export function useUploadAsset(id: string) {
  return useTenantMutation(id, ({ asset, file }: { asset: string; file: File }) => {
    const form = new FormData();
    form.append('file', file);
    return api<Branding>(`/v1/admin/tenants/${id}/branding/${asset}`, {
      method: 'POST',
      body: form,
    });
  });
}

export function useInviteMember(id: string) {
  return useMutation({
    mutationFn: (body: { email: string; name?: string; roleKey: string }) =>
      api<Invitation>(`/v1/admin/tenants/${id}/invitations`, { method: 'POST', body }),
  });
}

export function useStartSubscription(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { billingDay: number; chargeSetupFee: boolean }) =>
      api<BillingSummary>(`/v1/admin/tenants/${id}/subscription`, { method: 'POST', body }),
    onSuccess: () => client.invalidateQueries({ queryKey: adminKeys.billing(id) }),
  });
}
