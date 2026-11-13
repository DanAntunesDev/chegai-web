'use client';

import { ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { BlocksPanel } from '@/components/panel/blocks-panel';
import { KIND_LABEL, StaffDialog } from '@/components/panel/staff-dialog';
import { StaffServicesEditor } from '@/components/panel/staff-services-editor';
import { WorkingHoursEditor } from '@/components/panel/working-hours-editor';
import { PageHeader } from '@/components/shell/app-shell';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs } from '@/components/ui/tabs';
import { describeError } from '@/lib/api/errors';
import { useDeleteStaff, useStaffMember, useUnits } from '@/lib/panel/queries';
import { formatPhone } from '@/lib/phone';

type Section = 'expediente' | 'servicos' | 'ausencias';

const SECTIONS: { value: Section; label: string }[] = [
  { value: 'expediente', label: 'Expediente' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'ausencias', label: 'Folgas e bloqueios' },
];

export default function StaffPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const staff = useStaffMember(id);
  const units = useUnits();
  const remove = useDeleteStaff();
  const [section, setSection] = useState<Section>('expediente');
  const [editing, setEditing] = useState(false);

  return (
    <>
      <Link
        href="/painel/equipe"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Equipe
      </Link>
      {staff.isPending || units.isPending ? (
        <Skeleton className="h-64" />
      ) : staff.error ? (
        <Alert>{describeError(staff.error)}</Alert>
      ) : (
        <>
          <PageHeader
            title={staff.data.nickname || staff.data.name}
            description={[
              KIND_LABEL[staff.data.kind],
              formatPhone(staff.data.phone),
              staff.data.email,
            ]
              .filter(Boolean)
              .join(' · ')}
            actions={
              <>
                {staff.data.isActive ? null : <Badge className="self-center">Inativo</Badge>}
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil /> Editar
                </Button>
                <ConfirmButton
                  label="Remover"
                  title={`Remover ${staff.data.name}?`}
                  description="Sai da agenda e da equipe. Atendimentos passados continuam no histórico."
                  confirmLabel="Remover"
                  onConfirm={async () => {
                    await remove.mutateAsync(staff.data.id);
                    router.replace('/painel/equipe');
                  }}
                />
              </>
            }
          />
          <div className="mb-5">
            <Tabs
              label="Seções do profissional"
              items={SECTIONS}
              value={section}
              onValueChange={setSection}
            />
          </div>
          {section === 'expediente' ? (
            <WorkingHoursEditor staff={staff.data} units={units.data ?? []} />
          ) : null}
          {section === 'servicos' ? <StaffServicesEditor staff={staff.data} /> : null}
          {section === 'ausencias' ? <BlocksPanel staffId={staff.data.id} /> : null}
          {editing ? (
            <StaffDialog
              staff={staff.data}
              units={units.data ?? []}
              open={editing}
              onClose={() => setEditing(false)}
            />
          ) : null}
        </>
      )}
    </>
  );
}
