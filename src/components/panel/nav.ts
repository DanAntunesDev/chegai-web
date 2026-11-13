import {
  Building2,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Scissors,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import type { NavItem } from '@/components/shell/app-shell';

interface PanelNavItem extends NavItem {
  permission?: string;
  description?: string;
}

export const PANEL_NAV: PanelNavItem[] = [
  {
    href: '/painel',
    label: 'Visão geral',
    icon: LayoutDashboard,
    exact: true,
    mobile: true,
    permission: 'analytics.view',
  },
  {
    href: '/painel/agenda',
    label: 'Agenda',
    icon: CalendarDays,
    mobile: true,
    description: 'Horários do dia e da semana',
  },
  {
    href: '/painel/clientes',
    label: 'Clientes',
    icon: UserRound,
    mobile: true,
    permission: 'customers.view',
    description: 'Contatos, aniversários e observações',
  },
  {
    href: '/painel/equipe',
    label: 'Equipe',
    icon: Users,
    permission: 'staff.manage',
    description: 'Barbeiros, expediente e folgas',
  },
  {
    href: '/painel/servicos',
    label: 'Serviços',
    icon: Scissors,
    permission: 'services.manage',
    description: 'Preços, duração e categorias',
  },
  {
    href: '/painel/unidades',
    label: 'Unidades',
    icon: Building2,
    permission: 'units.manage',
    description: 'Endereços e regras de agendamento',
  },
  {
    href: '/painel/assinatura',
    label: 'Assinatura',
    icon: CreditCard,
    permission: 'billing.view',
    description: 'Faturas do Chegaí',
  },
  {
    href: '/painel/seguranca',
    label: 'Segurança',
    icon: ShieldCheck,
    description: 'Verificação em duas etapas',
  },
];

export function navFor(permissions: string[] | undefined): PanelNavItem[] {
  if (!permissions) {
    return PANEL_NAV;
  }
  return PANEL_NAV.filter((item) => !item.permission || permissions.includes(item.permission));
}
