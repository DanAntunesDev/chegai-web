'use client';

import { type FormEvent, useMemo, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { FEATURE_LABEL, STATUS_LABEL } from '@/lib/admin/labels';
import { featureOverrides, limitOverrides, type LimitInputs } from '@/lib/admin/overrides';
import { usePlans, useUpdateTenant } from '@/lib/admin/queries';
import { describeError } from '@/lib/api/errors';
import {
  type AdminTenant,
  FEATURES,
  type Feature,
  TENANT_STATUSES,
  type TenantStatus,
} from '@/lib/api/types';
import { formatMoney } from '@/lib/format';

const LIMITS: { key: keyof LimitInputs; label: string }[] = [
  { key: 'units', label: 'Unidades' },
  { key: 'barbers', label: 'Barbeiros' },
  { key: 'receptionists', label: 'Recepcionistas' },
  { key: 'aiConversationsPerMonth', label: 'Conversas da IA por mês' },
];

function toInput(value: number | null | undefined): string {
  if (value === undefined) {
    return '';
  }
  return value === null ? 'ilimitado' : String(value);
}

export function TenantPlanForm({ tenant }: { tenant: AdminTenant }) {
  const plans = usePlans();
  const update = useUpdateTenant(tenant.id);
  const [status, setStatus] = useState<TenantStatus>(tenant.status);
  const [planCode, setPlanCode] = useState(tenant.plan.code);
  const [trialEndsAt, setTrialEndsAt] = useState(tenant.trialEndsAt?.slice(0, 10) ?? '');
  const [features, setFeatures] = useState<Set<Feature>>(new Set(tenant.entitlements.features));
  const [limits, setLimits] = useState<LimitInputs>({
    units: toInput(tenant.limitOverrides?.units),
    barbers: toInput(tenant.limitOverrides?.barbers),
    receptionists: toInput(tenant.limitOverrides?.receptionists),
    aiConversationsPerMonth: toInput(tenant.limitOverrides?.aiConversationsPerMonth),
  });
  const [limitError, setLimitError] = useState<string | null>(null);

  const plan = useMemo(
    () => plans.data?.find((item) => item.code === planCode),
    [plans.data, planCode],
  );

  const planDefault = (key: keyof LimitInputs) => {
    if (!plan) {
      return '';
    }
    const value = {
      units: plan.maxUnits,
      barbers: plan.maxBarbers,
      receptionists: plan.maxReceptionists,
      aiConversationsPerMonth: plan.aiConversationsPerMonth,
    }[key];
    return value === null ? 'ilimitado' : String(value);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedLimits = limitOverrides(limits);
    if (!parsedLimits.ok) {
      setLimitError(parsedLimits.error);
      return;
    }
    setLimitError(null);
    update.mutate({
      status,
      planCode,
      trialEndsAt: trialEndsAt ? new Date(`${trialEndsAt}T23:59:59-03:00`).toISOString() : null,
      featureOverrides: plan ? featureOverrides(plan.features, features) : undefined,
      limitOverrides: parsedLimits.value,
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Card className="grid gap-4 sm:grid-cols-3">
        <Field label="Situação" htmlFor="status">
          <Select
            id="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as TenantStatus)}
          >
            {TENANT_STATUSES.map((item) => (
              <option key={item} value={item}>
                {STATUS_LABEL[item]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Plano" htmlFor="planCode">
          <Select
            id="planCode"
            value={planCode}
            onChange={(event) => setPlanCode(event.target.value)}
          >
            {plans.data?.map((item) => (
              <option key={item.id} value={item.code}>
                {item.name} · {formatMoney(item.monthlyPriceCents)}/mês
              </option>
            )) ?? <option value={tenant.plan.code}>{tenant.plan.name}</option>}
          </Select>
        </Field>
        <Field
          label="Fim do teste"
          htmlFor="trialEndsAt"
          hint="Deixe vazio se não estiver em teste."
        >
          <Input
            id="trialEndsAt"
            type="date"
            value={trialEndsAt}
            onChange={(event) => setTrialEndsAt(event.target.value)}
          />
        </Field>
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <CardTitle>Limites</CardTitle>
          <CardDescription>
            Vazio usa o limite do plano. Digite um número ou “ilimitado” para liberar.
          </CardDescription>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          {LIMITS.map((item) => (
            <Field key={item.key} label={item.label} htmlFor={`limit-${item.key}`}>
              <Input
                id={`limit-${item.key}`}
                value={limits[item.key]}
                placeholder={planDefault(item.key)}
                onChange={(event) =>
                  setLimits((current) => ({ ...current, [item.key]: event.target.value }))
                }
              />
            </Field>
          ))}
        </div>
        {limitError ? <Alert>{limitError}</Alert> : null}
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <CardTitle>Recursos</CardTitle>
          <CardDescription>
            Começa pelo que o plano inclui. Ligar ou desligar aqui vale só para esta barbearia.
          </CardDescription>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <Switch
              key={feature}
              id={`feature-${feature}`}
              label={FEATURE_LABEL[feature]}
              description={plan?.features.includes(feature) ? 'Incluso no plano' : 'Fora do plano'}
              checked={features.has(feature)}
              onCheckedChange={(checked) =>
                setFeatures((current) => {
                  const next = new Set(current);
                  if (checked) {
                    next.add(feature);
                  } else {
                    next.delete(feature);
                  }
                  return next;
                })
              }
            />
          ))}
        </div>
      </Card>

      {update.error ? <Alert>{describeError(update.error)}</Alert> : null}
      {update.isSuccess ? <Alert tone="success">Plano e limites salvos.</Alert> : null}
      <Button type="submit" loading={update.isPending} className="w-fit">
        Salvar plano e limites
      </Button>
    </form>
  );
}
