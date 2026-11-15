'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ShieldCheck } from 'lucide-react';
import { type FormEvent, useDeferredValue, useState } from 'react';
import { z } from 'zod';
import { useAuth } from '@/components/auth/auth-provider';
import { PageHeader } from '@/components/shell/app-shell';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api';
import { describeError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/format';

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  isPlatformAdmin: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  active: boolean;
  memberships: { tenantId: string; tenant: string; role: string }[];
}

function NewUserDialog({ onClose }: { onClose: () => void }) {
  const client = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPlatformAdmin, setAdmin] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const create = useMutation({
    mutationFn: () =>
      api<PlatformUser>('/v1/admin/users', {
        method: 'POST',
        body: { name: name.trim(), email: email.trim(), password, isPlatformAdmin },
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['admin', 'users'] });
      onClose();
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const local: Record<string, string> = {};
    if (name.trim().length < 2) local.name = 'Informe o nome.';
    if (!z.email().safeParse(email.trim()).success) local.email = 'E-mail inválido.';
    if (password.length < 10) local.password = 'Use pelo menos 10 caracteres.';
    setErrors(local);
    if (!Object.keys(local).length) create.mutate();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Novo usuário"
      description="Acesso à plataforma. Para dono ou equipe de barbearia, use o convite da barbearia."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="user-form" loading={create.isPending}>
            Criar usuário
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field label="Nome" htmlFor="user-name" error={errors.name} required>
          <Input id="user-name" value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="E-mail" htmlFor="user-email" error={errors.email} required>
          <Input
            id="user-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field
          label="Senha inicial"
          htmlFor="user-password"
          error={errors.password}
          hint="Mínimo de 10 caracteres."
          required
        >
          <Input
            id="user-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <Switch
          id="user-admin"
          label="Administrador da plataforma"
          description="Acesso total: dashboard, barbearias, usuários e qualquer painel. Exige 2FA."
          checked={isPlatformAdmin}
          onCheckedChange={setAdmin}
        />
        {create.error ? <Alert>{describeError(create.error)}</Alert> : null}
      </form>
    </Dialog>
  );
}

export default function UsersPage() {
  const { session } = useAuth();
  const client = useQueryClient();
  const [search, setSearch] = useState('');
  const deferred = useDeferredValue(search.trim());
  const [creating, setCreating] = useState(false);
  const users = useQuery({
    queryKey: ['admin', 'users', deferred],
    queryFn: () =>
      api<PlatformUser[]>('/v1/admin/users', { query: { search: deferred || undefined } }),
    placeholderData: (previous) => previous,
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api<PlatformUser>(`/v1/admin/users/${id}`, { method: 'PATCH', body }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Quem acessa a plataforma e com qual permissão."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus /> Novo usuário
          </Button>
        }
      />
      <div className="relative mb-4">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <Input
          type="search"
          aria-label="Buscar usuários"
          placeholder="Nome ou e-mail"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pl-9"
        />
      </div>
      {users.error ? <Alert>{describeError(users.error)}</Alert> : null}
      {update.error ? <Alert className="mb-3">{describeError(update.error)}</Alert> : null}
      {users.isPending ? (
        <Skeleton className="h-64" />
      ) : (
        <Card className="divide-y divide-border p-0">
          {users.data?.map((user) => {
            const self = user.id === session?.user.id;
            return (
              <div key={user.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-sm font-semibold">
                  {user.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{user.name}</span>
                    {user.isPlatformAdmin ? (
                      <Badge tone="info">
                        <ShieldCheck className="size-3" aria-hidden /> Admin
                      </Badge>
                    ) : null}
                    {user.active ? null : <Badge tone="danger">Desativado</Badge>}
                    {self ? <Badge>Você</Badge> : null}
                  </div>
                  <p className="truncate text-xs text-muted">
                    {user.email}
                    {user.memberships.length
                      ? ` · ${user.memberships.map((item) => `${item.role} em ${item.tenant}`).join(', ')}`
                      : ''}
                    {user.lastLoginAt ? ` · último acesso ${formatDateTime(user.lastLoginAt)}` : ''}
                  </p>
                </div>
                {self ? null : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        update.mutate({
                          id: user.id,
                          body: { isPlatformAdmin: !user.isPlatformAdmin },
                        })
                      }
                    >
                      {user.isPlatformAdmin ? 'Tirar admin' : 'Tornar admin'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={user.active ? 'text-danger' : undefined}
                      onClick={() => update.mutate({ id: user.id, body: { active: !user.active } })}
                    >
                      {user.active ? 'Desativar' : 'Reativar'}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      )}
      {creating ? <NewUserDialog onClose={() => setCreating(false)} /> : null}
    </>
  );
}
