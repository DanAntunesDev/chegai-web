'use client';

import { Clock, Pencil, Plus, Scissors, Tags } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CategoriesDialog } from '@/components/panel/categories-dialog';
import { ServiceDialog } from '@/components/panel/service-dialog';
import { PageHeader } from '@/components/shell/app-shell';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { describeError } from '@/lib/api/errors';
import { formatMoney } from '@/lib/format';
import { useCategories, useDeleteService, useServices } from '@/lib/panel/queries';
import type { Service } from '@/lib/panel/types';

export default function ServicesPage() {
  const services = useServices();
  const categories = useCategories();
  const remove = useDeleteService();
  const [editing, setEditing] = useState<Service | null>(null);
  const [open, setOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const groups = useMemo(() => {
    const list = categories.data ?? [];
    const byCategory = new Map<string, Service[]>();
    for (const service of services.data ?? []) {
      const key = service.categoryId ?? '';
      byCategory.set(key, [...(byCategory.get(key) ?? []), service]);
    }
    return [
      ...list.map((category) => ({
        id: category.id,
        name: category.name,
        items: byCategory.get(category.id) ?? [],
      })),
      { id: '', name: 'Sem categoria', items: byCategory.get('') ?? [] },
    ].filter((group) => group.items.length > 0);
  }, [services.data, categories.data]);

  const openDialog = (service: Service | null) => {
    setEditing(service);
    setOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Serviços"
        description="O que a barbearia oferece, com preço e duração."
        actions={
          <>
            <Button variant="outline" onClick={() => setCategoriesOpen(true)}>
              <Tags /> Categorias
            </Button>
            <Button onClick={() => openDialog(null)}>
              <Plus /> Novo serviço
            </Button>
          </>
        }
      />
      {services.error ? <Alert>{describeError(services.error)}</Alert> : null}
      {remove.error ? <Alert className="mb-3">{describeError(remove.error)}</Alert> : null}
      {services.isPending ? (
        <Skeleton className="h-64" />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title="Nenhum serviço"
          description="Cadastre o primeiro serviço para abrir a agenda."
          action={<Button onClick={() => openDialog(null)}>Novo serviço</Button>}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.id || 'none'}>
              <h2 className="mb-2 text-sm font-semibold text-muted">{group.name}</h2>
              <Card className="divide-y divide-border p-0">
                {group.items.map((service) => (
                  <div key={service.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{service.name}</span>
                        {service.isActive ? null : <Badge>Pausado</Badge>}
                      </div>
                      <p className="flex items-center gap-1 text-xs text-muted">
                        <Clock className="size-3.5" aria-hidden /> {service.durationMinutes} min
                        {service.bufferMinutes ? ` + ${service.bufferMinutes} de intervalo` : ''}
                      </p>
                    </div>
                    <span className="font-semibold tabular-nums">
                      {formatMoney(service.priceCents)}
                    </span>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => openDialog(service)}>
                        <Pencil /> Editar
                      </Button>
                      <ConfirmButton
                        label="Excluir"
                        title={`Excluir ${service.name}?`}
                        description="Agendamentos já feitos continuam no histórico."
                        onConfirm={() => remove.mutateAsync(service.id)}
                      />
                    </div>
                  </div>
                ))}
              </Card>
            </section>
          ))}
        </div>
      )}
      {open ? (
        <ServiceDialog
          key={editing?.id ?? 'new'}
          service={editing}
          categories={categories.data ?? []}
          open={open}
          onClose={() => setOpen(false)}
        />
      ) : null}
      <CategoriesDialog
        categories={categories.data ?? []}
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
      />
    </>
  );
}
