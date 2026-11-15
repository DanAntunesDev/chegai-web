'use client';

import { ArrowRight } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { type AuditLogRow, actionLabel, diffFields } from '@/lib/admin/logs';
import { formatDateTime } from '@/lib/format';
import { InfoTile, JsonBlock } from './json-block';

const FIELD_LABEL: Record<string, string> = {
  name: 'Nome',
  color: 'Cor',
  note: 'Observação',
  scope: 'Uso',
  url: 'URL',
  events: 'Eventos',
  isActive: 'Ativo',
  depositPercent: 'Sinal (%)',
  ownAccount: 'Conta própria',
  displayName: 'Nome de exibição',
  status: 'Situação',
  planCode: 'Plano',
};

function show(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return '—';
  }
  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Não';
  }
  if (Array.isArray(value)) {
    return value.length
      ? value
          .map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item)))
          .join(', ')
      : 'Nenhum';
  }
  if (typeof value === 'object') {
    const masked = value as { set?: boolean; hint?: string };
    return masked.set ? `Definido (${masked.hint ?? ''})` : JSON.stringify(value);
  }
  return String(value);
}

export function AuditLogDialog({ log, onClose }: { log: AuditLogRow; onClose: () => void }) {
  const changes = diffFields(log.before, log.after);

  return (
    <Dialog
      open
      onClose={onClose}
      size="xl"
      title={actionLabel(log.action)}
      description={log.action}
    >
      <div className="flex flex-col gap-5">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <InfoTile label="Data e hora">{formatDateTime(log.createdAt)}</InfoTile>
          <InfoTile label="Quem fez">
            {log.user ? `${log.user.name} (${log.user.email})` : 'Sistema'}
          </InfoTile>
          <InfoTile label="Barbearia">{log.tenant?.displayName ?? 'Plataforma'}</InfoTile>
          <InfoTile label="Registro">
            <span className="font-mono">
              {log.entity}
              {log.entityId ? ` · ${log.entityId.slice(0, 8)}` : ''}
            </span>
          </InfoTile>
        </div>

        {changes.length ? (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Campo</th>
                  <th className="px-3 py-2 font-medium">Antes</th>
                  <th className="w-6" />
                  <th className="px-3 py-2 font-medium">Depois</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {changes.map((change) => (
                  <tr key={change.field}>
                    <td className="px-3 py-2 font-medium">
                      {FIELD_LABEL[change.field] ?? change.field}
                    </td>
                    <td className="px-3 py-2 break-all text-muted line-through decoration-danger/40">
                      {show(change.before)}
                    </td>
                    <td className="text-muted">
                      <ArrowRight className="size-3.5" />
                    </td>
                    <td className="px-3 py-2 break-all">{show(change.after)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted">Sem campos alterados registrados para essa ação.</p>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <JsonBlock label="Antes" value={log.before} />
          <JsonBlock label="Depois" value={log.after} />
        </div>
      </div>
    </Dialog>
  );
}
