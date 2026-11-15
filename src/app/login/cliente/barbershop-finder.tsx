'use client';

import { MapPin, Search } from 'lucide-react';
import Link from 'next/link';
import { useDeferredValue, useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { publicApi } from '@/lib/public/client';

interface FoundBarbershop {
  slug: string;
  displayName: string;
  iconUrl: string | null;
  primaryColor: string;
  city: string | null;
  state: string | null;
}

export function BarbershopFinder() {
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query.trim());
  const [results, setResults] = useState<FoundBarbershop[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (deferred.length < 3) {
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const found = await publicApi<FoundBarbershop[]>('/v1/public/tenants', {
          query: { q: deferred },
        });
        if (active) {
          setResults(found);
        }
      } catch {
        if (active) {
          setResults([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [deferred]);

  const visible = deferred.length >= 3 ? results : null;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-semibold">Área do cliente</h2>
        <p className="mt-1 text-sm text-muted">
          Procure a barbearia onde você marca seus horários.
        </p>
      </div>
      <label className="relative block">
        <span className="sr-only">Nome da barbearia</span>
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nome da barbearia"
          className="h-12 w-full rounded-xl border border-border bg-background pr-10 pl-11 text-base outline-none placeholder:text-muted focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20"
        />
        {loading ? (
          <Spinner className="absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted" />
        ) : null}
      </label>
      {visible ? (
        visible.length ? (
          <ul className="flex flex-col gap-2">
            {visible.map((shop) => (
              <li key={shop.slug}>
                <Link
                  href={`/b/${shop.slug}/login/cliente`}
                  className="flex items-center gap-3 rounded-xl border border-border px-3 py-3 hover:bg-surface-2"
                >
                  {shop.iconUrl ? (
                    <img src={shop.iconUrl} alt="" className="size-10 rounded-lg object-cover" />
                  ) : (
                    <span
                      className="grid size-10 place-items-center rounded-lg text-sm font-bold text-white"
                      style={{ backgroundColor: shop.primaryColor }}
                    >
                      {shop.displayName.slice(0, 1)}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{shop.displayName}</span>
                    {shop.city ? (
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <MapPin className="size-3" /> {shop.city}
                        {shop.state ? ` - ${shop.state}` : ''}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Nenhuma barbearia com esse nome.</p>
        )
      ) : (
        <p className="text-xs text-muted">Digite pelo menos 3 letras.</p>
      )}
    </div>
  );
}
