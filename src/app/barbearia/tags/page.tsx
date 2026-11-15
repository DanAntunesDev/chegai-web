'use client';

import { Plus, Tags, UserRound, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useMe } from '@/components/auth/use-me';
import { PageHeader } from '@/components/shell/app-shell';
import { TagChip } from '@/components/tags/tag-chip';
import { TagDialog } from '@/components/tags/tag-dialog';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { describeError } from '@/lib/api/errors';
import { useDeleteTag, useTags } from '@/lib/panel/queries';
import type { Tag } from '@/lib/panel/types';

const SCOPE_LABEL = {
  ALL: 'Clientes e equipe',
  CUSTOMERS: 'Só clientes',
  STAFF: 'Só equipe',
} as const;

export default function TagsPage() {
  const me = useMe();
  const permissions = me.data?.permissions ?? [];
  const canManage =
    permissions.includes('customers.manage') || permissions.includes('staff.manage');
  const tags = useTags();
  const remove = useDeleteTag();
  const [editing, setEditing] = useState<Tag | null | undefined>(undefined);

  return (
    <>
      <PageHeader
        title="Tags"
        description="Marque clientes e equipe para encontrar e separar mais rápido."
        actions={
          canManage ? (
            <Button onClick={() => setEditing(null)}>
              <Plus /> Nova tag
            </Button>
          ) : null
        }
      />
      {tags.error ? <Alert>{describeError(tags.error)}</Alert> : null}
      {remove.error ? <Alert className="mb-3">{describeError(remove.error)}</Alert> : null}
      {tags.isPending ? (
        <Skeleton className="h-48" />
      ) : tags.data?.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="Nenhuma tag ainda"
          description="Crie tags como VIP, mensalista ou aprendiz e use nos cadastros de clientes e equipe."
          action={
            canManage ? (
              <Button onClick={() => setEditing(null)}>
                <Plus /> Criar a primeira
              </Button>
            ) : null
          }
        />
      ) : (
        <Card className="divide-y divide-border p-0">
          {tags.data?.map((tag) => (
            <div key={tag.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
              <button
                type="button"
                disabled={!canManage}
                onClick={() => setEditing(tag)}
                className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left"
              >
                <TagChip tag={tag} size="md" />
                {tag.note ? <span className="text-sm text-muted">{tag.note}</span> : null}
              </button>
              <span className="text-xs text-muted">{SCOPE_LABEL[tag.scope]}</span>
              <div className="flex items-center gap-3 text-sm">
                {tag.scope !== 'STAFF' ? (
                  <Link
                    href={`/barbearia/clientes?tag=${tag.id}`}
                    className="inline-flex items-center gap-1 text-muted hover:text-foreground"
                  >
                    <UserRound className="size-4" /> {tag.customersCount}
                  </Link>
                ) : null}
                {tag.scope !== 'CUSTOMERS' ? (
                  <Link
                    href={`/barbearia/equipe?tag=${tag.id}`}
                    className="inline-flex items-center gap-1 text-muted hover:text-foreground"
                  >
                    <UsersRound className="size-4" /> {tag.staffCount}
                  </Link>
                ) : null}
              </div>
              {canManage ? (
                <ConfirmButton
                  label=""
                  title={`Excluir a tag ${tag.name}?`}
                  description="Ela sai de todos os clientes e profissionais que a usam."
                  onConfirm={() => remove.mutateAsync(tag.id)}
                />
              ) : null}
            </div>
          ))}
        </Card>
      )}
      {editing !== undefined ? (
        <TagDialog tag={editing} onClose={() => setEditing(undefined)} />
      ) : null}
    </>
  );
}
