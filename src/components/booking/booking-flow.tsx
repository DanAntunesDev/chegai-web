'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarPlus, Check, Clock, Scissors, Sparkles, User } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError, describeError } from '@/lib/api/errors';
import type { PublicUnit } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { applyCombos, comboSavings } from '@/lib/combos';
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
import { clearCustomerSession } from '@/lib/public/session';
import { AccountAccess } from './account-access';
import { DepositStep } from './deposit-step';
import { calendarFile } from './calendar-file';
import { unitAddress } from './tenant-header';
import { useCustomerSession } from './use-customer-session';

type Step = 'unit' | 'services' | 'staff' | 'time' | 'confirm' | 'payment' | 'done';

const STEPS: { key: Step; label: string }[] = [
  { key: 'services', label: 'Serviço' },
  { key: 'staff', label: 'Profissional' },
  { key: 'time', label: 'Horário' },
  { key: 'confirm', label: 'Confirmar' },
];

const ANY = 'any';

const LONG_DAY = (timeZone: string) =>
  new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone });

function period(minutes: number) {
  if (minutes < 12 * 60) return 'Manhã';
  if (minutes < 18 * 60) return 'Tarde';
  return 'Noite';
}

function Stepper({ step, onJump }: { step: Step; onJump: (step: Step) => void }) {
  const index = STEPS.findIndex((item) => item.key === step);
  return (
    <ol className="flex items-center gap-2" aria-label="Etapas do agendamento">
      {STEPS.map((item, position) => {
        const done = position < index;
        const current = position === index;
        return (
          <li key={item.key} className="flex flex-1 flex-col gap-1.5">
            <button
              type="button"
              disabled={!done}
              onClick={() => onJump(item.key)}
              aria-current={current ? 'step' : undefined}
              className="h-1.5 w-full rounded-full bg-surface-2 enabled:cursor-pointer"
            >
              <span
                className={cn(
                  'block h-full rounded-full bg-brand transition-[width] duration-300',
                  done || current ? 'w-full' : 'w-0',
                  current && 'opacity-60',
                )}
              />
            </button>
            <span
              className={cn('text-xs', current ? 'font-semibold text-foreground' : 'text-muted')}
            >
              {item.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function BookingFlow({
  slug,
  units,
  initialUnitId,
  shopName,
  deposit,
}: {
  slug: string;
  units: PublicUnit[];
  initialUnitId?: string;
  shopName: string;
  deposit?: { required: boolean; percent: number };
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
  const [confirming, setConfirming] = useState(false);
  const customer = useCustomerSession(slug);

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

  const services = useMemo(() => catalog.data?.services ?? [], [catalog.data]);
  const chosen = useMemo(
    () => services.filter((service) => serviceIds.includes(service.id)),
    [services, serviceIds],
  );
  const covered = useMemo(() => {
    const map = new Map<string, string>();
    for (const service of chosen) {
      for (const item of service.includes ?? []) {
        map.set(item, service.name);
      }
    }
    return map;
  }, [chosen]);
  const total = chosen.reduce((sum, item) => sum + item.priceCents, 0);
  const depositShare = deposit?.required ? Math.round((total * deposit.percent) / 100) : 0;
  const depositCents = depositShare >= 500 ? depositShare : 0;
  const duration = chosen.reduce((sum, item) => sum + item.durationMinutes, 0);
  const savings = chosen.reduce((sum, item) => sum + comboSavings(item.id, services), 0);
  const barbers = catalog.data ? eligibleStaff(catalog.data.staff, unitId, serviceIds) : [];
  const staffName =
    staffId === ANY
      ? 'Primeiro profissional livre'
      : barbers.find((item) => item.id === staffId)?.name;

  const toggleService = (id: string) => {
    const next = serviceIds.includes(id)
      ? serviceIds.filter((item) => item !== id)
      : [...serviceIds, id];
    setServiceIds(applyCombos(next, services).slice(0, 5));
    setSlot(null);
  };

  const slots = (availability.data?.slots ?? []).filter((item) => item.staff.length > 0);
  const grouped = slots.reduce<Record<string, typeof slots>>((acc, item) => {
    const [hours = 0, minutes = 0] = item.time.split(':').map(Number);
    const key = period(hours * 60 + minutes);
    acc[key] = [...(acc[key] ?? []), item];
    return acc;
  }, {});

  const onPaid = useCallback(() => {
    setBooking((current) =>
      current ? { ...current, status: 'CONFIRMED', payment: undefined } : current,
    );
    setStep('done');
  }, []);

  const finish = async () => {
    if (!slot || !customer) {
      return;
    }
    setFailure(null);
    setConfirming(true);
    try {
      const hold = await publicApi<PublicBooking>(`${base}/bookings/holds`, {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: { unitId, serviceIds, startsAt: slot.startsAt, staffId: slot.staffId },
      });
      const confirmed = await publicApi<PublicBooking>(`${base}/bookings/${hold.id}/confirm`, {
        method: 'POST',
        body: { name: customer.customer.name },
      });
      setBooking(confirmed);
      setStep(confirmed.payment ? 'payment' : 'done');
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.code === 'SLOT_TAKEN' || error.code === 'SLOT_UNAVAILABLE')
      ) {
        setSlot(null);
        setStep('time');
        setFailure('Alguém acabou de pegar esse horário. Escolha outro, por favor.');
      } else if (error instanceof ApiError && error.code === 'INVALID_CUSTOMER_TOKEN') {
        clearCustomerSession(slug);
        setFailure('Sua sessão expirou. Entre de novo para confirmar.');
      } else if (error instanceof ApiError && error.code === 'PAYMENT_PROVIDER_ERROR') {
        setFailure(
          'Não conseguimos gerar o pagamento do sinal agora. Tente de novo em instantes ou fale com a barbearia.',
        );
      } else {
        setFailure(describeError(error));
      }
    } finally {
      setConfirming(false);
    }
  };

  const back: Partial<Record<Step, Step>> = {
    services: units.length > 1 ? 'unit' : undefined,
    staff: 'services',
    time: 'staff',
    confirm: 'time',
  };

  const summary = (
    <div className="flex flex-col gap-4">
      <h2 className="font-[family-name:var(--font-sign)] text-2xl font-semibold">Seu horário</h2>
      {chosen.length === 0 ? (
        <p className="text-sm text-muted">
          Escolha o que vai fazer e a gente monta o resto com você.
        </p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          {chosen.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span>{item.name}</span>
              <span className="tabular-nums">{formatMoney(item.priceCents)}</span>
            </li>
          ))}
        </ul>
      )}
      {staffName && step !== 'services' ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <User className="size-4" aria-hidden /> {slot?.staffName ?? staffName}
        </p>
      ) : null}
      {slot ? (
        <p className="flex items-center gap-2 text-sm text-muted first-letter:uppercase">
          <Clock className="size-4" aria-hidden />
          {LONG_DAY(timezone).format(new Date(slot.startsAt))},{' '}
          {timeLabel(minuteOfDay(slot.startsAt, timezone))}
        </p>
      ) : null}
      {chosen.length ? (
        <div className="flex items-end justify-between border-t border-border pt-4">
          <span className="text-sm text-muted">{duration} min</span>
          <span className="text-right">
            {savings ? (
              <span className="block text-xs font-medium text-success">
                Economia de {formatMoney(savings)}
              </span>
            ) : null}
            <span className="text-xl font-semibold tabular-nums">{formatMoney(total)}</span>
          </span>
        </div>
      ) : null}
    </div>
  );

  const nextAction =
    step === 'services'
      ? {
          label: 'Escolher profissional',
          disabled: serviceIds.length === 0,
          go: () => setStep('staff'),
        }
      : step === 'time'
        ? { label: 'Revisar e confirmar', disabled: !slot, go: () => setStep('confirm') }
        : null;

  const payment = booking?.payment;
  if (step === 'payment' && booking && payment) {
    const start = new Date(booking.startsAt);
    return (
      <DepositStep
        slug={slug}
        booking={{ ...booking, payment }}
        when={`${LONG_DAY(timezone).format(start)} às ${timeLabel(minuteOfDay(booking.startsAt, timezone))}`}
        onPaid={onPaid}
        onExpired={() => {
          setBooking(null);
          setSlot(null);
          setStep('time');
        }}
      />
    );
  }

  if (step === 'done' && booking) {
    const when = new Date(booking.startsAt);
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 py-6 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-brand text-on-brand">
          <Check className="size-10" strokeWidth={2.5} aria-hidden />
        </span>
        <div>
          <h2 className="font-[family-name:var(--font-sign)] text-4xl font-bold">Tá marcado!</h2>
          <p className="mt-2 text-muted">
            Te esperamos {LONG_DAY(timezone).format(when)} às{' '}
            {timeLabel(minuteOfDay(booking.startsAt, timezone))}.
          </p>
        </div>
        <div className="w-full rounded-2xl border border-border bg-surface p-5 text-left">
          <p className="font-medium">{booking.items.map((item) => item.name).join(' + ')}</p>
          <p className="mt-1 text-sm text-muted">com {booking.staff.name}</p>
          {unit && unitAddress(unit) ? (
            <p className="mt-1 text-sm text-muted">{unitAddress(unit)}</p>
          ) : null}
          <p className="mt-3 text-lg font-semibold tabular-nums">
            {formatMoney(booking.totalPriceCents)}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <a
            href={calendarFile({
              title: `${booking.items.map((item) => item.name).join(' + ')} – ${shopName}`,
              start: booking.startsAt,
              end: booking.endsAt,
              location: unit ? unitAddress(unit) : '',
            })}
            download="horario.ics"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-medium hover:bg-surface-2 sm:flex-1"
          >
            <CalendarPlus className="size-4" aria-hidden /> Salvar na agenda do celular
          </a>
          <Link
            href={`/b/${slug}/cliente`}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand text-sm font-medium text-on-brand hover:bg-brand/90 sm:flex-1"
          >
            Ver meus horários
          </Link>
        </div>
        <p className="text-sm text-muted">Você recebe um lembrete no WhatsApp antes do horário.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
      <div className="flex min-w-0 flex-col gap-6">
        {step !== 'unit' ? <Stepper step={step} onJump={setStep} /> : null}

        {back[step] ? (
          <button
            type="button"
            onClick={() => setStep(back[step]!)}
            className="-mb-2 inline-flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden /> Voltar
          </button>
        ) : null}

        {failure ? <Alert>{failure}</Alert> : null}

        {step === 'unit' ? (
          <section className="flex flex-col gap-4">
            <h2 className="font-[family-name:var(--font-sign)] text-3xl font-semibold">
              Em qual unidade?
            </h2>
            {units.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setUnitId(item.id);
                  setServiceIds([]);
                  setStep('services');
                }}
                className="rounded-2xl border border-border bg-surface p-5 text-left transition-colors hover:border-brand"
              >
                <span className="block text-lg font-semibold">{item.name}</span>
                <span className="text-sm text-muted">{unitAddress(item)}</span>
              </button>
            ))}
          </section>
        ) : null}

        {step === 'services' ? (
          <section className="flex flex-col gap-6">
            <h2 className="font-[family-name:var(--font-sign)] text-3xl font-semibold">
              Bora dar um trato?
            </h2>
            {catalog.isPending ? <Skeleton className="h-64 rounded-2xl" /> : null}
            {catalog.error ? <Alert>{describeError(catalog.error)}</Alert> : null}
            {catalog.data
              ? [...catalog.data.categories, { id: '', name: 'Outros' }].map((category) => {
                  const items = services.filter(
                    (service) => (service.categoryId ?? '') === category.id,
                  );
                  if (items.length === 0) {
                    return null;
                  }
                  return (
                    <div key={category.id || 'other'} className="flex flex-col gap-2">
                      <h3 className="text-sm font-semibold text-muted">{category.name}</h3>
                      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
                        {items.map((service, index) => {
                          const active = serviceIds.includes(service.id);
                          const inCombo = covered.get(service.id);
                          const save = comboSavings(service.id, services);
                          return (
                            <button
                              key={service.id}
                              type="button"
                              aria-pressed={active}
                              disabled={Boolean(inCombo)}
                              onClick={() => toggleService(service.id)}
                              className={cn(
                                'relative flex w-full items-center gap-4 px-5 py-4 text-left transition-colors',
                                index > 0 && 'border-t border-border',
                                active ? 'bg-brand/[0.06]' : 'enabled:hover:bg-surface-2',
                                inCombo && 'cursor-not-allowed opacity-50',
                              )}
                            >
                              <span
                                aria-hidden
                                className={cn(
                                  'absolute inset-y-0 left-0 w-1 bg-brand transition-opacity',
                                  active ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              <span
                                aria-hidden
                                className={cn(
                                  'grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors',
                                  active || inCombo
                                    ? 'border-brand bg-brand text-on-brand'
                                    : 'border-border',
                                )}
                              >
                                {active || inCombo ? (
                                  <Check className="size-3.5" strokeWidth={3} />
                                ) : null}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium">{service.name}</span>
                                  {save > 0 ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-xs font-medium text-success">
                                      <Sparkles className="size-3" aria-hidden /> economize{' '}
                                      {formatMoney(save)}
                                    </span>
                                  ) : null}
                                </span>
                                <span className="block text-sm text-muted">
                                  {inCombo
                                    ? `Já incluso em ${inCombo}`
                                    : (service.description ?? `${service.durationMinutes} min`)}
                                </span>
                              </span>
                              <span className="text-right">
                                <span className="block font-semibold tabular-nums">
                                  {formatMoney(service.priceCents)}
                                </span>
                                {service.description ? (
                                  <span className="text-xs text-muted">
                                    {service.durationMinutes} min
                                  </span>
                                ) : null}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              : null}
          </section>
        ) : null}

        {step === 'staff' ? (
          <section className="flex flex-col gap-4">
            <h2 className="font-[family-name:var(--font-sign)] text-3xl font-semibold">
              Quem vai te atender?
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[{ id: ANY, name: 'Tanto faz', photoUrl: null }, ...barbers].map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    setStaffId(member.id);
                    setSlot(null);
                    setStep('time');
                  }}
                  className={cn(
                    'flex flex-col items-center gap-3 rounded-2xl border bg-surface px-3 py-5 text-center transition-colors hover:border-brand',
                    staffId === member.id ? 'border-brand' : 'border-border',
                  )}
                >
                  {member.photoUrl ? (
                    <img
                      src={member.photoUrl}
                      alt=""
                      className="size-16 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className={cn(
                        'grid size-16 place-items-center rounded-full font-[family-name:var(--font-sign)] text-2xl font-semibold',
                        member.id === ANY ? 'bg-surface-2 text-muted' : 'bg-brand/12 text-brand',
                      )}
                    >
                      {member.id === ANY ? (
                        <Scissors className="size-6" aria-hidden />
                      ) : (
                        member.name.charAt(0)
                      )}
                    </span>
                  )}
                  <span className="font-medium">{member.name}</span>
                  {member.id === ANY ? (
                    <span className="-mt-2 text-xs text-muted">o primeiro livre</span>
                  ) : null}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {step === 'time' ? (
          <section className="flex flex-col gap-5">
            <h2 className="font-[family-name:var(--font-sign)] text-3xl font-semibold">
              Qual dia fica bom?
            </h2>
            <div
              className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2"
              role="radiogroup"
              aria-label="Dia"
            >
              {nextDays(today, 21).map((day) => {
                const selected = day === date;
                return (
                  <button
                    key={day}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setDate(day);
                      setSlot(null);
                    }}
                    className={cn(
                      'flex w-16 shrink-0 snap-start flex-col items-center gap-0.5 rounded-2xl border py-3 transition-colors',
                      selected
                        ? 'border-brand bg-brand text-on-brand'
                        : 'border-border bg-surface hover:border-brand',
                    )}
                  >
                    <span className="text-xs opacity-80">
                      {day === today ? 'Hoje' : WEEKDAYS_SHORT[weekdayOf(day)]}
                    </span>
                    <span className="font-[family-name:var(--font-sign)] text-2xl leading-none font-semibold">
                      {Number(day.slice(8))}
                    </span>
                  </button>
                );
              })}
            </div>
            {availability.isPending ? <Skeleton className="h-40 rounded-2xl" /> : null}
            {availability.error ? <Alert>{describeError(availability.error)}</Alert> : null}
            {availability.data && slots.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                <p className="font-medium">Agenda cheia nesse dia</p>
                <p className="mt-1 text-sm text-muted">
                  Toca em outro dia ali em cima que a gente acha um horário.
                </p>
              </div>
            ) : null}
            {['Manhã', 'Tarde', 'Noite'].map((label) =>
              grouped[label]?.length ? (
                <div
                  key={label}
                  className="flex flex-col gap-2"
                  role="radiogroup"
                  aria-label={label}
                >
                  <h3 className="text-sm font-semibold text-muted">{label}</h3>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {grouped[label].map((item) => {
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
                            'rounded-xl border py-3 text-sm font-semibold tabular-nums transition-colors',
                            selected
                              ? 'border-brand bg-brand text-on-brand'
                              : 'border-border bg-surface hover:border-brand',
                          )}
                        >
                          {item.time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null,
            )}
          </section>
        ) : null}

        {step === 'confirm' && slot ? (
          <section className="flex flex-col gap-5">
            <h2 className="font-[family-name:var(--font-sign)] text-3xl font-semibold">
              {customer ? `Tudo certo, ${customer.customer.name.split(' ')[0]}?` : 'Falta só você'}
            </h2>
            <div className="lg:hidden">
              <div className="rounded-2xl border border-border bg-surface p-5">{summary}</div>
            </div>
            {customer ? (
              <div className="flex flex-col gap-3">
                <Button
                  size="lg"
                  className="h-14 rounded-xl text-base"
                  loading={confirming}
                  onClick={() => void finish()}
                >
                  {depositCents ? 'Continuar para o pagamento' : 'Confirmar horário'}
                </Button>
                {depositCents ? (
                  <p className="text-center text-sm text-muted">
                    O horário é confirmado depois do sinal de {formatMoney(depositCents)}. O
                    restante você paga na barbearia.
                  </p>
                ) : null}
                <button
                  type="button"
                  className="text-sm text-muted hover:text-foreground"
                  onClick={() => clearCustomerSession(slug)}
                >
                  Não é {customer.customer.name.split(' ')[0]}? Trocar de conta
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
                <AccountAccess slug={slug} />
              </div>
            )}
          </section>
        ) : null}
      </div>

      {step !== 'unit' ? (
        <aside className="sticky top-6 hidden rounded-2xl border border-border bg-surface p-6 lg:block">
          {summary}
          {nextAction ? (
            <Button
              size="lg"
              className="mt-6 h-12 w-full rounded-xl"
              disabled={nextAction.disabled}
              onClick={nextAction.go}
            >
              {nextAction.label}
            </Button>
          ) : null}
        </aside>
      ) : null}

      {nextAction ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-muted">
                {chosen.length
                  ? `${chosen.length} ${chosen.length === 1 ? 'serviço' : 'serviços'}, ${duration} min`
                  : 'Nada escolhido ainda'}
              </p>
              <p className="text-lg font-semibold tabular-nums">{formatMoney(total)}</p>
            </div>
            <Button
              size="lg"
              className="h-12 rounded-xl"
              disabled={nextAction.disabled}
              onClick={nextAction.go}
            >
              {step === 'services' ? 'Continuar' : 'Revisar'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
