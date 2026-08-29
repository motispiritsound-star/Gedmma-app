import Constants from 'expo-constants';

interface Extra {
  focusFamilyApiUrl?: string;
  useMockScreenTime?: boolean;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? extra.focusFamilyApiUrl ?? 'http://127.0.0.1:4000';

/**
 * The mock adapter is the default everywhere until a build actually carries
 * the entitlements. Turning it off does not turn measurement on; it only stops
 * the app from showing example data.
 */
export const USE_MOCK_SCREEN_TIME =
  process.env.EXPO_PUBLIC_USE_MOCK_SCREENTIME === '1' || extra.useMockScreenTime !== false;
