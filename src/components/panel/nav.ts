import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  type LucideIcon,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import type { NavItem } from '@/components/shell/app-shell';

interface PanelChild {
  href: string;
  label: string;
  permission?: string;
  description?: string;
}

interface PanelNavItem {
  href?: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  mobile?: boolean;
  permission?: string;
  description?: string;
  children?: PanelChild[];
  adminOnly?: boolean;
}

export const PANEL_NAV: PanelNavItem[] = [
  {
    href: '/barbearia',
    label: 'Visão geral',
    icon: LayoutDashboard,
    exact: true,
    mobile: true,
    permission: 'analytics.view',
  },
  {
    href: '/barbearia/agenda',
    label: 'Agenda',
    icon: CalendarDays,
    mobile: true,
    description: 'Horários do dia e da semana',
  },
  {
    label: 'Cadastros',
    icon: ClipboardList,
    children: [
      {
        href: '/barbearia/clientes',
        label: 'Clientes',
        permission: 'customers.view',
        description: 'Contatos, aniversários e observações',
      },
      {
        href: '/barbearia/equipe',
        label: 'Equipe',
        permission: 'staff.manage',
        description: 'Barbeiros, expediente e folgas',
      },
      {
        href: '/barbearia/servicos',
        label: 'Serviços e combos',
        permission: 'services.manage',
        description: 'Preços, duração, categorias e combos',
      },
      {
        href: '/barbearia/unidades',
        label: 'Unidades',
        permission: 'units.manage',
        description: 'Endereços e regras de agendamento',
      },
    ],
  },
  {
    label: 'Financeiro',
    icon: Wallet,
    children: [
      {
        href: '/barbearia/pagamentos',
        label: 'Pagamentos',
        permission: 'tenant.settings.manage',
        description: 'Sinal e links de cobrança',
      },
      {
        href: '/barbearia/assinatura',
        label: 'Assinatura',
        permission: 'billing.view',
        description: 'Faturas do Chegaí',
      },
    ],
  },
  {
    href: '/barbearia/seguranca',
    label: 'Segurança',
    icon: ShieldCheck,
    adminOnly: true,
    description: 'Verificação em duas etapas',
  },
];

function allowed(permission: string | undefined, permissions: string[] | undefined) {
  return !permission || !permissions || permissions.includes(permission);
}

export function navFor(permissions: string[] | undefined, isPlatformAdmin: boolean): NavItem[] {
  return PANEL_NAV.filter((item) => (item.adminOnly ? isPlatformAdmin : true))
    .filter((item) => allowed(item.permission, permissions))
    .map((item) => ({
      ...item,
      children: item.children?.filter((child) => allowed(child.permission, permissions)),
    }))
    .filter((item) => !item.children || item.children.length > 0);
}

export function moreLinks(permissions: string[] | undefined, isPlatformAdmin: boolean) {
  return navFor(permissions, isPlatformAdmin).flatMap((item) => {
    if (item.children) {
      const source = PANEL_NAV.find((entry) => entry.label === item.label);
      return item.children.map((child) => ({
        href: child.href,
        label: child.label,
        icon: item.icon,
        description: source?.children?.find((entry) => entry.href === child.href)?.description,
      }));
    }
    if (item.mobile || !item.href) {
      return [];
    }
    const source = PANEL_NAV.find((entry) => entry.href === item.href);
    return [
      { href: item.href, label: item.label, icon: item.icon, description: source?.description },
    ];
  });
}
