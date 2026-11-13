'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api } from '@/lib/api';
import type { Session } from '@/lib/api/types';
import { getSession, refreshSession, setSession, subscribe } from '@/lib/auth/session-store';

type Status = 'loading' | 'authenticated' | 'anonymous';

export interface LoginInput {
  email: string;
  password: string;
  totpCode?: string;
}

interface AuthContextValue {
  status: Status;
  session: Session | null;
  login: (input: LoginInput) => Promise<Session>;
  logout: () => Promise<void>;
  replaceSession: (session: Session) => void;
  switchTenant: (tenantSlug: string) => Promise<Session>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setLocal] = useState<Session | null>(getSession);
  const [ready, setReady] = useState(false);

  useEffect(() => subscribe(setLocal), []);

  useEffect(() => {
    let active = true;
    refreshSession()
      .catch(() => setSession(null))
      .finally(() => {
        if (active) {
          setReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const created = await api<Session>('/v1/auth/login', { method: 'POST', body: { ...input } });
    setSession(created);
    return created;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api<void>('/v1/auth/logout', { method: 'POST' });
    } finally {
      setSession(null);
      queryClient.clear();
    }
  }, [queryClient]);

  const replaceSession = useCallback((next: Session) => setSession(next), []);

  const switchTenant = useCallback(
    async (tenantSlug: string) => {
      const next = await api<Session>('/v1/auth/switch-tenant', {
        method: 'POST',
        body: { tenantSlug },
      });
      setSession(next);
      queryClient.clear();
      return next;
    },
    [queryClient],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status: !ready ? 'loading' : session ? 'authenticated' : 'anonymous',
      session,
      login,
      logout,
      replaceSession,
      switchTenant,
    }),
    [ready, session, login, logout, replaceSession, switchTenant],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
