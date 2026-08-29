import { sanitiseCategories } from './ios.js';
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
 * Bridge to Android's UsageStatsManager and Digital Wellbeing surfaces.
 *
 * PACKAGE_USAGE_STATS is a "special access" permission: it cannot be requested
 * with a runtime dialog, only by sending the user to Settings. That is a
 * deliberate friction and we do not try to route around it - see
 * NATIVE_CAPABILITIES.md.
 *
 * Android exposes per-package foreground time. We map packages to coarse
 * categories on-device and only ever hand the aggregate upwards; the package
 * list never leaves the device and is never persisted.
 */
export interface NativeAndroidUsageModule {
  readonly isAvailable: boolean;
  hasUsageAccess(): Promise<boolean>;
  /** Opens the system settings screen. Returns once the user comes back. */
  openUsageAccessSettings(): Promise<void>;
  /** Already aggregated on the native side into coarse categories. */
  categoryTotals(args: {
    fromDayKey: string;
    toDayKey: string;
  }): Promise<
    ReadonlyArray<{
      dayKey: string;
      minutesByCategory: Record<string, number>;
      unlocks: number | null;
    }>
  >;
  /** Android has no first-party shielding API for third-party apps. */
  supportsShielding(): boolean;
}

const ANDROID_LIMITATIONS = Object.freeze([
  'native.android.requires_usage_access',
  'native.android.no_third_party_shield',
  'native.android.oem_variation',
]);

export class AndroidUsageAdapter implements ScreenTimeAdapter {
  readonly id = 'android_usage' as const;
  private readonly native: NativeAndroidUsageModule | null;

  constructor(native: NativeAndroidUsageModule | null) {
    this.native = native && native.isAvailable ? native : null;
  }

  capabilities(): AdapterCapabilities {
    const available = this.native !== null;
    return {
      adapter: this.id,
      canReadCategoryTotals: available,
      // Android cannot block third-party apps without accessibility-service
      // abuse, which we refuse to ship. Focus moments stay a shared promise.
      canApplyFocusShield: false,
      canReadPickups: available,
      producesSource: 'os_verified',
      limitationKeys: available
        ? ['native.android.no_third_party_shield']
        : ANDROID_LIMITATIONS,
    };
  }

  async authorizationState(): Promise<AuthorizationState> {
    if (!this.native) return 'unsupported';
    return (await this.native.hasUsageAccess()) ? 'granted' : 'not_determined';
  }

  /**
   * Sends the user to Settings and re-checks afterwards. There is no nagging
   * loop and no second prompt if they decline: one clear explanation, one trip.
   */
  async requestAuthorization(): Promise<AuthorizationState> {
    if (!this.native) return 'unsupported';
    if (await this.native.hasUsageAccess()) return 'granted';
    await this.native.openUsageAccessSettings();
    return (await this.native.hasUsageAccess()) ? 'granted' : 'denied';
  }

  async getDailyUsage(query: UsageQuery): Promise<AdapterResult<readonly DailyUsage[]>> {
    const state = await this.authorizationState();
    if (!this.native || state !== 'granted') {
      return { ok: false, reasonKey: 'adapter.android.no_usage_access', state };
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
        pickups: row.unlocks,
        source: 'os_verified' as const,
        provider: 'android.UsageStats',
      })),
    };
  }

  async applyFocusShield(
    _request: FocusShieldRequest,
  ): Promise<AdapterResult<{ applied: boolean }>> {
    return {
      ok: false,
      reasonKey: 'adapter.android.shield_unsupported',
      state: 'unsupported',
    };
  }

  async clearFocusShield(): Promise<AdapterResult<{ cleared: boolean }>> {
    return {
      ok: false,
      reasonKey: 'adapter.android.shield_unsupported',
      state: 'unsupported',
    };
  }
}
