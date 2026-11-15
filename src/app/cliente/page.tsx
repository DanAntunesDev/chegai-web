import { redirect } from 'next/navigation';

export default function CustomerRoot() {
  redirect('/login/cliente');
}
