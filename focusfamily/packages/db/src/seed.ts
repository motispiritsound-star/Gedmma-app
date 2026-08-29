/**
 * `npm run db:seed` - wipes and rebuilds the demo family, then upserts the
 * shared library content. Safe to run repeatedly against a development
 * database; it refuses to touch anything that is not the demo family.
 */
import { createPrismaClient } from './client.js';
import { seedContent, seedDemoFamily } from './seed-data.js';

const prisma = createPrismaClient();

try {
  const content = await seedContent(prisma);
  const result = await seedDemoFamily(prisma);
  console.log('FocusFamily demo data ready.');
  console.log(`  family:   ${result.familyId} (Familie De Vries)`);
  console.log('  sign in:  noor@focusfamily.test / sam@focusfamily.test / lena@focusfamily.test');
  console.log(`  password: ${result.demoPassword}`);
  console.log(`  content:  ${content.articles} articles, ${content.activities} activities`);
  for (const [key, value] of Object.entries(result.counts)) {
    console.log(`  ${key.padEnd(20)} ${value}`);
  }
} finally {
  await prisma.$disconnect();
}
