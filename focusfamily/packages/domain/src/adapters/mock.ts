import type {
  AdapterCapabilities,
  AdapterResult,
  AuthorizationState,
  DailyUsage,
  FocusShieldRequest,
  ScreenTimeAdapter,
  UsageQuery,
} from './types.js';
import type { UsageCategory } from '../measurement.js';

/**
 * The adapter every developer, every test and every unsupported device uses.
 *
 * It produces stable pseudo-random numbers from a seed so the demo looks the
 * same on every machine, and - this is the important part - it labels
 * everything it returns as `simulated`. Simulated data can never be presented
 * as a measurement: `MAX_CONFIDENCE_BY_SOURCE` caps it at low confidence and
 * the UI prints "example data" next to it.
 */
export class MockScreenTimeAdapter implements ScreenTimeAdapter {
  readonly id = 'mock' as const;
  private state: AuthorizationState;
  private readonly seed: number;
  private shieldActive = false;

  constructor(options: { seed?: number; initialState?: AuthorizationState } = {}) {
    this.seed = options.seed ?? 20250101;
    this.state = options.initialState ?? 'not_determined';
  }

  capabilities(): AdapterCapabilities {
    return {
      adapter: this.id,
      canReadCategoryTotals: true,
      canApplyFocusShield: true,
      canReadPickups: true,
      producesSource: 'simulated',
      limitationKeys: ['adapter.mock.not_a_measurement'],
    };
  }

  async authorizationState(): Promise<AuthorizationState> {
    return this.state;
  }

  async requestAuthorization(): Promise<AuthorizationState> {
    this.state = 'granted';
    return this.state;
  }

  /** Test hook: force a denial to exercise the honest empty state. */
  setAuthorizationState(state: AuthorizationState): void {
    this.state = state;
  }

  async getDailyUsage(query: UsageQuery): Promise<AdapterResult<readonly DailyUsage[]>> {
    if (this.state !== 'granted') {
      return { ok: false, reasonKey: 'adapter.mock.not_authorized', state: this.state };
    }
    const days = enumerateDays(query.fromDayKey, query.toDayKey);
    const value = days.map((dayKey) => {
      const rng = hashRandom(`${this.seed}:${query.memberId}:${dayKey}`);
      const weekend = new Date(`${dayKey}T12:00:00`).getDay() % 6 === 0;
      const scale = weekend ? 1.4 : 1;
      const minutesByCategory: Partial<Record<UsageCategory, number>> = {
        social: Math.round(rng(20, 70) * scale),
        video: Math.round(rng(15, 60) * scale),
        games: Math.round(rng(0, 55) * scale),
        creation: Math.round(rng(0, 25)),
        school: Math.round(rng(10, 45)),
        communication: Math.round(rng(5, 30)),
        other: Math.round(rng(5, 20)),
      };
      return {
        dayKey,
        minutesByCategory,
        pickups: Math.round(rng(30, 90)),
        source: 'simulated' as const,
        provider: 'mock',
      };
    });
    return { ok: true, value };
  }

  async applyFocusShield(
    _request: FocusShieldRequest,
  ): Promise<AdapterResult<{ applied: boolean }>> {
    if (this.state !== 'granted') {
      return { ok: false, reasonKey: 'adapter.mock.not_authorized', state: this.state };
    }
    this.shieldActive = true;
    return { ok: true, value: { applied: true } };
  }

  async clearFocusShield(): Promise<AdapterResult<{ cleared: boolean }>> {
    this.shieldActive = false;
    return { ok: true, value: { cleared: true } };
  }

  isShieldActive(): boolean {
    return this.shieldActive;
  }
}

/**
 * The fallback for a platform we do not support at all - a browser, a tablet
 * without the entitlement, an OEM build with Digital Wellbeing removed. It
 * reports honestly rather than degrading into fabricated numbers.
 */
export class UnsupportedScreenTimeAdapter implements ScreenTimeAdapter {
  readonly id = 'none' as const;
  private readonly reasonKey: string;

  constructor(reasonKey = 'adapter.none.platform_unsupported') {
    this.reasonKey = reasonKey;
  }

  capabilities(): AdapterCapabilities {
    return {
      adapter: this.id,
      canReadCategoryTotals: false,
      canApplyFocusShield: false,
      canReadPickups: false,
      producesSource: 'self_reported',
      limitationKeys: [this.reasonKey, 'adapter.none.self_report_instead'],
    };
  }

  async authorizationState(): Promise<AuthorizationState> {
    return 'unsupported';
  }

  async requestAuthorization(): Promise<AuthorizationState> {
    return 'unsupported';
  }

  async getDailyUsage(): Promise<AdapterResult<readonly DailyUsage[]>> {
    return { ok: false, reasonKey: this.reasonKey, state: 'unsupported' };
  }

  async applyFocusShield(): Promise<AdapterResult<{ applied: boolean }>> {
    return { ok: false, reasonKey: this.reasonKey, state: 'unsupported' };
  }

  async clearFocusShield(): Promise<AdapterResult<{ cleared: boolean }>> {
    return { ok: false, reasonKey: this.reasonKey, state: 'unsupported' };
  }
}

/* ------------------------------- helpers -------------------------------- */

function hashRandom(seed: string): (min: number, max: number) => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let state = h >>> 0;
  return (min: number, max: number) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return min + (state / 0xffffffff) * (max - min);
  };
}

export function enumerateDays(fromDayKey: string, toDayKey: string): string[] {
  const days: string[] = [];
  const cursor = new Date(`${fromDayKey}T00:00:00`);
  const end = new Date(`${toDayKey}T00:00:00`);
  let guard = 0;
  while (cursor.getTime() <= end.getTime() && guard < 400) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, '0');
    const day = String(cursor.getDate()).padStart(2, '0');
    days.push(`${year}-${month}-${day}`);
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }
  return days;
}
