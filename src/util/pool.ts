/**
 * Draait `worker` over alle items met maximaal `limit` gelijktijdige taken.
 * Fouten in één taak stoppen de rest niet; ze worden als `null` teruggegeven.
 */
export async function pool<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
  onSettled?: (result: R | null, item: T, index: number) => void,
): Promise<(R | null)[]> {
  const results: (R | null)[] = new Array(items.length).fill(null);
  let cursor = 0;

  const runners = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      let value: R | null = null;
      try {
        value = await worker(items[index]!, index);
      } catch {
        value = null;
      }
      results[index] = value;
      onSettled?.(value, items[index]!, index);
    }
  });

  await Promise.all(runners);
  return results;
}

export const sleep = (ms: number): Promise<void> =>
  new Promise((done) => setTimeout(done, ms));
