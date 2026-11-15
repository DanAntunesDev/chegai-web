'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

const isEmpty = (value: unknown) =>
  value === null ||
  value === undefined ||
  (typeof value === 'object' && Object.keys(value as object).length === 0);

export function JsonBlock({ label, value }: { label: string; value: unknown }) {
  const [copied, setCopied] = useState(false);
  const text = isEmpty(value) ? null : JSON.stringify(value, null, 2);

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        {text ? (
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        ) : null}
      </div>
      <pre className="max-h-64 overflow-auto rounded-lg border border-border bg-surface-2 p-3 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap">
        {text ?? '—'}
      </pre>
    </div>
  );
}

export function InfoTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-surface-2/60 px-3 py-2.5">
      <p className="text-xs text-muted">{label}</p>
      <div className="mt-0.5 truncate text-sm font-medium">{children}</div>
    </div>
  );
}
