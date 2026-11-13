'use client';

import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { useAuth } from '@/components/auth/auth-provider';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ApiError, describeError } from '@/lib/api/errors';
import { destinationAfterLogin } from '@/lib/auth/redirect';

const credentialsSchema = z.object({
  email: z.email('Digite um e-mail válido.'),
  password: z.string().min(1, 'Digite sua senha.'),
});

const codeSchema = z.string().regex(/^\d{6}$/, 'O código tem 6 números.');

type Step = 'credentials' | 'totp';

export function LoginForm() {
  const { login, status, session } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next');

  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace(destinationAfterLogin(session, next));
    }
  }, [status, session, next, router]);

  useEffect(() => {
    if (step === 'totp') {
      codeRef.current?.focus();
    }
  }, [step]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure(null);

    const parsed = credentialsSchema.safeParse({ email: email.trim(), password });
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
      return;
    }
    let totpCode: string | undefined;
    if (step === 'totp') {
      const checked = codeSchema.safeParse(code.trim());
      if (!checked.success) {
        setErrors({ code: checked.error.issues[0]?.message ?? 'Código inválido.' });
        return;
      }
      totpCode = checked.data;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await login({ ...parsed.data, totpCode });
    } catch (error) {
      if (error instanceof ApiError && error.code === 'TOTP_REQUIRED') {
        setStep('totp');
      } else {
        if (error instanceof ApiError && error.code === 'INVALID_TOTP') {
          setCode('');
        }
        setFailure(describeError(error));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      {step === 'credentials' ? (
        <>
          <div>
            <h2 className="text-2xl font-bold">Entrar</h2>
            <p className="mt-1 text-sm text-muted">Acesse o painel da sua barbearia.</p>
          </div>
          <Field label="E-mail" htmlFor="email" error={errors.email}>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              autoFocus
            />
          </Field>
          <Field label="Senha" htmlFor="password" error={errors.password}>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
          </Field>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              setStep('credentials');
              setCode('');
              setFailure(null);
            }}
            className="inline-flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Voltar
          </button>
          <div>
            <span className="mb-3 grid size-11 place-items-center rounded-xl bg-brand/10 text-brand">
              <ShieldCheck className="size-5" />
            </span>
            <h2 className="text-2xl font-bold">Verificação em duas etapas</h2>
            <p className="mt-1 text-sm text-muted">
              Abra seu app autenticador e digite o código de 6 números.
            </p>
          </div>
          <Field label="Código" htmlFor="code" error={errors.code}>
            <Input
              ref={codeRef}
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              aria-invalid={Boolean(errors.code)}
              aria-describedby={errors.code ? 'code-error' : undefined}
              className="text-center font-mono text-lg tracking-[0.5em]"
            />
          </Field>
        </>
      )}

      {failure ? <Alert>{failure}</Alert> : null}

      <Button type="submit" size="lg" loading={submitting}>
        {step === 'credentials' ? 'Entrar' : 'Confirmar'}
      </Button>
    </form>
  );
}
