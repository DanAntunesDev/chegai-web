'use client';

import { ChevronLeft, ChevronRight, Filter, ScrollText, Search, X } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs } from '@/components/ui/tabs';
import {
  ACTOR_LABEL,
  type AuditLogFilters,
  type AuditLogRow,
  actionLabel,
  LOG_PAGE_SIZE,
  type LogActor,
  type RequestLogFilters,
  useAuditLogs,
  useRequestLogs,
} from '@/lib/admin/logs';
import { describeError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/format';
import { AuditLogDialog } from './audit-log-dialog';
import { MethodBadge, StatusPill } from './method-badge';
import { RequestLogDialog } from './request-log-dialog';

type Kind = 'requests' | 'audit';

function Pager({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / LOG_PAGE_SIZE));
  if (pages <= 1) {
    return null;
  }
  return (
    <div className="mt-3 flex items-center justify-end gap-2 text-sm text-muted">
      <span>
        Página {page} de {pages}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        aria-label="Página anterior"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        aria-label="Próxima página"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative min-w-0 flex-1 sm:max-w-sm">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
      <Input
        type="search"
        aria-label="Buscar nos logs"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="pl-9"
      />
    </div>
  );
}

function FilterButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <Button variant="outline" onClick={onClick}>
      <Filter /> Filtros
      {count ? (
        <span className="grid size-5 place-items-center rounded-full bg-foreground text-[11px] text-background">
          {count}
        </span>
      ) : null}
    </Button>
  );
}

function PeriodFields({
  from,
  to,
  onChange,
}: {
  from?: string;
  to?: string;
  onChange: (value: { from?: string; to?: string }) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="De" htmlFor="log-from">
        <Input
          id="log-from"
          type="date"
          value={from ?? ''}
          onChange={(event) => onChange({ from: event.target.value || undefined, to })}
        />
      </Field>
      <Field label="Até" htmlFor="log-to">
        <Input
          id="log-to"
          type="date"
          value={to ?? ''}
          onChange={(event) => onChange({ from, to: event.target.value || undefined })}
        />
      </Field>
    </div>
  );
}

function FilterDialog({
  title,
  onApply,
  onClear,
  onClose,
  children,
}: {
  title: string;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" className="mr-auto" onClick={onClear}>
            <X /> Limpar
          </Button>
          <Button onClick={onApply}>Aplicar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">{children}</div>
    </Dialog>
  );
}

function RequestLogs({ tenantId }: { tenantId?: string }) {
  const [search, setSearch] = useState('');
  const deferred = useDeferredValue(search.trim());
  const [filters, setFilters] = useState<RequestLogFilters>({});
  const [draft, setDraft] = useState<RequestLogFilters>({});
  const [filtering, setFiltering] = useState(false);
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<string | null>(null);
  const logs = useRequestLogs({ ...filters, tenantId, search: deferred || undefined }, page);
  const active = [filters.method, filters.status, filters.actor, filters.from || filters.to].filter(
    Boolean,
  ).length;

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchBox
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Caminho, código de erro ou IP"
        />
        <FilterButton
          count={active}
          onClick={() => {
            setDraft(filters);
            setFiltering(true);
          }}
        />
        <span className="ml-auto text-xs text-muted">
          {logs.data ? `${logs.data.total} registros` : ''}
        </span>
      </div>
      {logs.error ? <Alert>{describeError(logs.error)}</Alert> : null}
      {logs.isPending ? (
        <Skeleton className="h-72" />
      ) : logs.data?.items.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="Nenhuma requisição registrada"
          description="Entram aqui todas as alterações e qualquer requisição que deu erro."
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="hidden grid-cols-[4.5rem_minmax(0,1fr)_4.5rem_5rem_9rem_8.5rem] gap-3 border-b border-border bg-surface-2/60 px-4 py-2 text-xs font-medium text-muted md:grid">
            <span>Método</span>
            <span>Caminho</span>
            <span>Status</span>
            <span>Duração</span>
            <span>Origem</span>
            <span>Quando</span>
          </div>
          <ul className="divide-y divide-border">
            {logs.data?.items.map((log) => (
              <li key={log.id}>
                <button
                  type="button"
                  onClick={() => setViewing(log.id)}
                  className="grid w-full grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-2.5 text-left text-sm hover:bg-surface-2/60 md:grid-cols-[4.5rem_minmax(0,1fr)_4.5rem_5rem_9rem_8.5rem]"
                >
                  <MethodBadge method={log.method} />
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-[13px]">{log.path}</span>
                    {log.errorCode ? (
                      <span className="block truncate text-xs text-danger">{log.errorCode}</span>
                    ) : null}
                  </span>
                  <StatusPill code={log.statusCode} />
                  <span className="hidden text-muted tabular-nums md:block">
                    {log.durationMs} ms
                  </span>
                  <span className="col-span-2 truncate text-xs text-muted md:col-span-1 md:text-sm">
                    {log.tenant?.displayName ?? ACTOR_LABEL[log.actor]}
                    {log.user ? ` · ${log.user.name.split(' ')[0]}` : ''}
                  </span>
                  <span className="text-right text-xs text-muted tabular-nums md:text-left md:text-sm">
                    {formatDateTime(log.createdAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Pager page={page} total={logs.data?.total ?? 0} onChange={setPage} />
      {filtering ? (
        <FilterDialog
          title="Filtrar requisições"
          onClose={() => setFiltering(false)}
          onClear={() => {
            setFilters({});
            setDraft({});
            setPage(1);
            setFiltering(false);
          }}
          onApply={() => {
            setFilters(draft);
            setPage(1);
            setFiltering(false);
          }}
        >
          <Field label="Método" htmlFor="log-method">
            <Select
              id="log-method"
              value={draft.method ?? ''}
              onChange={(event) => setDraft({ ...draft, method: event.target.value || undefined })}
            >
              <option value="">Todos</option>
              {['POST', 'PUT', 'PATCH', 'DELETE', 'GET'].map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Resultado" htmlFor="log-status">
            <Select
              id="log-status"
              value={draft.status ?? ''}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  status: (event.target.value || undefined) as RequestLogFilters['status'],
                })
              }
            >
              <option value="">Todos</option>
              <option value="success">Deu certo (2xx e 3xx)</option>
              <option value="client_error">Recusado (4xx)</option>
              <option value="server_error">Falha no servidor (5xx)</option>
            </Select>
          </Field>
          <Field label="Origem" htmlFor="log-actor">
            <Select
              id="log-actor"
              value={draft.actor ?? ''}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  actor: (event.target.value || undefined) as LogActor | undefined,
                })
              }
            >
              <option value="">Todas</option>
              {(Object.keys(ACTOR_LABEL) as LogActor[]).map((actor) => (
                <option key={actor} value={actor}>
                  {ACTOR_LABEL[actor]}
                </option>
              ))}
            </Select>
          </Field>
          <PeriodFields
            from={draft.from}
            to={draft.to}
            onChange={(value) => setDraft({ ...draft, ...value })}
          />
        </FilterDialog>
      ) : null}
      {viewing ? <RequestLogDialog id={viewing} onClose={() => setViewing(null)} /> : null}
    </>
  );
}

function AuditLogs({ tenantId }: { tenantId?: string }) {
  const [search, setSearch] = useState('');
  const deferred = useDeferredValue(search.trim());
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [draft, setDraft] = useState<AuditLogFilters>({});
  const [filtering, setFiltering] = useState(false);
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<AuditLogRow | null>(null);
  const logs = useAuditLogs({ ...filters, tenantId, search: deferred || undefined }, page);
  const active = [filters.action, filters.from || filters.to].filter(Boolean).length;

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchBox
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Ação, registro ou ID"
        />
        <FilterButton
          count={active}
          onClick={() => {
            setDraft(filters);
            setFiltering(true);
          }}
        />
        <span className="ml-auto text-xs text-muted">
          {logs.data ? `${logs.data.total} registros` : ''}
        </span>
      </div>
      {logs.error ? <Alert>{describeError(logs.error)}</Alert> : null}
      {logs.isPending ? (
        <Skeleton className="h-72" />
      ) : logs.data?.items.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="Nenhuma alteração registrada"
          description="Quem mudou o quê: tags, integrações, webhooks, planos e dados das barbearias."
        />
      ) : (
        <Card className="divide-y divide-border p-0">
          {logs.data?.items.map((log) => (
            <button
              key={log.id}
              type="button"
              onClick={() => setViewing(log)}
              className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left hover:bg-surface-2/60"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{actionLabel(log.action)}</span>
                <span className="block truncate text-xs text-muted">
                  {log.user ? log.user.name : 'Sistema'}
                  {log.tenant ? ` · ${log.tenant.displayName}` : ' · Plataforma'}
                </span>
              </span>
              <span className="text-xs text-muted tabular-nums">
                {formatDateTime(log.createdAt)}
              </span>
            </button>
          ))}
        </Card>
      )}
      <Pager page={page} total={logs.data?.total ?? 0} onChange={setPage} />
      {filtering ? (
        <FilterDialog
          title="Filtrar alterações"
          onClose={() => setFiltering(false)}
          onClear={() => {
            setFilters({});
            setDraft({});
            setPage(1);
            setFiltering(false);
          }}
          onApply={() => {
            setFilters(draft);
            setPage(1);
            setFiltering(false);
          }}
        >
          <Field label="Ação" htmlFor="log-action">
            <Select
              id="log-action"
              value={draft.action ?? ''}
              onChange={(event) => setDraft({ ...draft, action: event.target.value || undefined })}
            >
              <option value="">Todas</option>
              {logs.data?.actions.map((action) => (
                <option key={action} value={action}>
                  {actionLabel(action)}
                </option>
              ))}
            </Select>
          </Field>
          <PeriodFields
            from={draft.from}
            to={draft.to}
            onChange={(value) => setDraft({ ...draft, ...value })}
          />
        </FilterDialog>
      ) : null}
      {viewing ? <AuditLogDialog log={viewing} onClose={() => setViewing(null)} /> : null}
    </>
  );
}

export function LogsView({ tenantId }: { tenantId?: string }) {
  const [kind, setKind] = useState<Kind>('requests');
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Tabs
          label="Tipo de log"
          items={[
            { value: 'requests', label: 'Requisições' },
            { value: 'audit', label: 'Alterações' },
          ]}
          value={kind}
          onValueChange={setKind}
        />
      </div>
      {kind === 'requests' ? (
        <RequestLogs tenantId={tenantId} />
      ) : (
        <AuditLogs tenantId={tenantId} />
      )}
    </div>
  );
}
