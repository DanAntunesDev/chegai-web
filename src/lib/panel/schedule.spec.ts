import { describe, expect, it } from 'vitest';
import { copyDay, formatHours, scheduleProblem, weeklyMinutes } from './schedule';

const at = (weekday: number, start: string, end: string, unitId = 'u1') => ({
  unitId,
  weekday,
  start,
  end,
});

describe('schedule helpers', () => {
  it('accepts a normal week', () => {
    expect(scheduleProblem([at(1, '09:00', '12:00'), at(1, '13:00', '19:00')])).toBeNull();
  });

  it('flags inverted and overlapping intervals', () => {
    expect(scheduleProblem([at(2, '12:00', '09:00')])).toContain('Terça');
    expect(scheduleProblem([at(3, '09:00', '12:00'), at(3, '11:00', '14:00', 'u2')])).toContain(
      'sobrepostos',
    );
    expect(scheduleProblem([at(3, '9:00', '12:00')])).toContain('inválido');
  });

  it('copies a day to others in the same unit only', () => {
    const result = copyDay(
      [at(1, '09:00', '12:00'), at(2, '10:00', '11:00'), at(2, '08:00', '09:00', 'u2')],
      'u1',
      1,
      [1, 2, 3],
    );
    expect(result).toEqual([
      at(1, '09:00', '12:00'),
      at(2, '08:00', '09:00', 'u2'),
      at(2, '09:00', '12:00'),
      at(3, '09:00', '12:00'),
    ]);
  });

  it('sums the week', () => {
    expect(formatHours(weeklyMinutes([at(1, '09:00', '12:00'), at(2, '13:00', '14:30')]))).toBe(
      '4h30',
    );
  });
});
