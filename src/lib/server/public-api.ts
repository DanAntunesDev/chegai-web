import 'server-only';
import type { PublicBranding, PublicProfile } from '../api/types';
import { isValidSlug } from '../tenancy/resolve';

export function apiBase(): string {
  return (process.env.API_URL ?? 'http://localhost:3333').replace(/\/$/, '');
}

async function getJson<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    const response = await fetch(`${apiBase()}${path}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate },
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function fetchBranding(slug: string): Promise<PublicBranding | null> {
  if (!isValidSlug(slug)) {
    return Promise.resolve(null);
  }
  return getJson<PublicBranding>(`/v1/public/tenants/${slug}/branding`, 60);
}

export function fetchProfile(slug: string): Promise<PublicProfile | null> {
  if (!isValidSlug(slug)) {
    return Promise.resolve(null);
  }
  return getJson<PublicProfile>(`/v1/public/tenants/${slug}`, 60);
}
