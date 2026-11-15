import { describe, expect, it } from 'vitest';
import { calendarFile } from './calendar-file';

describe('calendarFile', () => {
  it('builds an ics event in utc', () => {
    const url = calendarFile({
      title: 'Corte, barba',
      start: '2026-11-21T12:00:00.000Z',
      end: '2026-11-21T13:00:00.000Z',
      location: 'Rua A, 10',
    });
    const body = decodeURIComponent(url.split(',').slice(1).join(','));
    expect(url.startsWith('data:text/calendar')).toBe(true);
    expect(body).toContain('DTSTART:20261121T120000Z');
    expect(body).toContain('SUMMARY:Corte\\, barba');
    expect(body).toContain('LOCATION:Rua A\\, 10');
  });
});
