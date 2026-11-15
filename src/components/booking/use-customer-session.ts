'use client';

import { useSyncExternalStore } from 'react';
import { getCustomerSession, subscribeCustomerSession } from '@/lib/public/session';

export function useCustomerSession(slug: string) {
  return useSyncExternalStore(
    subscribeCustomerSession,
    () => getCustomerSession(slug),
    () => null,
  );
}
