'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AccountAccess } from '@/components/booking/account-access';
import { useCustomerSession } from '@/components/booking/use-customer-session';

export function CustomerLogin({ slug }: { slug: string }) {
  const router = useRouter();
  const session = useCustomerSession(slug);

  useEffect(() => {
    if (session) {
      router.replace(`/b/${slug}/cliente`);
    }
  }, [session, slug, router]);

  return <AccountAccess slug={slug} onReady={() => router.replace(`/b/${slug}/cliente`)} />;
}
