export type TenantStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'BLOCKED' | 'CANCELED';

export const TENANT_STATUSES: TenantStatus[] = [
  'TRIAL',
  'ACTIVE',
  'PAST_DUE',
  'BLOCKED',
  'CANCELED',
];

export const FEATURES = [
  'public_booking',
  'whatsapp_reminders',
  'whatsapp_agent',
  'deposits',
  'waitlist',
  'custom_domain',
  'basic_dashboard',
  'full_dashboard',
  'unit_comparison',
  'loyalty',
  'products',
  'hide_powered_by',
] as const;

export type Feature = (typeof FEATURES)[number];

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  isPlatformAdmin: boolean;
}

export interface TenantSummary {
  id: string;
  slug: string;
  displayName: string;
}

export interface Session {
  accessToken: string;
  expiresIn: number;
  user: SessionUser;
  tenant: TenantSummary | null;
  tenants: (TenantSummary & { role: string })[];
}

export interface Me {
  user: SessionUser & { twoFactorEnabled: boolean };
  tenant: TenantSummary | null;
  role: string | null;
  permissions: string[];
  tenants: (TenantSummary & { role: string })[];
}

export interface TotpSetup {
  secret: string;
  otpauthUrl: string;
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  setupFeeCents: number;
  monthlyPriceCents: number;
  extraUnitPriceCents: number;
  extraUnitSetupFeeCents: number;
  maxUnits: number | null;
  maxBarbers: number | null;
  maxReceptionists: number | null;
  aiConversationsPerMonth: number;
  features: string[];
  isActive: boolean;
}

export interface Branding {
  tenantId: string;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  iconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  allowOwnerRename: boolean;
  customDomain: string | null;
  showPoweredBy: boolean;
  emailSenderName: string | null;
}

export interface LimitOverrides {
  units?: number | null;
  barbers?: number | null;
  receptionists?: number | null;
  aiConversationsPerMonth?: number;
}

export interface FeatureOverrides {
  enabled: Feature[];
  disabled: Feature[];
}

export interface AdminTenant {
  id: string;
  slug: string;
  legalName: string;
  displayName: string;
  document: string | null;
  email: string;
  phone: string | null;
  timezone: string;
  status: TenantStatus;
  trialEndsAt: string | null;
  featureOverrides: FeatureOverrides | null;
  limitOverrides: LimitOverrides | null;
  createdAt: string;
  plan: { id: string; code: string; name: string };
  branding: Branding | null;
  unitsCount: number;
  membersCount: number;
  entitlements: {
    features: Feature[];
    limits: {
      units: number | null;
      barbers: number | null;
      receptionists: number | null;
      aiConversationsPerMonth: number;
    };
  };
}

export interface Invitation {
  id: string;
  email: string;
  link: string;
}

export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELED';

export interface Invoice {
  id: string;
  kind: 'SETUP' | 'MONTHLY';
  period: string | null;
  description: string;
  amountCents: number;
  dueDate: string;
  status: InvoiceStatus;
  paymentUrl: string | null;
  paidAt: string | null;
}

export interface BillingSummary {
  subscription: { billingDay: number; startedAt: string; canceledAt: string | null } | null;
  invoices: Invoice[];
}

export interface MonthTotals {
  revenueCents: number;
  completedBookings: number;
  averageTicketCents: number;
  occupancyRate: number;
  noShowRate: number;
  canceledBookings: number;
  newCustomers: number;
}

export interface AnalyticsSummary {
  month: string;
  current: MonthTotals;
  previous: MonthTotals;
  change: Record<
    'revenue' | 'completedBookings' | 'averageTicket' | 'occupancy' | 'noShow',
    number | null
  >;
}

export interface PublicBranding {
  slug: string;
  displayName: string;
  status: TenantStatus;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  iconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  showPoweredBy: boolean;
}

export interface PublicUnit {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  street: string | null;
  number: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  timezone: string;
}

export interface PublicProfile {
  slug: string;
  displayName: string;
  phone: string | null;
  units: PublicUnit[];
}
