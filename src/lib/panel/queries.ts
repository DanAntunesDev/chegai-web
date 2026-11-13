'use client';

import { type QueryKey, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { RequestOptions } from '../api/client';
import type {
  Category,
  Customer,
  Page,
  ScheduleBlock,
  Service,
  Staff,
  StaffDetail,
  Unit,
  WorkingInterval,
} from './types';

export const panelKeys = {
  units: ['panel', 'units'] as const,
  staff: ['panel', 'staff'] as const,
  staffMember: (id: string) => ['panel', 'staff', id] as const,
  blocks: (id: string, from: string, to: string) =>
    ['panel', 'staff', id, 'blocks', from, to] as const,
  categories: ['panel', 'categories'] as const,
  services: ['panel', 'services'] as const,
  customers: (search: string, tag: string, page: number) =>
    ['panel', 'customers', search, tag, page] as const,
};

type Body = Record<string, unknown>;

function useApiMutation<T, V>(request: (variables: V) => Promise<T>, invalidate: QueryKey[]) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: async () => {
      await Promise.all(invalidate.map((queryKey) => client.invalidateQueries({ queryKey })));
    },
  });
}

const send = <T>(path: string, method: RequestOptions['method'], body?: Body) =>
  api<T>(path, { method, body });

export function useUnits() {
  return useQuery({ queryKey: panelKeys.units, queryFn: () => api<Unit[]>('/v1/units') });
}

export function useSaveUnit() {
  return useApiMutation(
    ({ id, body }: { id?: string; body: Body }) =>
      id ? send<Unit>(`/v1/units/${id}`, 'PATCH', body) : send<Unit>('/v1/units', 'POST', body),
    [panelKeys.units],
  );
}

export function useDeleteUnit() {
  return useApiMutation((id: string) => send<void>(`/v1/units/${id}`, 'DELETE'), [panelKeys.units]);
}

export function useStaffList() {
  return useQuery({ queryKey: panelKeys.staff, queryFn: () => api<Staff[]>('/v1/staff') });
}

export function useStaffMember(id: string) {
  return useQuery({
    queryKey: panelKeys.staffMember(id),
    queryFn: () => api<StaffDetail>(`/v1/staff/${id}`),
  });
}

export function useSaveStaff() {
  return useApiMutation(
    ({ id, body }: { id?: string; body: Body }) =>
      id ? send<Staff>(`/v1/staff/${id}`, 'PATCH', body) : send<Staff>('/v1/staff', 'POST', body),
    [panelKeys.staff],
  );
}

export function useDeleteStaff() {
  return useApiMutation((id: string) => send<void>(`/v1/staff/${id}`, 'DELETE'), [panelKeys.staff]);
}

export function useSaveWorkingHours(id: string) {
  return useApiMutation(
    (intervals: WorkingInterval[]) =>
      send<void>(`/v1/staff/${id}/working-hours`, 'PUT', { intervals }),
    [panelKeys.staffMember(id)],
  );
}

export function useSaveStaffServices(id: string) {
  return useApiMutation(
    (services: { serviceId: string; priceCents?: number; durationMinutes?: number }[]) =>
      send<void>(`/v1/staff/${id}/services`, 'PUT', { services }),
    [panelKeys.staffMember(id)],
  );
}

export function useBlocks(id: string, from: string, to: string) {
  return useQuery({
    queryKey: panelKeys.blocks(id, from, to),
    queryFn: () => api<ScheduleBlock[]>(`/v1/staff/${id}/blocks`, { query: { from, to } }),
  });
}

export function useCreateBlock(id: string) {
  return useApiMutation(
    (body: Body) => send<ScheduleBlock>(`/v1/staff/${id}/blocks`, 'POST', body),
    [['panel', 'staff', id, 'blocks']],
  );
}

export function useDeleteBlock(id: string) {
  return useApiMutation(
    (blockId: string) => send<void>(`/v1/staff/${id}/blocks/${blockId}`, 'DELETE'),
    [['panel', 'staff', id, 'blocks']],
  );
}

export function useCategories() {
  return useQuery({
    queryKey: panelKeys.categories,
    queryFn: () => api<Category[]>('/v1/service-categories'),
  });
}

export function useSaveCategory() {
  return useApiMutation(
    ({ id, body }: { id?: string; body: Body }) =>
      id
        ? send<Category>(`/v1/service-categories/${id}`, 'PATCH', body)
        : send<Category>('/v1/service-categories', 'POST', body),
    [panelKeys.categories, panelKeys.services],
  );
}

export function useDeleteCategory() {
  return useApiMutation(
    (id: string) => send<void>(`/v1/service-categories/${id}`, 'DELETE'),
    [panelKeys.categories, panelKeys.services],
  );
}

export function useServices() {
  return useQuery({
    queryKey: panelKeys.services,
    queryFn: () => api<Service[]>('/v1/services', { query: { includeInactive: 'true' } }),
  });
}

export function useSaveService() {
  return useApiMutation(
    ({ id, body }: { id?: string; body: Body }) =>
      id
        ? send<Service>(`/v1/services/${id}`, 'PATCH', body)
        : send<Service>('/v1/services', 'POST', body),
    [panelKeys.services],
  );
}

export function useDeleteService() {
  return useApiMutation(
    (id: string) => send<void>(`/v1/services/${id}`, 'DELETE'),
    [panelKeys.services],
  );
}

export function useCustomers(search: string, tag: string, page: number) {
  return useQuery({
    queryKey: panelKeys.customers(search, tag, page),
    queryFn: () =>
      api<Page<Customer>>('/v1/customers', {
        query: { search: search || undefined, tag: tag || undefined, page, pageSize: 20 },
      }),
    placeholderData: (previous) => previous,
  });
}

export function useSaveCustomer() {
  return useApiMutation(
    ({ id, body }: { id?: string; body: Body }) =>
      id
        ? send<Customer>(`/v1/customers/${id}`, 'PATCH', body)
        : send<Customer>('/v1/customers', 'POST', body),
    [['panel', 'customers']],
  );
}

export function useDeleteCustomer() {
  return useApiMutation(
    (id: string) => send<void>(`/v1/customers/${id}`, 'DELETE'),
    [['panel', 'customers']],
  );
}
