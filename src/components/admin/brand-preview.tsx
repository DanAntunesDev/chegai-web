import type { CSSProperties } from 'react';
import { modeVariables } from '@/lib/branding';
import { cn } from '@/lib/cn';

interface BrandPreviewProps {
  name: string;
  primary: string;
  secondary: string;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  showPoweredBy: boolean;
  mode: 'light' | 'dark';
}

export function BrandPreview({
  name,
  primary,
  secondary,
  logoUrl,
  logoDarkUrl,
  showPoweredBy,
  mode,
}: BrandPreviewProps) {
  const logo = mode === 'dark' ? (logoDarkUrl ?? logoUrl) : logoUrl;
  return (
    <div className={mode}>
      <div
        style={modeVariables(primary, secondary, mode) as CSSProperties}
        className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5 text-foreground"
      >
        <span className="text-xs font-medium text-muted uppercase">
          {mode === 'dark' ? 'Tema escuro' : 'Tema claro'}
        </span>
        <div className="flex items-center gap-3">
          {logo ? (
            <img src={logo} alt="" className="h-9 w-auto max-w-36 object-contain" />
          ) : (
            <span className="grid size-9 place-items-center rounded-lg bg-brand font-display font-bold text-on-brand">
              {name.charAt(0) || 'B'}
            </span>
          )}
          <span className="font-display font-semibold">{name}</span>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3">
          <p className="text-sm font-medium">Corte + barba</p>
          <p className="text-xs text-muted">45 min · com Rafael</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {['09:00', '09:45', '10:30'].map((time, index) => (
              <span
                key={time}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium',
                  index === 1 ? 'bg-brand text-on-brand' : 'bg-surface-2',
                )}
              >
                {time}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-brand-2">Ver outros horários</span>
          <span className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-on-brand">
            Agendar
          </span>
        </div>
        {showPoweredBy ? (
          <p className="text-center text-[11px] text-muted">Agenda por Chegaí</p>
        ) : null}
      </div>
    </div>
  );
}
