import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';
import { LoginScreen } from '@/components/auth/login-screen';

export const metadata: Metadata = { title: 'Entrar na barbearia' };

export default function BarbershopLoginPage() {
  return (
    <LoginScreen
      footer={
        <p className="text-sm text-muted">
          É cliente?{' '}
          <Link href="/login/cliente" className="font-medium text-foreground hover:underline">
            Entre por aqui
          </Link>
        </p>
      }
    >
      <LoginForm audience="barbearia" />
    </LoginScreen>
  );
}
