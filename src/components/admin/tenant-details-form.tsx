'use client';

import { type FormEvent, useState } from 'react';
import { z } from 'zod';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { fieldErrors } from '@/lib/admin/tenant-form';
import { useUpdateTenant } from '@/lib/admin/queries';
import { describeError } from '@/lib/api/errors';
import type { AdminTenant } from '@/lib/api/types';

const schema = z.object({
  displayName: z.string().trim().min(2, 'Informe o nome.'),
  legalName: z.string().trim().min(2, 'Informe a razão social.'),
  document: z
    .string()
    .trim()
    .transform((value) => value || null),
  email: z.email('E-mail inválido.'),
  phone: z
    .string()
    .trim()
    .transform((value) => value || null),
  timezone: z.string().min(1),
});

type Values = z.input<typeof schema>;

const FIELDS: { key: keyof Values; label: string; type?: string }[] = [
  { key: 'displayName', label: 'Nome para clientes' },
  { key: 'legalName', label: 'Razão social' },
  { key: 'document', label: 'CPF ou CNPJ' },
  { key: 'email', label: 'E-mail', type: 'email' },
  { key: 'phone', label: 'Telefone', type: 'tel' },
  { key: 'timezone', label: 'Fuso horário' },
];

export function TenantDetailsForm({ tenant }: { tenant: AdminTenant }) {
  const update = useUpdateTenant(tenant.id);
  const [values, setValues] = useState<Values>({
    displayName: tenant.displayName,
    legalName: tenant.legalName,
    document: tenant.document ?? '',
    email: tenant.email,
    phone: tenant.phone ?? '',
    timezone: tenant.timezone,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    update.mutate(parsed.data);
  };

  return (
    <Card>
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <Field key={field.key} label={field.label} htmlFor={field.key} error={errors[field.key]}>
            <Input
              id={field.key}
              type={field.type ?? 'text'}
              value={values[field.key] ?? ''}
              aria-invalid={Boolean(errors[field.key])}
              onChange={(event) =>
                setValues((current) => ({ ...current, [field.key]: event.target.value }))
              }
            />
          </Field>
        ))}
        <div className="flex flex-col gap-3 sm:col-span-2">
          {update.error ? <Alert>{describeError(update.error)}</Alert> : null}
          {update.isSuccess ? <Alert tone="success">Dados salvos.</Alert> : null}
          <Button type="submit" loading={update.isPending} className="w-fit">
            Salvar dados
          </Button>
        </div>
      </form>
    </Card>
  );
}
