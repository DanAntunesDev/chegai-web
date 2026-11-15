import { CalendarClock, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  PoweredBy,
  TenantHeader,
  TenantHero,
  unitAddress,
} from '@/components/booking/tenant-header';
import { formatPhone } from '@/lib/phone';
import { formatMoney } from '@/lib/format';
import { fetchBranding, fetchCatalog, fetchProfile } from '@/lib/server/public-api';

export default async function TenantHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [branding, profile] = await Promise.all([fetchBranding(slug), fetchProfile(slug)]);
  if (!branding) {
    notFound();
  }
  const units = profile?.units ?? [];
  const catalog = await fetchCatalog(slug, units.length === 1 ? units[0]?.id : undefined);

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-5 py-5">
      <TenantHeader branding={branding} />
      <TenantHero branding={branding} unit={units.length === 1 ? units[0] : undefined} />

      {units.length === 1 && units[0] ? (
        <Link
          href={`/b/${branding.slug}/agendar?unidade=${units[0].id}`}
          className="flex h-16 items-center justify-center gap-3 rounded-2xl bg-foreground text-lg font-semibold text-background hover:opacity-90"
        >
          <CalendarClock className="size-5" aria-hidden /> Agendar meu horário
        </Link>
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className="font-[family-name:var(--font-sign)] text-2xl font-semibold">
            Escolha a unidade
          </h2>
          {units.map((unit) => (
            <Link
              key={unit.id}
              href={`/b/${branding.slug}/agendar?unidade=${unit.id}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 hover:border-brand"
            >
              <span>
                <span className="block text-lg font-semibold">{unit.name}</span>
                {unitAddress(unit) ? (
                  <span className="flex items-start gap-1.5 text-sm text-muted">
                    <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden /> {unitAddress(unit)}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-on-brand">
                Agendar
              </span>
            </Link>
          ))}
        </section>
      )}

      {units.length === 1 && units[0]?.phone ? (
        <a
          href={`tel:${units[0].phone}`}
          className="flex items-center justify-center gap-2 text-sm text-muted hover:text-foreground"
        >
          <Phone className="size-4" aria-hidden /> {formatPhone(units[0].phone)}
        </a>
      ) : null}

      {catalog && catalog.services.length ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-[family-name:var(--font-sign)] text-2xl font-semibold">
            Serviços e preços
          </h2>
          <ul className="overflow-hidden rounded-2xl border border-border bg-surface">
            {catalog.services.map((service, index) => (
              <li
                key={service.id}
                className={`flex items-center justify-between gap-4 px-5 py-3.5 ${index > 0 ? 'border-t border-border' : ''}`}
              >
                <span>
                  <span className="block font-medium">{service.name}</span>
                  <span className="text-sm text-muted">{service.durationMinutes} min</span>
                </span>
                <span className="font-semibold tabular-nums">
                  {formatMoney(service.priceCents)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {catalog && catalog.staff.length ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-[family-name:var(--font-sign)] text-2xl font-semibold">
            Quem vai te atender
          </h2>
          <ul className="flex flex-wrap gap-4">
            {catalog.staff.map((member) => (
              <li key={member.id} className="flex w-20 flex-col items-center gap-2 text-center">
                {member.photoUrl ? (
                  <img src={member.photoUrl} alt="" className="size-16 rounded-full object-cover" />
                ) : (
                  <span className="grid size-16 place-items-center rounded-full bg-brand/12 font-[family-name:var(--font-sign)] text-2xl font-semibold text-brand">
                    {member.name.charAt(0)}
                  </span>
                )}
                <span className="text-sm font-medium">{member.name}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <PoweredBy show={branding.showPoweredBy} />
    </div>
  );
}
