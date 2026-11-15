'use client';

import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ACTOR_LABEL, useRequestLog } from '@/lib/admin/logs';
import { formatDateTime } from '@/lib/format';
import { InfoTile, JsonBlock } from './json-block';
import { MethodBadge, StatusPill } from './method-badge';

export function RequestLogDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const log = useRequestLog(id);
  const data = log.data;

  return (
    <Dialog
      open
      onClose={onClose}
      size="xl"
      title="Detalhes da requisição"
      description={data ? `${data.method} ${data.path}` : undefined}
    >
      {!data ? (
        <Skeleton className="h-72" />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill code={data.statusCode} />
            <MethodBadge method={data.method} />
            <code className="min-w-0 font-mono text-sm break-all">{data.path}</code>
          </div>

          {data.errorCode || data.errorMessage ? (
            <div className="rounded-lg border border-danger/30 bg-danger/8 px-3 py-2.5 text-sm">
              <p className="font-medium text-danger">{data.errorCode ?? 'Erro'}</p>
              {data.errorMessage ? (
                <p className="mt-0.5 text-danger/90">{data.errorMessage}</p>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <InfoTile label="Data e hora">{formatDateTime(data.createdAt)}</InfoTile>
            <InfoTile label="Duração">{data.durationMs} ms</InfoTile>
            <InfoTile label="Origem">{ACTOR_LABEL[data.actor]}</InfoTile>
            <InfoTile label="IP">
              <span className="font-mono">{data.ip ?? '—'}</span>
            </InfoTile>
            <InfoTile label="Quem">
              {data.user ? `${data.user.name} (${data.user.email})` : '—'}
            </InfoTile>
            <InfoTile label="Barbearia">{data.tenant?.displayName ?? '—'}</InfoTile>
            <InfoTile label="Rota">
              <span className="font-mono">{data.route ?? '—'}</span>
            </InfoTile>
            <InfoTile label="Navegador">
              <span title={data.userAgent ?? undefined}>{data.userAgent ?? '—'}</span>
            </InfoTile>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <JsonBlock label="Corpo enviado" value={data.payload} />
            <JsonBlock label="Resposta" value={data.responseBody} />
            <JsonBlock label="Parâmetros da URL" value={data.query} />
            <JsonBlock label="Cabeçalhos" value={data.headers} />
          </div>
          <p className="text-xs text-muted">
            Senhas, tokens, códigos e chaves aparecem como [oculto]. Os registros ficam guardados
            por 30 dias.
          </p>
        </div>
      )}
    </Dialog>
  );
}
