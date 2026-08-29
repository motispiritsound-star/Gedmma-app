/**
 * Cursor pagination over `createdAt`-ordered lists. The cursor is the id of the
 * last row of the previous page, which Prisma can seek to directly.
 */
export interface PageResult<T> {
  items: T[];
  nextCursor: string | null;
}

export function cursorArgs(cursor: string | undefined, limit: number) {
  return {
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  };
}

export function toPage<T extends { id: string }>(rows: T[], limit: number): PageResult<T> {
  if (rows.length <= limit) return { items: rows, nextCursor: null };
  const items = rows.slice(0, limit);
  return { items, nextCursor: items[items.length - 1]?.id ?? null };
}
