import type { Session } from '../api/types';

export function safeNext(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return null;
  }
  return value;
}

export function homeFor(session: Session): string {
  if (session.tenant) {
    return '/barbearia';
  }
  return session.user.isPlatformAdmin ? '/admin' : '/sem-acesso';
}

export type LoginAudience = 'admin' | 'barbearia';

export function loginPathFor(pathname: string): string {
  const audience: LoginAudience = pathname.startsWith('/admin') ? 'admin' : 'barbearia';
  return `/login/${audience}?next=${encodeURIComponent(pathname)}`;
}

export function destinationAfterLogin(session: Session, next: string | null | undefined): string {
  const target = safeNext(next);
  if (target?.startsWith('/admin') && !session.user.isPlatformAdmin) {
    return homeFor(session);
  }
  if (target?.startsWith('/barbearia') && !session.tenant) {
    return homeFor(session);
  }
  return target ?? homeFor(session);
}
