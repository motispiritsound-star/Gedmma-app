import type { DataSourceKind, UsageCategory } from '../measurement.js';

/**
 * The screen-time port.
 *
 * Everything platform-specific lives behind this interface, and the interface
 * itself is the privacy boundary: there is no method that can return a
 * message, a URL, a keystroke, a screenshot or a coordinate. A future adapter
 * physically cannot leak those through this port without changing this file,
 * which is exactly the review checkpoint we want.
 */

export const adapterIds = ['ios_screen_time', 'android_usage', 'mock', 'none'] as const;
export type AdapterId = (typeof adapterIds)[number];

export type AuthorizationState =
  | 'not_determined'
  | 'granted'
  | 'denied'
  | 'restricted'
  /** The OS supports it but this build lacks the entitlement. */
  | 'entitlement_missing'
  /** The platform has no equivalent capability at all. */
  | 'unsupported';

export interface AdapterCapabilities {
  readonly adapter: AdapterId;
  /** Can we read coarse category totals from the OS? */
  readonly canReadCategoryTotals: boolean;
  /** Can we ask the OS to shield apps during a focus moment? */
  readonly canApplyFocusShield: boolean;
  /** Can we read a device-level pickup count? */
  readonly canReadPickups: boolean;
  /** Provenance this adapter is allowed to claim. Never negotiable. */
  readonly producesSource: DataSourceKind;
  /** Why a capability is missing, for the honest empty state. */
  readonly limitationKeys: readonly string[];
}

export interface DailyUsage {
  readonly dayKey: string;
  readonly minutesByCategory: Partial<Record<UsageCategory, number>>;
  readonly pickups: number | null;
  readonly source: DataSourceKind;
  readonly provider: string;
}

export interface UsageQuery {
  readonly memberId: string;
  readonly fromDayKey: string;
  readonly toDayKey: string;
}

export interface FocusShieldRequest {
  readonly startsAt: Date;
  readonly durationMinutes: number;
  /** Coarse categories only. We never name individual apps to the OS layer. */
  readonly categories: readonly UsageCategory[];
  /** Applies to the device owner; there is no remote-control path. */
  readonly appliedLocally: true;
}

export type AdapterResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly reasonKey: string; readonly state: AuthorizationState };

export interface ScreenTimeAdapter {
  readonly id: AdapterId;
  capabilities(): AdapterCapabilities;
  authorizationState(): Promise<AuthorizationState>;
  /**
   * Must be triggered by an explicit user action on a screen that explains
   * what is measured. Implementations never call this on launch.
   */
  requestAuthorization(): Promise<AuthorizationState>;
  /**
   * Returns nothing at all when unauthorised. It never returns estimates,
   * placeholders or zeroes that could be mistaken for a measurement.
   */
  getDailyUsage(query: UsageQuery): Promise<AdapterResult<readonly DailyUsage[]>>;
  applyFocusShield(request: FocusShieldRequest): Promise<AdapterResult<{ applied: boolean }>>;
  clearFocusShield(): Promise<AdapterResult<{ cleared: boolean }>>;
}
