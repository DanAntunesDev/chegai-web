import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Entrar' };

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-[#0B0B0F] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="absolute -top-40 -left-40 size-[520px] rounded-full bg-[#F0384C]/25 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -right-32 -bottom-48 size-[480px] rounded-full bg-[#4D7CFF]/20 blur-3xl"
        />
        <Logo className="relative text-white" />
        <div className="relative max-w-md">
          <h1 className="text-4xl leading-tight font-bold">
            A agenda da sua barbearia, cheia e no controle.
          </h1>
          <p className="mt-4 text-white/70">
            Agendamento online, lembretes no WhatsApp e números do mês em um só lugar.
          </p>
        </div>
        <p className="relative text-xs text-white/50">© Chegaí</p>
      </section>

      <section className="flex flex-col px-6 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo className="lg:invisible" />
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
