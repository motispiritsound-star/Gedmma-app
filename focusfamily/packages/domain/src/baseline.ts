import { differenceInDays } from './time.js';
import type { Family } from './people.js';

/**
 * The first week is deliberately uneventful. FocusFamily observes nothing it
 * has not been given, enforces no rule and sends no nudge; the family simply
 * gets used to the app and to talking about it. Skipping the baseline is
 * allowed but has to be a conscious choice, not a default.
 */
export const BASELINE_DAYS = 7;

export interface BaselineState {
  readonly active: boolean;
  readonly started: boolean;
  readonly dayNumber: number;
  readonly daysRemaining: number;
  /** Nudges, reminders and recommendations are all held back while true. */
  readonly suppressNudges: boolean;
  readonly messageKey: string;
}

export function baselineState(
  family: Pick<Family, 'baselineStartedAt'>,
  now: Date,
): BaselineState {
  if (family.baselineStartedAt === null) {
    return {
      active: false,
      started: false,
      dayNumber: 0,
      daysRemaining: BASELINE_DAYS,
      suppressNudges: true,
      messageKey: 'baseline.not_started',
    };
  }
  const elapsed = differenceInDays(now, family.baselineStartedAt);
  const dayNumber = Math.min(BASELINE_DAYS, elapsed + 1);
  const active = elapsed < BASELINE_DAYS;
  return {
    active,
    started: true,
    dayNumber,
    daysRemaining: Math.max(0, BASELINE_DAYS - elapsed),
    suppressNudges: active,
    messageKey: active ? 'baseline.active' : 'baseline.complete',
  };
}
