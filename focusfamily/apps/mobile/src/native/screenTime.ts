import { Platform } from 'react-native';
import {
  createScreenTimeAdapter,
  type NativeAndroidUsageModule,
  type NativeIosScreenTimeModule,
  type ScreenTimeAdapter,
} from '@focusfamily/domain';

/**
 * Where the app decides which screen-time adapter it gets.
 *
 * Both native modules are resolved optionally. In Expo Go, in a simulator, in
 * a build without Apple's Family Controls entitlement and on any Android
 * device where the user has not granted usage access, the module is simply
 * absent - and the adapter then reports that honestly instead of falling back
 * to invented numbers.
 *
 * Wiring a real module means adding an Expo config plugin plus a native module
 * that satisfies the interfaces in @focusfamily/domain. See
 * NATIVE_CAPABILITIES.md for what each platform can and cannot deliver.
 */
export function loadIosModule(): NativeIosScreenTimeModule | null {
  if (Platform.OS !== 'ios') return null;
  try {
     
    const native = require('./FocusFamilyScreenTime') as {
      default?: NativeIosScreenTimeModule;
    };
    return native.default?.isAvailable ? native.default : null;
  } catch {
    return null;
  }
}

export function loadAndroidModule(): NativeAndroidUsageModule | null {
  if (Platform.OS !== 'android') return null;
  try {
     
    const native = require('./FocusFamilyUsageStats') as {
      default?: NativeAndroidUsageModule;
    };
    return native.default?.isAvailable ? native.default : null;
  } catch {
    return null;
  }
}

export function createAdapter(options: { forceMock: boolean }): ScreenTimeAdapter {
  return createScreenTimeAdapter({
    platform:
      Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'unknown',
    forceMock: options.forceMock,
    ios: loadIosModule(),
    android: loadAndroidModule(),
  });
}
