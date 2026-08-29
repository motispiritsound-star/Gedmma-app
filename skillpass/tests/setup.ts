import { afterAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import { resetRateLimits } from '@/lib/rate-limit';
import { MockEmailProvider } from '@/lib/adapters/email';
import { isAutoTruncateEnabled, setAutoTruncate, truncateAll } from './helpers';

beforeEach(async () => {
  if (isAutoTruncateEnabled()) await truncateAll();
  resetRateLimits();
  MockEmailProvider.clear();
});

afterAll(async () => {
  setAutoTruncate(true);
  await prisma.$disconnect();
});
