'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, CheckCircle2, Clock, User } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError, describeError } from '@/lib/api/errors';
import type { PublicUnit } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { localDateOf, minuteOfDay, timeLabel, weekdayOf } from '@/lib/panel/agenda';
import { WEEKDAYS_SHORT } from '@/lib/panel/schedule';
import {
  type Availability,
  eligibleStaff,
  nextDays,
  type PublicBooking,
  type PublicCatalog,
  publicApi,
} from '@/lib/public/client';
import { PhoneVerification } from './phone-verification';

type Step = 'unit' | 'services' | 'staff' | 'time' | 'identify' | 'done';

const ANY = 'any';

export function BookingFlow({
  slug,
  units,
  initialUnitId,
}: {
  slug: string;
  units: PublicUnit[];
  initialUnitId?: string;
}) {
  const base = `/v1/public/tenants/${slug}`;
  const startUnit =
    units.find((unit) => unit.id === initialUnitId) ?? (units.length === 1 ? units[0] : undefined);
  const [unitId, setUnitId] = useState(startUnit?.id ?? '');
  const [step, setStep] = useState<Step>(startUnit ? 'services' : 'unit');
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [staffId, setStaffId] = useState(ANY);
  const unit = units.find((item) => item.id === unitId);
  const timezone = unit?.timezone ?? 'America/Sao_Paulo';
  const today = localDateOf(new Date(), timezone);
  const [date, setDate] = useState(today);
  const [slot, setSlot] = useState<{ startsAt: string; staffId: string; staffName: string } | null>(
    null,
  );
  const [booking, setBooking] = useState<PublicBooking | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const catalog = useQuery({
    queryKey: ['public', slug, 'catalog', unitId],
    queryFn: () => publicApi<PublicCatalog>(`${base}/catalog`, { query: { unitId } }),
    enabled: Boolean(unitId),
  });

  const availability = useQuery({
    queryKey: ['public', slug, 'availability', unitId, date, serviceIds.join(','), staffId],
    queryFn: () =>
      publicApi<Availability>(`${base}/availability`, {
        query: {
          unitId,
          date,
          serviceIds: serviceIds.join(','),
          staffId: staffId === ANY ? undefined : staffId,
        },
      }),
    enabled: step === 'time' && Boolean(unitId && serviceIds.length),
  });

  const chosen = useMemo(
    () => catalog.data?.services.filter((service) => serviceIds.includes(service.id)) ?? [],
    [catalog.data, serviceIds],
  );
  const total = chosen.reduce((sum, item) => sum + item.priceCents, 0);
  const duration = chosen.reduce((sum, item) => sum + item.durationMinutes, 0);
  const barbers = catalog.data ? eligibleStaff(catalog.data.staff, unitId, serviceIds) : [];

  const finish = async ({ name }: { phone: string; name: string }) => {
    if (!slot) {
      return;
    }
    setFailure(null);
    try {
      const hold = await publicApi<PublicBooking>(`${base}/bookings/holds`, {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: { unitId, serviceIds, startsAt: slot.startsAt, staffId: slot.staffId },
      });
      const confirmed = await publicApi<PublicBooking>(`${base}/bookings/${hold.id}/confirm`, {
        method: 'POST',
        body: { name },
      });
      setBooking(confirmed);
      setStep('done');
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.code === 'SLOT_TAKEN' || error.code === 'SLOT_UNAVAILABLE')
      ) {
        setSlot(null);
        setStep('time');
        setFailure('Esse horário acabou de ser ocupado. Escolha outro, por favor.');
        return;
      }
      throw error;
    }
  };

  const back: Partial<Record<Step, Step>> = {
    services: units.length > 1 ? 'unit' : undefined,
    staff: 'services',
    time: 'staff',
    identify: 'time',
  };

  const summary = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
      {chosen.length ? <span>{chosen.map((item) => item.name).join(' + ')}</span> : null}
      {duration ? (
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" aria-hidden /> {duration} min
        </span>
      ) : null}
      {total ? <span className="font-semibold text-foreground">{formatMoney(total)}</span> : null}
    </div>
  );

  if (step === 'done' && booking) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <CheckCircle2 className="size-14 text-success" aria-hidden />
        <h2 className="text-2xl font-bold">Horário confirmado!</h2>
        <p className="text-muted">
          {new Intl.DateTimeFormat('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            timeZone: timezone,
          }).format(new Date(booking.startsAt))}{' '}
          às {timeLabel(minuteOfDay(booking.startsAt, timezone))} com {booking.staff.name}
        </p>
        <p className="text-sm">
          {booking.items.map((item) => item.name).join(' + ')} ·{' '}
          {formatMoney(booking.totalPriceCents)}
        </p>
        <p className="text-sm text-muted">Você recebe um lembrete no WhatsApp antes do horário.</p>
        <Link
          href={`/b/${slug}/meus-horarios`}
          className="text-sm font-medium text-brand-2 hover:underline"
        >
          Ver ou cancelar meus horários
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {back[step] ? (
        <button
          type="button"
          onClick={() => setStep(back[step]!)}
          className="inline-flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Voltar
        </button>
      ) : null}

      {step === 'unit' ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Qual unidade?</h2>
          {units.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setUnitId(item.id);
                setServiceIds([]);
                setStep('services');
              }}
              className="rounded-xl border border-border bg-surface p-4 text-left hover:border-brand/50"
            >
              <span className="block font-medium">{item.name}</span>
              <span className="text-sm text-muted">
                {[item.street, item.number, item.district].filter(Boolean).join(', ')}
              </span>
            </button>
          ))}
        </section>
      ) : null}

      {step === 'services' ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">O que você vai fazer?</h2>
          {catalog.isPending ? <Skeleton className="h-48" /> : null}
          {catalog.error ? <Alert>{describeError(catalog.error)}</Alert> : null}
          {catalog.data
            ? [...catalog.data.categories, { id: '', name: 'Outros' }].map((category) => {
                const items = catalog.data.services.filter(
                  (service) => (service.categoryId ?? '') === category.id,
                );
                if (items.length === 0) {
                  return null;
                }
                return (
                  <div key={category.id || 'other'} className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold text-muted">{category.name}</h3>
                    {items.map((service) => {
                      const active = serviceIds.includes(service.id);
                      return (
                        <button
                          key={service.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            setServiceIds((current) =>
                              active
                                ? current.filter((id) => id !== service.id)
                                : [...current, service.id].slice(0, 5),
                            )
                          }
                          className={cn(
                            'flex items-center gap-3 rounded-xl border p-4 text-left transition-colors',
                            active
                              ? 'border-brand bg-brand/8'
                              : 'border-border bg-surface hover:border-brand/40',
                          )}
                        >
                          <span
                            className={cn(
                              'grid size-5 shrink-0 place-items-center rounded-md border',
                              active ? 'border-brand bg-brand text-on-brand' : 'border-border',
                            )}
                            aria-hidden
                          >
                            {active ? <Check className="size-3.5" /> : null}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium">{service.name}</span>
                            {service.description ? (
                              <span className="block text-sm text-muted">
                                {service.description}
                              </span>
                            ) : null}
                            <span className="text-xs text-muted">
                              {service.durationMinutes} min
                            </span>
                          </span>
                          <span className="font-semibold tabular-nums">
                            {formatMoney(service.priceCents)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })
            : null}
        </section>
      ) : null}

      {step === 'staff' ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Com quem?</h2>
          {summary}
          {[{ id: ANY, name: 'Qualquer profissional', photoUrl: null }, ...barbers].map(
            (member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => {
                  setStaffId(member.id);
                  setSlot(null);
                  setStep('time');
                }}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left hover:border-brand/50"
              >
                {member.photoUrl ? (
                  <img src={member.photoUrl} alt="" className="size-11 rounded-full object-cover" />
                ) : (
                  <span className="grid size-11 place-items-center rounded-full bg-brand/12 font-semibold text-brand">
                    {member.id === ANY ? (
                      <User className="size-5" aria-hidden />
                    ) : (
                      member.name.charAt(0)
                    )}
                  </span>
                )}
                <span className="font-medium">{member.name}</span>
              </button>
            ),
          )}
        </section>
      ) : null}

      {step === 'time' ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Quando?</h2>
          {summary}
          {failure ? <Alert>{failure}</Alert> : null}
          <div
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
            role="radiogroup"
            aria-label="Dia"
          >
            {nextDays(today, 21).map((day) => (
              <button
                key={day}
                type="button"
                role="radio"
                aria-checked={day === date}
                onClick={() => {
                  setDate(day);
                  setSlot(null);
                }}
                className={cn(
                  'flex w-14 shrink-0 flex-col items-center rounded-xl border py-2 text-sm',
                  day === date ? 'border-brand bg-brand text-on-brand' : 'border-border bg-surface',
                )}
              >
                <span className="text-[11px] uppercase opacity-80">
                  {day === today ? 'Hoje' : WEEKDAYS_SHORT[weekdayOf(day)]}
                </span>
                <span className="font-display text-lg font-semibold">{day.slice(8)}</span>
              </button>
            ))}
          </div>
          {availability.isPending ? <Skeleton className="h-32" /> : null}
          {availability.error ? <Alert>{describeError(availability.error)}</Alert> : null}
          {availability.data ? (
            availability.data.slots.filter((item) => item.staff.length).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                Sem horários nesse dia. Tente outro.
              </p>
            ) : (
              <div
                className="grid grid-cols-4 gap-2 sm:grid-cols-5"
                role="radiogroup"
                aria-label="Horário"
              >
                {availability.data.slots
                  .filter((item) => item.staff.length)
                  .map((item) => {
                    const selected = slot?.startsAt === item.startsAt;
                    const first = item.staff[0]!;
                    return (
                      <button
                        key={item.startsAt}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() =>
                          setSlot({
                            startsAt: item.startsAt,
                            staffId: first.id,
                            staffName: first.name,
                          })
                        }
                        className={cn(
                          'rounded-lg border py-2.5 text-sm font-medium tabular-nums',
                          selected
                            ? 'border-brand bg-brand text-on-brand'
                            : 'border-border bg-surface hover:border-brand/50',
                        )}
                      >
                        {item.time}
                      </button>
                    );
                  })}
              </div>
            )
          ) : null}
        </section>
      ) : null}

      {step === 'identify' && slot ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Quase lá</h2>
          <div className="rounded-xl border border-border bg-surface p-4 text-sm">
            <p className="font-medium">
              {new Intl.DateTimeFormat('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                timeZone: timezone,
              }).format(new Date(slot.startsAt))}{' '}
              às {timeLabel(minuteOfDay(slot.startsAt, timezone))} com {slot.staffName}
            </p>
            {summary}
          </div>
          {failure ? <Alert>{failure}</Alert> : null}
          <PhoneVerification
            slug={slug}
            askName
            submitLabel="Confirmar horário"
            onVerified={finish}
          />
        </section>
      ) : null}

      {step === 'services' || step === 'time' ? (
        <div className="sticky bottom-0 -mx-5 border-t border-border bg-background/95 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
          <Button
            size="lg"
            className="w-full"
            disabled={step === 'services' ? serviceIds.length === 0 : !slot}
            onClick={() => setStep(step === 'services' ? 'staff' : 'identify')}
          >
            {step === 'services'
              ? serviceIds.length
                ? `Continuar · ${formatMoney(total)}`
                : 'Escolha um serviço'
              : slot
                ? `Continuar · ${timeLabel(minuteOfDay(slot.startsAt, timezone))}`
                : 'Escolha um horário'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
