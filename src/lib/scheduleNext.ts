import type { ScheduleEntry } from '@/services/schedule.service';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

const parseToMinutes = (t: string): number => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

const normDay = (d: string) => d.trim().toLowerCase();

/** Sessions du jour courant triées par heure de début */
export function sessionsForDate(entries: ScheduleEntry[], date: Date): ScheduleEntry[] {
  const name = DAY_NAMES[date.getDay()];
  return entries
    .filter((e) => normDay(e.dayOfWeek) === normDay(name))
    .sort((a, b) => parseToMinutes(a.startTime) - parseToMinutes(b.startTime));
}

export type NextSessionInfo =
  | { kind: 'current'; entry: ScheduleEntry; endsAt: Date }
  | { kind: 'upcoming'; entry: ScheduleEntry; startsAt: Date; msUntilStart: number }
  | { kind: 'none' };

/**
 * Prochain créneau pertinent pour le tableau de bord : cours en cours ou prochain à venir (aujourd'hui puis jours suivants).
 */
export function getNextSessionWindow(entries: ScheduleEntry[], now = new Date()): NextSessionInfo {
  const nowMin = now.getHours() * 60 + now.getMinutes();

  for (let offset = 0; offset < 7; offset++) {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    const dayName = DAY_NAMES[d.getDay()];
    if (dayName === 'Sunday') continue;

    const dayList = entries
      .filter((e) => normDay(e.dayOfWeek) === normDay(dayName))
      .sort((a, b) => parseToMinutes(a.startTime) - parseToMinutes(b.startTime));

    for (const e of dayList) {
      const startMin = parseToMinutes(e.startTime);
      const endMin = parseToMinutes(e.endTime);

      if (offset === 0) {
        if (nowMin >= startMin && nowMin < endMin) {
          const endsAt = new Date(now);
          endsAt.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0);
          return { kind: 'current', entry: e, endsAt };
        }
        if (nowMin < startMin) {
          const startsAt = new Date(now);
          startsAt.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
          return {
            kind: 'upcoming',
            entry: e,
            startsAt,
            msUntilStart: Math.max(0, startsAt.getTime() - now.getTime()),
          };
        }
      } else {
        const startsAt = new Date(d);
        startsAt.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
        return {
          kind: 'upcoming',
          entry: e,
          startsAt,
          msUntilStart: Math.max(0, startsAt.getTime() - now.getTime()),
        };
      }
    }
  }

  return { kind: 'none' };
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
