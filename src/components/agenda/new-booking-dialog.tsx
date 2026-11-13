'use client';

import { type FormEvent, useDeferredValue, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { describeError } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { useCreateBooking, useCustomers, useServices } from '@/lib/panel/queries';
import type { Customer, Staff } from '@/lib/panel/types';
import { formatPhone } from '@/lib/phone';
import { type PickedSlot, SlotPicker } from './slot-picker';

interface NewBookingDialogProps {
  open: boolean;
  onClose: () => void;
  unitId: string;
  date: string;
  staff: Staff[];
  initialStaffId?: string;
}

export function NewBookingDialog({
  open,
  onClose,
  unitId,
  date: initialDate,
  staff,
  initialStaffId,
}: NewBookingDialogProps) {
  const services = useServices();
  const create = useCreateBooking();
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [date, setDate] = useState(initialDate);
  const [staffId, setStaffId] = useState(initialStaffId ?? '');
  const [slot, setSlot] = useState<PickedSlot | null>(null);
  const [search, setSearch] = useState('');
  const deferred = useDeferredValue(search.trim());
  const customers = useCustomers(deferred, '', 1);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  const barbers = staff.filter((member) => member.kind === 'BARBER' && member.isActive);
  const chosen = services.data?.filter((service) => serviceIds.includes(service.id)) ?? [];

  const resetSlot = () => setSlot(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!slot) {
      setProblem('Escolha um horário.');
      return;
    }
    if (
      !customer &&
      (!newCustomer || name.trim().length < 2 || phone.replace(/\D/g, '').length < 10)
    ) {
      setProblem('Escolha um cliente ou cadastre nome e WhatsApp.');
      return;
    }
    setProblem(null);
    create.mutate(
      {
        unitId,
        serviceIds,
        startsAt: slot.startsAt,
        staffId: staffId || slot.staffId,
        customer: customer
          ? { customerId: customer.id }
          : { customer: { name: name.trim(), phone } },
        notes: notes.trim() || undefined,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="Novo agendamento"
      footer={
        <>
          <span className="mr-auto self-center text-sm text-muted">
            {chosen.length
              ? formatMoney(chosen.reduce((sum, item) => sum + item.priceCents, 0))
              : ''}
            {slot ? ` · ${slot.time} com ${slot.staffName}` : ''}
          </span>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="booking-form" loading={create.isPending}>
            Agendar
          </Button>
        </>
      }
    >
      <form id="booking-form" onSubmit={submit} noValidate className="flex flex-col gap-5">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-medium">Serviços</legend>
          <div className="flex flex-wrap gap-2">
            {services.data
              ?.filter((service) => service.isActive)
              .map((service) => {
                const active = serviceIds.includes(service.id);
                return (
                  <button
                    key={service.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      resetSlot();
                      setServiceIds((current) =>
                        active
                          ? current.filter((id) => id !== service.id)
                          : [...current, service.id].slice(0, 5),
                      );
                    }}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm transition-colors',
                      active
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-border hover:border-brand/40',
                    )}
                  >
                    {service.name} · {service.durationMinutes} min
                  </button>
                );
              })}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Dia" htmlFor="booking-date">
            <Input
              id="booking-date"
              type="date"
              value={date}
              onChange={(event) => {
                resetSlot();
                setDate(event.target.value);
              }}
            />
          </Field>
          <Field label="Profissional" htmlFor="booking-staff">
            <Select
              id="booking-staff"
              value={staffId}
              onChange={(event) => {
                resetSlot();
                setStaffId(event.target.value);
              }}
            >
              <option value="">Qualquer um</option>
              {barbers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.nickname || member.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Horário</span>
          <SlotPicker
            unitId={unitId}
            date={date}
            serviceIds={serviceIds}
            staffId={staffId}
            value={slot}
            onChange={setSlot}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Cliente</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setNewCustomer((value) => !value);
                setCustomer(null);
              }}
            >
              {newCustomer ? 'Buscar cadastrado' : 'Cliente novo'}
            </Button>
          </div>
          {newCustomer ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                aria-label="Nome do cliente"
                placeholder="Nome"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <Input
                aria-label="WhatsApp do cliente"
                placeholder="(38) 99999-9999"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
          ) : customer ? (
            <div className="flex items-center justify-between rounded-lg border border-brand/40 bg-brand/5 px-3 py-2">
              <span className="text-sm">
                <span className="font-medium">{customer.name}</span>
                <span className="ml-2 text-muted">{formatPhone(customer.phone)}</span>
              </span>
              <Button variant="ghost" size="sm" onClick={() => setCustomer(null)}>
                Trocar
              </Button>
            </div>
          ) : (
            <>
              <Input
                type="search"
                aria-label="Buscar cliente"
                placeholder="Buscar por nome ou telefone"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <ul className="max-h-40 overflow-y-auto rounded-lg border border-border">
                {customers.data?.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setCustomer(item)}
                      className="flex w-full justify-between px-3 py-2 text-left text-sm hover:bg-surface-2"
                    >
                      <span>{item.name}</span>
                      <span className="text-muted">{formatPhone(item.phone)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <Field label="Observações" htmlFor="booking-notes">
          <Textarea
            id="booking-notes"
            maxLength={500}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </Field>

        {problem ? <Alert>{problem}</Alert> : null}
        {create.error ? <Alert>{describeError(create.error)}</Alert> : null}
      </form>
    </Dialog>
  );
}
