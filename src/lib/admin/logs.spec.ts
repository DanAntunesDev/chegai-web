import { describe, expect, it } from 'vitest';
import { actionLabel, diffFields, statusTone } from './logs';

describe('logs helpers', () => {
  it('lists only the fields that changed', () => {
    expect(
      diffFields({ name: 'VIP', color: '#000' }, { name: 'VIP', color: '#fff', note: 'x' }),
    ).toEqual([
      { field: 'color', before: '#000', after: '#fff' },
      { field: 'note', before: undefined, after: 'x' },
    ]);
    expect(diffFields(null, { name: 'Nova' })).toEqual([
      { field: 'name', before: undefined, after: 'Nova' },
    ]);
  });

  it('names actions in portuguese and falls back to a readable label', () => {
    expect(actionLabel('tag.created')).toBe('Tag criada');
    expect(actionLabel('booking.some_thing')).toBe('Booking some thing');
  });

  it('colors status codes', () => {
    expect(statusTone(201)).toBe('success');
    expect(statusTone(409)).toBe('warning');
    expect(statusTone(502)).toBe('danger');
  });
});
