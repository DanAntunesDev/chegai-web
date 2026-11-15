function stamp(iso: string) {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

function escape(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/[,;]/g, (match) => `\\${match}`)
    .replace(/\n/g, '\\n');
}

export function calendarFile(event: {
  title: string;
  start: string;
  end: string;
  location: string;
}) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Chegai//Agenda//PT',
    'BEGIN:VEVENT',
    `UID:${stamp(event.start)}-${Math.abs(event.title.length * 7919)}@chegai`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(event.start)}`,
    `DTEND:${stamp(event.end)}`,
    `SUMMARY:${escape(event.title)}`,
    event.location ? `LOCATION:${escape(event.location)}` : '',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Seu horário é daqui a 1 hora',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join('\r\n'))}`;
}
