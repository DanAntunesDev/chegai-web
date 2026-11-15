import { setCustomerToken } from './client';

export interface CustomerProfile {
  name: string;
  email: string | null;
  phone: string;
}

export interface CustomerSession {
  token: string;
  expiresAt: number;
  customer: CustomerProfile;
}

type Listener = () => void;

const listeners = new Set<Listener>();
const cache = new Map<string, CustomerSession | null>();
const key = (slug: string) => `chegai.customer.${slug}`;

function read(slug: string): CustomerSession | null {
  try {
    const raw = window.sessionStorage.getItem(key(slug));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as CustomerSession;
    return parsed.expiresAt > Date.now() ? parsed : null;
  } catch {
    return null;
  }
}

export function getCustomerSession(slug: string): CustomerSession | null {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!cache.has(slug)) {
    cache.set(slug, read(slug));
  }
  const session = cache.get(slug) ?? null;
  if (session && session.expiresAt <= Date.now()) {
    clearCustomerSession(slug);
    return null;
  }
  setCustomerToken(session?.token ?? null);
  return session;
}

export function saveCustomerSession(
  slug: string,
  data: { token: string; expiresInSeconds: number; customer: CustomerProfile },
) {
  const session: CustomerSession = {
    token: data.token,
    expiresAt: Date.now() + data.expiresInSeconds * 1000,
    customer: data.customer,
  };
  cache.set(slug, session);
  setCustomerToken(session.token);
  try {
    window.sessionStorage.setItem(key(slug), JSON.stringify(session));
  } catch {
    cache.set(slug, session);
  }
  listeners.forEach((listener) => listener());
}

export function clearCustomerSession(slug: string) {
  cache.set(slug, null);
  setCustomerToken(null);
  try {
    window.sessionStorage.removeItem(key(slug));
  } catch {
    cache.set(slug, null);
  }
  listeners.forEach((listener) => listener());
}

export function subscribeCustomerSession(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
