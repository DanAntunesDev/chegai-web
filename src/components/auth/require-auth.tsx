'use client';

import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';
import type { Session } from '@/lib/api/types';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from './auth-provider';

interface RequireAuthProps {
  children: ReactNode;
  allow?: (session: Session) => boolean;
  fallback: string;
}

export function RequireAuth({ children, allow, fallback }: RequireAuthProps) {
  const { status, session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const permitted = session ? (allow ? allow(session) : true) : false;

  useEffect(() => {
    if (status === 'anonymous') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (status === 'authenticated' && !permitted) {
      router.replace(fallback);
    }
  }, [status, permitted, router, pathname, fallback]);

  if (status !== 'authenticated' || !permitted) {
    return (
      <div className="grid min-h-dvh place-items-center text-muted">
        <Spinner className="size-6" />
      </div>
    );
  }

  return children;
}
