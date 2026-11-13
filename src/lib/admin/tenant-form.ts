import { z } from 'zod';

const slug = z
  .string()
  .min(3, 'Mínimo de 3 caracteres.')
  .max(60, 'Máximo de 60 caracteres.')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use letras minúsculas, números e hífen.');

const optional = z
  .string()
  .trim()
  .transform((value) => value || undefined);

export const createTenantForm = z.object({
  displayName: z.string().trim().min(2, 'Informe o nome da barbearia.'),
  legalName: z.string().trim().min(2, 'Informe a razão social ou o nome do responsável.'),
  slug,
  document: optional,
  email: z.email('E-mail inválido.'),
  phone: optional,
  planCode: z.string().min(1, 'Escolha um plano.'),
  status: z.enum(['TRIAL', 'ACTIVE']),
  trialDays: z.coerce.number().int().min(0, 'Entre 0 e 90.').max(90, 'Entre 0 e 90.'),
  unitName: z.string().trim().min(2, 'Informe o nome da unidade.'),
  unitCity: optional,
  unitState: z
    .string()
    .trim()
    .toUpperCase()
    .transform((value) => value || undefined)
    .refine((value) => value === undefined || /^[A-Z]{2}$/.test(value), 'Use a sigla, ex.: MG.'),
  ownerName: z.string().trim().min(2, 'Informe o nome do dono.'),
  ownerEmail: z.email('E-mail inválido.'),
});

export type CreateTenantForm = z.input<typeof createTenantForm>;

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0]);
    result[key] ??= issue.message;
  }
  return result;
}
