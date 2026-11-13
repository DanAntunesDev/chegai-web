import { describe, expect, it } from 'vitest';
import { eligibleStaff, maskPhone, nextDays } from './client';

describe('public booking helpers', () => {
  const staff = [
    { id: 'a', name: 'A', photoUrl: null, unitIds: ['u1'], serviceIds: ['s1', 's2'] },
    { id: 'b', name: 'B', photoUrl: null, unitIds: ['u1'], serviceIds: ['s1'] },
    { id: 'c', name: 'C', photoUrl: null, unitIds: ['u2'], serviceIds: ['s1', 's2'] },
  ];

  it('keeps barbers who do every chosen service at the unit', () => {
    expect(eligibleStaff(staff, 'u1', ['s1', 's2']).map((item) => item.id)).toEqual(['a']);
    expect(eligibleStaff(staff, 'u1', ['s1']).map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('lists the next days', () => {
    expect(nextDays('2026-12-30', 3)).toEqual(['2026-12-30', '2026-12-31', '2027-01-01']);
  });

  it('masks phones while typing', () => {
    expect(maskPhone('38')).toBe('(38');
    expect(maskPhone('389911')).toBe('(38) 9911');
    expect(maskPhone('38991110001')).toBe('(38) 99111-0001');
    expect(maskPhone('3832210000')).toBe('(38) 3221-0000');
  });
});
