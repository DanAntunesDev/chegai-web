'use client';

import { type FormEvent, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { describeError, serverFieldErrors } from '@/lib/api/errors';
import { useSaveUnit } from '@/lib/panel/queries';
import type { Unit } from '@/lib/panel/types';
import { formatPhone } from '@/lib/phone';
import { slugify } from '@/lib/slug';

interface UnitDialogProps {
  unit: Unit | null;
  open: boolean;
  onClose: () => void;
}

type Text = Record<
  | 'name'
  | 'slug'
  | 'phone'
  | 'zipCode'
  | 'street'
  | 'number'
  | 'district'
  | 'city'
  | 'state'
  | 'timezone',
  string
>;
type Rules = Record<
  | 'slotIntervalMinutes'
  | 'minAdvanceMinutes'
  | 'maxAdvanceDays'
  | 'holdMinutes'
  | 'checkInOpensMinutes'
  | 'noShowAfterMinutes',
  string
>;

const RULES: { key: keyof Rules; label: string; hint: string; min: number; max: number }[] = [
  {
    key: 'minAdvanceMinutes',
    label: 'Antecedência mínima (min)',
    hint: 'Até quantos minutos antes o cliente ainda agenda.',
    min: 0,
    max: 10080,
  },
  {
    key: 'maxAdvanceDays',
    label: 'Agenda aberta (dias)',
    hint: 'Quantos dias à frente aparecem para agendar.',
    min: 1,
    max: 180,
  },
  {
    key: 'holdMinutes',
    label: 'Reserva provisória (min)',
    hint: 'Tempo para o cliente confirmar o horário.',
    min: 1,
    max: 30,
  },
  {
    key: 'checkInOpensMinutes',
    label: 'Check-in libera (min antes)',
    hint: 'Quando o “cheguei” passa a valer.',
    min: 0,
    max: 240,
  },
  {
    key: 'noShowAfterMinutes',
    label: 'Falta após (min)',
    hint: 'Atraso que vira falta automática.',
    min: 0,
    max: 1440,
  },
];

function initialText(unit: Unit | null): Text {
  return {
    name: unit?.name ?? '',
    slug: unit?.slug ?? '',
    phone: formatPhone(unit?.phone),
    zipCode: unit?.zipCode ?? '',
    street: unit?.street ?? '',
    number: unit?.number ?? '',
    district: unit?.district ?? '',
    city: unit?.city ?? '',
    state: unit?.state ?? '',
    timezone: unit?.timezone ?? 'America/Sao_Paulo',
  };
}

function initialRules(unit: Unit | null): Rules {
  return {
    slotIntervalMinutes: String(unit?.slotIntervalMinutes ?? 15),
    minAdvanceMinutes: String(unit?.minAdvanceMinutes ?? 30),
    maxAdvanceDays: String(unit?.maxAdvanceDays ?? 30),
    holdMinutes: String(unit?.holdMinutes ?? 5),
    checkInOpensMinutes: String(unit?.checkInOpensMinutes ?? 60),
    noShowAfterMinutes: String(unit?.noShowAfterMinutes ?? 30),
  };
}

const orNull = (value: string) => value.trim() || null;

export function UnitDialog({ unit, open, onClose }: UnitDialogProps) {
  const save = useSaveUnit();
  const [text, setText] = useState<Text>(() => initialText(unit));
  const [rules, setRules] = useState<Rules>(() => initialRules(unit));
  const [slugTouched, setSlugTouched] = useState(Boolean(unit));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof Text, value: string) =>
    setText((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const local: Record<string, string> = {};
    if (text.name.trim().length < 2) {
      local.name = 'Informe o nome.';
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(text.slug)) {
      local.slug = 'Use letras minúsculas, números e hífen.';
    }
    if (text.state && !/^[A-Za-z]{2}$/.test(text.state)) {
      local.state = 'Use a sigla, ex.: MG.';
    }
    if (text.zipCode && !/^\d{5}-?\d{3}$/.test(text.zipCode)) {
      local.zipCode = 'CEP inválido.';
    }
    const numbers: Record<string, number> = {};
    for (const rule of RULES) {
      const value = Number(rules[rule.key]);
      if (!Number.isInteger(value) || value < rule.min || value > rule.max) {
        local[rule.key] = `Entre ${rule.min} e ${rule.max}.`;
      }
      numbers[rule.key] = value;
    }
    setErrors(local);
    if (Object.keys(local).length) {
      return;
    }
    save.mutate(
      {
        id: unit?.id,
        body: {
          name: text.name.trim(),
          slug: text.slug,
          phone: orNull(text.phone),
          zipCode: orNull(text.zipCode),
          street: orNull(text.street),
          number: orNull(text.number),
          district: orNull(text.district),
          city: orNull(text.city),
          state: text.state ? text.state.toUpperCase() : null,
          timezone: text.timezone,
          slotIntervalMinutes: Number(rules.slotIntervalMinutes),
          ...numbers,
        },
      },
      {
        onSuccess: onClose,
        onError: (error) => setErrors(serverFieldErrors(error)),
      },
    );
  };

  const field = (key: keyof Text, label: string, extra: Record<string, unknown> = {}) => (
    <Field label={label} htmlFor={`unit-${key}`} error={errors[key]}>
      <Input
        id={`unit-${key}`}
        value={text[key]}
        aria-invalid={Boolean(errors[key])}
        onChange={(event) => set(key, event.target.value)}
        {...extra}
      />
    </Field>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={unit ? `Editar ${unit.name}` : 'Nova unidade'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="unit-form" loading={save.isPending}>
            Salvar
          </Button>
        </>
      }
    >
      <form id="unit-form" onSubmit={submit} noValidate className="flex flex-col gap-6">
        <section className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome" htmlFor="unit-name" error={errors.name}>
            <Input
              id="unit-name"
              value={text.name}
              aria-invalid={Boolean(errors.name)}
              onChange={(event) => {
                set('name', event.target.value);
                if (!slugTouched) {
                  set('slug', slugify(event.target.value));
                }
              }}
            />
          </Field>
          <Field label="Endereço curto" htmlFor="unit-slug" error={errors.slug}>
            <Input
              id="unit-slug"
              value={text.slug}
              aria-invalid={Boolean(errors.slug)}
              onChange={(event) => {
                setSlugTouched(true);
                set('slug', event.target.value.toLowerCase());
              }}
            />
          </Field>
          {field('phone', 'Telefone', { type: 'tel', placeholder: '(38) 99999-9999' })}
          {field('zipCode', 'CEP', { inputMode: 'numeric' })}
          {field('street', 'Rua')}
          <div className="grid grid-cols-[1fr_2fr] gap-4">
            {field('number', 'Número')}
            {field('district', 'Bairro')}
          </div>
          <div className="grid grid-cols-[2fr_1fr] gap-4">
            {field('city', 'Cidade')}
            {field('state', 'UF', { maxLength: 2, className: 'uppercase' })}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold">Regras de agendamento</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Intervalo entre horários" htmlFor="unit-slot">
              <Select
                id="unit-slot"
                value={rules.slotIntervalMinutes}
                onChange={(event) =>
                  setRules((current) => ({ ...current, slotIntervalMinutes: event.target.value }))
                }
              >
                {[5, 10, 15, 20, 30].map((value) => (
                  <option key={value} value={value}>
                    A cada {value} min
                  </option>
                ))}
              </Select>
            </Field>
            {RULES.map((rule) => (
              <Field
                key={rule.key}
                label={rule.label}
                htmlFor={`unit-${rule.key}`}
                error={errors[rule.key]}
                hint={rule.hint}
              >
                <Input
                  id={`unit-${rule.key}`}
                  type="number"
                  min={rule.min}
                  max={rule.max}
                  value={rules[rule.key]}
                  aria-invalid={Boolean(errors[rule.key])}
                  onChange={(event) =>
                    setRules((current) => ({ ...current, [rule.key]: event.target.value }))
                  }
                />
              </Field>
            ))}
          </div>
        </section>

        {save.error && !Object.keys(errors).length ? (
          <Alert>{describeError(save.error)}</Alert>
        ) : null}
      </form>
    </Dialog>
  );
}
