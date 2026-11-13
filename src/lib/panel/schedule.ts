import type { WorkingInterval } from './types';

export const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const TIME = /^([01]\d|2[0-3]):[0-5]\d$|^24:00$/;

export function toMinutes(value: string): number {
  const [hours = 0, minutes = 0] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function sortIntervals(intervals: WorkingInterval[]): WorkingInterval[] {
  return [...intervals].sort(
    (a, b) => a.weekday - b.weekday || toMinutes(a.start) - toMinutes(b.start),
  );
}

export function scheduleProblem(intervals: WorkingInterval[]): string | null {
  for (const interval of intervals) {
    if (!TIME.test(interval.start) || !TIME.test(interval.end)) {
      return `Horário inválido na ${WEEKDAYS[interval.weekday]}.`;
    }
    if (toMinutes(interval.start) >= toMinutes(interval.end)) {
      return `Na ${WEEKDAYS[interval.weekday]}, o início precisa ser antes do fim.`;
    }
  }
  const sorted = sortIntervals(intervals);
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1]!;
    const current = sorted[index]!;
    if (
      previous.weekday === current.weekday &&
      toMinutes(current.start) < toMinutes(previous.end)
    ) {
      return `Horários sobrepostos na ${WEEKDAYS[current.weekday]}.`;
    }
  }
  return null;
}

export function copyDay(
  intervals: WorkingInterval[],
  unitId: string,
  from: number,
  targets: number[],
): WorkingInterval[] {
  const days = targets.filter((weekday) => weekday !== from);
  const source = intervals.filter((item) => item.unitId === unitId && item.weekday === from);
  const kept = intervals.filter((item) => !(item.unitId === unitId && days.includes(item.weekday)));
  const copies = days.flatMap((weekday) => source.map((item) => ({ ...item, weekday })));
  return sortIntervals([...kept, ...copies]);
}

export function weeklyMinutes(intervals: WorkingInterval[]): number {
  return intervals.reduce((total, item) => total + toMinutes(item.end) - toMinutes(item.start), 0);
}

export function formatHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h${String(rest).padStart(2, '0')}` : `${hours}h`;
}
