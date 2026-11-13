import { createClient } from './client';
import { getSession, refreshSession, setSession } from '../auth/session-store';

export const api = createClient({
  fetch: (...args) => fetch(...args),
  getToken: () => getSession()?.accessToken ?? null,
  refresh: async () => {
    try {
      return (await refreshSession())?.accessToken ?? null;
    } catch {
      return null;
    }
  },
  onSessionLost: () => setSession(null),
});
