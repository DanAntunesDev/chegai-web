'use client';

import { Eye, EyeOff, MessageCircle } from 'lucide-react';
import { type FormEvent, type InputHTMLAttributes, useState } from 'react';
import { z } from 'zod';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { describeError } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { maskPhone, onlyDigits, publicApi } from '@/lib/public/client';
import { type CustomerProfile, saveCustomerSession } from '@/lib/public/session';

type Mode = 'register' | 'login';

interface SessionResponse {
  token: string;
  expiresInSeconds: number;
  customer: CustomerProfile;
}

function BigField({
  id,
  label,
  hint,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        className={cn(
          'h-12 w-full rounded-xl border border-border bg-background px-4 text-base outline-none placeholder:text-muted focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20',
          className,
        )}
        {...props}
      />
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-xl border border-border bg-background px-4 pr-12 text-base outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Esconder senha' : 'Mostrar senha'}
          className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-foreground"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </div>
  );
}

export function AccountAccess({ slug, onReady }: { slug: string; onReady?: () => void }) {
  const base = `/v1/public/tenants/${slug}/accounts`;
  const [mode, setMode] = useState<Mode>('register');
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
      setError('Preencha seu e-mail ou WhatsApp e a senha.');
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

  const register = () =>
    run(async () => {
      await publicApi(base, {
        method: 'POST',
        body: { name: name.trim(), email: email.trim(), phone, password },
      });
      setCode('');
      setStep('code');
    });

  const submitRegister = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (name.trim().length < 2) return setError('Como podemos te chamar?');
    if (onlyDigits(phone).length < 10) return setError('Coloque o WhatsApp com DDD.');
    if (!z.email().safeParse(email.trim()).success)
      return setError('Esse e-mail parece incompleto.');
    if (password.length < 8) return setError('A senha precisa de pelo menos 8 caracteres.');
    void register();
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
      <form method="post" onSubmit={submitCode} noValidate className="flex flex-col gap-5">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-success/12 text-success">
            <MessageCircle className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-semibold">Confere seu WhatsApp</p>
            <p className="text-sm text-muted">
              Mandamos um código para {phone}. É só desta vez, para confirmar que o número é seu.
            </p>
          </div>
        </div>
        <label htmlFor="account-code" className="sr-only">
          Código de 6 números
        </label>
        <input
          id="account-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          value={code}
          placeholder="000000"
          onChange={(event) => setCode(onlyDigits(event.target.value))}
          className="h-16 w-full rounded-xl border border-border bg-background text-center font-mono text-3xl tracking-[0.6em] outline-none placeholder:text-border focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20"
        />
        {error ? <Alert>{error}</Alert> : null}
        <Button type="submit" size="lg" className="h-12 rounded-xl" loading={busy}>
          Confirmar e continuar
        </Button>
        <div className="flex justify-between text-sm">
          <button
            type="button"
            className="text-muted hover:text-foreground"
            onClick={() => setStep('form')}
          >
            Corrigir número
          </button>
          <button
            type="button"
            className="font-medium hover:underline"
            disabled={busy}
            onClick={() => void register()}
          >
            Mandar de novo
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div
        role="tablist"
        aria-label="Acesso"
        className="grid grid-cols-2 gap-1 rounded-full bg-surface-2 p-1 text-sm font-medium"
      >
        {(
          [
            ['register', 'Primeira vez aqui'],
            ['login', 'Já tenho conta'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => {
              setMode(value);
              setError(null);
            }}
            className={cn(
              'rounded-full py-2.5 transition-colors',
              mode === value ? 'bg-surface shadow-sm' : 'text-muted hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'register' ? (
        <form method="post" onSubmit={submitRegister} noValidate className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Leva um minuto. Depois é só entrar para ver, remarcar ou cancelar seus horários sem
            precisar ligar.
          </p>
          <BigField
            id="account-name"
            label="Seu nome"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <BigField
            id="account-phone"
            label="WhatsApp"
            type="tel"
            autoComplete="tel-national"
            placeholder="(38) 99999-9999"
            hint="É por aqui que chega o lembrete do horário."
            value={phone}
            onChange={(event) => setPhone(maskPhone(event.target.value))}
          />
          <BigField
            id="account-email"
            label="E-mail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <PasswordField
            id="account-new-password"
            label="Crie uma senha"
            autoComplete="new-password"
            hint="Pelo menos 8 caracteres."
            value={password}
            onChange={setPassword}
          />
          {error ? <Alert>{error}</Alert> : null}
          <Button type="submit" size="lg" className="h-12 rounded-xl" loading={busy}>
            Criar conta e continuar
          </Button>
        </form>
      ) : (
        <form method="post" onSubmit={submitLogin} noValidate className="flex flex-col gap-4">
          <BigField
            id="account-login"
            label="E-mail ou WhatsApp"
            autoComplete="username"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
          />
          <PasswordField
            id="account-password"
            label="Senha"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
          />
          {error ? <Alert>{error}</Alert> : null}
          <Button type="submit" size="lg" className="h-12 rounded-xl" loading={busy}>
            Entrar
          </Button>
        </form>
      )}
    </div>
  );
}
