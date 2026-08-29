import { MockAiDraftProvider } from './mock.ts';
import type { AiDraftProvider } from './types.ts';

export * from './types.ts';
export { MockAiDraftProvider } from './mock.ts';

const globalForAi = globalThis as unknown as { wonderboxAi?: AiDraftProvider };

export function aiDraftProvider(): AiDraftProvider {
  // Only the mock ships. A real adapter would implement the same single method
  // and would still land in the DRAFT state — the approval gate does not move.
  globalForAi.wonderboxAi ??= new MockAiDraftProvider();
  return globalForAi.wonderboxAi;
}
