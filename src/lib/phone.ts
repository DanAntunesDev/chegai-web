export function formatPhone(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const digits = value.replace(/\D/g, '');
  const national = digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : digits;
  if (national.length === 11) {
    return `(${national.slice(0, 2)}) ${national.slice(2, 7)}-${national.slice(7)}`;
  }
  if (national.length === 10) {
    return `(${national.slice(0, 2)}) ${national.slice(2, 6)}-${national.slice(6)}`;
  }
  return value;
}

export function whatsappLink(value: string): string {
  return `https://wa.me/${value.replace(/\D/g, '')}`;
}
