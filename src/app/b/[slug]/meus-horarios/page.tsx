import { redirect } from 'next/navigation';

type Props = { params: Promise<{ slug: string }> };

export default async function MyBookingsPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/b/${slug}/cliente`);
}
