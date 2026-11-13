'use client';

import { type FormEvent, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { describeError, serverFieldErrors } from '@/lib/api/errors';
import { centsFromInput } from '@/lib/format';
import { useSaveService } from '@/lib/panel/queries';
import type { Category, Service } from '@/lib/panel/types';

interface ServiceDialogProps {
  service: Service | null;
  categories: Category[];
  open: boolean;
  onClose: () => void;
}

function priceText(cents: number | undefined) {
  return cents === undefined ? '' : (cents / 100).toFixed(2).replace('.', ',');
}

export function ServiceDialog({ service, categories, open, onClose }: ServiceDialogProps) {
  const save = useSaveService();
  const [name, setName] = useState(service?.name ?? '');
  const [categoryId, setCategoryId] = useState(service?.categoryId ?? '');
  const [price, setPrice] = useState(priceText(service?.priceCents));
  const [duration, setDuration] = useState(String(service?.durationMinutes ?? 30));
  const [buffer, setBuffer] = useState(String(service?.bufferMinutes ?? 0));
  const [description, setDescription] = useState(service?.description ?? '');
  const [active, setActive] = useState(service?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const local: Record<string, string> = {};
    const priceCents = centsFromInput(price);
    const durationMinutes = Number(duration);
    const bufferMinutes = Number(buffer);
    if (name.trim().length < 2) {
      local.name = 'Informe o nome.';
    }
    if (priceCents === null) {
      local.price = 'Preço inválido. Ex.: 45,00';
    }
    if (!Number.isInteger(durationMinutes) || durationMinutes < 5 || durationMinutes > 600) {
      local.duration = 'Entre 5 e 600 minutos.';
    }
    if (!Number.isInteger(bufferMinutes) || bufferMinutes < 0 || bufferMinutes > 120) {
      local.buffer = 'Entre 0 e 120 minutos.';
    }
    setErrors(local);
    if (Object.keys(local).length || priceCents === null) {
      return;
    }
    save.mutate(
      {
        id: service?.id,
        body: {
          name: name.trim(),
          categoryId: categoryId || null,
          priceCents,
          durationMinutes,
          bufferMinutes,
          description: description.trim() || null,
          isActive: active,
        },
      },
      { onSuccess: onClose, onError: (error) => setErrors(serverFieldErrors(error)) },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={service ? `Editar ${service.name}` : 'Novo serviço'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="service-form" loading={save.isPending}>
            Salvar
          </Button>
        </>
      }
    >
      <form id="service-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" htmlFor="service-name" error={errors.name} className="sm:col-span-2">
          <Input
            id="service-name"
            value={name}
            aria-invalid={Boolean(errors.name)}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="Categoria" htmlFor="service-category">
          <Select
            id="service-category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">Sem categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Preço (R$)" htmlFor="service-price" error={errors.price}>
          <Input
            id="service-price"
            inputMode="decimal"
            placeholder="45,00"
            value={price}
            aria-invalid={Boolean(errors.price)}
            onChange={(event) => setPrice(event.target.value)}
          />
        </Field>
        <Field label="Duração (min)" htmlFor="service-duration" error={errors.duration}>
          <Input
            id="service-duration"
            type="number"
            min={5}
            max={600}
            step={5}
            value={duration}
            aria-invalid={Boolean(errors.duration)}
            onChange={(event) => setDuration(event.target.value)}
          />
        </Field>
        <Field
          label="Intervalo depois (min)"
          htmlFor="service-buffer"
          error={errors.buffer}
          hint="Tempo de limpeza antes do próximo cliente."
        >
          <Input
            id="service-buffer"
            type="number"
            min={0}
            max={120}
            value={buffer}
            aria-invalid={Boolean(errors.buffer)}
            onChange={(event) => setBuffer(event.target.value)}
          />
        </Field>
        <Field label="Descrição" htmlFor="service-description" className="sm:col-span-2">
          <Textarea
            id="service-description"
            maxLength={500}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        <div className="sm:col-span-2">
          <Switch
            id="service-active"
            label="Disponível para agendar"
            checked={active}
            onCheckedChange={setActive}
          />
        </div>
        {save.error && !Object.keys(errors).length ? (
          <Alert className="sm:col-span-2">{describeError(save.error)}</Alert>
        ) : null}
      </form>
    </Dialog>
  );
}
