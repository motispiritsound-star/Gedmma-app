import { createScreenTimeAdapter } from '@focusfamily/domain';
import { createAdapter } from '@/native/screenTime';

describe('the mobile adapter wiring', () => {
  it('falls back to the honest unsupported adapter with no native module', () => {
    const adapter = createAdapter({ forceMock: false });
    // The test runner reports platform ios; there is no native module here.
    expect(['none', 'mock']).toContain(adapter.id);
    expect(adapter.capabilities().limitationKeys.length).toBeGreaterThan(0);
  });

  it('uses the mock adapter when the build asks for it', () => {
    const adapter = createAdapter({ forceMock: true });
    expect(adapter.id).toBe('mock');
    expect(adapter.capabilities().producesSource).toBe('simulated');
  });

  it('never exposes a way to read message or browsing content', () => {
    const adapter = createScreenTimeAdapter({ platform: 'ios', forceMock: true });
    const names = Object.getOwnPropertyNames(Object.getPrototypeOf(adapter));
    for (const name of names) {
      expect(name.toLowerCase()).not.toMatch(/message|browsing|keystroke|location|screenshot/);
    }
  });
});
