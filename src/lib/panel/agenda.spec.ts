import { describe, expect, it } from 'vitest';
import {
  addDays,
  canDrag,
  gridWindow,
  localDateOf,
  minuteOfDay,
  rangeFor,
  snapMinute,
  weekStart,
  zonedToUtc,
} from './agenda';

const TZ = 'America/Sao_Paulo';

describe('agenda time helpers', () => {
  it('converts local times of the unit to utc', () => {
    expect(zonedToUtc('2026-11-20', '09:30', TZ).toISOString()).toBe('2026-11-20T12:30:00.000Z');
    expect(zonedToUtc('2026-07-01', '00:00', 'America/Manaus').toISOString()).toBe(
      '2026-07-01T04:00:00.000Z',
    );
  });

  it('reads the local day and minute', () => {
    expect(localDateOf('2026-11-21T02:00:00Z', TZ)).toBe('2026-11-20');
    expect(minuteOfDay('2026-11-20T12:30:00Z', TZ)).toBe(570);
  });

  it('walks days and weeks', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(weekStart('2026-11-22')).toBe('2026-11-16');
    expect(weekStart('2026-11-16')).toBe('2026-11-16');
  });

  it('builds the query range for a day', () => {
    expect(rangeFor('2026-11-20', 1, TZ)).toEqual({
      from: '2026-11-20T03:00:00.000Z',
      to: '2026-11-21T03:00:00.000Z',
    });
  });

  it('fits the grid to the working hours', () => {
    expect(gridWindow([])).toEqual({ start: 480, end: 1200 });
    expect(
      gridWindow([
        { start: 545, end: 720 },
        { start: 780, end: 1150 },
      ]),
    ).toEqual({
      start: 540,
      end: 1200,
    });
  });
});

describe('drag helpers', () => {
  it('snaps drops to the nearest quarter hour', () => {
    expect(snapMinute(0, 480, 1.6)).toBe(480);
    expect(snapMinute(1.6 * 37, 480, 1.6)).toBe(510);
    expect(snapMinute(1.6 * 38, 480, 1.6)).toBe(525);
    expect(snapMinute(-50, 480, 1.6)).toBe(480);
  });

  it('only moves confirmed bookings', () => {
    expect(canDrag('CONFIRMED')).toBe(true);
    expect(canDrag('COMPLETED')).toBe(false);
  });
});
