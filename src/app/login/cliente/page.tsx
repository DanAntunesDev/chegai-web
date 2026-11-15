import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginScreen } from '@/components/auth/login-screen';
import { BarbershopFinder } from './barbershop-finder';

export const metadata: Metadata = { title: 'Área do cliente' };

export default function CustomerFinderPage() {
  return (
    <LoginScreen
      footer={
        <p className="text-sm text-muted">
          Trabalha em uma barbearia?{' '}
          <Link href="/login/barbearia" className="font-medium text-foreground hover:underline">
            Entre no painel
          </Link>
        </p>
      }
    >
      <BarbershopFinder />
    </LoginScreen>
  );
}
