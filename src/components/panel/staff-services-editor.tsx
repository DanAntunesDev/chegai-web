'use client';

import { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { describeError } from '@/lib/api/errors';
import { centsFromInput, formatMoney } from '@/lib/format';
import { useSaveStaffServices, useServices } from '@/lib/panel/queries';
import type { StaffDetail } from '@/lib/panel/types';

interface Choice {
  enabled: boolean;
  price: string;
  duration: string;
}

export function StaffServicesEditor({ staff }: { staff: StaffDetail }) {
  const services = useServices();
  const save = useSaveStaffServices(staff.id);
  const [choices, setChoices] = useState<Record<string, Choice>>(() =>
    Object.fromEntries(
      staff.services.map((item) => [
        item.serviceId,
        {
          enabled: true,
          price:
            item.priceCents === null ? '' : (item.priceCents / 100).toFixed(2).replace('.', ','),
          duration: item.durationMinutes === null ? '' : String(item.durationMinutes),
        },
      ]),
    ),
  );
  const [problem, setProblem] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const set = (id: string, patch: Partial<Choice>) => {
    setSaved(false);
    setChoices((current) => ({
      ...current,
      [id]: { enabled: false, price: '', duration: '', ...current[id], ...patch },
    }));
  };

  const submit = () => {
    const payload: { serviceId: string; priceCents?: number; durationMinutes?: number }[] = [];
    for (const [serviceId, choice] of Object.entries(choices)) {
      if (!choice.enabled) {
        continue;
      }
      const priceCents = choice.price.trim() ? centsFromInput(choice.price) : undefined;
      const durationMinutes = choice.duration.trim() ? Number(choice.duration) : undefined;
      if (
        priceCents === null ||
        (durationMinutes !== undefined &&
          (!Number.isInteger(durationMinutes) || durationMinutes < 5))
      ) {
        setProblem('Confira os preços e durações personalizados.');
        return;
      }
      payload.push({ serviceId, priceCents, durationMinutes });
    }
    setProblem(null);
    save.mutate(payload, { onSuccess: () => setSaved(true) });
  };

  return (
    <Card className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Marque o que esse profissional faz. Preço e duração em branco seguem o padrão do serviço.
      </p>
      <ul className="flex flex-col divide-y divide-border">
        {services.data
          ?.filter((service) => service.isActive)
          .map((service) => {
            const choice = choices[service.id];
            return (
              <li key={service.id} className="flex flex-wrap items-center gap-3 py-3">
                <label className="flex min-w-48 flex-1 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--brand)]"
                    checked={choice?.enabled ?? false}
                    onChange={(event) => set(service.id, { enabled: event.target.checked })}
                  />
                  <span>
                    <span className="block font-medium">{service.name}</span>
                    <span className="text-xs text-muted">
                      {formatMoney(service.priceCents)} · {service.durationMinutes} min
                    </span>
                  </span>
                </label>
                {choice?.enabled ? (
                  <div className="flex gap-2">
                    <Input
                      aria-label={`Preço de ${service.name} com este profissional`}
                      placeholder="Preço"
                      inputMode="decimal"
                      value={choice.price}
                      onChange={(event) => set(service.id, { price: event.target.value })}
                      className="w-28"
                    />
                    <Input
                      aria-label={`Duração de ${service.name} com este profissional`}
                      placeholder="Min"
                      type="number"
                      value={choice.duration}
                      onChange={(event) => set(service.id, { duration: event.target.value })}
                      className="w-20"
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
      </ul>
      {problem ? <Alert>{problem}</Alert> : null}
      {save.error ? <Alert>{describeError(save.error)}</Alert> : null}
      {saved ? <Alert tone="success">Serviços salvos.</Alert> : null}
      <Button onClick={submit} loading={save.isPending} className="w-fit">
        Salvar serviços
      </Button>
    </Card>
  );
}
