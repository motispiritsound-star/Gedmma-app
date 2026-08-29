import type {
  AdapterCapabilities,
  AdapterResult,
  AuthorizationState,
  DailyUsage,
  FocusShieldRequest,
  ScreenTimeAdapter,
  UsageQuery,
} from './types.js';

/**
 * Bridge to Apple's Screen Time APIs (FamilyControls, ManagedSettings,
 * DeviceActivity).
 *
 * Those frameworks require the com.apple.developer.family-controls
 * entitlement, which Apple grants on request and which cannot be exercised in
 * Expo Go or in a simulator without a development build. Everything below
 * therefore routes through an injected `NativeIosScreenTimeModule`. When the
 * module is absent - CI, web, Expo Go, a build without the entitlement - the
 * adapter reports `entitlement_missing` and returns no data. It never
 * substitutes an estimate.
 *
 * See NATIVE_CAPABILITIES.md for the entitlement request process and for what
 * DeviceActivity can and cannot report.
 */
export interface NativeIosScreenTimeModule {
  readonly isAvailable: boolean;
  requestAuthorization(): Promise<'approved' | 'denied' | 'notDetermined'>;
  authorizationStatus(): Promise<'approved' | 'denied' | 'notDetermined'>;
  /**
   * Returns coarse per-category totals. DeviceActivity reports through an
   * extension, so the native side aggregates into whole minutes per day before
   * it ever reaches JavaScript.
   */
  categoryTotals(args: {
    fromDayKey: string;
    toDayKey: string;
  }): Promise<
    ReadonlyArray<{
      dayKey: string;
      minutesByCategory: Record<string, number>;
      pickups: number | null;
    }>
  >;
  applyShield(args: { minutes: number; categories: readonly string[] }): Promise<boolean>;
  clearShield(): Promise<boolean>;
}

const IOS_LIMITATIONS = Object.freeze([
  'native.ios.requires_family_controls_entitlement',
  'native.ios.requires_development_build',
  'native.ios.category_granularity_only',
  'native.ios.no_per_app_detail_shared',
]);

export class IOSScreenTimeAdapter implements ScreenTimeAdapter {
  readonly id = 'ios_screen_time' as const;
  private readonly native: NativeIosScreenTimeModule | null;

  constructor(native: NativeIosScreenTimeModule | null) {
    this.native = native && native.isAvailable ? native : null;
  }

  capabilities(): AdapterCapabilities {
    const available = this.native !== null;
    return {
      adapter: this.id,
      canReadCategoryTotals: available,
      canApplyFocusShield: available,
      canReadPickups: available,
      producesSource: 'os_verified',
      limitationKeys: available ? [] : IOS_LIMITATIONS,
    };
  }

  async authorizationState(): Promise<AuthorizationState> {
    if (!this.native) return 'entitlement_missing';
    const status = await this.native.authorizationStatus();
    return status === 'approved' ? 'granted' : status === 'denied' ? 'denied' : 'not_determined';
  }

  async requestAuthorization(): Promise<AuthorizationState> {
    if (!this.native) return 'entitlement_missing';
    const status = await this.native.requestAuthorization();
    return status === 'approved' ? 'granted' : status === 'denied' ? 'denied' : 'not_determined';
  }

  async getDailyUsage(query: UsageQuery): Promise<AdapterResult<readonly DailyUsage[]>> {
    const state = await this.authorizationState();
    if (!this.native || state !== 'granted') {
      return { ok: false, reasonKey: 'adapter.ios.not_authorized', state };
    }
    const rows = await this.native.categoryTotals({
      fromDayKey: query.fromDayKey,
      toDayKey: query.toDayKey,
    });
    return {
      ok: true,
      value: rows.map((row) => ({
        dayKey: row.dayKey,
        minutesByCategory: sanitiseCategories(row.minutesByCategory),
        pickups: row.pickups,
        source: 'os_verified' as const,
        provider: 'ios.DeviceActivity',
      })),
    };
  }

  async applyFocusShield(
    request: FocusShieldRequest,
  ): Promise<AdapterResult<{ applied: boolean }>> {
    const state = await this.authorizationState();
    if (!this.native || state !== 'granted') {
      return { ok: false, reasonKey: 'adapter.ios.not_authorized', state };
    }
    const applied = await this.native.applyShield({
      minutes: request.durationMinutes,
      categories: request.categories,
    });
    return { ok: true, value: { applied } };
  }

  async clearFocusShield(): Promise<AdapterResult<{ cleared: boolean }>> {
    const state = await this.authorizationState();
    if (!this.native || state !== 'granted') {
      return { ok: false, reasonKey: 'adapter.ios.not_authorized', state };
    }
    return { ok: true, value: { cleared: await this.native.clearShield() } };
  }
}

const ALLOWED = new Set([
  'social',
  'video',
  'games',
  'creation',
  'school',
  'communication',
  'other',
]);

/** Drop anything the native layer sends that is not a known coarse category. */
export function sanitiseCategories(
  raw: Record<string, number>,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!ALLOWED.has(key)) continue;
    if (!Number.isFinite(value) || value < 0) continue;
    result[key] = Math.min(1440, Math.round(value));
  }
  return result;
}
