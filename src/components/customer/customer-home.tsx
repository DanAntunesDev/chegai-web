'use client';

import { CalendarPlus, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { MyBookings } from '@/components/booking/my-bookings';
import { useCustomerSession } from '@/components/booking/use-customer-session';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { clearCustomerSession } from '@/lib/public/session';

export function CustomerHome({ slug, timezone }: { slug: string; timezone: string }) {
  const router = useRouter();
  const session = useCustomerSession(slug);

  useEffect(() => {
    if (!session) {
      const timer = setTimeout(() => router.replace(`/b/${slug}/login/cliente`), 150);
      return () => clearTimeout(timer);
    }
  }, [session, slug, router]);

  if (!session) {
    return (
      <div className="grid place-items-center py-16 text-muted">
        <Spinner className="size-6" />
      </div>
    );
  }

  const first = session.customer.name.split(/\s+/)[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-sign)] text-4xl font-bold">Olá, {first}</h1>
          <p className="text-sm text-muted">Seus próximos horários ficam aqui.</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            clearCustomerSession(slug);
            router.replace(`/b/${slug}`);
          }}
        >
          <LogOut /> Sair
        </Button>
      </div>
      <Link
        href={`/b/${slug}/agendar`}
        className="flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-4 text-base font-semibold text-on-brand hover:bg-brand/90"
      >
        <CalendarPlus className="size-5" /> Marcar novo horário
      </Link>
      <MyBookings slug={slug} timezone={timezone} />
    </div>
  );
}
