'use client';

import { type FormEvent, useState } from 'react';
import { z } from 'zod';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { describeError, serverFieldErrors } from '@/lib/api/errors';
import { useSaveCustomer } from '@/lib/panel/queries';
import type { Customer } from '@/lib/panel/types';
import { formatPhone, parseTags } from '@/lib/phone';

export function CustomerDialog({
  customer,
  open,
  onClose,
}: {
  customer: Customer | null;
  open: boolean;
  onClose: () => void;
}) {
  const save = useSaveCustomer();
  const [name, setName] = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(formatPhone(customer?.phone));
  const [email, setEmail] = useState(customer?.email ?? '');
  const [birthDate, setBirthDate] = useState(customer?.birthDate?.slice(0, 10) ?? '');
  const [tags, setTags] = useState(customer?.tags.join(', ') ?? '');
  const [notes, setNotes] = useState(customer?.notes ?? '');
  const [optIn, setOptIn] = useState(customer?.marketingOptIn ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const local: Record<string, string> = {};
    if (name.trim().length < 2) {
      local.name = 'Informe o nome.';
    }
    if (phone.replace(/\D/g, '').length < 10) {
      local.phone = 'Telefone com DDD.';
    }
    if (email.trim() && !z.email().safeParse(email.trim()).success) {
      local.email = 'E-mail inválido.';
    }
    setErrors(local);
    if (Object.keys(local).length) {
      return;
    }
    save.mutate(
      {
        id: customer?.id,
        body: {
          name: name.trim(),
          phone,
          email: email.trim() || null,
          birthDate: birthDate || null,
          tags: parseTags(tags),
          notes: notes.trim() || null,
          marketingOptIn: optIn,
        },
      },
      { onSuccess: onClose, onError: (error) => setErrors(serverFieldErrors(error)) },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={customer ? customer.name : 'Novo cliente'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="customer-form" loading={save.isPending}>
            Salvar
          </Button>
        </>
      }
    >
      <form id="customer-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" htmlFor="customer-name" error={errors.name} className="sm:col-span-2">
          <Input
            id="customer-name"
            value={name}
            aria-invalid={Boolean(errors.name)}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="WhatsApp" htmlFor="customer-phone" error={errors.phone}>
          <Input
            id="customer-phone"
            type="tel"
            placeholder="(38) 99999-9999"
            value={phone}
            aria-invalid={Boolean(errors.phone)}
            onChange={(event) => setPhone(event.target.value)}
          />
        </Field>
        <Field label="E-mail" htmlFor="customer-email" error={errors.email}>
          <Input
            id="customer-email"
            type="email"
            value={email}
            aria-invalid={Boolean(errors.email)}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Aniversário" htmlFor="customer-birth">
          <Input
            id="customer-birth"
            type="date"
            value={birthDate}
            onChange={(event) => setBirthDate(event.target.value)}
          />
        </Field>
        <Field
          label="Etiquetas"
          htmlFor="customer-tags"
          hint="Separe por vírgula. Ex.: vip, mensal"
        >
          <Input
            id="customer-tags"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
        </Field>
        <Field label="Observações" htmlFor="customer-notes" className="sm:col-span-2">
          <Textarea
            id="customer-notes"
            maxLength={2000}
            placeholder="Preferências de corte, alergias a produtos…"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </Field>
        <div className="sm:col-span-2">
          <Switch
            id="customer-optin"
            label="Aceita receber promoções"
            description="Lembretes de horário são enviados mesmo sem essa opção."
            checked={optIn}
            onCheckedChange={setOptIn}
          />
        </div>
        {save.error && !Object.keys(errors).length ? (
          <Alert className="sm:col-span-2">{describeError(save.error)}</Alert>
        ) : null}
      </form>
    </Dialog>
  );
}
