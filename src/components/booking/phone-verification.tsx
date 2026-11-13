'use client';

import { type FormEvent, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { describeError } from '@/lib/api/errors';
import { maskPhone, onlyDigits, publicApi, setCustomerToken } from '@/lib/public/client';

interface PhoneVerificationProps {
  slug: string;
  submitLabel: string;
  askName?: boolean;
  onVerified: (data: { phone: string; name: string }) => Promise<void> | void;
}

export function PhoneVerification({
  slug,
  submitLabel,
  askName = false,
  onVerified,
}: PhoneVerificationProps) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const base = `/v1/public/tenants/${slug}`;

  const requestCode = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (askName && name.trim().length < 2) {
      setError('Digite seu nome.');
      return;
    }
    if (onlyDigits(phone).length < 10) {
      setError('Digite o WhatsApp com DDD.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await publicApi(`${base}/verification/request`, { method: 'POST', body: { phone } });
      setStep('code');
      setCode('');
    } catch (failure) {
      setError(describeError(failure));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError('O código tem 6 números.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const result = await publicApi<{ token: string }>(`${base}/verification/confirm`, {
        method: 'POST',
        body: { phone, code },
      });
      setCustomerToken(result.token);
      await onVerified({ phone, name: name.trim() });
    } catch (failure) {
      setError(describeError(failure));
    } finally {
      setBusy(false);
    }
  };

  if (step === 'code') {
    return (
      <form onSubmit={confirm} className="flex flex-col gap-4" noValidate>
        <p className="text-sm text-muted">
          Mandamos um código de 6 números para o WhatsApp{' '}
          <strong className="text-foreground">{phone}</strong>.
        </p>
        <Field label="Código" htmlFor="public-code">
          <Input
            id="public-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
            value={code}
            onChange={(event) => setCode(onlyDigits(event.target.value))}
            className="h-12 text-center font-mono text-xl tracking-[0.5em]"
          />
        </Field>
        {error ? <Alert>{error}</Alert> : null}
        <Button type="submit" size="lg" loading={busy}>
          {submitLabel}
        </Button>
        <div className="flex justify-between text-sm">
          <button
            type="button"
            className="text-muted hover:text-foreground"
            onClick={() => setStep('phone')}
          >
            Trocar número
          </button>
          <button
            type="button"
            className="text-brand-2 hover:underline"
            disabled={busy}
            onClick={() => void requestCode()}
          >
            Reenviar código
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={requestCode} className="flex flex-col gap-4" noValidate>
      {askName ? (
        <Field label="Seu nome" htmlFor="public-name">
          <Input
            id="public-name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
      ) : null}
      <Field
        label="WhatsApp"
        htmlFor="public-phone"
        hint="Enviamos um código para confirmar que é você."
      >
        <Input
          id="public-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="(38) 99999-9999"
          value={phone}
          onChange={(event) => setPhone(maskPhone(event.target.value))}
        />
      </Field>
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" size="lg" loading={busy}>
        Receber código
      </Button>
    </form>
  );
}
