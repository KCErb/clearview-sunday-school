// Helpers for the 2026 Come, Follow Me — Old Testament manual.

const CFM_BASE =
  'https://www.churchofjesuschrist.org/study/manual/come-follow-me-for-home-and-church-old-testament-2026';

/** Official Church lesson URL for a given CFM week number (1–52). */
export function cfmUrl(week: number): string {
  return `${CFM_BASE}/${String(week).padStart(2, '0')}?lang=eng`;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "June 15–21" / "June 29–July 5" from two ISO dates. */
export function formatRange(startISO: string, endISO: string): string {
  const s = new Date(startISO + 'T00:00:00');
  const e = new Date(endISO + 'T00:00:00');
  const left = `${MONTHS[s.getMonth()]} ${s.getDate()}`;
  const right =
    s.getMonth() === e.getMonth()
      ? `${e.getDate()}`
      : `${MONTHS[e.getMonth()]} ${e.getDate()}`;
  return `${left}–${right}`;
}
