export interface Unit {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  street: string | null;
  number: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  timezone: string;
  slotIntervalMinutes: number;
  minAdvanceMinutes: number;
  maxAdvanceDays: number;
  noShowAfterMinutes: number;
  holdMinutes: number;
  checkInOpensMinutes: number;
  isActive: boolean;
}

export type StaffKind = 'BARBER' | 'RECEPTIONIST' | 'MANAGER';

export interface Staff {
  id: string;
  kind: StaffKind;
  name: string;
  nickname: string | null;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  isActive: boolean;
  units: { unitId: string }[];
}

export interface WorkingInterval {
  unitId: string;
  weekday: number;
  start: string;
  end: string;
}

export interface StaffDetail extends Staff {
  workingHours: (WorkingInterval & { id: string })[];
  services: {
    serviceId: string;
    priceCents: number | null;
    durationMinutes: number | null;
    service: { id: string; name: string };
  }[];
}

export type BlockKind = 'VACATION' | 'DAY_OFF' | 'BREAK' | 'BLOCK';

export interface ScheduleBlock {
  id: string;
  kind: BlockKind;
  startsAt: string;
  endsAt: string;
  reason: string | null;
}

export interface Category {
  id: string;
  name: string;
  position: number;
}

export interface Service {
  id: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  priceCents: number;
  durationMinutes: number;
  bufferMinutes: number;
  position: number;
  isActive: boolean;
  category: { id: string; name: string } | null;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  birthDate: string | null;
  notes: string | null;
  tags: string[];
  marketingOptIn: boolean;
  createdAt: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Booking {
  id: string;
  unitId: string;
  staffId: string;
  customerId: string | null;
  status: import('./agenda').BookingStatus;
  source: 'PANEL' | 'PUBLIC' | 'WHATSAPP';
  startsAt: string;
  endsAt: string;
  totalPriceCents: number;
  notes: string | null;
  cancelReason: string | null;
  items: {
    id: string;
    serviceId: string;
    name: string;
    priceCents: number;
    durationMinutes: number;
  }[];
  staff: { id: string; name: string; nickname: string | null };
  customer: { id: string; name: string; phone: string } | null;
}

export interface BookingEvent {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  reason: string | null;
  createdAt: string;
}

export interface AvailabilitySlot {
  time: string;
  startsAt: string;
  staff: { id: string; name: string; durationMinutes: number; priceCents: number }[];
}

export interface Availability {
  date: string;
  timezone: string;
  slots: AvailabilitySlot[];
}
