import type { Feature, InvoiceStatus, TenantStatus } from '../api/types';

type Tone = 'neutral' | 'brand' | 'info' | 'success' | 'warning' | 'danger';

export const STATUS_LABEL: Record<TenantStatus, string> = {
  TRIAL: 'Teste',
  ACTIVE: 'Ativa',
  PAST_DUE: 'Em atraso',
  BLOCKED: 'Bloqueada',
  CANCELED: 'Cancelada',
};

export const STATUS_TONE: Record<TenantStatus, Tone> = {
  TRIAL: 'info',
  ACTIVE: 'success',
  PAST_DUE: 'warning',
  BLOCKED: 'danger',
  CANCELED: 'neutral',
};

export const INVOICE_LABEL: Record<InvoiceStatus, string> = {
  PENDING: 'Aberta',
  PAID: 'Paga',
  OVERDUE: 'Vencida',
  CANCELED: 'Cancelada',
};

export const INVOICE_TONE: Record<InvoiceStatus, Tone> = {
  PENDING: 'info',
  PAID: 'success',
  OVERDUE: 'danger',
  CANCELED: 'neutral',
};

export const FEATURE_LABEL: Record<Feature, string> = {
  public_booking: 'Agendamento online',
  whatsapp_reminders: 'Lembretes no WhatsApp',
  whatsapp_agent: 'Atendente no WhatsApp',
  deposits: 'Sinal no agendamento',
  waitlist: 'Lista de espera',
  custom_domain: 'Domínio próprio',
  basic_dashboard: 'Painel básico',
  full_dashboard: 'Painel completo',
  unit_comparison: 'Comparativo entre unidades',
  loyalty: 'Fidelidade',
  products: 'Produtos e estoque',
  hide_powered_by: 'Ocultar “Agenda por Chegaí”',
};
