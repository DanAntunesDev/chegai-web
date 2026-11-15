'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { formatMoney } from '../format';

export type PaymentKind = 'DEPOSIT' | 'FULL' | 'REMAINDER';
export type PaymentStatus = 'PENDING' | 'PAID' | 'CANCELED';

export interface BookingPayment {
  id: string;
  kind: PaymentKind;
  status: PaymentStatus;
  amountCents: number;
  paymentUrl: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface PaymentSummary {
  totalCents: number;
  paidCents: number;
  dueCents: number;
  payments: BookingPayment[];
}

export interface PaymentSettings {
  depositPercent: number;
  ownAccount: boolean;
}

export const KIND_LABEL: Record<PaymentKind, string> = {
  DEPOSIT: 'Sinal',
  FULL: 'Valor total',
  REMAINDER: 'Restante',
};

const keys = {
  booking: (id: string) => ['panel', 'payments', id] as const,
  settings: ['panel', 'payment-settings'] as const,
};

export function usePaymentSummary(bookingId: string | null) {
  return useQuery({
    queryKey: keys.booking(bookingId ?? ''),
    queryFn: () => api<PaymentSummary>(`/v1/bookings/${bookingId}/payments`),
    enabled: Boolean(bookingId),
    refetchInterval: (query) =>
      query.state.data?.payments.some((payment) => payment.status === 'PENDING') ? 15_000 : false,
  });
}

export function useCreatePaymentLink(bookingId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (kind: PaymentKind) =>
      api<{ payment: BookingPayment; reused: boolean }>(`/v1/bookings/${bookingId}/payment-link`, {
        method: 'POST',
        body: { kind },
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.booking(bookingId) }),
  });
}

export function usePaymentSettings() {
  return useQuery({
    queryKey: keys.settings,
    queryFn: () => api<PaymentSettings>('/v1/payment-settings'),
  });
}

export function useSavePaymentSettings() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (depositPercent: number) =>
      api<PaymentSettings>('/v1/payment-settings', { method: 'PUT', body: { depositPercent } }),
    onSuccess: (data) => client.setQueryData(keys.settings, data),
  });
}

export function depositCents(totalCents: number, percent: number) {
  return Math.round((totalCents * percent) / 100);
}

export function paymentMessage(input: {
  customerName?: string | null;
  shopName?: string | null;
  when: string;
  kind: PaymentKind;
  amountCents: number;
  url: string;
}) {
  const first = input.customerName?.trim().split(/\s+/)[0];
  const greeting = first ? `Olá, ${first}!` : 'Olá!';
  const shop = input.shopName ? ` na ${input.shopName}` : '';
  const reason =
    input.kind === 'DEPOSIT'
      ? `Para garantir seu horário${shop}, ${input.when}, o sinal é de ${formatMoney(input.amountCents)}.`
      : input.kind === 'REMAINDER'
        ? `Segue o restante do seu atendimento${shop}, ${input.when}: ${formatMoney(input.amountCents)}.`
        : `Segue o pagamento do seu horário${shop}, ${input.when}: ${formatMoney(input.amountCents)}.`;
  return `${greeting} ${reason}\nPague por Pix ou cartão neste link: ${input.url}`;
}

export function whatsappMessageLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, '');
  const number = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
