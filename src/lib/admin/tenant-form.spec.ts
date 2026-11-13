import { describe, expect, it } from 'vitest';
import { createTenantForm, fieldErrors } from './tenant-form';

const valid = {
  displayName: 'Barbearia do Zé',
  legalName: 'Zé Barbearia LTDA',
  slug: 'barbearia-do-ze',
  document: '',
  email: 'contato@ze.com',
  phone: '',
  planCode: 'ESSENCIAL',
  status: 'TRIAL',
  trialDays: '14',
  unitName: 'Centro',
  unitCity: 'Montes Claros',
  unitState: 'mg',
  ownerName: 'Zé',
  ownerEmail: 'ze@ze.com',
};

describe('createTenantForm', () => {
  it('cleans optional fields and normalizes state', () => {
    const parsed = createTenantForm.parse(valid);
    expect(parsed.document).toBeUndefined();
    expect(parsed.unitState).toBe('MG');
    expect(parsed.trialDays).toBe(14);
  });

  it('reports the first problem of each field', () => {
    const result = createTenantForm.safeParse({ ...valid, slug: 'Zé!', unitState: 'Minas' });
    expect(result.success).toBe(false);
    const errors = fieldErrors(result.error!);
    expect(Object.keys(errors).sort()).toEqual(['slug', 'unitState']);
  });
});
