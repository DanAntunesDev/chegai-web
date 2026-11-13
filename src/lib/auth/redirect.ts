import type { Session } from '../api/types';

export function safeNext(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return null;
  }
  return value;
}

export function homeFor(session: Session): string {
  if (session.tenant) {
    return '/painel';
  }
  return session.user.isPlatformAdmin ? '/admin' : '/sem-acesso';
}

export function destinationAfterLogin(session: Session, next: string | null | undefined): string {
  const target = safeNext(next);
  if (target?.startsWith('/admin') && !session.user.isPlatformAdmin) {
    return homeFor(session);
  }
  if (target?.startsWith('/painel') && !session.tenant) {
    return homeFor(session);
  }
  return target ?? homeFor(session);
}
