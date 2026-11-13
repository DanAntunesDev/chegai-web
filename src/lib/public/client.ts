import { createClient } from '../api/client';
import type { Availability } from '../panel/types';

let customerToken: string | null = null;

export function setCustomerToken(token: string | null) {
  customerToken = token;
}

export function hasCustomerToken() {
  return customerToken !== null;
}

export const publicApi = createClient({
  fetch: (...args) => fetch(...args),
  getToken: () => customerToken,
  refresh: () => Promise.resolve(null),
  onSessionLost: () => setCustomerToken(null),
});

export interface PublicService {
  id: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  priceCents: number;
  durationMinutes: number;
}

export interface PublicStaff {
  id: string;
  name: string;
  photoUrl: string | null;
  unitIds: string[];
  serviceIds: string[];
}

export interface PublicCatalog {
  categories: { id: string; name: string }[];
  services: PublicService[];
  staff: PublicStaff[];
}

export interface PublicBooking {
  id: string;
  status: string;
  unitId: string;
  startsAt: string;
  endsAt: string;
  holdExpiresAt: string | null;
  totalPriceCents: number;
  staff: { id: string; name: string };
  items: { serviceId: string; name: string; priceCents: number; durationMinutes: number }[];
}

export type { Availability };

export function eligibleStaff(staff: PublicStaff[], unitId: string, serviceIds: string[]) {
  return staff.filter(
    (member) =>
      member.unitIds.includes(unitId) && serviceIds.every((id) => member.serviceIds.includes(id)),
  );
}

export function nextDays(start: string, count: number): string[] {
  const base = new Date(`${start}T12:00:00Z`);
  return Array.from({ length: count }, (_, index) => {
    const day = new Date(base);
    day.setUTCDate(base.getUTCDate() + index);
    return day.toISOString().slice(0, 10);
  });
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function maskPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) {
    return digits.length ? `(${digits}` : '';
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
