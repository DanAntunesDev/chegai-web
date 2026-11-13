'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Me } from '@/lib/api/types';
import { useAuth } from './auth-provider';

export function useMe() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['me', session?.user.id, session?.tenant?.id],
    queryFn: () => api<Me>('/v1/auth/me'),
    enabled: Boolean(session),
  });
}
