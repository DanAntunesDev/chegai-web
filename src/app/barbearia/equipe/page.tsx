'use client';

import { ChevronRight, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { KIND_LABEL, StaffDialog } from '@/components/panel/staff-dialog';
import { PageHeader } from '@/components/shell/app-shell';
import { TagChip } from '@/components/tags/tag-chip';
import { TagFilter } from '@/components/tags/tag-filter';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { describeError } from '@/lib/api/errors';
import { useStaffList, useUnits } from '@/lib/panel/queries';
import { formatPhone } from '@/lib/phone';

export default function TeamPage() {
  return (
    <Suspense>
      <Team />
    </Suspense>
  );
}

function Team() {
  const params = useSearchParams();
  const [tag, setTag] = useState(params.get('tag') ?? '');
  const staff = useStaffList();
  const units = useUnits();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const visible = (staff.data ?? []).filter(
    (member) => !tag || member.tags.some((item) => item.id === tag),
  );
  const unitName = new Map(units.data?.map((unit) => [unit.id, unit.name]));

  return (
    <>
      <PageHeader
        title="Equipe"
        description="Quem atende, onde e em quais horários."
        actions={
          <Button onClick={() => setOpen(true)} disabled={!units.data}>
            <Plus /> Novo profissional
          </Button>
        }
      />
      <div className="mb-4 flex justify-end">
        <TagFilter value={tag} onChange={setTag} target="STAFF" />
      </div>
      {staff.error ? <Alert>{describeError(staff.error)}</Alert> : null}
      {staff.isPending ? (
        <Skeleton className="h-48" />
      ) : visible.length === 0 && tag ? (
        <EmptyState icon={Users} title="Ninguém com essa tag" />
      ) : staff.data?.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Ninguém na equipe ainda"
          description="Cadastre os barbeiros para montar a agenda."
        />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {visible.map((member) => (
            <li key={member.id}>
              <Link
                href={`/barbearia/equipe/${member.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 hover:border-brand/40"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2 font-semibold text-foreground">
                  {member.name.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-medium">{member.nickname || member.name}</span>
                    {member.isActive ? null : <Badge>Inativo</Badge>}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {KIND_LABEL[member.kind]} ·{' '}
                    {member.units
                      .map((unit) => unitName.get(unit.unitId))
                      .filter(Boolean)
                      .join(', ')}
                    {member.phone ? ` · ${formatPhone(member.phone)}` : ''}
                  </span>
                  {member.tags.length ? (
                    <span className="mt-1.5 flex flex-wrap gap-1">
                      {member.tags.map((item) => (
                        <TagChip key={item.id} tag={item} />
                      ))}
                    </span>
                  ) : null}
                </span>
                <ChevronRight className="size-4 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {open && units.data ? (
        <StaffDialog
          staff={null}
          units={units.data}
          open={open}
          onClose={() => setOpen(false)}
          onSaved={(saved) => router.push(`/barbearia/equipe/${saved.id}`)}
        />
      ) : null}
    </>
  );
}
