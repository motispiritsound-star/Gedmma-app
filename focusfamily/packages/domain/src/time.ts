/**
 * Small, dependency-free time helpers. FocusFamily deals with *local family
 * time* ("dinner at 18:00") rather than instants, so we keep a tiny value type
 * for wall-clock minutes and convert explicitly at the edges.
 */

export const MINUTES_PER_DAY = 24 * 60;

/** Minutes since local midnight, 0..1439. */
export type MinuteOfDay = number;

/** 0 = Sunday .. 6 = Saturday, matching `Date#getDay`. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAYS: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseClockTime(value: string): MinuteOfDay {
  const match = TIME_PATTERN.exec(value);
  if (!match) throw new RangeError(`Invalid HH:mm time: ${value}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatClockTime(minute: MinuteOfDay): string {
  const normalised = ((minute % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(normalised / 60);
  const minutes = normalised % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function isClockTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

/**
 * Windows may wrap past midnight (quiet hours 21:30 -> 07:00). `end` is
 * exclusive so 21:00-22:00 and 22:00-23:00 do not overlap on the boundary.
 */
export function isWithinWindow(
  minute: MinuteOfDay,
  startInclusive: MinuteOfDay,
  endExclusive: MinuteOfDay,
): boolean {
  if (startInclusive === endExclusive) return false;
  if (startInclusive < endExclusive) {
    return minute >= startInclusive && minute < endExclusive;
  }
  return minute >= startInclusive || minute < endExclusive;
}

export function windowLengthMinutes(
  startInclusive: MinuteOfDay,
  endExclusive: MinuteOfDay,
): number {
  const raw = endExclusive - startInclusive;
  return raw > 0 ? raw : raw + MINUTES_PER_DAY;
}

export function minuteOfDay(date: Date): MinuteOfDay {
  return date.getHours() * 60 + date.getMinutes();
}

export function weekdayOf(date: Date): Weekday {
  return date.getDay() as Weekday;
}

export function startOfLocalDay(date: Date): Date {
  const copy = new Date(date.getTime());
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function differenceInDays(later: Date, earlier: Date): number {
  const ms = startOfLocalDay(later).getTime() - startOfLocalDay(earlier).getTime();
  return Math.round(ms / 86_400_000);
}

/** ISO date (YYYY-MM-DD) in *local* time - used for day-keyed aggregates. */
export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Monday-based start of the week, matching Dutch and most EU calendars. */
export function startOfWeek(date: Date): Date {
  const start = startOfLocalDay(date);
  const shift = (start.getDay() + 6) % 7;
  return addDays(start, -shift);
}
