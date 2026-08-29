import { describe, expect, it } from 'vitest';
import {
  AndroidUsageAdapter,
  IOSScreenTimeAdapter,
  MAX_CONFIDENCE_BY_SOURCE,
  MockScreenTimeAdapter,
  UnsupportedScreenTimeAdapter,
  clampConfidence,
  createScreenTimeAdapter,
  describeSource,
  weakestSource,
  type NativeAndroidUsageModule,
  type NativeIosScreenTimeModule,
} from '../src/index.js';

describe('the port itself is the privacy boundary', () => {
  it('exposes no method that could return message or browsing content', () => {
    const adapter = new MockScreenTimeAdapter();
    const surface = [
      ...Object.getOwnPropertyNames(Object.getPrototypeOf(adapter)),
      ...Object.keys(adapter),
    ];
    for (const name of surface) {
      expect(name.toLowerCase()).not.toMatch(
        /message|sms|chat|browse|browsing|url|history|keystroke|screenshot|location|contact|photo|mic|camera/,
      );
    }
  });

  it('returns only coarse category totals, never an app or site list', async () => {
    const adapter = new MockScreenTimeAdapter({ seed: 7 });
    await adapter.requestAuthorization();
    const result = await adapter.getDailyUsage({
      memberId: 'u_teen',
      fromDayKey: '2026-03-02',
      toDayKey: '2026-03-04',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const day of result.value) {
      for (const key of Object.keys(day.minutesByCategory)) {
        expect([
          'social',
          'video',
          'games',
          'creation',
          'school',
          'communication',
          'other',
        ]).toContain(key);
      }
      expect(JSON.stringify(day)).not.toMatch(/https?:|\.com|com\.[a-z]/);
    }
  });
});

describe('the mock adapter is honest about being a mock', () => {
  it('labels everything simulated and never claims high confidence', async () => {
    const adapter = new MockScreenTimeAdapter();
    expect(adapter.capabilities().producesSource).toBe('simulated');
    await adapter.requestAuthorization();
    const result = await adapter.getDailyUsage({
      memberId: 'u_kid',
      fromDayKey: '2026-03-02',
      toDayKey: '2026-03-03',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.every((day) => day.source === 'simulated')).toBe(true);
    expect(MAX_CONFIDENCE_BY_SOURCE.simulated).toBe('low');
    expect(clampConfidence('simulated', 'high')).toBe('low');
  });

  it('is deterministic for a given seed, so the demo looks the same everywhere', async () => {
    const first = new MockScreenTimeAdapter({ seed: 42, initialState: 'granted' });
    const second = new MockScreenTimeAdapter({ seed: 42, initialState: 'granted' });
    const query = { memberId: 'u_kid', fromDayKey: '2026-03-02', toDayKey: '2026-03-05' };
    const a = await first.getDailyUsage(query);
    const b = await second.getDailyUsage(query);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('returns nothing at all when it has not been authorised', async () => {
    const adapter = new MockScreenTimeAdapter();
    adapter.setAuthorizationState('denied');
    const result = await adapter.getDailyUsage({
      memberId: 'u_kid',
      fromDayKey: '2026-03-02',
      toDayKey: '2026-03-03',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.state).toBe('denied');
  });
});

describe('iOS adapter without the entitlement', () => {
  it('reports entitlement_missing rather than inventing data', async () => {
    const adapter = new IOSScreenTimeAdapter(null);
    expect(await adapter.authorizationState()).toBe('entitlement_missing');
    const result = await adapter.getDailyUsage({
      memberId: 'u_kid',
      fromDayKey: '2026-03-02',
      toDayKey: '2026-03-03',
    });
    expect(result.ok).toBe(false);
    expect(adapter.capabilities().limitationKeys).toContain(
      'native.ios.requires_family_controls_entitlement',
    );
  });

  it('drops anything the native side sends that is not a known category', async () => {
    const native: NativeIosScreenTimeModule = {
      isAvailable: true,
      requestAuthorization: async () => 'approved',
      authorizationStatus: async () => 'approved',
      categoryTotals: async () => [
        {
          dayKey: '2026-03-02',
          minutesByCategory: {
            social: 30,
            // A future OS version starts reporting something we did not ask for.
            'com.example.messenger': 45,
            browsingHistory: 12,
            video: -5,
          },
          pickups: 40,
        },
      ],
      applyShield: async () => true,
      clearShield: async () => true,
    };
    const adapter = new IOSScreenTimeAdapter(native);
    const result = await adapter.getDailyUsage({
      memberId: 'u_kid',
      fromDayKey: '2026-03-02',
      toDayKey: '2026-03-02',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value[0]?.minutesByCategory).toEqual({ social: 30 });
    expect(result.value[0]?.source).toBe('os_verified');
  });
});

describe('Android adapter', () => {
  const native: NativeAndroidUsageModule = {
    isAvailable: true,
    hasUsageAccess: async () => true,
    openUsageAccessSettings: async () => undefined,
    categoryTotals: async () => [
      { dayKey: '2026-03-02', minutesByCategory: { games: 60 }, unlocks: 33 },
    ],
    supportsShielding: () => false,
  };

  it('never claims it can pause other apps', async () => {
    const adapter = new AndroidUsageAdapter(native);
    expect(adapter.capabilities().canApplyFocusShield).toBe(false);
    const shield = await adapter.applyFocusShield({
      startsAt: new Date(),
      durationMinutes: 30,
      categories: ['games'],
      appliedLocally: true,
    });
    expect(shield.ok).toBe(false);
    if (shield.ok) return;
    expect(shield.reasonKey).toBe('adapter.android.shield_unsupported');
  });

  it('labels what it does read as OS verified', async () => {
    const adapter = new AndroidUsageAdapter(native);
    const result = await adapter.getDailyUsage({
      memberId: 'u_teen',
      fromDayKey: '2026-03-02',
      toDayKey: '2026-03-02',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value[0]?.source).toBe('os_verified');
    expect(result.value[0]?.provider).toBe('android.UsageStats');
  });
});

describe('unsupported platforms fall back honestly', () => {
  it('offers self-reporting instead of a fabricated number', async () => {
    const adapter = new UnsupportedScreenTimeAdapter();
    const capabilities = adapter.capabilities();
    expect(capabilities.canReadCategoryTotals).toBe(false);
    expect(capabilities.limitationKeys).toContain('adapter.none.self_report_instead');
    const result = await adapter.getDailyUsage();
    expect(result.ok).toBe(false);
  });

  it('is what the factory picks for the web and for unknown devices', () => {
    expect(createScreenTimeAdapter({ platform: 'web' }).id).toBe('none');
    expect(createScreenTimeAdapter({ platform: 'unknown' }).id).toBe('none');
    expect(createScreenTimeAdapter({ platform: 'ios', ios: null }).id).toBe('none');
    expect(createScreenTimeAdapter({ platform: 'android', android: null }).id).toBe('none');
    expect(createScreenTimeAdapter({ platform: 'ios', forceMock: true }).id).toBe('mock');
  });
});

describe('source labels', () => {
  it('caps the confidence a provenance is allowed to claim', () => {
    expect(describeSource('self_reported', 'high').confidence).toBe('medium');
    expect(describeSource('os_verified', 'high').confidence).toBe('high');
    expect(describeSource('simulated', 'medium').confidence).toBe('low');
  });

  it('gives every label a key the UI must render', () => {
    const label = describeSource('app_observed');
    expect(label.labelKey).toBe('source.app_observed.label');
    expect(label.explanationKey).toBe('source.app_observed.explanation');
    expect(label.confidenceKey).toBe('confidence.medium');
  });

  it('takes the weakest provenance when figures are mixed', () => {
    expect(weakestSource(['os_verified', 'self_reported'])).toBe('self_reported');
    expect(weakestSource(['os_verified', 'app_observed'])).toBe('app_observed');
    expect(weakestSource(['os_verified'])).toBe('os_verified');
    expect(weakestSource(['os_verified', 'simulated'])).toBe('simulated');
  });
});
