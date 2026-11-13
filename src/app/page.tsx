'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Spinner } from '@/components/ui/spinner';
import { homeFor } from '@/lib/auth/redirect';

export default function Home() {
  const { status, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'anonymous') {
      router.replace('/login');
    } else if (session) {
      router.replace(homeFor(session));
    }
  }, [status, session, router]);

  return (
    <div className="grid min-h-dvh place-items-center text-muted">
      <Spinner className="size-6" />
    </div>
  );
}
