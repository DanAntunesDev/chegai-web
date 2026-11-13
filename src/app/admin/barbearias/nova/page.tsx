'use client';

import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { CopyField } from '@/components/admin/copy-field';
import { PageHeader } from '@/components/shell/app-shell';
import { Alert } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useCreateTenant, usePlans } from '@/lib/admin/queries';
import { type CreateTenantForm, createTenantForm, fieldErrors } from '@/lib/admin/tenant-form';
import { ApiError, describeError } from '@/lib/api/errors';
import { formatMoney } from '@/lib/format';
import { slugify } from '@/lib/slug';

const INITIAL: CreateTenantForm = {
  displayName: '',
  legalName: '',
  slug: '',
  document: '',
  email: '',
  phone: '',
  planCode: '',
  status: 'TRIAL',
  trialDays: 14,
  unitName: 'Principal',
  unitCity: '',
  unitState: '',
  ownerName: '',
  ownerEmail: '',
};

export default function NewTenantPage() {
  const plans = usePlans();
  const create = useCreateTenant();
  const [form, setForm] = useState<CreateTenantForm>(INITIAL);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof CreateTenantForm>(key: K, value: CreateTenantForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const input = (key: keyof CreateTenantForm) => ({
    id: key,
    value: String(form[key] ?? ''),
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `${key}-error` : undefined,
    onChange: (event: { target: { value: string } }) => set(key, event.target.value as never),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = createTenantForm.safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    const data = parsed.data;
    create.mutate(
      {
        slug: data.slug,
        legalName: data.legalName,
        displayName: data.displayName,
        document: data.document,
        email: data.email,
        phone: data.phone,
        planCode: data.planCode,
        status: data.status,
        trialDays: data.trialDays,
        unit: { name: data.unitName, city: data.unitCity, state: data.unitState },
        owner: { name: data.ownerName, email: data.ownerEmail },
      },
      {
        onError: (error) => {
          if (error instanceof ApiError && error.code === 'SLUG_TAKEN') {
            setErrors({ slug: describeError(error) });
          }
        },
      },
    );
  };

  if (create.data) {
    const { tenant, invitation } = create.data;
    return (
      <Card className="mx-auto flex max-w-lg flex-col gap-5">
        <CheckCircle2 className="size-10 text-success" aria-hidden />
        <div>
          <CardTitle className="text-xl">{tenant.displayName} cadastrada</CardTitle>
          <p className="mt-1 text-sm text-muted">
            {invitation.emailSent
              ? `Enviamos o convite para ${invitation.email}. Se preferir, mande o link abaixo pelo WhatsApp.`
              : `Não conseguimos enviar o e-mail para ${invitation.email}. Mande o link abaixo para o dono.`}
          </p>
        </div>
        <CopyField label="Link do convite" value={invitation.link} />
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/barbearias/${tenant.id}`} className={buttonVariants()}>
            Abrir barbearia
          </Link>
          <Link href="/admin" className={buttonVariants({ variant: 'outline' })}>
            Voltar para a lista
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Barbearias
      </Link>
      <PageHeader
        title="Nova barbearia"
        description="Cria a conta, a primeira unidade e o convite do dono."
      />

      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        <Card className="grid gap-4 sm:grid-cols-2">
          <CardTitle className="sm:col-span-2">Barbearia</CardTitle>
          <Field
            label="Nome que aparece para os clientes"
            htmlFor="displayName"
            error={errors.displayName}
          >
            <Input
              {...input('displayName')}
              onChange={(event) => {
                set('displayName', event.target.value);
                if (!slugTouched) {
                  set('slug', slugify(event.target.value));
                }
              }}
            />
          </Field>
          <Field label="Razão social" htmlFor="legalName" error={errors.legalName}>
            <Input {...input('legalName')} />
          </Field>
          <Field
            label="Endereço na plataforma"
            htmlFor="slug"
            error={errors.slug}
            hint={form.slug ? `Página: /b/${form.slug}` : 'Letras minúsculas, números e hífen.'}
          >
            <Input
              {...input('slug')}
              onChange={(event) => {
                setSlugTouched(true);
                set('slug', event.target.value.toLowerCase());
              }}
            />
          </Field>
          <Field label="CPF ou CNPJ" htmlFor="document" error={errors.document}>
            <Input {...input('document')} inputMode="numeric" />
          </Field>
          <Field label="E-mail da barbearia" htmlFor="email" error={errors.email}>
            <Input {...input('email')} type="email" />
          </Field>
          <Field label="Telefone" htmlFor="phone" error={errors.phone}>
            <Input {...input('phone')} type="tel" placeholder="(38) 99999-9999" />
          </Field>
        </Card>

        <Card className="grid gap-4 sm:grid-cols-3">
          <CardTitle className="sm:col-span-3">Plano</CardTitle>
          <Field label="Plano" htmlFor="planCode" error={errors.planCode}>
            <Select {...input('planCode')}>
              <option value="">{plans.isPending ? 'Carregando…' : 'Escolha'}</option>
              {plans.data
                ?.filter((plan) => plan.isActive)
                .map((plan) => (
                  <option key={plan.id} value={plan.code}>
                    {plan.name} · {formatMoney(plan.monthlyPriceCents)}/mês
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Situação inicial" htmlFor="status">
            <Select {...input('status')}>
              <option value="TRIAL">Teste grátis</option>
              <option value="ACTIVE">Ativa</option>
            </Select>
          </Field>
          <Field label="Dias de teste" htmlFor="trialDays" error={errors.trialDays}>
            <Input {...input('trialDays')} type="number" min={0} max={90} />
          </Field>
        </Card>

        <Card className="grid gap-4 sm:grid-cols-3">
          <CardTitle className="sm:col-span-3">Primeira unidade</CardTitle>
          <Field label="Nome" htmlFor="unitName" error={errors.unitName}>
            <Input {...input('unitName')} />
          </Field>
          <Field label="Cidade" htmlFor="unitCity" error={errors.unitCity}>
            <Input {...input('unitCity')} />
          </Field>
          <Field label="UF" htmlFor="unitState" error={errors.unitState}>
            <Input {...input('unitState')} maxLength={2} className="uppercase" />
          </Field>
        </Card>

        <Card className="grid gap-4 sm:grid-cols-2">
          <CardTitle className="sm:col-span-2">Dono</CardTitle>
          <Field label="Nome" htmlFor="ownerName" error={errors.ownerName}>
            <Input {...input('ownerName')} autoComplete="off" />
          </Field>
          <Field label="E-mail" htmlFor="ownerEmail" error={errors.ownerEmail}>
            <Input {...input('ownerEmail')} type="email" autoComplete="off" />
          </Field>
        </Card>

        {create.error && !errors.slug ? <Alert>{describeError(create.error)}</Alert> : null}

        <div className="flex justify-end gap-2">
          <Link href="/admin" className={buttonVariants({ variant: 'ghost' })}>
            Cancelar
          </Link>
          <Button type="submit" loading={create.isPending}>
            Cadastrar barbearia
          </Button>
        </div>
      </form>
    </>
  );
}
