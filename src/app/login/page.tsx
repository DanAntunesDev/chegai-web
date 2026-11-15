import { redirect } from 'next/navigation';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const next = (await searchParams).next;
  const target = typeof next === 'string' && next.startsWith('/admin') ? 'admin' : 'barbearia';
  const query = typeof next === 'string' ? `?next=${encodeURIComponent(next)}` : '';
  redirect(`/login/${target}${query}`);
}
