'use client';

import { ImageUp } from 'lucide-react';
import { type ChangeEvent, type FormEvent, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useUpdateBranding, useUploadAsset } from '@/lib/admin/queries';
import { describeError } from '@/lib/api/errors';
import type { AdminTenant } from '@/lib/api/types';
import { DEFAULT_PRIMARY, DEFAULT_SECONDARY } from '@/lib/branding';
import { isHexColor } from '@/lib/color';
import { BrandPreview } from './brand-preview';

const ASSETS = [
  { key: 'logo', label: 'Logo (fundo claro)', column: 'logoUrl' },
  { key: 'logo-dark', label: 'Logo (fundo escuro)', column: 'logoDarkUrl' },
  { key: 'icon', label: 'Ícone do app', column: 'iconUrl' },
] as const;

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024;
const DOMAIN = /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/i;

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const valid = isHexColor(value);
  return (
    <Field label={label} htmlFor={id} error={valid ? undefined : 'Use o formato #RRGGBB.'}>
      <div className="flex gap-2">
        <input
          type="color"
          aria-label={`${label} (seletor)`}
          value={valid ? value : '#000000'}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="h-10 w-12 cursor-pointer rounded-lg border border-border bg-background p-1"
        />
        <Input
          id={id}
          value={value}
          maxLength={7}
          aria-invalid={!valid}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="font-mono uppercase"
        />
      </div>
    </Field>
  );
}

export function BrandingEditor({ tenant }: { tenant: AdminTenant }) {
  const branding = tenant.branding;
  const save = useUpdateBranding(tenant.id);
  const upload = useUploadAsset(tenant.id);
  const [primary, setPrimary] = useState(branding?.primaryColor ?? DEFAULT_PRIMARY);
  const [secondary, setSecondary] = useState(branding?.secondaryColor ?? DEFAULT_SECONDARY);
  const [showPoweredBy, setShowPoweredBy] = useState(branding?.showPoweredBy ?? true);
  const [allowOwnerRename, setAllowOwnerRename] = useState(branding?.allowOwnerRename ?? false);
  const [customDomain, setCustomDomain] = useState(branding?.customDomain ?? '');
  const [senderName, setSenderName] = useState(branding?.emailSenderName ?? '');
  const [localError, setLocalError] = useState<string | null>(null);

  const canHidePoweredBy = tenant.entitlements.features.includes('hide_powered_by');
  const canUseDomain = tenant.entitlements.features.includes('custom_domain');

  const onFile = (asset: string) => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    if (!ACCEPTED.includes(file.type)) {
      setLocalError('Envie PNG, JPG ou WebP.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setLocalError('A imagem precisa ter até 2 MB.');
      return;
    }
    setLocalError(null);
    upload.mutate({ asset, file });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const domain = customDomain.trim().toLowerCase();
    if (!isHexColor(primary) || !isHexColor(secondary)) {
      setLocalError('Confira as cores.');
      return;
    }
    if (domain && !DOMAIN.test(domain)) {
      setLocalError('Domínio inválido. Exemplo: agenda.barbeariadoze.com.br');
      return;
    }
    if (senderName.trim() && senderName.trim().length < 2) {
      setLocalError('O nome do remetente precisa de pelo menos 2 letras.');
      return;
    }
    setLocalError(null);
    save.mutate({
      primaryColor: primary,
      secondaryColor: secondary,
      showPoweredBy: canHidePoweredBy ? showPoweredBy : true,
      allowOwnerRename,
      customDomain: canUseDomain ? domain || null : (branding?.customDomain ?? null),
      emailSenderName: senderName.trim() || null,
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Card className="flex flex-col gap-4">
          <CardTitle>Cores</CardTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorField id="primary" label="Cor principal" value={primary} onChange={setPrimary} />
            <ColorField
              id="secondary"
              label="Cor de destaque"
              value={secondary}
              onChange={setSecondary}
            />
          </div>
          <CardDescription>
            Ajustamos o tom automaticamente quando a cor fica difícil de ler em algum dos temas.
          </CardDescription>
        </Card>

        <Card className="flex flex-col gap-4">
          <CardTitle>Imagens</CardTitle>
          <div className="grid gap-3 sm:grid-cols-3">
            {ASSETS.map((asset) => {
              const url = branding?.[asset.column] ?? null;
              return (
                <label
                  key={asset.key}
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border p-4 text-center text-sm transition-colors hover:border-brand/50"
                >
                  {url ? (
                    <img src={url} alt="" className="h-12 w-auto max-w-full object-contain" />
                  ) : (
                    <ImageUp className="size-6 text-muted" aria-hidden />
                  )}
                  <span className="font-medium">{asset.label}</span>
                  <span className="text-xs text-muted">PNG, JPG ou WebP até 2 MB</span>
                  <input
                    type="file"
                    accept={ACCEPTED.join(',')}
                    className="sr-only"
                    onChange={onFile(asset.key)}
                    disabled={upload.isPending}
                  />
                </label>
              );
            })}
          </div>
          {upload.isPending ? <Alert tone="info">Enviando imagem…</Alert> : null}
          {upload.error ? <Alert>{describeError(upload.error)}</Alert> : null}
        </Card>

        <Card className="flex flex-col gap-4">
          <CardTitle>Marca branca</CardTitle>
          <Switch
            id="showPoweredBy"
            label="Mostrar “Agenda por Chegaí”"
            description={canHidePoweredBy ? undefined : 'O plano atual não permite ocultar.'}
            checked={canHidePoweredBy ? showPoweredBy : true}
            onCheckedChange={setShowPoweredBy}
            disabled={!canHidePoweredBy}
          />
          <Switch
            id="allowOwnerRename"
            label="Dono pode trocar o nome da barbearia"
            checked={allowOwnerRename}
            onCheckedChange={setAllowOwnerRename}
          />
          <Field
            label="Domínio próprio"
            htmlFor="customDomain"
            hint={
              canUseDomain
                ? 'Aponte um CNAME do domínio para o endereço da plataforma.'
                : 'O plano atual não inclui domínio próprio.'
            }
          >
            <Input
              id="customDomain"
              placeholder="agenda.barbeariadoze.com.br"
              value={customDomain}
              onChange={(event) => setCustomDomain(event.target.value)}
              disabled={!canUseDomain}
            />
          </Field>
          <Field label="Remetente dos e-mails" htmlFor="emailSenderName">
            <Input
              id="emailSenderName"
              placeholder={tenant.displayName}
              value={senderName}
              onChange={(event) => setSenderName(event.target.value)}
            />
          </Field>
        </Card>

        {localError ? <Alert>{localError}</Alert> : null}
        {save.error ? <Alert>{describeError(save.error)}</Alert> : null}
        {save.isSuccess ? <Alert tone="success">Marca salva.</Alert> : null}
        <Button type="submit" loading={save.isPending} className="w-fit">
          Salvar marca
        </Button>
      </form>

      <div className="flex flex-col gap-3 lg:sticky lg:top-24 lg:self-start">
        {(['light', 'dark'] as const).map((mode) => (
          <BrandPreview
            key={mode}
            mode={mode}
            name={tenant.displayName}
            primary={isHexColor(primary) ? primary : DEFAULT_PRIMARY}
            secondary={isHexColor(secondary) ? secondary : DEFAULT_SECONDARY}
            logoUrl={branding?.logoUrl ?? null}
            logoDarkUrl={branding?.logoDarkUrl ?? null}
            showPoweredBy={canHidePoweredBy ? showPoweredBy : true}
          />
        ))}
      </div>
    </div>
  );
}
