import { AndroidUsageAdapter, type NativeAndroidUsageModule } from './android.js';
import { IOSScreenTimeAdapter, type NativeIosScreenTimeModule } from './ios.js';
import { MockScreenTimeAdapter, UnsupportedScreenTimeAdapter } from './mock.js';
import type { ScreenTimeAdapter } from './types.js';

export * from './types.js';
export { IOSScreenTimeAdapter, type NativeIosScreenTimeModule } from './ios.js';
export { AndroidUsageAdapter, type NativeAndroidUsageModule } from './android.js';
export {
  MockScreenTimeAdapter,
  UnsupportedScreenTimeAdapter,
  enumerateDays,
} from './mock.js';

export interface AdapterEnvironment {
  readonly platform: 'ios' | 'android' | 'web' | 'unknown';
  readonly forceMock?: boolean;
  readonly ios?: NativeIosScreenTimeModule | null;
  readonly android?: NativeAndroidUsageModule | null;
}

/**
 * One place decides which adapter a runtime gets. `forceMock` is driven by
 * EXPO_PUBLIC_USE_MOCK_SCREENTIME / FOCUSFAMILY_USE_MOCK so that development,
 * CI and the public demo all take the same honest path.
 */
export function createScreenTimeAdapter(env: AdapterEnvironment): ScreenTimeAdapter {
  if (env.forceMock) return new MockScreenTimeAdapter();
  switch (env.platform) {
    case 'ios': {
      const adapter = new IOSScreenTimeAdapter(env.ios ?? null);
      return adapter.capabilities().canReadCategoryTotals
        ? adapter
        : new UnsupportedScreenTimeAdapter('native.ios.requires_family_controls_entitlement');
    }
    case 'android': {
      const adapter = new AndroidUsageAdapter(env.android ?? null);
      return adapter.capabilities().canReadCategoryTotals
        ? adapter
        : new UnsupportedScreenTimeAdapter('native.android.requires_usage_access');
    }
    default:
      return new UnsupportedScreenTimeAdapter('adapter.none.platform_unsupported');
  }
}
