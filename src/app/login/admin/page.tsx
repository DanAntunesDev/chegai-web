import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';
import { LoginScreen } from '@/components/auth/login-screen';

export const metadata: Metadata = { title: 'Administração', robots: { index: false } };

export default function AdminLoginPage() {
  return (
    <LoginScreen>
      <LoginForm audience="admin" />
    </LoginScreen>
  );
}
