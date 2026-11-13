'use client';

import { type FormEvent, useState } from 'react';
import { z } from 'zod';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useInviteMember } from '@/lib/admin/queries';
import { describeError } from '@/lib/api/errors';
import { CopyField } from './copy-field';

const ROLES = [
  { value: 'OWNER', label: 'Dono' },
  { value: 'MANAGER', label: 'Gerente' },
  { value: 'RECEPTIONIST', label: 'Recepção' },
  { value: 'BARBER', label: 'Barbeiro' },
];

export function InviteForm({ tenantId }: { tenantId: string }) {
  const invite = useInviteMember(tenantId);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [roleKey, setRoleKey] = useState('OWNER');
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!z.email().safeParse(email.trim()).success) {
      setError('E-mail inválido.');
      return;
    }
    setError(null);
    invite.mutate(
      { email: email.trim(), name: name.trim() || undefined, roleKey },
      {
        onSuccess: () => {
          setEmail('');
          setName('');
        },
      },
    );
  };

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <CardTitle>Convidar pessoa</CardTitle>
        <CardDescription>O convite chega por e-mail e vale por tempo limitado.</CardDescription>
      </div>
      <form
        onSubmit={submit}
        noValidate
        className="grid gap-4 sm:grid-cols-[1fr_1fr_180px_auto] sm:items-end"
      >
        <Field label="E-mail" htmlFor="invite-email" error={error ?? undefined}>
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Nome" htmlFor="invite-name">
          <Input id="invite-name" value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Papel" htmlFor="invite-role">
          <Select
            id="invite-role"
            value={roleKey}
            onChange={(event) => setRoleKey(event.target.value)}
          >
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" loading={invite.isPending}>
          Convidar
        </Button>
      </form>
      {invite.error ? <Alert>{describeError(invite.error)}</Alert> : null}
      {invite.data ? (
        <div className="flex flex-col gap-2">
          {invite.data.emailSent ? (
            <Alert tone="success">Convite enviado para {invite.data.email}.</Alert>
          ) : (
            <Alert tone="info">E-mail não enviado. Mande o link para {invite.data.email}.</Alert>
          )}
          <CopyField label="Link do convite" value={invite.data.link} />
        </div>
      ) : null}
    </Card>
  );
}
