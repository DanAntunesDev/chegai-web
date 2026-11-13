'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';

export default function NoAccessPage() {
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <Logo />
      <h1 className="text-2xl font-bold">Sua conta ainda não tem uma barbearia</h1>
      <p className="text-sm text-muted">
        Peça ao responsável pela barbearia para enviar um convite para o seu e-mail.
      </p>
      <Button
        variant="outline"
        onClick={async () => {
          await logout();
          router.replace('/login');
        }}
      >
        Sair
      </Button>
    </div>
  );
}
