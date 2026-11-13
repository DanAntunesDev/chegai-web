import { describe, expect, it } from 'vitest';
import { ApiError, describeError, serverFieldErrors } from './errors';

describe('errors', () => {
  it('maps known codes to friendly text', () => {
    expect(describeError(new ApiError(409, 'CUSTOMER_PHONE_TAKEN', 'x'))).toContain('telefone');
    expect(describeError(new Error('boom'))).toBe('Algo deu errado. Tente novamente.');
  });

  it('reads field errors from validation failures', () => {
    const error = new ApiError(400, 'VALIDATION_FAILED', 'x', [
      { path: 'phone', message: 'must be a valid Brazilian phone number' },
      { path: 'unit.slug', message: 'use lowercase letters, numbers and hyphens' },
      { path: 'phone', message: 'second' },
    ]);
    expect(serverFieldErrors(error)).toEqual({
      phone: 'Telefone inválido. Use DDD + número.',
      unit: 'Use letras minúsculas, números e hífen.',
    });
    expect(serverFieldErrors(new ApiError(409, 'X', 'x'))).toEqual({});
  });
});
