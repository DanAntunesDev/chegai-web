import type { Session } from '../api/types';
import { ApiError } from '../api/errors';
import { singleFlight } from './single-flight';

type Listener = (session: Session | null) => void;

let current: Session | null = null;
const listeners = new Set<Listener>();

export function getSession(): Session | null {
  return current;
}

export function setSession(session: Session | null) {
  current = session;
  listeners.forEach((listener) => listener(session));
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function requestRefresh(): Promise<Session | null> {
  const response = await fetch('/v1/auth/refresh', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (response.status === 401) {
    return null;
  }
  if (!response.ok) {
    throw await ApiError.from(response);
  }
  return (await response.json()) as Session;
}

async function withLock<T>(task: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && 'locks' in navigator) {
    return navigator.locks.request('chegai-refresh', task);
  }
  return task();
}

export const refreshSession = singleFlight(async () => {
  const session = await withLock(requestRefresh);
  setSession(session);
  return session;
});
