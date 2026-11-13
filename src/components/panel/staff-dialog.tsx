'use client';

import { type FormEvent, useState } from 'react';
import { z } from 'zod';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { describeError, serverFieldErrors } from '@/lib/api/errors';
import { useSaveStaff } from '@/lib/panel/queries';
import type { Staff, StaffKind, Unit } from '@/lib/panel/types';
import { formatPhone } from '@/lib/phone';

export const KIND_LABEL: Record<StaffKind, string> = {
  BARBER: 'Barbeiro',
  RECEPTIONIST: 'Recepção',
  MANAGER: 'Gerente',
};

export function StaffDialog({
  staff,
  units,
  open,
  onClose,
  onSaved,
}: {
  staff: Staff | null;
  units: Unit[];
  open: boolean;
  onClose: () => void;
  onSaved?: (staff: Staff) => void;
}) {
  const save = useSaveStaff();
  const [name, setName] = useState(staff?.name ?? '');
  const [nickname, setNickname] = useState(staff?.nickname ?? '');
  const [kind, setKind] = useState<StaffKind>(staff?.kind ?? 'BARBER');
  const [phone, setPhone] = useState(formatPhone(staff?.phone));
  const [email, setEmail] = useState(staff?.email ?? '');
  const [active, setActive] = useState(staff?.isActive ?? true);
  const [unitIds, setUnitIds] = useState<string[]>(
    staff?.units.map((unit) => unit.unitId) ??
      (units.length === 1 && units[0] ? [units[0].id] : []),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const local: Record<string, string> = {};
    if (name.trim().length < 2) {
      local.name = 'Informe o nome.';
    }
    if (email.trim() && !z.email().safeParse(email.trim()).success) {
      local.email = 'E-mail inválido.';
    }
    if (phone.trim() && phone.replace(/\D/g, '').length < 10) {
      local.phone = 'Telefone com DDD.';
    }
    if (unitIds.length === 0) {
      local.unitIds = 'Escolha pelo menos uma unidade.';
    }
    setErrors(local);
    if (Object.keys(local).length) {
      return;
    }
    const body = staff
      ? {
          name: name.trim(),
          nickname: nickname.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          unitIds,
          isActive: active,
        }
      : {
          kind,
          name: name.trim(),
          nickname: nickname.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          unitIds,
        };
    save.mutate(
      { id: staff?.id, body },
      {
        onSuccess: (saved) => {
          onSaved?.(saved);
          onClose();
        },
        onError: (error) => setErrors(serverFieldErrors(error)),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={staff ? `Editar ${staff.name}` : 'Novo profissional'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="staff-form" loading={save.isPending}>
            Salvar
          </Button>
        </>
      }
    >
      <form id="staff-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" htmlFor="staff-name" error={errors.name}>
          <Input
            id="staff-name"
            value={name}
            aria-invalid={Boolean(errors.name)}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="Apelido" htmlFor="staff-nickname" hint="Como aparece para o cliente.">
          <Input
            id="staff-nickname"
            value={nickname}
            maxLength={40}
            onChange={(event) => setNickname(event.target.value)}
          />
        </Field>
        <Field label="Função" htmlFor="staff-kind">
          <Select
            id="staff-kind"
            value={kind}
            disabled={Boolean(staff)}
            onChange={(event) => setKind(event.target.value as StaffKind)}
          >
            {Object.entries(KIND_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="WhatsApp" htmlFor="staff-phone" error={errors.phone}>
          <Input
            id="staff-phone"
            type="tel"
            value={phone}
            aria-invalid={Boolean(errors.phone)}
            onChange={(event) => setPhone(event.target.value)}
          />
        </Field>
        <Field label="E-mail" htmlFor="staff-email" error={errors.email} className="sm:col-span-2">
          <Input
            id="staff-email"
            type="email"
            value={email}
            aria-invalid={Boolean(errors.email)}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <fieldset className="flex flex-col gap-2 sm:col-span-2">
          <legend className="mb-1.5 text-sm font-medium">Unidades onde atende</legend>
          {units.map((unit) => (
            <label key={unit.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-[var(--brand)]"
                checked={unitIds.includes(unit.id)}
                onChange={(event) =>
                  setUnitIds((current) =>
                    event.target.checked
                      ? [...current, unit.id]
                      : current.filter((id) => id !== unit.id),
                  )
                }
              />
              {unit.name}
            </label>
          ))}
          {errors.unitIds ? <p className="text-xs text-danger">{errors.unitIds}</p> : null}
        </fieldset>
        {staff ? (
          <div className="sm:col-span-2">
            <Switch
              id="staff-active"
              label="Ativo na agenda"
              description="Desligue para tirar da agenda sem apagar o histórico."
              checked={active}
              onCheckedChange={setActive}
            />
          </div>
        ) : null}
        {save.error && !Object.keys(errors).length ? (
          <Alert className="sm:col-span-2">{describeError(save.error)}</Alert>
        ) : null}
      </form>
    </Dialog>
  );
}
