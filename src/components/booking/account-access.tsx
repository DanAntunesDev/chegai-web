'use client';

import { type FormEvent, useState } from 'react';
import { z } from 'zod';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Tabs } from '@/components/ui/tabs';
import { describeError } from '@/lib/api/errors';
import { maskPhone, onlyDigits, publicApi } from '@/lib/public/client';
import { type CustomerProfile, saveCustomerSession } from '@/lib/public/session';

type Mode = 'login' | 'register';

interface SessionResponse {
  token: string;
  expiresInSeconds: number;
  customer: CustomerProfile;
}

export function AccountAccess({ slug, onReady }: { slug: string; onReady?: () => void }) {
  const base = `/v1/public/tenants/${slug}/accounts`;
  const [mode, setMode] = useState<Mode>('login');
  const [step, setStep] = useState<'form' | 'code'>('form');
  const [login, setLogin] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (failure) {
      setError(describeError(failure));
    } finally {
      setBusy(false);
    }
  };

  const finish = (session: SessionResponse) => {
    saveCustomerSession(slug, session);
    onReady?.();
  };

  const submitLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (login.trim().length < 3 || !password) {
      setError('Informe e-mail ou WhatsApp e a senha.');
      return;
    }
    void run(async () =>
      finish(
        await publicApi<SessionResponse>(`${base}/login`, {
          method: 'POST',
          body: { login: login.trim(), password },
        }),
      ),
    );
  };

  const submitRegister = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (name.trim().length < 2) return setError('Digite seu nome.');
    if (!z.email().safeParse(email.trim()).success) return setError('E-mail inválido.');
    if (onlyDigits(phone).length < 10) return setError('Digite o WhatsApp com DDD.');
    if (password.length < 8) return setError('A senha precisa de pelo menos 8 caracteres.');
    void run(async () => {
      await publicApi(base, {
        method: 'POST',
        body: { name: name.trim(), email: email.trim(), phone, password },
      });
      setStep('code');
    });
  };

  const submitCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError('O código tem 6 números.');
      return;
    }
    void run(async () =>
      finish(
        await publicApi<SessionResponse>(`${base}/confirm`, {
          method: 'POST',
          body: { phone, code },
        }),
      ),
    );
  };

  if (step === 'code') {
    return (
      <form method="post" onSubmit={submitCode} noValidate className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          Mandamos um código para o WhatsApp <strong className="text-foreground">{phone}</strong>. É
          só desta vez, para confirmar que o número é seu.
        </p>
        <Field label="Código" htmlFor="account-code" required>
          <Input
            id="account-code"
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
          Confirmar e entrar
        </Button>
        <button
          type="button"
          className="text-sm text-muted hover:text-foreground"
          onClick={() => setStep('form')}
        >
          Voltar
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        label="Acesso"
        value={mode}
        onValueChange={(value) => {
          setMode(value);
          setError(null);
        }}
        items={[
          { value: 'login', label: 'Já tenho conta' },
          { value: 'register', label: 'Criar conta' },
        ]}
      />
      {mode === 'login' ? (
        <form method="post" onSubmit={submitLogin} noValidate className="flex flex-col gap-4">
          <Field label="E-mail ou WhatsApp" htmlFor="account-login" required>
            <Input
              id="account-login"
              autoComplete="username"
              value={login}
              onChange={(event) => setLogin(event.target.value)}
            />
          </Field>
          <Field label="Senha" htmlFor="account-password" required>
            <Input
              id="account-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          {error ? <Alert>{error}</Alert> : null}
          <Button type="submit" size="lg" loading={busy}>
            Entrar
          </Button>
        </form>
      ) : (
        <form method="post" onSubmit={submitRegister} noValidate className="flex flex-col gap-4">
          <Field label="Nome" htmlFor="account-name" required>
            <Input
              id="account-name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field label="E-mail" htmlFor="account-email" required>
            <Input
              id="account-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field
            label="WhatsApp"
            htmlFor="account-phone"
            hint="Usado para lembretes do horário."
            required
          >
            <Input
              id="account-phone"
              type="tel"
              autoComplete="tel-national"
              placeholder="(38) 99999-9999"
              value={phone}
              onChange={(event) => setPhone(maskPhone(event.target.value))}
            />
          </Field>
          <Field
            label="Senha"
            htmlFor="account-new-password"
            hint="Pelo menos 8 caracteres."
            required
          >
            <Input
              id="account-new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          {error ? <Alert>{error}</Alert> : null}
          <Button type="submit" size="lg" loading={busy}>
            Criar conta
          </Button>
        </form>
      )}
    </div>
  );
}
