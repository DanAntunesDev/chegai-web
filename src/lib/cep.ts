export interface CepAddress {
  street: string;
  district: string;
  city: string;
  state: string;
}

export function cepDigits(value: string) {
  return value.replace(/\D/g, '').slice(0, 8);
}

export function maskCep(value: string) {
  const digits = cepDigits(value);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export async function lookupCep(value: string, signal?: AbortSignal): Promise<CepAddress | null> {
  const digits = cepDigits(value);
  if (digits.length !== 8) {
    return null;
  }
  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal });
  if (!response.ok) {
    return null;
  }
  const body = (await response.json()) as {
    erro?: boolean | string;
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
  };
  if (body.erro) {
    return null;
  }
  return {
    street: body.logradouro ?? '',
    district: body.bairro ?? '',
    city: body.localidade ?? '',
    state: body.uf ?? '',
  };
}
