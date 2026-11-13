import { CalendarClock, MapPin, Phone } from 'lucide-react';
import { notFound } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card } from '@/components/ui/card';
import { fetchBranding, fetchProfile } from '@/lib/server/public-api';

function address(unit: {
  street: string | null;
  number: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
}) {
  const line = [unit.street, unit.number].filter(Boolean).join(', ');
  const place = [unit.district, unit.city && unit.state ? `${unit.city}/${unit.state}` : unit.city]
    .filter(Boolean)
    .join(' · ');
  return [line, place].filter(Boolean).join(' — ');
}

export default async function TenantHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [branding, profile] = await Promise.all([fetchBranding(slug), fetchProfile(slug)]);
  if (!branding) {
    notFound();
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-5 py-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {branding.logoUrl ? (
            <>
              <img
                src={branding.logoUrl}
                alt={branding.displayName}
                className="h-10 w-auto dark:hidden"
              />
              <img
                src={branding.logoDarkUrl ?? branding.logoUrl}
                alt={branding.displayName}
                className="hidden h-10 w-auto dark:block"
              />
            </>
          ) : (
            <span className="grid size-10 place-items-center rounded-xl bg-brand font-display text-lg font-bold text-on-brand">
              {branding.displayName.charAt(0)}
            </span>
          )}
        </div>
        <ThemeToggle />
      </header>

      <section className="py-10">
        <h1 className="text-3xl font-bold sm:text-4xl">{branding.displayName}</h1>
        <p className="mt-2 text-muted">Escolha a unidade e agende seu horário.</p>
      </section>

      <section className="flex flex-col gap-3">
        {(profile?.units ?? []).map((unit) => (
          <Card key={unit.id} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{unit.name}</h2>
            {address(unit) ? (
              <p className="flex items-start gap-2 text-sm text-muted">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                {address(unit)}
              </p>
            ) : null}
            {unit.phone ? (
              <p className="flex items-center gap-2 text-sm text-muted">
                <Phone className="size-4" aria-hidden />
                {unit.phone}
              </p>
            ) : null}
            <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-on-brand">
              <CalendarClock className="size-4" aria-hidden />
              Agendamento online em breve
            </span>
          </Card>
        ))}
      </section>

      {branding.showPoweredBy ? (
        <footer className="mt-auto pt-12 text-center text-xs text-muted">
          Agenda por <span className="font-semibold text-foreground">Chegaí</span>
        </footer>
      ) : null}
    </div>
  );
}
