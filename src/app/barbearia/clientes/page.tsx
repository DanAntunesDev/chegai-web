'use client';

import { Cake, MessageCircle, Plus, Search, UserRound } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { useMe } from '@/components/auth/use-me';
import { CustomerDialog } from '@/components/panel/customer-dialog';
import { PageHeader } from '@/components/shell/app-shell';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { describeError } from '@/lib/api/errors';
import { formatDate } from '@/lib/format';
import { useCustomers, useDeleteCustomer } from '@/lib/panel/queries';
import type { Customer } from '@/lib/panel/types';
import { formatPhone, whatsappLink } from '@/lib/phone';

export default function CustomersPage() {
  const me = useMe();
  const canManage = me.data?.permissions.includes('customers.manage') ?? false;
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');
  const [page, setPage] = useState(1);
  const deferred = useDeferredValue(search.trim());
  const customers = useCustomers(deferred, tag, page);
  const remove = useDeleteCustomer();
  const [editing, setEditing] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);

  const totalPages = customers.data
    ? Math.max(1, Math.ceil(customers.data.total / customers.data.pageSize))
    : 1;

  const openDialog = (customer: Customer | null) => {
    setEditing(customer);
    setOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Clientes"
        description={customers.data ? `${customers.data.total} cadastrados` : undefined}
        actions={
          canManage ? (
            <Button onClick={() => openDialog(null)}>
              <Plus /> Novo cliente
            </Button>
          ) : null
        }
      />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <Input
            type="search"
            aria-label="Buscar clientes"
            placeholder="Nome, e-mail ou telefone"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        {tag ? (
          <Button variant="outline" onClick={() => setTag('')}>
            Etiqueta: {tag} ✕
          </Button>
        ) : null}
      </div>

      {customers.error ? <Alert>{describeError(customers.error)}</Alert> : null}
      {remove.error ? <Alert className="mb-3">{describeError(remove.error)}</Alert> : null}

      {customers.isPending ? (
        <Skeleton className="h-64" />
      ) : customers.data?.items.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title={deferred || tag ? 'Ninguém encontrado' : 'Nenhum cliente ainda'}
          description="Clientes que agendam pelo link ou pelo WhatsApp entram aqui sozinhos."
        />
      ) : (
        <Card className="divide-y divide-border p-0">
          {customers.data?.items.map((customer) => (
            <div key={customer.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <button
                type="button"
                onClick={() => canManage && openDialog(customer)}
                className="min-w-0 flex-1 text-left"
                disabled={!canManage}
              >
                <span className="block font-medium">{customer.name}</span>
                <span className="flex flex-wrap items-center gap-x-3 text-xs text-muted">
                  {formatPhone(customer.phone)}
                  {customer.birthDate ? (
                    <span className="inline-flex items-center gap-1">
                      <Cake className="size-3.5" aria-hidden />{' '}
                      {formatDate(customer.birthDate.slice(0, 10)).slice(0, 5)}
                    </span>
                  ) : null}
                </span>
              </button>
              <div className="flex flex-wrap gap-1">
                {customer.tags.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setTag(item);
                      setPage(1);
                    }}
                  >
                    <Badge tone="info">{item}</Badge>
                  </button>
                ))}
              </div>
              <a
                href={whatsappLink(customer.phone)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Conversar com ${customer.name} no WhatsApp`}
                className="grid size-9 place-items-center rounded-lg text-success hover:bg-success/10"
              >
                <MessageCircle className="size-4" />
              </a>
              {canManage ? (
                <ConfirmButton
                  label=""
                  title={`Excluir ${customer.name}?`}
                  description="O histórico de agendamentos continua guardado."
                  onConfirm={() => remove.mutateAsync(customer.id)}
                />
              ) : null}
            </div>
          ))}
        </Card>
      )}

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
          >
            Anterior
          </Button>
          <span className="text-muted">
            {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((value) => value + 1)}
          >
            Próxima
          </Button>
        </div>
      ) : null}

      {open ? (
        <CustomerDialog
          key={editing?.id ?? 'new'}
          customer={editing}
          open={open}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
