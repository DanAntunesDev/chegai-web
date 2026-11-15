'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { useMe } from '@/components/auth/use-me';
import { moreLinks } from '@/components/panel/nav';
import { PageHeader } from '@/components/shell/app-shell';

export default function MorePage() {
  const me = useMe();
  const { session } = useAuth();
  const items = moreLinks(me.data?.permissions, session?.user.isPlatformAdmin ?? false);

  return (
    <>
      <PageHeader title="Mais" />
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 hover:bg-surface-2"
            >
              <span className="grid size-10 place-items-center rounded-lg bg-surface-2">
                <item.icon className="size-5" aria-hidden />
              </span>
              <span className="flex-1">
                <span className="block font-medium">{item.label}</span>
                {item.description ? (
                  <span className="block text-sm text-muted">{item.description}</span>
                ) : null}
              </span>
              <ChevronRight className="size-4 text-muted" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
